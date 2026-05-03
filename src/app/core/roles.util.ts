import { TipoRolSistema } from '../models/empleado-auth.model';

const ORDEN: Record<TipoRolSistema, number> = {
  ADMIN: 3,
  EDITOR: 2,
  READER: 1
};

export function rolesDesdeAuthorities(authorities: string[] | undefined): TipoRolSistema[] {
  const raw = (authorities ?? [])
    .map((a) => a.replace(/^ROLE_/, ''))
    .filter((r): r is TipoRolSistema => r === 'ADMIN' || r === 'EDITOR' || r === 'READER');
  return raw.length ? dedupe(raw) : ['READER'];
}

function dedupe(roles: TipoRolSistema[]): TipoRolSistema[] {
  const set = new Set(roles);
  return (['ADMIN', 'EDITOR', 'READER'] as const).filter((r) => set.has(r));
}

export function rolMasAlto(roles: TipoRolSistema[] | undefined): TipoRolSistema {
  if (!roles?.length) return 'READER';
  return roles.reduce((a, b) => (ORDEN[a] >= ORDEN[b] ? a : b));
}

export function puedeEditarProcesos(roles: TipoRolSistema[] | undefined): boolean {
  const r = rolMasAlto(roles);
  return r === 'ADMIN' || r === 'EDITOR';
}

export function esAdministradorEmpresa(roles: TipoRolSistema[] | undefined): boolean {
  return rolMasAlto(roles) === 'ADMIN';
}
