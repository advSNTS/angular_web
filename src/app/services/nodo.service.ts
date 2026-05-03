import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { NodoRequest, NodoResponse } from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NodoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/nodos');

  crear(dto: NodoRequest): Observable<NodoResponse> {
    return this.http.post<NodoResponse>(this.baseUrl, dto);
  }

  obtenerPorProceso(idProceso: number): Observable<NodoResponse[]> {
    return this.http.get<NodoResponse[]>(`${this.baseUrl}/proceso/${idProceso}`, {
      params: new HttpParams().set('nitEmpresa', this.requireNit())
    });
  }

  actualizar(id: number, dto: NodoRequest): Observable<NodoResponse> {
    return this.http.put<NodoResponse>(`${this.baseUrl}/${id}`, dto);
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
