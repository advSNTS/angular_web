export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

/** Coincide con {@code EmpleadoLoginResponseDTO} + datos derivados del JWT. */
export type TipoRolSistema = 'ADMIN' | 'EDITOR' | 'READER';

export interface EmpleadoAuthResponse {
  id: number;
  nitEmpresa: string;
  nombreEmpresa: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  token?: string;
  /** Derivado de claims JWT ({@code authorities}); si no hay token, se asume permiso de lectura. */
  rolesSistema?: TipoRolSistema[];
}
