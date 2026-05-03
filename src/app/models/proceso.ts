/** Alineado con {@code EstadoProceso} del backend. */
export type EstadoProceso = 'BORRADOR' | 'PUBLICADO' | 'INACTIVO';

export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado?: EstadoProceso;
  poolId?: number | null;
  nitEmpresa?: string | null;
  borrador: boolean;
  activo: boolean;
}

export interface ProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
  /** Preferido sobre borrador/activo cuando el backend lo acepta. */
  estado?: EstadoProceso;
  borrador?: boolean;
  activo?: boolean;
  nitEmpresa?: string;
  poolId?: number | null;
}

export interface ActividadResponse {
  id: number;
  nodoId: number;
  nombreNodo: string;
  procesoId: number;
  nombreProceso: string;
  descripcion: string;
  tipoActividad?: string | null;
  laneId?: number | null;
}

export interface ActividadRequest {
  nodoId: number;
  descripcion: string;
  tipoActividad?: string | null;
  laneId?: number | null;
}

export type TipoGatewayApi = 'XOR' | 'AND' | 'OR';

export interface GatewayResponse {
  id: number;
  nodoId: number;
  nombreNodo: string;
  procesoId: number;
  nombreProceso: string;
  tipoGateway: TipoGatewayApi;
}

export interface GatewayRequest {
  nodoId: number;
  tipoGateway: TipoGatewayApi;
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
  nitEmpresa?: string;
  idProceso: number;
  nodoOrigenId: number;
  nodoDestinoId: number;
}

export interface HistorialProcesoApi {
  id: number;
  tipoAccion: string;
  fechaCambio: string;
  valorAnterior: string | Record<string, unknown> | null;
  valorNuevo: string | Record<string, unknown> | null;
  empleado?: { id: number; nombre?: string } | null;
}

export interface NodoResponse {
  id: number;
  idProceso: number;
  nombreProceso?: string;
  tipo: 'ACTIVIDAD' | 'GATEWAY' | 'ARCO';
  nombre: string;
  coordenadaX?: number | null;
  coordenadaY?: number | null;
}

export interface NodoRequest {
  nitEmpresa: string;
  idProceso: number;
  tipo: 'ACTIVIDAD' | 'GATEWAY' | 'ARCO';
  nombre: string;
  coordenadaX?: number | null;
  coordenadaY?: number | null;
}

export interface LaneResponse {
  id: number;
  poolId: number;
  nombre: string;
  rolProcesoId?: number | null;
}

export interface LaneRequest {
  poolId: number;
  nombre: string;
  rolProcesoId?: number | null;
}

export interface PoolResponse {
  id: number;
  nitEmpresa?: string;
  nombre?: string;
  descripcion?: string;
  esDefault?: boolean;
}

export interface EmpresaRequest {
  nit: string;
  nombre: string;
  correo: string;
}

export interface EmpresaResponse {
  nit: string;
  nombre: string;
  correo: string;
}

export type PermisoRol = 'VER' | 'EDITAR' | 'ADMINISTRAR';

export interface RolProcesoResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  permiso?: PermisoRol | null;
  nitEmpresa?: string;
}

export interface RolProcesoRequest {
  nitEmpresa: string;
  nombre: string;
  descripcion?: string | null;
  permiso?: PermisoRol | null;
}

export interface EmpleadoResponse {
  id: number;
  nitEmpresa: string;
  nombreEmpresa?: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo?: string;
}

export interface EmpleadoCreateRequest {
  nitEmpresa: string;
  nombre: string;
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  credencial: { correo: string; contrasena: string };
}

export interface RolXEmpleadoResponse {
  id: number;
  empleadoId: number;
  rolId: number;
}

export interface RolXEmpleadoRequest {
  empleadoId: number;
  rolId: number;
}

export type PermisoCompartido = 'LECTURA' | 'EDICION';

export interface ProcesoCompartidoRequest {
  poolId: number;
  permiso: PermisoCompartido;
}

export interface ProcesoCompartidoResponse {
  id: number;
  procesoId: number;
  poolId: number;
  permiso: PermisoCompartido;
}

export interface MensajeThrowResponse {
  id: number;
  procesoId: number;
  nombreMensaje: string;
  payloadTemplate?: string | null;
}

export interface MensajeThrowRequest {
  procesoId: number;
  nombreMensaje: string;
  payloadTemplate?: string | null;
}

export interface MensajeCatchResponse {
  id: number;
  procesoId: number;
  nombreMensaje: string;
  correlacionExpr?: string | null;
  iniciarNuevaInstancia?: boolean | null;
}

export interface MensajeCatchRequest {
  procesoId: number;
  nombreMensaje: string;
  correlacionExpr?: string | null;
  iniciarNuevaInstancia?: boolean | null;
}

export type TipoDestinoMensajeExterno = 'EMAIL' | 'WEBHOOK' | 'BROKER';

export interface MensajeExternoResponse {
  id: number;
  destinoTipo: TipoDestinoMensajeExterno;
  configuracion?: string | null;
  credenciales?: string | null;
}

export interface MensajeExternoRequest {
  destinoTipo: TipoDestinoMensajeExterno;
  configuracion?: string | null;
  credenciales?: string | null;
}

export interface TareaIntegracionResponse {
  id: number;
  procesoId: number;
  mensajeExternoId?: number | null;
  payloadMapping?: string | null;
}

export interface TareaIntegracionRequest {
  procesoId: number;
  mensajeExternoId?: number | null;
  payloadMapping?: string | null;
}
