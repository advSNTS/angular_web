import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, defer, forkJoin, map, of, finalize, Observable, switchMap, timeout, tap, throwError } from 'rxjs';
import { claseEstado, labelEstado } from '../../../core/proceso-estado.util';
import { esAdministradorEmpresa, puedeEditarProcesos } from '../../../core/roles.util';
import {
  HistorialProcesoApi,
  LaneResponse,
  MensajeCatchResponse,
  MensajeExternoResponse,
  MensajeThrowResponse,
  PermisoCompartido,
  PoolResponse,
  ProcesoCompartidoResponse,
  ProcesoResponse,
  TareaIntegracionResponse,
  ActividadResponse,
  GatewayResponse,
  ArcoResponse
} from '../../../models/proceso';
import { ActividadService } from '../../../services/actividad.service';
import { ArcoService } from '../../../services/arco.service';
import { AuthService } from '../../../services/auth.service';
import { GatewayService } from '../../../services/gateway.service';
import { LaneService } from '../../../services/lane.service';
import { MensajeCatchService } from '../../../services/mensaje-catch.service';
import { MensajeExternoService } from '../../../services/mensaje-externo.service';
import { MensajeThrowService } from '../../../services/mensaje-throw.service';
import { NotificationService } from '../../../services/notification.service';
import { PoolService } from '../../../services/pool.service';
import { ProcesoService } from '../../../services/proceso.service';
import { TareaIntegracionService } from '../../../services/tarea-integracion.service';

