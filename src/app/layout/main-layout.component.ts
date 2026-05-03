import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { esAdministradorEmpresa, puedeEditarProcesos, rolMasAlto } from '../core/roles.util';
import { EmpleadoAuthResponse, TipoRolSistema } from '../models/empleado-auth.model';
import { AuthService } from '../services/auth.service';
import { NotificationService, ToastMessage } from '../services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();

  session: EmpleadoAuthResponse | null = null;
  toast: ToastMessage | null = null;

  ngOnInit(): void {
    this.session = this.auth.getSesionActual();
    this.auth.session$.pipe(takeUntil(this.destroy$)).subscribe((s) => {
      this.session = s;
    });
    this.notify.mensaje$.pipe(takeUntil(this.destroy$)).subscribe((m) => {
      this.toast = m;
      if (m) {
        setTimeout(() => this.notify.limpiar(), 5000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get nombreEmpresa(): string {
    return this.session?.nombreEmpresa ?? '—';
  }

  get rolLabel(): string {
    const r = rolMasAlto(this.session?.rolesSistema);
    const map: Record<TipoRolSistema, string> = {
      ADMIN: 'Administrador',
      EDITOR: 'Editor',
      READER: 'Solo lectura'
    };
    return map[r];
  }

  get puedeEditar(): boolean {
    return puedeEditarProcesos(this.session?.rolesSistema);
  }

  get esAdmin(): boolean {
    return esAdministradorEmpresa(this.session?.rolesSistema);
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    void this.router.navigateByUrl('/login');
  }
}
