import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { claseEstado, estadoDesdeResponse, labelEstado } from '../../../core/proceso-estado.util';
import { puedeEditarProcesos, esAdministradorEmpresa } from '../../../core/roles.util';
import { ProcesoResponse, EstadoProceso, PoolResponse } from '../../../models/proceso';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { PoolService } from '../../../services/pool.service';
import { ProcesoService } from '../../../services/proceso.service';

@Component({
  selector: 'app-lista-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-procesos.html',
  styleUrls: ['./lista-procesos.css']
})
export class ListaProcesosComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly poolService = inject(PoolService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  procesos: ProcesoResponse[] = [];
  procesosFiltrados: ProcesoResponse[] = [];
  pools: PoolResponse[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  filtroCategoria = '';
  filtroEstado: '' | EstadoProceso = '';
  poolActivoId: number | null = null;
  cambiarPoolVisible = false;

  ngOnInit(): void {
    this.cargarPoolsYProcesos();
  }

  get puedeEditar(): boolean {
    return puedeEditarProcesos(this.authService.getSesionActual()?.rolesSistema);
  }

  get esAdmin(): boolean {
    return esAdministradorEmpresa(this.authService.getSesionActual()?.rolesSistema);
  }

  get poolActivo(): PoolResponse | undefined {
    return this.pools.find((p) => p.id === this.poolActivoId);
  }

  cargarPoolsYProcesos(): void {
    this.cargando = true;
    this.error = '';

    this.authService
      .getNitEmpresaSeguro()
      .pipe(
        switchMap(() => this.poolService.listar()),
        switchMap((pools) => {
          this.pools = pools;
          const activo =
            this.poolService.getPoolActivoId() ?? pools.find((p) => p.esDefault)?.id ?? pools[0]?.id ?? null;
          this.poolActivoId = activo;
          this.poolService.setPoolActivoId(activo);
          return activo != null ? this.procesoService.obtenerPorPool(activo) : this.procesoService.obtenerTodos();
        }),
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.procesos = data;
          this.filtrar();
          this.cdr.detectChanges();
        },
        error: (err: Error) => {
          this.procesos = [];
          this.procesosFiltrados = [];
          this.error = err.message || 'Error al cargar los procesos.';
          this.cdr.detectChanges();
        }
      });
  }

  cargarProcesos(): void {
    if (this.poolActivoId == null) {
      this.procesos = [];
      this.procesosFiltrados = [];
      return;
    }

    this.cargando = true;
    this.error = '';
    this.procesoService
      .obtenerPorPool(this.poolActivoId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.procesos = data;
          this.filtrar();
          this.cdr.detectChanges();
        },
        error: (err: Error) => {
          this.procesos = [];
          this.procesosFiltrados = [];
          this.error = err.message || 'Error al cargar los procesos.';
          this.cdr.detectChanges();
        }
      });
  }

  filtrar(): void {
    this.procesosFiltrados = this.procesos.filter((p) => {
      const nombreOk = p.nombre.toLowerCase().includes(this.busqueda.toLowerCase());
      const catOk = this.filtroCategoria ? p.categoria === this.filtroCategoria : true;
      const est = estadoDesdeResponse(p);
      const estadoOk = this.filtroEstado ? est === this.filtroEstado : true;
      return nombreOk && catOk && estadoOk;
    });
  }

  toggleCambiarPool(): void {
    this.cambiarPoolVisible = !this.cambiarPoolVisible;
  }

  cambiarPool(poolId: number | null): void {
    this.poolActivoId = poolId;
    this.poolService.setPoolActivoId(poolId);
    this.cambiarPoolVisible = false;
    this.cargarProcesos();
  }

  ver(proceso: ProcesoResponse, ev: Event): void {
    ev.stopPropagation();
    void this.router.navigate(['/procesos', proceso.id, 'detalle']);
  }

  editar(proceso: ProcesoResponse, ev: Event): void {
    ev.stopPropagation();
    void this.router.navigate(['/procesos', proceso.id, 'editar']);
  }

  nuevo(): void {
    this.router.navigate(['/procesos/nuevo']).then((ok) => {
      if (!ok) {
        this.notify.error('No se pudo navegar al editor de proceso.');
      }
    });
  }

  eliminar(proceso: ProcesoResponse, ev: Event): void {
    ev.stopPropagation();
    if (!this.esAdmin) return;
    if (!confirm(`¿Marcar como inactivo el proceso "${proceso.nombre}"?`)) return;
    const idEmp = this.authService.getSesionActual()?.id;
    this.procesoService.eliminar(proceso.id, idEmp).subscribe({
      next: () => {
        this.notify.exito('Proceso desactivado.');
        this.cargarProcesos();
      },
      error: () => this.notify.error('No se pudo eliminar el proceso.')
    });
  }

  get categorias(): string[] {
    return [...new Set(this.procesos.map((p) => p.categoria).filter(Boolean))];
  }

  getEstado(proceso: ProcesoResponse): string {
    return labelEstado(proceso);
  }

  getClaseEstado(proceso: ProcesoResponse): string {
    return claseEstado(proceso);
  }
}