import { environment } from '../../environments/environment';

export function buildApiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.apiUrl}${normalizedPath}`;
}