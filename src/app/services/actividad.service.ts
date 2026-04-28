import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ActividadResponse, ActividadRequest } from '../models/proceso';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private apiUrl = `${environment.apiUrl}/actividades`;

  // MOCK — reemplaza of(...) por this.http.get(...) cuando el backend esté listo
  private mock: ActividadResponse[] = [
    { id: 1, nodoId: 1, nombreNodo: 'Inicio', procesoId: 1, nombreProceso: 'Proceso de Ventas', descripcion: 'Recepción del cliente' },
    { id: 2, nodoId: 2, nombreNodo: 'Evaluación', procesoId: 1, nombreProceso: 'Proceso de Ventas', descripcion: 'Evaluar necesidades' },
    { id: 3, nodoId: 3, nombreNodo: 'Cierre', procesoId: 1, nombreProceso: 'Proceso de Ventas', descripcion: 'Firma del contrato' },
  ];

  constructor(private http: HttpClient) {}

  obtenerPorProceso(procesoId: number): Observable<ActividadResponse[]> {
    return of(this.mock.filter(a => a.procesoId === procesoId));
    // BACKEND: return this.http.get<ActividadResponse[]>(`${this.apiUrl}/proceso/${procesoId}`);
  }

  crear(dto: ActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: ActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}