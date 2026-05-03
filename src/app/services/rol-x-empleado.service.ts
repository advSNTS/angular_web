import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { RolXEmpleadoRequest, RolXEmpleadoResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class RolXEmpleadoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/rol-empleado');

  asignar(dto: RolXEmpleadoRequest): Observable<RolXEmpleadoResponse> {
    return this.http.post<RolXEmpleadoResponse>(this.baseUrl, dto);
  }

  porEmpleado(empleadoId: number): Observable<RolXEmpleadoResponse[]> {
    return this.http.get<RolXEmpleadoResponse[]>(`${this.baseUrl}/empleado/${empleadoId}`);
  }

  porRol(rolId: number): Observable<RolXEmpleadoResponse[]> {
    return this.http.get<RolXEmpleadoResponse[]>(`${this.baseUrl}/rol/${rolId}`);
  }

  quitar(asignacionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${asignacionId}`);
  }
}
