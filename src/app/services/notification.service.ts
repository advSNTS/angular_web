import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  texto: string;
  tipo: 'ok' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly subject = new BehaviorSubject<ToastMessage | null>(null);
  readonly mensaje$ = this.subject.asObservable();

  exito(texto: string): void {
    this.subject.next({ texto, tipo: 'ok' });
  }

  error(texto: string): void {
    this.subject.next({ texto, tipo: 'error' });
  }

  info(texto: string): void {
    this.subject.next({ texto, tipo: 'info' });
  }

  limpiar(): void {
    this.subject.next(null);
  }
}
