import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import {
  HistorialProcesoApi,
  ProcesoCompartidoRequest,
  ProcesoCompartidoResponse,
  ProcesoRequest,
  ProcesoResponse
} from '../models/proceso';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = buildApiPath('/procesos');

  obtenerTodos(): Observable<ProcesoResponse[]> {
    return this.http.get<ProcesoResponse[]>(this.baseUrl, {
      params: this.nitParams()
    });
  }

  obtenerPorId(id: number): Observable<ProcesoResponse> {
    return this.http.get<ProcesoResponse>(`${this.baseUrl}/${id}`, {
      params: this.nitParams()
    });
  }

  obtenerPorCategoria(categoria: string): Observable<ProcesoResponse[]> {
    return this.http.get<ProcesoResponse[]>(`${this.baseUrl}/categoria/${encodeURIComponent(categoria)}`, {
      params: this.nitParams()
    });
  }

  crear(dto: ProcesoRequest): Observable<ProcesoResponse> {
    const nit = this.requireNit();
    const body: ProcesoRequest = { ...dto, nitEmpresa: dto.nitEmpresa ?? nit };
    return this.http.post<ProcesoResponse>(this.baseUrl, body);
  }

  actualizar(id: number, dto: ProcesoRequest, idEmpleado?: number): Observable<ProcesoResponse> {
    let params = this.nitParams();
    if (idEmpleado != null) {
      params = params.set('idEmpleado', String(idEmpleado));
    }
    return this.http.put<ProcesoResponse>(`${this.baseUrl}/${id}`, dto, { params });
  }

  eliminar(id: number, idEmpleado?: number): Observable<void> {
    let params = this.nitParams();
    if (idEmpleado != null) {
      params = params.set('idEmpleado', String(idEmpleado));
    }
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { params });
  }

  obtenerHistorial(id: number): Observable<HistorialProcesoApi[]> {
    return this.http.get<HistorialProcesoApi[]>(`${this.baseUrl}/${id}/historial`);
  }

  compartir(procesoId: number, dto: ProcesoCompartidoRequest): Observable<ProcesoCompartidoResponse> {
    return this.http.post<ProcesoCompartidoResponse>(
      `${this.baseUrl}/${procesoId}/compartir`,
      dto,
      { params: this.nitParams() }
    );
  }

  listarCompartidos(procesoId: number): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.baseUrl}/${procesoId}/compartidos`, {
      params: this.nitParams()
    });
  }

  private nitParams(): HttpParams {
    return new HttpParams().set('nitEmpresa', this.requireNit());
  }

  private requireNit(): string {
    const nit = this.auth.getNitEmpresa();
    if (!nit) {
      throw new Error('Sesión sin NIT de empresa.');
    }
    return nit;
  }
}
