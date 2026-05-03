import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { buildApiPath } from '../core/api-url';
import { MensajeExternoRequest, MensajeExternoResponse } from '../models/proceso';

@Injectable({ providedIn: 'root' })
export class MensajeExternoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiPath('/mensajes-externos');

  listar(): Observable<MensajeExternoResponse[]> {
    return this.http.get<MensajeExternoResponse[]>(this.baseUrl);
  }

  crear(dto: MensajeExternoRequest): Observable<MensajeExternoResponse> {
    return this.http.post<MensajeExternoResponse>(this.baseUrl, dto);
  }
}
