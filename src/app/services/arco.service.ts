import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ArcoResponse, ArcoRequest } from '../models/proceso';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  private apiUrl = `${environment.apiUrl}/arcos`;

  private mock: ArcoResponse[] = [
    { id: 1, idProceso: 1, nombreProceso: 'Proceso de Ventas', nodoOrigenId: 1, nombreNodoOrigen: 'Inicio', nodoDestinoId: 2, nombreNodoDestino: 'Evaluación' },
    { id: 2, idProceso: 1, nombreProceso: 'Proceso de Ventas', nodoOrigenId: 2, nombreNodoOrigen: 'Evaluación', nodoDestinoId: 4, nombreNodoDestino: 'Decision' },
    { id: 3, idProceso: 1, nombreProceso: 'Proceso de Ventas', nodoOrigenId: 4, nombreNodoOrigen: 'Decision', nodoDestinoId: 3, nombreNodoDestino: 'Cierre' },
  ];

  constructor(private http: HttpClient) {}

  obtenerPorProceso(procesoId: number): Observable<ArcoResponse[]> {
    return of(this.mock.filter(a => a.idProceso === procesoId));
    // BACKEND: return this.http.get<ArcoResponse[]>(`${this.apiUrl}/proceso/${procesoId}`);
  }

  crear(dto: ArcoRequest): Observable<ArcoResponse> {
    return this.http.post<ArcoResponse>(this.apiUrl, dto);
  }

  actualizar(id: number, dto: ArcoRequest): Observable<ArcoResponse> {
    return this.http.put<ArcoResponse>(`${this.apiUrl}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}