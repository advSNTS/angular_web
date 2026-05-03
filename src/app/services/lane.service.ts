import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { LaneRequest, LaneResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LaneService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/lanes');

  crear(dto: LaneRequest): Observable<LaneResponse> {
    return this.http.post<LaneResponse>(this.baseUrl, dto, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  listarPorPool(poolId: number): Observable<LaneResponse[]> {
    return this.http.get<LaneResponse[]>(`${this.baseUrl}/pool/${poolId}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  actualizar(id: number, dto: LaneRequest): Observable<LaneResponse> {
    return this.http.put<LaneResponse>(`${this.baseUrl}/${id}`, dto, {
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
