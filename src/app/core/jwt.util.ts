export interface JwtPayloadClaims {
  sub?: string;
  nit?: string;
  adminGlobal?: boolean;
  authorities?: string[];
  exp?: number;
}

export function decodeJwtPayload(token: string): JwtPayloadClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayloadClaims;
  } catch {
    return null;
  }
}
