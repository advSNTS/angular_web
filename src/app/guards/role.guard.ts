import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TipoRolSistema } from '../models/empleado-auth.model';

export function roleGuard(allowed: TipoRolSistema[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const roles = auth.getSesionActual()?.rolesSistema ?? [];
    const ok = allowed.some((r) => roles.includes(r));
    return ok || router.parseUrl('/procesos');
  };
}
