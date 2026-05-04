import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verificar-correo.component.html',
  styleUrl: './verificar-correo.component.css'
})
export class VerificarCorreoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly empresaService = inject(EmpresaService);

  cargando = true;
  exito = false;
  mensaje = 'Verificando tu correo...';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.cargando = false;
      this.exito = false;
      this.mensaje = 'El enlace de verificacion no tiene token.';
      return;
    }

    this.empresaService
      .verificarCorreo(token)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          this.exito = !!res.verificado;
          this.mensaje = res.mensaje || 'Correo verificado correctamente. Ya puedes iniciar sesion.';
        },
        error: (err: Error) => {
          this.exito = false;
          this.mensaje = err.message || 'No se pudo verificar el correo. El enlace puede estar vencido o ya fue usado.';
        }
      });
  }
}