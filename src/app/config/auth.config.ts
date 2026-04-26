import { DemoEmployee } from '../models/empleado-auth.model';

export const BACKEND_BASE_URL = 'https://grupo11.inphotech.co';

export const DEMO_EMPLOYEE: DemoEmployee = {
  nitEmpresa: '888',
  nombre: 'Juan Perez',
  tipoDocumento: 'CC',
  numeroDocumento: '12345678',
  nombreEmpresa: 'Grupo 11',
  credencial: {
    correo: 'juan@ejemplo.com',
    contrasena: '123456'
  }
};

