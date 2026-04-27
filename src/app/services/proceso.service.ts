import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProcesoResponse, ProcesoRequest } from '../models/proceso';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcesoService {

  private apiUrl = `${environment.apiUrl}/procesos`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<ProcesoResponse[]> {
    return this.http.get<ProcesoResponse[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ProcesoResponse> {
    return this.http.get<ProcesoResponse>(`${this.apiUrl}/${id}`);
  }

  obtenerPorCategoria(categoria: string): Observable<ProcesoResponse[]> {
    return this.http.get<ProcesoResponse[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  crear(dto: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}