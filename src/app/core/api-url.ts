import { environment } from '../../environments/environment';

/** Ruta absoluta hacia el backend (proxy `/api` en desarrollo, host en producción). */
export function buildApiPath(suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (environment.production) {
    return `${environment.apiUrl}${path}`;
  }
  return `/api${path}`;
}
