import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { RolProcesoRequest, RolProcesoResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/roles-proceso');

  listarPorEmpresa(nit: string): Observable<RolProcesoResponse[]> {
    return this.http.get<RolProcesoResponse[]>(
      `${this.baseUrl}/empresa/${encodeURIComponent(nit)}`
    );
  }

  crear(dto: RolProcesoRequest): Observable<RolProcesoResponse> {
    return this.http.post<RolProcesoResponse>(this.baseUrl, dto);
  }

  actualizar(id: number, dto: RolProcesoRequest): Observable<RolProcesoResponse> {
    return this.http.put<RolProcesoResponse>(`${this.baseUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
