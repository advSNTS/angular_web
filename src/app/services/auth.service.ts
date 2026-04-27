import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, tap, throwError } from 'rxjs';
import { AUTH_LOGIN_PATH, BACKEND_BASE_URL } from '../config/auth.config';
import { EmpleadoAuthResponse, LoginCredentials } from '../models/empleado-auth.model';

const SESSION_KEY = 'angular_web_employee_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionSubject = new BehaviorSubject<EmpleadoAuthResponse | null>(
    this.loadSession()
  );

  readonly session$ = this.sessionSubject.asObservable();

  iniciarSesion(payload: LoginCredentials): Observable<EmpleadoAuthResponse> {
    return this.http.post<unknown>(`${BACKEND_BASE_URL}${AUTH_LOGIN_PATH}`, payload).pipe(
      map((response) => this.normalizeSession(response)),
      tap((session) => {
        this.saveSession(session);
        this.sessionSubject.next(session);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = this.extractErrorMessage(error);
        return throwError(() => new Error(message));
      })
    );
  }

  cerrarSesion(): void {
    this.clearSession();
    this.sessionSubject.next(null);
  }

  getSesionActual(): EmpleadoAuthResponse | null {
    return this.sessionSubject.value;
  }

  estaAutenticado(): boolean {
    return this.getSesionActual() !== null;
  }

  private loadSession(): EmpleadoAuthResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const rawSession = window.sessionStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as EmpleadoAuthResponse;
    } catch {
      this.clearSession();
      return null;
    }
  }

  private saveSession(session: EmpleadoAuthResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.sessionStorage.removeItem(SESSION_KEY);
  }

  private normalizeSession(response: unknown): EmpleadoAuthResponse {
    if (this.isEmpleadoAuthResponse(response)) {
      return response;
    }

    if (this.hasEmpleadoProperty(response)) {
      return response.empleado;
    }

    if (this.hasDataProperty(response)) {
      return response.data;
    }

    throw new Error('La respuesta del backend no tiene el formato esperado.');
  }

  private isEmpleadoAuthResponse(value: unknown): value is EmpleadoAuthResponse {
    return (
      this.hasStringProperty(value, 'nombre') &&
      this.hasStringProperty(value, 'correo') &&
      this.hasStringProperty(value, 'nitEmpresa') &&
      this.hasStringProperty(value, 'nombreEmpresa') &&
      this.hasStringProperty(value, 'tipoDocumento') &&
      this.hasStringProperty(value, 'numeroDocumento') &&
      this.hasNumberProperty(value, 'id')
    );
  }

  private hasEmpleadoProperty(
    value: unknown
  ): value is { empleado: EmpleadoAuthResponse } {
    return (
      this.hasObjectProperty(value, 'empleado') &&
      this.isEmpleadoAuthResponse(value['empleado'])
    );
  }

  private hasDataProperty(value: unknown): value is { data: EmpleadoAuthResponse } {
    return this.hasObjectProperty(value, 'data') && this.isEmpleadoAuthResponse(value['data']);
  }

  private hasObjectProperty(value: unknown, property: string): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && property in value;
  }

  private hasStringProperty(value: unknown, property: keyof EmpleadoAuthResponse): boolean {
    return this.hasObjectProperty(value, property) && typeof value[property] === 'string';
  }

  private hasNumberProperty(value: unknown, property: keyof EmpleadoAuthResponse): boolean {
    return this.hasObjectProperty(value, property) && typeof value[property] === 'number';
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = this.tryReadBackendMessage(error.error);

    if (backendMessage) {
      return backendMessage;
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    return 'Credenciales inválidas.';
  }

  private tryReadBackendMessage(payload: unknown): string | null {
    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (this.hasObjectProperty(payload, 'message') && typeof payload['message'] === 'string') {
      return payload['message'];
    }

    if (this.hasObjectProperty(payload, 'error') && typeof payload['error'] === 'string') {
      return payload['error'];
    }

    return null;
  }
}
