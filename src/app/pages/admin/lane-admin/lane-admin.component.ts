import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { LaneRequest, LaneResponse, PoolResponse, RolProcesoResponse } from '../../../models/proceso';
import { AuthService } from '../../../services/auth.service';
import { LaneService } from '../../../services/lane.service';
import { NotificationService } from '../../../services/notification.service';
import { PoolService } from '../../../services/pool.service';
import { RolProcesoService } from '../../../services/rol-proceso.service';

@Component({
  selector: 'app-lane-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lane-admin.component.html',
  styleUrl: './lane-admin.component.css'
})
export class LaneAdminComponent implements OnInit, OnDestroy {
  private readonly api = inject(LaneService);
  private readonly poolApi = inject(PoolService);
  private readonly rolApi = inject(RolProcesoService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  lanes: LaneResponse[] = [];
  pools: PoolResponse[] = [];
  roles: RolProcesoResponse[] = [];
  cargando = true;
  guardando = false;
  editandoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    poolId: this.fb.control<number | null>(null, Validators.required),
    rolProcesoId: this.fb.control<number | null>(null, Validators.required)
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.auth.getNitEmpresaSeguro()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((nit) => this.poolApi.listar().pipe(
          switchMap((pools) => {
            this.pools = pools;
            return this.rolApi.listarPorEmpresa(nit);
          })
        ))
      )
      .subscribe({
        next: (roles) => {
          this.roles = roles;
          this.cargarLanes();
        },
        error: () => {
          this.notify.error('No se pudieron cargar los roles de proceso.');
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cargarLanes(): void {
    this.api.listarPorEmpresa().subscribe({
      next: (lanes) => {
        this.lanes = lanes;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notify.error('No se pudieron cargar las lanes.');
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  nuevo(): void {
    this.editandoId = null;
    this.form.reset({ nombre: '', poolId: null, rolProcesoId: null });
  }

  editar(l: LaneResponse): void {
    this.editandoId = l.id;
    this.form.patchValue({
      nombre: l.nombre,
      poolId: l.poolId,
      rolProcesoId: l.rolProcesoId ?? null
    });
  }

  guardar(): void {
    const nit = this.auth.getNitEmpresa();
    if (!nit || this.form.invalid) {
      if (this.form.invalid) this.form.markAllAsTouched();
      else this.notify.error('No se pudo obtener la empresa de la sesión.');
      return;
    }

    const v = this.form.getRawValue();
    if (v.poolId == null || v.rolProcesoId == null) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();
    const req: LaneRequest = {
      poolId: v.poolId,
      nombre: v.nombre.trim(),
      rolProcesoId: v.rolProcesoId
    };

    const obs = this.editandoId != null ? this.api.actualizar(this.editandoId, req) : this.api.crear(req);
    obs.pipe(finalize(() => (this.guardando = false))).subscribe({
      next: () => {
        this.notify.exito(this.editandoId != null ? 'Lane actualizada.' : 'Lane creada.');
        this.nuevo();
        this.cargarLanes();
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => {
        this.notify.error(e.error?.message || 'No se pudo guardar.');
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(l: LaneResponse): void {
    if (!confirm(`¿Eliminar la lane "${l.nombre}"?`)) return;
    this.api.eliminar(l.id).subscribe({
      next: () => {
        this.notify.exito('Lane eliminada.');
        this.cargarLanes();
        this.cdr.detectChanges();
      },
      error: (e: HttpErrorResponse) => {
        this.notify.error(e.error?.message || 'No se pudo eliminar.');
        this.cdr.detectChanges();
      }
    });
  }

  nombrePool(id: number): string {
    return this.pools.find((p) => p.id === id)?.nombre || `Pool ${id}`;
  }

  nombreRol(id: number | null | undefined): string {
    if (id == null) return 'Sin rol';
    return this.roles.find((r) => r.id === id)?.nombre || `Rol ${id}`;
  }
}
