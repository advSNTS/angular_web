import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmpresaService } from '../../services/empresa.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-registro-empresa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro-empresa.component.html',
  styleUrl: './registro-empresa.component.css'
})
export class RegistroEmpresaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  cargando = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    nit: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasenaAdministrador: ['']
  });

  enviar(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.cargando = true;
    const pwd = v.contrasenaAdministrador?.trim();
    this.empresaService
      .registrar({
        nit: v.nit.trim(),
        nombre: v.nombre.trim(),
        correo: v.correo.trim(),
        ...(pwd ? { contrasenaAdministrador: pwd } : {})
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (res.mensajeRegistro) {
            this.notify.exito(res.mensajeRegistro);
          }
          void this.router.navigateByUrl('/login');
        },
        error: (err: HttpErrorResponse | Error) => {
          if (err instanceof HttpErrorResponse) {
            const e = err.error;
            this.error =
              (typeof e === 'object' && e && 'message' in e && typeof e.message === 'string'
                ? e.message
                : null) ||
              err.message ||
              'No se pudo registrar la empresa.';
          } else {
            this.error = err.message || 'No se pudo registrar la empresa.';
          }
        }
      });
  }
}
