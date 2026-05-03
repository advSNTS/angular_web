import { environment } from '../../environments/environment';

/** Ruta absoluta hacia el backend (proxy `/api` en desarrollo, host en producción). */
export function buildApiPath(suffix: string): string {
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${environment.apiUrl}${path}`;
}
