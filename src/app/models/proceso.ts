export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  borrador: boolean;
  activo: boolean;
}

export interface ProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
  borrador: boolean;
  activo: boolean;
}

export interface ActividadResponse {
  id: number;
  nodoId: number;
  nombreNodo: string;
  procesoId: number;
  nombreProceso: string;
  descripcion: string;
}

export interface ActividadRequest {
  nodoId: number;
  descripcion: string;
}

export interface GatewayResponse {
  id: number;
  nodoId: number;
  nombreNodo: string;
  procesoId: number;
  nombreProceso: string;
  tipoGateway: 'XOR' | 'AND' | 'OR';
}

export interface GatewayRequest {
  nodoId: number;
  tipoGateway: 'XOR' | 'AND' | 'OR';
}

export interface ArcoResponse {
  id: number;
  idProceso: number;
  nombreProceso: string;
  nodoOrigenId: number;
  nombreNodoOrigen: string;
  nodoDestinoId: number;
  nombreNodoDestino: string;
}

export interface ArcoRequest {
  idProceso: number;
  nodoOrigenId: number;
  nodoDestinoId: number;
}

export interface HistorialProceso {
  id: number;
  tipoAccion: string;
  fechaCambio: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}