import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { GatewayRequest, GatewayResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/gateways');

  obtenerPorProceso(procesoId: number): Observable<GatewayResponse[]> {
    return this.http.get<GatewayResponse[]>(`${this.baseUrl}/proceso/${procesoId}`);
  }

  crear(dto: GatewayRequest): Observable<GatewayResponse> {
    return this.http.post<GatewayResponse>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: GatewayRequest): Observable<GatewayResponse> {
    return this.http.put<GatewayResponse>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
