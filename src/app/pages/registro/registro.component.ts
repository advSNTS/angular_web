import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  paso = 1;
  guardando = false;
  error = '';

  empresa = { nit: '', nombre: '', correo: '' };
  empleado = {
    nitEmpresa: '',
    nombre: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    credencial: { correo: '', contrasena: '' }
  };

  constructor(private http: HttpClient, private router: Router) {}

  registrar(): void {
    this.guardando = true;
    this.error = '';
    this.empleado.nitEmpresa = this.empresa.nit;

    this.http.post('/api/empresas', this.empresa).pipe(
      switchMap(() => this.http.post('/api/empleados', this.empleado))
    ).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.error = 'Error al registrar. Verifica que el NIT no esté ya registrado.';
        this.guardando = false;
      }
    });
  }

  irLogin(): void {
    this.router.navigate(['/']);
  }
}