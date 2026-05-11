import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoolResponse } from '../../../models/proceso';
import { NotificationService } from '../../../services/notification.service';
import { PoolService } from '../../../services/pool.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-pool-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pool-admin.component.html',
  styleUrl: './pool-admin.component.css'
})
export class PoolAdminComponent implements OnInit {
  private readonly poolApi = inject(PoolService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);

  pools: PoolResponse[] = [];
  cargando = true;
  guardando = false;
  nuevoPool = {
    nombre: '',
    descripcion: '',
    esDefault: false
  };

  ngOnInit(): void {
    this.cargarPools();
  }

  cargarPools(): void {
    this.poolApi.listar().subscribe({
      next: (p) => {
        this.pools = p;
        if (this.poolApi.getPoolActivoId() == null && p.length) {
          this.poolApi.setPoolActivoId(p[0].id);
        }
        this.cargando = false;
      },
      error: () => {
        this.notify.error('No se pudieron cargar los pools.');
        this.cargando = false;
      }
    });
  }

  crearPool(): void {
    if (!this.nuevoPool.nombre.trim()) {
      this.notify.info('Ingresa un nombre para el pool.');
      return;
    }

    this.guardando = true;
    this.poolApi.crear({
      nombre: this.nuevoPool.nombre.trim(),
      descripcion: this.nuevoPool.descripcion.trim() || null,
      esDefault: this.nuevoPool.esDefault
    }).subscribe({
      next: (pool) => {
        this.notify.exito('Pool creado correctamente.');
        this.poolApi.setPoolActivoId(pool.id);
        this.nuevoPool = { nombre: '', descripcion: '', esDefault: false };
        this.guardando = false;
        this.cargarPools();
      },
      error: () => {
        this.notify.error('No se pudo crear el pool.');
        this.guardando = false;
      }
    });
  }

  usarComoActivo(poolId: number): void {
    this.poolApi.setPoolActivoId(poolId);
    this.notify.info(`Pool ${poolId} seleccionado como activo.`);
  }

  get poolActivoId(): number | null {
    return this.poolApi.getPoolActivoId();
  }
}
