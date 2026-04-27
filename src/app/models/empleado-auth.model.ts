export interface LoginCredentials {
  correo: string;
  contrasena: string;
}

export interface EmpleadoAuthResponse {
  id: number;
  nitEmpresa: string;
  nombreEmpresa: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  correo: string;
  token?: string;
}
