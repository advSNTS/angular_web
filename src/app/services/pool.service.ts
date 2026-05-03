import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { PoolResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
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

  private requireNit(): string {
    const nit = this.auth.getNitEmpresa();
    if (!nit) throw new Error('Sesión sin NIT de empresa.');
    return nit;
  }
}
