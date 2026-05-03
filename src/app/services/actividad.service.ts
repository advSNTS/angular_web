import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { ActividadRequest, ActividadResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/actividades');

  obtenerPorProceso(procesoId: number): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.baseUrl}/proceso/${procesoId}`);
  }

  crear(dto: ActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: ActividadRequest, idEmpleado?: number): Observable<ActividadResponse> {
    let params = new HttpParams();
    if (idEmpleado != null) {
      params = params.set('idEmpleado', String(idEmpleado));
    }
    return this.http.put<ActividadResponse>(`${this.baseUrl}/${id}`, dto, { params });
  }

  eliminar(id: number, idEmpleado?: number): Observable<void> {
    let params = new HttpParams();
    if (idEmpleado != null) {
      params = params.set('idEmpleado', String(idEmpleado));
    }
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }
}
