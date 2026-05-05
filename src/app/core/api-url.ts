const API_BASE_URL = 'http://localhost:8080/api';

export function buildApiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}