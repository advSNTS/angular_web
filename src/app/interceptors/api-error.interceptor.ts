import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/** Notifica acceso denegado u otros fallos comunes sin sustituir el manejo local del componente. */
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 403) {
        const msg =
          typeof err.error === 'string' && err.error.trim()
            ? err.error
            : 'No tiene permisos para esta operación.';
        notify.error(msg);
      }
      return throwError(() => err);
    })
  );
};
