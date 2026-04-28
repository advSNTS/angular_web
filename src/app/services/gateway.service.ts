import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { GatewayResponse, GatewayRequest } from '../models/proceso';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private apiUrl = `${environment.apiUrl}/gateways`;

  private mock: GatewayResponse[] = [
    { id: 1, nodoId: 4, nombreNodo: 'Decision', procesoId: 1, nombreProceso: 'Proceso de Ventas', tipoGateway: 'XOR' },
  ];

  constructor(private http: HttpClient) {}

  obtenerPorProceso(procesoId: number): Observable<GatewayResponse[]> {
    return of(this.mock.filter(g => g.procesoId === procesoId));
    // BACKEND: return this.http.get<GatewayResponse[]>(`${this.apiUrl}/proceso/${procesoId}`);
  }

  crear(dto: GatewayRequest): Observable<GatewayResponse> {
    return this.http.post<GatewayResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: GatewayRequest): Observable<GatewayResponse> {
    return this.http.put<GatewayResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}