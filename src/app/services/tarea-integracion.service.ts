import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { TareaIntegracionRequest, TareaIntegracionResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TareaIntegracionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/tareas-integracion');

  listarPorProceso(procesoId: number): Observable<TareaIntegracionResponse[]> {
    return this.http.get<TareaIntegracionResponse[]>(`${this.baseUrl}/proceso/${procesoId}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  crear(dto: TareaIntegracionRequest): Observable<TareaIntegracionResponse> {
    return this.http.post<TareaIntegracionResponse>(this.baseUrl, dto, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  private requireNit(): string {
    const nit = this.auth.getNitEmpresa();
    if (!nit) throw new Error('Sesión sin NIT de empresa.');
    return nit;
  }
}