@Component({
  selector: 'app-detalle-proceso',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-proceso.html',
  styleUrl: './detalle-proceso.css'
})
export class DetalleProcesoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly procesoService = inject(ProcesoService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly arcoService = inject(ArcoService);
  private readonly laneService = inject(LaneService);
  private readonly poolService = inject(PoolService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly msgThrow = inject(MensajeThrowService);
  private readonly msgCatch = inject(MensajeCatchService);
  private readonly tareaInt = inject(TareaIntegracionService);
  private readonly msgExt = inject(MensajeExternoService);

  proceso: ProcesoResponse | null = null;
  actividades: ActividadResponse[] = [];
  gateways: GatewayResponse[] = [];
  arcos: ArcoResponse[] = [];
  lanes: LaneResponse[] = [];
  historial: HistorialProcesoApi[] = [];
  historialCargando = false;
  historialCargado = false;

  compartidos: ProcesoCompartidoResponse[] = [];
  poolsDestino: PoolResponse[] = [];
  sharePoolId: number | null = null;
  sharePermiso: PermisoCompartido = 'LECTURA';
  compartiendo = false;
  compartidosCargando = false;
  compartidosCargados = false;

  throws: MensajeThrowResponse[] = [];
  catches: MensajeCatchResponse[] = [];
  tareas: TareaIntegracionResponse[] = [];
  externos: MensajeExternoResponse[] = [];
  mensajesCargando = false;
  mensajesCargados = false;

  nuevoThrow = { nombreMensaje: '', payloadTemplate: '' };
  nuevoCatch = { nombreMensaje: '', correlacionExpr: '', iniciarNuevaInstancia: false };
  nuevaTarea = { mensajeExternoId: null as number | null, payloadMapping: '' };

  cargando = true;
  pasoCarga = 'Inicializando...';
  trazasCarga: string[] = [];
  tabActiva:
    | 'flujo'
    | 'diagrama'
    | 'historial'
    | 'compartir'
    | 'mensajes' = 'flujo';

  procesoId = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.procesoId = id;
    this.cargarDatos(id);
  }

  get puedeEditar(): boolean {
    return puedeEditarProcesos(this.auth.getSesionActual()?.rolesSistema);
  }

  get puedeCompartir(): boolean {
    return esAdministradorEmpresa(this.auth.getSesionActual()?.rolesSistema);
  }

  cargarDatos(id: number): void {
    this.cargando = true;
    this.pasoCarga = 'Preparando solicitudes...';
    this.trazasCarga = [];
    this.marcarCarga('inicio', `cargando proceso ${id}`);
    defer(() =>
      forkJoin({
        proceso: this.solicitarCarga('proceso', () => this.procesoService.obtenerPorId(id)),
        actividades: this.solicitarCarga('actividades', () => this.actividadService.obtenerPorProceso(id), [] as ActividadResponse[]),
        gateways: this.solicitarCarga('gateways', () => this.gatewayService.obtenerPorProceso(id), [] as GatewayResponse[]),
        arcos: this.solicitarCarga('arcos', () => this.arcoService.obtenerPorProceso(id), [] as ArcoResponse[])
      })
    )
      .pipe(
        switchMap((res) => {
          const poolId = res.proceso.poolId;
          if (!poolId) {
            this.marcarCarga('lanes', 'sin pool, omitiendo lanes');
            return of({ res, lanes: [] as LaneResponse[] });
          }
          this.marcarCarga('lanes', `cargando lanes del pool ${poolId}`);
          return this.laneService.listarPorPool(poolId).pipe(
            timeout({ first: 10000 }),
            catchError((error) => {
              this.marcarCarga('lanes', `error al cargar lanes del pool ${poolId}`);
              console.error('[DetalleProceso] lanes error', error);
              return of([] as LaneResponse[]);
            }),
            map((lanes) => ({ res, lanes }))
          );
        }),
        finalize(() => (this.cargando = false))
      )
      .subscribe({
        next: ({ res, lanes }) => {
          this.marcarCarga('render', 'datos recibidos, renderizando vista');
          this.proceso = res.proceso;
          this.actividades = res.actividades;
          this.gateways = res.gateways;
          this.arcos = res.arcos;
          this.lanes = lanes;
          this.marcarCarga('completo', 'detalle cargado correctamente');
          this.cargarHistorial(id);
          this.cargarMensajes(id);
          if (this.puedeCompartir) {
            this.cargarCompartidos(id);
          }
        },
        error: () => {
          this.marcarCarga('error', 'fallo la carga del detalle');
          this.notify.error('No se pudo cargar el proceso.');
        }
      });
  }

  private cargarHistorial(id: number): void {
    if (this.historialCargando || this.historialCargado) {
      return;
    }
    this.historialCargando = true;
    this.marcarCarga('historial', 'cargando historial');
    this.procesoService
      .obtenerHistorial(id)
      .pipe(
        timeout({ first: 10000 }),
        catchError((error) => {
          this.marcarCarga('historial', 'error al cargar historial');
          console.error('[DetalleProceso] historial error', error);
          return of([] as HistorialProcesoApi[]);
        }),
        finalize(() => (this.historialCargando = false))
      )
      .subscribe((historial) => {
        this.historial = historial;
        this.historialCargado = true;
        this.marcarCarga('historial', 'historial cargado');
      });
  }

  private cargarCompartidos(id: number): void {
    if (this.compartidosCargando || this.compartidosCargados) {
      return;
    }
    this.compartidosCargando = true;
    this.marcarCarga('compartir', 'cargando pools y comparticiones');
    forkJoin({
      pools: this.solicitarCarga('pools', () => this.poolService.listar(), [] as PoolResponse[]),
      compartidos: this.solicitarCarga('compartidos', () => this.procesoService.listarCompartidos(id), [] as ProcesoCompartidoResponse[])
    })
      .pipe(finalize(() => (this.compartidosCargando = false)))
      .subscribe({
        next: ({ pools, compartidos }) => {
          this.poolsDestino = pools;
          this.compartidos = compartidos;
          this.compartidosCargados = true;
          this.marcarCarga('compartir', 'datos de compartir cargados');
        },
        error: (error) => {
          console.error('[DetalleProceso] compartir error', error);
          this.compartidosCargados = true;
          this.marcarCarga('compartir', 'error al cargar compartir');
        }
      });
  }

  private cargarMensajes(id: number): void {
    if (this.mensajesCargando || this.mensajesCargados) {
      return;
    }
    this.mensajesCargando = true;
    this.marcarCarga('mensajes', 'cargando mensajes y tareas');
    forkJoin({
      throws: this.solicitarCarga('mensajes throw', () => this.msgThrow.listarPorProceso(id), [] as MensajeThrowResponse[]),
      catches: this.solicitarCarga('mensajes catch', () => this.msgCatch.listarPorProceso(id), [] as MensajeCatchResponse[]),
      tareas: this.solicitarCarga('tareas integracion', () => this.tareaInt.listarPorProceso(id), [] as TareaIntegracionResponse[]),
      externos: this.solicitarCarga('mensajes externos', () => this.msgExt.listar(), [] as MensajeExternoResponse[])
    })
      .pipe(finalize(() => (this.mensajesCargando = false)))
      .subscribe({
        next: ({ throws, catches, tareas, externos }) => {
          this.throws = throws;
          this.catches = catches;
          this.tareas = tareas;
          this.externos = externos;
          this.mensajesCargados = true;
          this.marcarCarga('mensajes', 'mensajes cargados');
        },
        error: (error) => {
          console.error('[DetalleProceso] mensajes error', error);
          this.mensajesCargados = true;
          this.marcarCarga('mensajes', 'error al cargar mensajes');
        }
      });
  }

  private solicitarCarga<T>(etiqueta: string, factory: () => Observable<T>, fallback?: T): Observable<T> {
    this.marcarCarga(etiqueta, 'iniciando');
    return defer(factory).pipe(
      timeout({ first: 10000 }),
      tap({
        next: () => this.marcarCarga(etiqueta, 'respuesta OK'),
        error: (error) => {
          this.marcarCarga(etiqueta, 'respuesta ERROR');
          console.error(`[DetalleProceso] ${etiqueta} error`, error);
        }
      }),
      catchError((error) => {
        if (fallback !== undefined) {
          this.marcarCarga(etiqueta, 'usando fallback');
          return of(fallback);
        }
        return throwError(() => error);
      })
    );
  }

  private marcarCarga(etapa: string, mensaje: string): void {
    const marca = `${new Date().toISOString()} [${etapa}] ${mensaje}`;
    this.pasoCarga = `${etapa}: ${mensaje}`;
    this.trazasCarga = [...this.trazasCarga, marca].slice(-12);
    console.debug('[DetalleProceso]', marca);
  }

  getEstado(proceso: ProcesoResponse): string {
    return labelEstado(proceso);
  }

  getClaseEstado(proceso: ProcesoResponse): string {
    return claseEstado(proceso);
  }

  estadoActividad(act: ActividadResponse): string {
    const lane = this.lanes.find((l) => l.id === act.laneId);
    if (lane) return lane.nombre;
    return act.laneId ? 'Carril restringido' : 'Sin carril';
  }

  getBadgeGateway(tipo: string): string {
    const map: Record<string, string> = { XOR: 'gateway-xor', AND: 'gateway-and', OR: 'gateway-or' };
    return map[tipo] || '';
  }

  parsearJson(val: string | Record<string, unknown> | null): string {
    if (val == null) return '—';
    if (typeof val === 'object') {
      return JSON.stringify(val, null, 2);
    }
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  }

  fechaHistorial(h: HistorialProcesoApi): string {
    const raw = h.fechaCambio as unknown;
    if (typeof raw === 'string') return raw;
    return JSON.stringify(raw);
  }

  irAEditor(): void {
    void this.router.navigate(['/procesos', this.proceso?.id, 'editar']);
  }

  volver(): void {
    void this.router.navigate(['/procesos']);
  }

  compartir(): void {
    if (!this.proceso || this.sharePoolId == null) {
      this.notify.info('Seleccione un pool destino.');
      return;
    }
    this.compartiendo = true;
    this.procesoService
      .compartir(this.proceso.id, { poolId: this.sharePoolId, permiso: this.sharePermiso })
      .subscribe({
        next: () => {
          this.notify.exito('Proceso compartido.');
          this.compartiendo = false;
          this.procesoService.listarCompartidos(this.proceso!.id).subscribe((c) => (this.compartidos = c));
        },
        error: () => {
          this.notify.error('No se pudo compartir (¿permisos de administrador?).');
          this.compartiendo = false;
        }
      });
  }

  seleccionarTab(tab: 'flujo' | 'diagrama' | 'historial' | 'compartir' | 'mensajes'): void {
    this.tabActiva = tab;
    if (!this.proceso) {
      return;
    }
    if (tab === 'compartir') {
      this.cargarCompartidos(this.proceso.id);
    }
    if (tab === 'historial') {
      this.cargarHistorial(this.proceso.id);
    }
    if (tab === 'mensajes') {
      this.cargarMensajes(this.proceso.id);
    }
  }

  crearThrow(): void {
    if (!this.proceso || !this.nuevoThrow.nombreMensaje.trim()) return;
    this.msgThrow
      .crear({
        procesoId: this.proceso.id,
        nombreMensaje: this.nuevoThrow.nombreMensaje.trim(),
        payloadTemplate: this.nuevoThrow.payloadTemplate.trim() || null
      })
      .subscribe({
        next: () => {
          this.notify.exito('Mensaje throw registrado.');
          this.nuevoThrow = { nombreMensaje: '', payloadTemplate: '' };
          this.msgThrow.listarPorProceso(this.proceso!.id).subscribe((t) => (this.throws = t));
        },
        error: () => this.notify.error('No se pudo crear el mensaje.')
      });
  }

  crearCatch(): void {
    if (!this.proceso || !this.nuevoCatch.nombreMensaje.trim()) return;
    this.msgCatch
      .crear({
        procesoId: this.proceso.id,
        nombreMensaje: this.nuevoCatch.nombreMensaje.trim(),
        correlacionExpr: this.nuevoCatch.correlacionExpr.trim() || null,
        iniciarNuevaInstancia: this.nuevoCatch.iniciarNuevaInstancia
      })
      .subscribe({
        next: () => {
          this.notify.exito('Mensaje catch registrado.');
          this.nuevoCatch = { nombreMensaje: '', correlacionExpr: '', iniciarNuevaInstancia: false };
          this.msgCatch.listarPorProceso(this.proceso!.id).subscribe((t) => (this.catches = t));
        },
        error: () => this.notify.error('No se pudo crear el mensaje.')
      });
  }

  crearTareaIntegracion(): void {
    if (!this.proceso) return;
    this.tareaInt
      .crear({
        procesoId: this.proceso.id,
        mensajeExternoId: this.nuevaTarea.mensajeExternoId ?? undefined,
        payloadMapping: this.nuevaTarea.payloadMapping.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.notify.exito('Tarea de integración creada.');
          this.nuevaTarea = { mensajeExternoId: null, payloadMapping: '' };
          this.tareaInt.listarPorProceso(this.proceso!.id).subscribe((t) => (this.tareas = t));
        },
        error: () => this.notify.error('No se pudo crear la tarea.')
      });
  }

  /** Orden visual simple: nodos en cadena según primer arco disponible */
  ordenDiagrama(): number[] {
    const ids = new Set<number>();
    this.actividades.forEach((a) => ids.add(a.nodoId));
    this.gateways.forEach((g) => ids.add(g.nodoId));
    const orden: number[] = [];
    const visited = new Set<number>();

    const incoming = new Map<number, number>();
    this.arcos.forEach((ar) => incoming.set(ar.nodoDestinoId, ar.nodoOrigenId));

    let start: number | undefined;
    for (const id of ids) {
      if (!incoming.has(id)) {
        start = id;
        break;
      }
    }
    if (start === undefined && ids.size) {
      start = [...ids][0];
    }

    let cur = start;
    while (cur !== undefined && !visited.has(cur)) {
      visited.add(cur);
      orden.push(cur);
      const nextArc = this.arcos.find((a) => a.nodoOrigenId === cur);
      cur = nextArc?.nodoDestinoId;
    }
    for (const id of ids) {
      if (!visited.has(id)) orden.push(id);
    }
    return orden;
  }

  labelNodoDiagrama(nodoId: number): string {
    const a = this.actividades.find((x) => x.nodoId === nodoId);
    if (a) return a.nombreNodo;
    const g = this.gateways.find((x) => x.nodoId === nodoId);
    if (g) return `${g.tipoGateway} ${g.nombreNodo}`;
    return `Nodo ${nodoId}`;
  }

  tipoNodoDiagrama(nodoId: number): 'act' | 'gw' {
    return this.gateways.some((g) => g.nodoId === nodoId) ? 'gw' : 'act';
  }
}
