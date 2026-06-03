export type DiagramaNodoTipo = 'ACTIVIDAD' | 'GATEWAY';

export interface DiagramaNodoCanvas {
  id: number;
  idProceso: number;
  tipo: DiagramaNodoTipo;
  nombre: string;
  subtitulo: string;
  gatewayTipo?: 'XOR' | 'AND' | 'OR';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramaNodoMovimiento {
  id: number;
  x: number;
  y: number;
}
