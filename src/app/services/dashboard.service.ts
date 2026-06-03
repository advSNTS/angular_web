import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { DashboardMetrics } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = buildApiPath('/estadisticas');

  obtenerDashboard(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.base}/dashboard`);
  }
}
