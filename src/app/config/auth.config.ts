import { buildApiPath } from '../core/api-url';

/** URL completa del endpoint de login (incluye prefijo `/api` en desarrollo). */
export const AUTH_LOGIN_URL = buildApiPath('/empleados/login');
