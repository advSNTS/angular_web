import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';
import { DashboardMetrics } from '../../models/proceso';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

interface BarItem {
  label: string;
  value: number;
  color: string;
  pct: number;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  pct: number;
  dashOffset: number;
  dashArray: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly session = this.authService.getSesionActual();

  metrics: DashboardMetrics | null = null;
  cargando = true;
  error = '';

  barItems: BarItem[] = [];
  donutSegments: DonutSegment[] = [];
  barMax = 0;
  donutRadius = 54;
  donutCircumference = 2 * Math.PI * this.donutRadius;

  private readonly barColors: Record<string, string> = {
    'Procesos':        '#38bdf8',
    'Publicados':      '#4ade80',
    'Borradores':      '#fbbf24',
    'Inactivos':       '#94a3b8',
    'Empleados':       '#60a5fa',
    'Actividades':     '#c084fc',
    'Gateways':        '#a3e635',
    'Arcos':           '#38bdf8',
    'Pools':           '#f472b6',
    'Lanes':           '#fb923c'
  };

  private readonly donutColors = ['#4ade80', '#fbbf24', '#94a3b8'];

  ngOnInit(): void {
    this.dashboardService.obtenerDashboard()
      .pipe(
        timeout(15000),
        catchError((err) => {
          console.error('[Dashboard] error', err);
          this.error = 'No se pudieron cargar las metricas.';
          return of(null);
        }),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((m) => {
        if (m) {
          this.metrics = m;
          this.buildCharts(m);
        }
      });
  }

  private buildCharts(m: DashboardMetrics): void {
    const rawBars: { label: string; value: number }[] = [
      { label: 'Procesos', value: m.totalProcesos },
      { label: 'Publicados', value: m.procesosPublicado },
      { label: 'Borradores', value: m.procesosBorrador },
      { label: 'Inactivos', value: m.procesosInactivo },
      { label: 'Empleados', value: m.totalEmpleados },
      { label: 'Actividades', value: m.totalActividades },
      { label: 'Gateways', value: m.totalGateways },
      { label: 'Arcos', value: m.totalArcos },
      { label: 'Pools', value: m.totalPools },
      { label: 'Lanes', value: m.totalLanes }
    ];

    const maxVal = Math.max(...rawBars.map(b => b.value), 1);
    this.barMax = maxVal;

    this.barItems = rawBars.map(b => ({
      label: b.label,
      value: b.value,
      color: this.barColors[b.label] || '#94a3b8',
      pct: Math.round((b.value / maxVal) * 100)
    }));

    const donutData = [
      { label: 'Publicados', value: m.procesosPublicado },
      { label: 'Borradores', value: m.procesosBorrador },
      { label: 'Inactivos', value: m.procesosInactivo }
    ];

    const donutTotal = Math.max(donutData.reduce((s, d) => s + d.value, 0), 1);
    let cumulative = 0;
    this.donutSegments = donutData.map((d, i) => {
      const ratio = d.value / donutTotal;
      const dashLen = ratio * this.donutCircumference;
      const offset = -cumulative;
      cumulative += dashLen;
      return {
        label: d.label,
        value: d.value,
        pct: Math.round(ratio * 100),
        color: this.donutColors[i],
        dashArray: `${dashLen.toFixed(1)} ${(this.donutCircumference - dashLen).toFixed(1)}`,
        dashOffset: offset
      };
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }
}
