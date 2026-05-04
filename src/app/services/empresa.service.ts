import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.http.get<VerificacionCorreoResponse>(url);
  }

  reenviarVerificacion(correo: string): Observable<VerificacionCorreoResponse> {
    const url = buildApiPath(`/auth/reenviar-verificacion?correo=${encodeURIComponent(correo)}`);
    return this.http.post<VerificacionCorreoResponse>(url, null);
  }
}