import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PermisoRol, RolProcesoResponse } from '../../models/proceso';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RolProcesoService } from '../../services/rol-proceso.service';

@Component({
  selector: 'app-roles-proceso-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles-proceso-page.component.html',
  styleUrl: './roles-proceso-page.component.css'
})
export class RolesProcesoPageComponent implements OnInit {
  private readonly api = inject(RolProcesoService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);

  roles: RolProcesoResponse[] = [];
  cargando = true;
  guardando = false;
  editandoId: number | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    permiso: this.fb.nonNullable.control<PermisoRol>('VER')
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const nit = this.auth.getNitEmpresa();
    if (!nit) return;
    this.cargando = true;
    this.api.listarPorEmpresa(nit).subscribe({
      next: (r) => {
        this.roles = r;
        this.cargando = false;
      },
      error: () => {
        this.notify.error('No se pudieron cargar los roles.');
        this.cargando = false;
      }
    });
  }

  nuevo(): void {
    this.editandoId = null;
    this.form.reset({ nombre: '', descripcion: '', permiso: 'VER' });
  }

  editar(r: RolProcesoResponse): void {
    this.editandoId = r.id;
    this.form.patchValue({
      nombre: r.nombre,
      descripcion: r.descripcion ?? '',
      permiso: (r.permiso as PermisoRol) ?? 'VER'
    });
  }

  guardar(): void {
    const nit = this.auth.getNitEmpresa();
    if (!nit || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardando = true;
    const req = {
      nitEmpresa: nit,
      nombre: v.nombre.trim(),
      descripcion: v.descripcion?.trim() || null,
      permiso: v.permiso
    };
    const obs =
      this.editandoId != null
        ? this.api.actualizar(this.editandoId, req)
        : this.api.crear(req);
    obs.pipe(finalize(() => (this.guardando = false))).subscribe({
      next: () => {
        this.notify.exito(this.editandoId != null ? 'Rol actualizado.' : 'Rol creado.');
        this.nuevo();
        this.cargar();
      },
      error: (e: HttpErrorResponse) => {
        this.notify.error(e.error?.message || 'No se pudo guardar.');
      }
    });
  }

  eliminar(r: RolProcesoResponse): void {
    if (!confirm(`¿Eliminar el rol "${r.nombre}"?`)) return;
    this.api.eliminar(r.id).subscribe({
      next: () => {
        this.notify.exito('Rol eliminado.');
        this.cargar();
      },
      error: (e: HttpErrorResponse) => {
        if (e.status === 409) {
          this.notify.error(
            'No se puede eliminar: el rol está asignado a una o más actividades (requiere).'
          );
        } else {
          this.notify.error(e.error?.message || 'No se pudo eliminar.');
        }
      }
    });
  }
}
