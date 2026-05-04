import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);

  cargando = false;
  reenviando = false;
  error = '';
  avisoVerificacion = '';
  correoPendienteVerificacion = '';

  readonly loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      void this.router.navigateByUrl('/');
    }
  }

  ingresar(): void {
    this.error = '';
    this.avisoVerificacion = '';
    this.correoPendienteVerificacion = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const values = this.loginForm.getRawValue();

    this.authService
      .iniciarSesion({
        correo: values.correo.trim(),
        contrasena: values.contrasena
      })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/'),
        error: (err: Error) => {
          const mensaje = err.message || 'Credenciales inválidas.';
          this.error = mensaje;

          if (this.esErrorDeVerificacion(mensaje)) {
            this.correoPendienteVerificacion = values.correo.trim();
          }
        }
      });
  }

  reenviarCorreoVerificacion(): void {
    this.error = '';
    this.avisoVerificacion = '';

    const correo = this.correoPendienteVerificacion || this.loginForm.getRawValue().correo.trim();

    if (!correo) {
      this.error = 'Escribe el correo para reenviar la verificacion.';
      return;
    }

    this.reenviando = true;

    this.empresaService
      .reenviarVerificacion(correo)
      .pipe(finalize(() => (this.reenviando = false)))
      .subscribe({
        next: (res) => {
          this.avisoVerificacion = res.mensaje || 'Se envio un nuevo correo de verificacion.';
        },
        error: (err: Error) => {
          this.error = err.message || 'No se pudo reenviar el correo de verificacion.';
        }
      });
  }

  get mostrarReenvioVerificacion(): boolean {
    return !!this.correoPendienteVerificacion;
  }

  private esErrorDeVerificacion(mensaje: string): boolean {
    return mensaje.toLowerCase().includes('verificar su correo');
  }
}