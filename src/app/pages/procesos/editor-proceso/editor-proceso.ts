import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concatMap, forkJoin, from, map, Observable, of, switchMap, throwError, toArray } from 'rxjs';
import { legadoDesdeEstado } from '../../../core/proceso-estado.util';
import { puedeEditarProcesos } from '../../../core/roles.util';
import {
  ActividadRequest,
  ArcoRequest,
  EstadoProceso,
  GatewayRequest,
  ProcesoRequest,
  ProcesoResponse
} from '../../../models/proceso';
import { ActividadService } from '../../../services/actividad.service';
import { ArcoService } from '../../../services/arco.service';
import { AuthService } from '../../../services/auth.service';
import { GatewayService } from '../../../services/gateway.service';
import { NodoService } from '../../../services/nodo.service';
import { ProcesoService } from '../../../services/proceso.service';
import { estadoDesdeResponse } from '../../../core/proceso-estado.util';

type GatewayTipo = 'XOR' | 'AND' | 'OR';

interface ActividadUI {
  id?: number;
  nodoId: number;
  nombreNodo: string;
  descripcion: string;
  tipoActividad?: string | null;
  laneId?: number | null;
}

interface GatewayUI {
  id?: number;
  nodoId: number;
  tipoGateway: GatewayTipo;
  nombreNodo: string;
}

interface ArcoUI {
  id?: number;
  nodoOrigenId: number;
  nodoDestinoId: number;
}

interface NodoOption {
  nodoId: number;
  label: string;
}

interface FlujoGuardadoTemporal {
  nodosCreados: number[];
  nodosVinculados: Set<number>;
  actividadesCreadas: number[];
  gatewaysCreados: number[];
  arcosCreados: number[];
}

