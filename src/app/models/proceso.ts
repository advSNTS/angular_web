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