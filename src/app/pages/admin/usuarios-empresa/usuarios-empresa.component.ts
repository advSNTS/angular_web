import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { EmpleadoEmpresaService } from '../../../services/empleado-empresa.service';
import { NotificationService } from '../../../services/notification.service';
import { RolProcesoService } from '../../../services/rol-proceso.service';
import { RolXEmpleadoService } from '../../../services/rol-x-empleado.service';
import { EmpleadoResponse, RolProcesoResponse } from '../../../models/proceso';

@Component({
  selector: 'app-usuarios-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-empresa.component.html',
  styleUrl: './usuarios-empresa.component.css'
})
export class UsuariosEmpresaComponent implements OnInit, OnDestroy {
  private readonly empleadosApi = inject(EmpleadoEmpresaService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly rolProceso = inject(RolProcesoService);
  private readonly rolXEmpleado = inject(RolXEmpleadoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  usuarios: EmpleadoResponse[] = [];
  rolesFuncionales: RolProcesoResponse[] = [];
  rolesActuales: Record<number, string> = {};
  esAdmin = false;
  cargando = true;
  invitando = false;
  asignando: Record<number, boolean> = {};

  readonly invitarForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    tipoDocumento: this.fb.nonNullable.control<'CC' | 'CE'>('CC'),
    numeroDocumento: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly asignacionForms: Record<number, FormGroup> = {};

  ngOnInit(): void {
    this.esAdmin = this.auth.esAdmin();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    this.auth.getNitEmpresaSeguro()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((nit) => this.empleadosApi.listarPorEmpresa(nit))
      )
      .subscribe({
        next: (u) => {
          this.usuarios = u;
          this.cargarRolesFuncionales();
        },
        error: () => {
          this.notify.error('No se pudieron cargar los usuarios.');
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  private cargarRolesFuncionales(): void {
    const nit = this.auth.getNitEmpresa();
    if (!nit) {
      this.cargando = false;
      this.notify.error('No se pudo obtener la empresa de la sesión.');
      this.cdr.detectChanges();
      return;
    }
    this.rolProceso.listarPorEmpresa(nit).subscribe({
      next: (r) => {
        this.rolesFuncionales = r;
        for (const emp of this.usuarios) {
          if (!this.asignacionForms[emp.id]) {
            this.asignacionForms[emp.id] = this.fb.group({
              rolId: this.fb.control<number | null>(null)
            });
          }
          this.rolXEmpleado.porEmpleado(emp.id).subscribe({
            next: (roles) => {
              this.rolesActuales[emp.id] = roles.length > 0
                ? roles.map(r => `${r.nombreRol ?? '?'} (${r.permiso ?? ''})`).join(', ')
                : 'Sin rol';
              this.cdr.detectChanges();
            },
            error: () => { this.rolesActuales[emp.id] = 'Sin rol'; this.cdr.detectChanges(); }
          });
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rolesFuncionales = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  invitar(): void {
    const nit = this.auth.getNitEmpresa();
    if (!nit || this.invitarForm.invalid) {
      if (this.invitarForm.invalid) this.invitarForm.markAllAsTouched();
      else this.notify.error('No se pudo obtener la empresa de la sesión.');
      return;
    }
    const v = this.invitarForm.getRawValue();
    this.invitando = true;
    this.cdr.detectChanges();
    this.empleadosApi
      .invitar({
        nitEmpresa: nit,
        nombre: v.nombre.trim(),
        tipoDocumento: v.tipoDocumento,
        numeroDocumento: v.numeroDocumento.trim(),
        credencial: { correo: v.correo.trim(), contrasena: v.contrasena }
      })
      .pipe(finalize(() => (this.invitando = false)))
      .subscribe({
        next: () => {
          this.notify.exito('Usuario creado. Asígnale un rol funcional desde la lista.');
          this.invitarForm.reset({ tipoDocumento: 'CC', nombre: '', numeroDocumento: '', correo: '', contrasena: '' });
          this.cargar();
          this.cdr.detectChanges();
        },
        error: (e: HttpErrorResponse) => {
          this.notify.error(
            typeof e.error === 'object' && e.error && 'message' in e.error
              ? String((e.error as { message: string }).message)
              : 'No se pudo crear el usuario.'
          );
          this.cdr.detectChanges();
        }
      });
  }

  asignarRolFuncional(empleadoId: number): void {
    const g = this.asignacionForms[empleadoId];
    const rolId = g?.get('rolId')?.value as number | null;
    if (!rolId) {
      this.notify.info('Seleccione un rol funcional.');
      return;
    }
    this.asignando[empleadoId] = true;
    this.cdr.detectChanges();
    this.rolXEmpleado
      .asignar({ empleadoId, rolId })
      .pipe(finalize(() => (this.asignando[empleadoId] = false)))
      .subscribe({
        next: () => {
          this.notify.exito('Rol funcional asignado.');
          this.rolXEmpleado.porEmpleado(empleadoId).subscribe({
            next: (roles) => {
              this.rolesActuales[empleadoId] = roles.length > 0
                ? roles.map(r => `${r.nombreRol ?? '?'} (${r.permiso ?? ''})`).join(', ')
                : 'Sin rol';
              this.cdr.detectChanges();
            }
          });
        },
        error: () => {
          this.notify.error('No se pudo asignar el rol.');
          this.cdr.detectChanges();
        }
      });
  }
}