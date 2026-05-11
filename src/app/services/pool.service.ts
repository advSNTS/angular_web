import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { PoolRequest, PoolResponse } from '../models/proceso';
import { AuthService } from './auth.service';

const ACTIVE_POOL_KEY = 'angular_web_active_pool_id';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = buildApiPath('/pools');

  listar(): Observable<PoolResponse[]> {
    return this.http.get<PoolResponse[]>(this.baseUrl, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  obtener(id: number): Observable<PoolResponse> {
    return this.http.get<PoolResponse>(`${this.baseUrl}/${id}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  crear(dto: PoolRequest): Observable<PoolResponse> {
    return this.http.post<PoolResponse>(this.baseUrl, dto, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  getPoolActivoId(): number | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = window.sessionStorage.getItem(ACTIVE_POOL_KEY);
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  setPoolActivoId(poolId: number | null): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (poolId == null) {
      window.sessionStorage.removeItem(ACTIVE_POOL_KEY);
      return;
    }

    window.sessionStorage.setItem(ACTIVE_POOL_KEY, String(poolId));
  }

  private requireNit(): string {
    const nit = this.auth.getNitEmpresa();
    if (!nit) throw new Error('SesiÃ³n sin NIT de empresa.');
    return nit;
  }
}
