import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { MensajeThrowRequest, MensajeThrowResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MensajeThrowService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/mensajes-throw');

  listarPorProceso(procesoId: number): Observable<MensajeThrowResponse[]> {
    return this.http.get<MensajeThrowResponse[]>(`${this.baseUrl}/proceso/${procesoId}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  crear(dto: MensajeThrowRequest): Observable<MensajeThrowResponse> {
    return this.http.post<MensajeThrowResponse>(this.baseUrl, dto, {
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
