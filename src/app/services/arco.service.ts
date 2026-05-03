import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { ArcoRequest, ArcoResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/arcos');

  obtenerPorProceso(procesoId: number): Observable<ArcoResponse[]> {
    return this.http.get<ArcoResponse[]>(`${this.baseUrl}/proceso/${procesoId}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  crear(dto: ArcoRequest): Observable<ArcoResponse> {
    const nit = this.requireNit();
    return this.http.post<ArcoResponse>(this.baseUrl, { ...dto, nitEmpresa: dto.nitEmpresa ?? nit });
  }

  actualizar(id: number, dto: ArcoRequest): Observable<ArcoResponse> {
    const nit = this.requireNit();
    return this.http.put<ArcoResponse>(`${this.baseUrl}/${id}`, { ...dto, nitEmpresa: dto.nitEmpresa ?? nit });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private requireNit(): string {
    const nit = this.auth.getNitEmpresa();
    if (!nit) throw new Error('Sesión sin NIT de empresa.');
    return nit;
  }
}
