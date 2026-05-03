import { EstadoProceso, ProcesoResponse } from '../models/proceso';

export function estadoDesdeResponse(p: ProcesoResponse): EstadoProceso {
  if (p.estado) {
    return p.estado;
  }
  if (p.activo === false) {
    return 'INACTIVO';
  }
  if (p.borrador) {
    return 'BORRADOR';
  }
  return 'PUBLICADO';
}

export function legadoDesdeEstado(estado: EstadoProceso): { borrador: boolean; activo: boolean } {
  switch (estado) {
    case 'INACTIVO':
      return { borrador: false, activo: false };
    case 'BORRADOR':
      return { borrador: true, activo: true };
    default:
      return { borrador: false, activo: true };
  }
}

export function labelEstado(p: ProcesoResponse): string {
  const e = estadoDesdeResponse(p);
  if (e === 'INACTIVO') return 'Inactivo';
  if (e === 'BORRADOR') return 'Borrador';
  return 'Publicado';
}

export function claseEstado(p: ProcesoResponse): string {
  const e = estadoDesdeResponse(p);
  if (e === 'INACTIVO') return 'estado-inactivo';
  if (e === 'BORRADOR') return 'estado-borrador';
  return 'estado-publicado';
}
