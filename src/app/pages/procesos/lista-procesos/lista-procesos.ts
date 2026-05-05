import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { claseEstado, estadoDesdeResponse, labelEstado } from '../../../core/proceso-estado.util';
import { puedeEditarProcesos, esAdministradorEmpresa } from '../../../core/roles.util';
import { AuthService } from '../../../services/auth.service';
import { ProcesoService } from '../../../services/proceso.service';
import { NotificationService } from '../../../services/notification.service';
import { EstadoProceso, ProcesoResponse } from '../../../models/proceso';
import { finalize, switchMap } from 'rxjs';
@Component({
  selector: 'app-lista-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-procesos.html',
  styleUrls: ['./lista-procesos.css']
})
export class ListaProcesosComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  procesos: ProcesoResponse[] = [];
  procesosFiltrados: ProcesoResponse[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  filtroCategoria = '';
  filtroEstado: '' | EstadoProceso = '';

  ngOnInit(): void {
    this.cargarProcesos();
  }

  get puedeEditar(): boolean {
    return puedeEditarProcesos(this.authService.getSesionActual()?.rolesSistema);
  }

  get esAdmin(): boolean {
    return esAdministradorEmpresa(this.authService.getSesionActual()?.rolesSistema);
  }

  cargarProcesos(): void {
  this.cargando = true;
  this.error = '';

  this.authService
    .getNitEmpresaSeguro()
    .pipe(
      switchMap(() => this.procesoService.obtenerTodos()),
      finalize(() => (this.cargando = false))
    )
    .subscribe({
      next: (data) => {
        this.procesos = data;
        this.filtrar();
      },
      error: (err: Error) => {
        this.procesos = [];
        this.procesosFiltrados = [];
        this.error =
          err.message ||
          'Error al cargar los procesos. Verifica el backend o el inicio de sesión.';
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

  ver(proceso: ProcesoResponse, ev: Event): void {
    ev.stopPropagation();
    void this.router.navigate(['/procesos', proceso.id, 'detalle']);
  }

  editar(proceso: ProcesoResponse, ev: Event): void {
    ev.stopPropagation();
    void this.router.navigate(['/procesos', proceso.id, 'editar']);
  }

  nuevo(): void {
    void this.router.navigate(['/procesos/nuevo']);
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
