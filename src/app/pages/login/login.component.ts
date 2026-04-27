import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  cargando = false;
  error = '';

  readonly loginForm = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      void this.router.navigateByUrl('/front/dashboard');
    }
  }

  ingresar(): void {
    this.error = '';

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
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: (err: Error) => {
          this.error = err.message || 'Credenciales inválidas.';
        }
      });
  }
}
