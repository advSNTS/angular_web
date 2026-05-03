import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmpresaService } from '../../services/empresa.service';

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

  cargando = false;
  error = '';

  infoClave = '';

  readonly form = this.fb.nonNullable.group({
    nit: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['']
  });

  enviar(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.cargando = true;
    const payload = {
      nit: v.nit.trim(),
      nombre: v.nombre.trim(),
      correo: v.correo.trim(),
      ...(v.contrasena.trim() ? { contrasena: v.contrasena.trim() } : {})
    };

    this.empresaService
      .registrar(payload)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (res.contrasenaInicialAsignada) {
            this.infoClave = `Contraseña del administrador (guárdela): ${res.contrasenaInicialAsignada}`;
            setTimeout(() => void this.router.navigateByUrl('/login'), 4000);
          } else {
            void this.router.navigateByUrl('/login');
          }
        },
        error: (err: HttpErrorResponse | Error) => {
          if (err instanceof HttpErrorResponse) {
            if (typeof err.error === 'string' && err.error.trim()) {
              this.error = err.error;
            } else {
              const e = err.error;
              this.error =
                (typeof e === 'object' && e && 'message' in e && typeof e.message === 'string'
                  ? e.message
                  : null) ||
                err.message ||
                'No se pudo registrar la empresa.';
            }
          } else {
            this.error = err.message || 'No se pudo registrar la empresa.';
          }
        }
      });
  }
}