@Component({
  selector: 'app-editor-proceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-proceso.html',
  styleUrl: './editor-proceso.css'
})
export class EditorProcesoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly procesoService = inject(ProcesoService);
  private readonly actividadService = inject(ActividadService);
  private readonly gatewayService = inject(GatewayService);
  private readonly arcoService = inject(ArcoService);
  private readonly nodoService = inject(NodoService);
  private readonly auth = inject(AuthService);

  esEdicion = false;
  procesoId: number | null = null;
  guardando = false;
  error = '';
  exito = '';

  esLector = !puedeEditarProcesos(this.auth.getSesionActual()?.rolesSistema);

  form = {
    nombre: '',
    descripcion: '',
    categoria: '',
    estado: 'BORRADOR' as EstadoProceso
  };

  categorias = ['Comercial', 'Administrativo', 'Finanzas', 'Operaciones', 'RRHH', 'TI'];
  estados: EstadoProceso[] = ['BORRADOR', 'PUBLICADO', 'INACTIVO'];

  actividades: ActividadUI[] = [];
  gateways: GatewayUI[] = [];
  arcos: ArcoUI[] = [];

  deletedActividadIds: number[] = [];
  deletedGatewayIds: number[] = [];
  deletedArcoIds: number[] = [];

  nodosDisponibles: NodoOption[] = [];
  nodosLabelMap = new Map<number, string>();

  private tempSeq = -1;

  ngOnInit(): void {
    if (this.esLector) {
      this.error = 'No tienes permiso para editar procesos.';
      return;
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.reconstruirNodosDisponibles();
      return;
    }

    this.esEdicion = true;
    this.procesoId = Number(id);
    this.cargarEdicion(this.procesoId);
  }

  private nextTempNodoId(): number {
    return this.tempSeq--;
  }

  private ejecutarSecuencialmente<TEntrada, TSalida>(
    items: readonly TEntrada[],
    ejecutar: (item: TEntrada) => Observable<TSalida>
  ): Observable<TSalida[]> {
    if (!items.length) {
      return of([]);
    }

    return from(items).pipe(concatMap((item) => ejecutar(item)), toArray());
  }

  private cargarEdicion(id: number): void {
    forkJoin({
      proceso: this.procesoService.obtenerPorId(id),
      actividades: this.actividadService.obtenerPorProceso(id),
      gateways: this.gatewayService.obtenerPorProceso(id),
      arcos: this.arcoService.obtenerPorProceso(id)
    }).subscribe({
      next: ({ proceso, actividades, gateways, arcos }) => {
        const est = estadoDesdeResponse(proceso as ProcesoResponse);
        this.form = {
          nombre: proceso.nombre,
          descripcion: proceso.descripcion,
          categoria: proceso.categoria,
          estado: est
        };

        this.actividades = actividades.map((a) => ({
          id: a.id,
          nodoId: a.nodoId,
          descripcion: a.descripcion,
          nombreNodo: a.nombreNodo,
          tipoActividad: a.tipoActividad ?? null,
          laneId: a.laneId ?? null
        }));

        this.gateways = gateways.map((g) => ({
          id: g.id,
          nodoId: g.nodoId,
          tipoGateway: g.tipoGateway as GatewayTipo,
          nombreNodo: g.nombreNodo
        }));

        this.arcos = arcos.map((a) => ({
          id: a.id,
          nodoOrigenId: a.nodoOrigenId,
          nodoDestinoId: a.nodoDestinoId
        }));

        this.reconstruirNodosDisponibles();
      },
      error: () => {
        this.error = 'No fue posible cargar la información del proceso.';
      }
    });
  }

  reconstruirNodosDisponibles(): void {
    const deActividades = this.actividades.map((a) => ({
      nodoId: a.nodoId,
      label: `[Actividad] ${a.nombreNodo || 'Nodo ' + a.nodoId}`
    }));

    const deGateways = this.gateways.map((g) => ({
      nodoId: g.nodoId,
      label: `[Gateway ${g.tipoGateway}] ${g.nombreNodo || 'Nodo ' + g.nodoId}`
    }));

    this.nodosDisponibles = [...deActividades, ...deGateways].sort((x, y) => x.nodoId - y.nodoId);
    this.nodosLabelMap = new Map(this.nodosDisponibles.map((n) => [n.nodoId, n.label]));
  }

  private existeNodo(nodoId: number): boolean {
    return this.nodosDisponibles.some((n) => n.nodoId === nodoId);
  }

  private existeArcoDuplicado(origen: number, destino: number, idxActual: number): boolean {
    return this.arcos.some(
      (a, i) => i !== idxActual && a.nodoOrigenId === origen && a.nodoDestinoId === destino
    );
  }

  getLabelNodo(nodoId: number): string {
    return this.nodosLabelMap.get(nodoId) ?? `Nodo ${nodoId}`;
  }

  agregarActividad(): void {
    this.actividades.push({
      nodoId: this.nextTempNodoId(),
      nombreNodo: '',
      descripcion: '',
      tipoActividad: 'TAREA',
      laneId: null
    });
    this.reconstruirNodosDisponibles();
  }

  eliminarActividad(index: number): void {
    const item = this.actividades[index];
    if (!item) return;

    if (item.id) this.deletedActividadIds.push(item.id);
    this.actividades.splice(index, 1);
    this.removerArcosDelNodo(item.nodoId);
    this.reconstruirNodosDisponibles();
  }

  onActividadChange(): void {
    this.reconstruirNodosDisponibles();
  }

  agregarGateway(): void {
    this.gateways.push({
      nodoId: this.nextTempNodoId(),
      nombreNodo: '',
      tipoGateway: 'XOR'
    });
    this.reconstruirNodosDisponibles();
  }

  eliminarGateway(index: number): void {
    const item = this.gateways[index];
    if (!item) return;

    if (item.id) this.deletedGatewayIds.push(item.id);
    this.gateways.splice(index, 1);
    this.removerArcosDelNodo(item.nodoId);
    this.reconstruirNodosDisponibles();
  }

  onGatewayChange(): void {
    this.reconstruirNodosDisponibles();
  }

  agregarArco(): void {
    if (this.nodosDisponibles.length < 2) {
      this.error = 'Necesitas al menos dos nodos para crear un arco.';
      return;
    }

    const origen = this.nodosDisponibles[0].nodoId;
    const destino = this.nodosDisponibles[1].nodoId;

    this.arcos.push({
      nodoOrigenId: origen,
      nodoDestinoId: destino
    });
  }

  eliminarArco(index: number): void {
    const item = this.arcos[index];
    if (!item) return;

    if (item.id) this.deletedArcoIds.push(item.id);
    this.arcos.splice(index, 1);
  }

  private removerArcosDelNodo(nodoId: number): void {
    const restantes: ArcoUI[] = [];

    for (const a of this.arcos) {
      const elimina = a.nodoOrigenId === nodoId || a.nodoDestinoId === nodoId;
      if (elimina && a.id) this.deletedArcoIds.push(a.id);
      if (!elimina) restantes.push(a);
    }

    this.arcos = restantes;
  }

  private validarFormulario(): string | null {
    if (!this.form.nombre.trim() || !this.form.categoria.trim()) {
      return 'El nombre y la categoría son obligatorios.';
    }

    const nodoIds = new Set<number>();
    for (const a of this.actividades) {
      if (nodoIds.has(a.nodoId)) return 'Hay nodoId duplicado en actividades.';
      nodoIds.add(a.nodoId);
    }
    for (const g of this.gateways) {
      if (nodoIds.has(g.nodoId)) return 'Hay nodoId duplicado entre actividad y gateway.';
      nodoIds.add(g.nodoId);
    }

    for (const [idx, a] of this.actividades.entries()) {
      if (!a.nombreNodo.trim()) return `Actividad #${idx + 1}: el nombre del nodo es obligatorio.`;
      if (!a.descripcion.trim()) return `Actividad #${idx + 1}: la descripción es obligatoria.`;
    }

    for (const [idx, g] of this.gateways.entries()) {
      if (!g.nombreNodo.trim()) return `Gateway #${idx + 1}: el nombre del nodo es obligatorio.`;
    }

    for (const [idx, ar] of this.arcos.entries()) {
      if (ar.nodoOrigenId === ar.nodoDestinoId) {
        return `Arco #${idx + 1}: origen y destino no pueden ser iguales.`;
      }

      if (!this.existeNodo(ar.nodoOrigenId) || !this.existeNodo(ar.nodoDestinoId)) {
        return `Arco #${idx + 1}: referencia nodos inexistentes.`;
      }

      if (this.existeArcoDuplicado(ar.nodoOrigenId, ar.nodoDestinoId, idx)) {
        return `Arco #${idx + 1}: está duplicado.`;
      }
    }

    return null;
  }

  guardar(): void {
    if (this.esLector) return;

    const validacion = this.validarFormulario();
    if (validacion) {
      this.error = validacion;
      return;
    }

    this.guardando = true;
    this.error = '';
    this.exito = '';

    const nit = this.auth.getNitEmpresa();
    if (!nit) {
      this.error = 'Sesión inválida.';
      this.guardando = false;
      return;
    }

    const leg = legadoDesdeEstado(this.form.estado);
    const dto: ProcesoRequest = {
      nombre: this.form.nombre.trim(),
      descripcion: this.form.descripcion.trim(),
      categoria: this.form.categoria.trim(),
      estado: this.form.estado,
      borrador: leg.borrador,
      activo: leg.activo,
      nitEmpresa: nit
    };

    const idEmpleado = this.auth.getSesionActual()?.id;

    const saveProceso$: Observable<ProcesoResponse> =
      this.esEdicion && this.procesoId
        ? this.procesoService.actualizar(this.procesoId, dto, idEmpleado)
        : this.procesoService.crear(dto);

    saveProceso$
      .pipe(
        switchMap((proceso) => {
          const pid = proceso.id;
          return this.sincronizarFlujo(pid).pipe(map(() => pid));
        })
      )
      .subscribe({
        next: (procesoId) => {
          this.exito = this.esEdicion
            ? 'Proceso y flujo actualizados correctamente.'
            : 'Proceso y flujo creados correctamente.';
          this.guardando = false;
          setTimeout(() => void this.router.navigate(['/procesos', procesoId, 'detalle']), 900);
        },
        error: () => {
          this.error = 'No fue posible guardar el proceso y su flujo.';
          this.guardando = false;
        }
      });
  }

  private sincronizarFlujo(procesoId: number): Observable<unknown> {
    const nit = this.auth.getNitEmpresa()!;
    const idEmpleado = this.auth.getSesionActual()?.id;

    const deleteOps: Observable<unknown>[] = [
      ...this.deletedArcoIds.map((id) => this.arcoService.eliminar(id)),
      ...this.deletedActividadIds.map((id) => this.actividadService.eliminar(id, idEmpleado)),
      ...this.deletedGatewayIds.map((id) => this.gatewayService.eliminar(id))
    ];

    const afterDeletes: Observable<unknown> = deleteOps.length ? forkJoin(deleteOps) : of(null);

    return afterDeletes.pipe(
      switchMap(() => this.resolverMapaNodos(procesoId, nit)),
      switchMap((mapa) => this.persistirFlujoConRollback(procesoId, nit, idEmpleado, mapa))
    );
  }

  private resolverMapaNodos(procesoId: number, nit: string): Observable<Map<number, number>> {
    const temps = new Set<number>();
    for (const a of this.actividades) if (a.nodoId < 0) temps.add(a.nodoId);
    for (const g of this.gateways) if (g.nodoId < 0) temps.add(g.nodoId);
    for (const ar of this.arcos) {
      if (ar.nodoOrigenId < 0) temps.add(ar.nodoOrigenId);
      if (ar.nodoDestinoId < 0) temps.add(ar.nodoDestinoId);
    }

    const jobs = [...temps].sort((a, b) => a - b);

    const crearNodo = (tempId: number) => {
      const act = this.actividades.find((x) => x.nodoId === tempId);
      const gw = this.gateways.find((x) => x.nodoId === tempId);
      const nombre = act?.nombreNodo?.trim() || gw?.nombreNodo?.trim() || `Nodo ${tempId}`;
      const tipo = act ? ('ACTIVIDAD' as const) : ('GATEWAY' as const);
      return this.nodoService
        .crear({
          nitEmpresa: nit,
          idProceso: procesoId,
          tipo,
          nombre,
          coordenadaX: 0,
          coordenadaY: 0
        })
        .pipe(map((n) => ({ temp: tempId, real: n.id })));
    };

    if (!jobs.length) return of(new Map());

    return this.ejecutarSecuencialmente(jobs, crearNodo).pipe(
      map((pairs) => {
        const m = new Map<number, number>();
        for (const p of pairs) m.set(p.temp, p.real);
        return m;
      })
    );
  }

  private persistirFlujoConRollback(
    procesoId: number,
    nit: string,
    idEmpleado: number | undefined,
    mapa: Map<number, number>
  ): Observable<unknown> {
    // Si algo falla después de crear nodos, limpiamos lo ya materializado para no dejar flujo parcial.
    const estado: FlujoGuardadoTemporal = {
      nodosCreados: [...mapa.values()],
      nodosVinculados: new Set<number>(),
      actividadesCreadas: [],
      gatewaysCreados: [],
      arcosCreados: []
    };

    const mapNid = (nid: number) => (nid < 0 ? mapa.get(nid) ?? nid : nid);

    return this.crearActividadesSecuencialmente(mapNid, idEmpleado, estado).pipe(
      switchMap(() => this.crearGatewaysSecuencialmente(mapNid, estado)),
      switchMap(() => this.crearArcosSecuencialmente(procesoId, nit, mapNid, estado)),
      map(() => null),
      catchError((error) =>
        this.revertirFlujoGuardado(estado, idEmpleado).pipe(switchMap(() => throwError(() => error)))
      )
    );
  }

  private crearActividadesSecuencialmente(
    mapNid: (nid: number) => number,
    idEmpleado: number | undefined,
    estado: FlujoGuardadoTemporal
  ): Observable<unknown> {
    return this.ejecutarSecuencialmente(this.actividades, (a) => {
      const nid = mapNid(a.nodoId);
      const body: ActividadRequest = {
        nodoId: nid,
        descripcion: a.descripcion,
        tipoActividad: a.tipoActividad ?? undefined,
        laneId: a.laneId ?? undefined
      };
      const request$ = a.id
        ? this.actividadService.actualizar(a.id, body, idEmpleado)
        : this.actividadService.crear(body);

      return request$.pipe(
        map((respuesta) => {
          estado.nodosVinculados.add(respuesta.nodoId);
          if (!a.id) {
            estado.actividadesCreadas.push(respuesta.id);
          }
          return respuesta;
        })
      );
    }).pipe(map(() => null));
  }

  private crearGatewaysSecuencialmente(
    mapNid: (nid: number) => number,
    estado: FlujoGuardadoTemporal
  ): Observable<unknown> {
    return this.ejecutarSecuencialmente(this.gateways, (g) => {
      const nid = mapNid(g.nodoId);
      const body: GatewayRequest = { nodoId: nid, tipoGateway: g.tipoGateway };
      const request$ = g.id ? this.gatewayService.actualizar(g.id, body) : this.gatewayService.crear(body);

      return request$.pipe(
        map((respuesta) => {
          estado.nodosVinculados.add(respuesta.nodoId);
          if (!g.id) {
            estado.gatewaysCreados.push(respuesta.id);
          }
          return respuesta;
        })
      );
    }).pipe(map(() => null));
  }

  private crearArcosSecuencialmente(
    procesoId: number,
    nit: string,
    mapNid: (nid: number) => number,
    estado: FlujoGuardadoTemporal
  ): Observable<unknown> {
    return this.ejecutarSecuencialmente(this.arcos, (ar) => {
      const body: ArcoRequest = {
        idProceso: procesoId,
        nodoOrigenId: mapNid(ar.nodoOrigenId),
        nodoDestinoId: mapNid(ar.nodoDestinoId),
        nitEmpresa: nit
      };
      return ar.id
        ? this.arcoService.actualizar(ar.id, body)
        : this.arcoService.crear(body).pipe(
            map((respuesta) => {
              estado.arcosCreados.push(respuesta.id);
              return respuesta;
            })
          );
    }).pipe(map(() => null));
  }

  private revertirFlujoGuardado(
    estado: FlujoGuardadoTemporal,
    idEmpleado: number | undefined
  ): Observable<unknown> {
    const nodoIdsOrfanos = estado.nodosCreados.filter((nodoId) => !estado.nodosVinculados.has(nodoId));

    const limpiezas: Observable<unknown>[] = [
      ...estado.arcosCreados.map((id) => this.arcoService.eliminar(id).pipe(catchError(() => of(null)))),
      ...estado.actividadesCreadas.map((id) =>
        this.actividadService.eliminar(id, idEmpleado).pipe(catchError(() => of(null)))
      ),
      ...estado.gatewaysCreados.map((id) => this.gatewayService.eliminar(id).pipe(catchError(() => of(null)))),
      ...nodoIdsOrfanos.map((id) => this.nodoService.eliminar(id).pipe(catchError(() => of(null))))
    ];

    return limpiezas.length ? forkJoin(limpiezas).pipe(map(() => null)) : of(null);
  }

  volver(): void {
    if (this.esEdicion && this.procesoId) {
      void this.router.navigate(['/procesos', this.procesoId, 'detalle']);
    } else {
      void this.router.navigate(['/procesos']);
    }
  }
}
