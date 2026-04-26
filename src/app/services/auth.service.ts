import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, delay, tap } from 'rxjs';
import { EmpleadoAuthResponse, LoginCredentials } from '../models/empleado-auth.model';
import { BACKEND_BASE_URL, DEMO_EMPLOYEE } from '../config/auth.config';
const SESSION_KEY = 'angular_web_employee_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sessionSubject = new BehaviorSubject<EmpleadoAuthResponse | null>(
    this.loadSession()
  );

  readonly session$ = this.sessionSubject.asObservable();

  iniciarSesion(payload: LoginCredentials): Observable<EmpleadoAuthResponse> {
    const correoValido = payload.correo.trim().toLowerCase() === DEMO_EMPLOYEE.credencial.correo;
    const contrasenaValida = payload.contrasena === DEMO_EMPLOYEE.credencial.contrasena;

    if (!correoValido || !contrasenaValida) {
      return throwError(() => new Error(`Credenciales inválidas para ${BACKEND_BASE_URL}`));
    }

    const response: EmpleadoAuthResponse = {
      id: 1,
      nitEmpresa: DEMO_EMPLOYEE.nitEmpresa,
      nombreEmpresa: DEMO_EMPLOYEE.nombreEmpresa,
      nombre: DEMO_EMPLOYEE.nombre,
      tipoDocumento: DEMO_EMPLOYEE.tipoDocumento,
      numeroDocumento: DEMO_EMPLOYEE.numeroDocumento,
      correo: DEMO_EMPLOYEE.credencial.correo
    };

    return of(response).pipe(
      delay(250),
      tap((session) => {
        this.saveSession(session);
        this.sessionSubject.next(session);
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
}
