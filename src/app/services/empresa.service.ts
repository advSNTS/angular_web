import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { EmpresaRequest, EmpresaResponse, VerificacionCorreoResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/empresas');

  registrar(dto: EmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.baseUrl, dto);
  }

  obtenerPorNit(nit: string): Observable<EmpresaResponse> {
    return this.http.get<EmpresaResponse>(`${this.baseUrl}/${encodeURIComponent(nit)}`);
  }

  verificarCorreo(token: string): Observable<VerificacionCorreoResponse> {
    const url = buildApiPath(`/auth/verificar-correo?token=${encodeURIComponent(token)}`);

    return this.http.get<VerificacionCorreoResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(this.extraerMensajeError(error)));
      })
    );
  }

  reenviarVerificacion(correo: string): Observable<VerificacionCorreoResponse> {
    const url = buildApiPath(`/auth/reenviar-verificacion?correo=${encodeURIComponent(correo)}`);

    return this.http.post<VerificacionCorreoResponse>(url, null).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => new Error(this.extraerMensajeError(error)));
      })
    );
  }

  private extraerMensajeError(error: HttpErrorResponse): string {
    const payload = error.error;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;

      if (typeof data['mensaje'] === 'string' && data['mensaje'].trim()) {
        return data['mensaje'];
      }

      if (typeof data['message'] === 'string' && data['message'].trim()) {
        return data['message'];
      }

      if (typeof data['error'] === 'string' && data['error'].trim()) {
        return data['error'];
      }
    }

    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    return 'Ocurrio un error procesando la solicitud.';
  }
}