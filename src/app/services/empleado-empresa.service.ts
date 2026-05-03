import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { EmpleadoCreateRequest, EmpleadoResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class EmpleadoEmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/empleados');

  listarPorEmpresa(nit: string): Observable<EmpleadoResponse[]> {
    return this.http.get<EmpleadoResponse[]>(`${this.baseUrl}/empresa/${encodeURIComponent(nit)}`);
  }

  invitar(dto: EmpleadoCreateRequest): Observable<EmpleadoResponse> {
    return this.http.post<EmpleadoResponse>(this.baseUrl, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
