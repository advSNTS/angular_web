const API_BASE_URL = 'https://grupo11.inphotech.co/api';

export function buildApiPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
