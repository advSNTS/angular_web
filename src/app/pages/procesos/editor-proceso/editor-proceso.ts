import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of, switchMap, map } from 'rxjs';

import { ProcesoService } from '../../../services/proceso.service';
import { ActividadService } from '../../../services/actividad.service';
import { GatewayService } from '../../../services/gateway.service';
import { ArcoService } from '../../../services/arco.service';

import {
  ProcesoResponse,
  ProcesoRequest,
  ActividadRequest,
  GatewayRequest,
  ArcoRequest
} from '../../../models/proceso';

type GatewayTipo = 'XOR' | 'AND' | 'OR';

interface ActividadUI {
  id?: number;
  nodoId: number;
  descripcion: string;
  nombreNodo: string;
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

interface HistorialCampo {
  id: number;
  tipoAccion: 'EDICION';
  fechaCambio: string;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}

@Component({
  selector: 'app-editor-proceso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-proceso.html',
  styleUrl: './editor-proceso.css'
})
export class EditorProcesoComponent implements OnInit {
  esEdicion = false;
  procesoId: number | null = null;
  guardando = false;
  error = '';
  exito = '';

  form: ProcesoRequest = {
    nombre: '',
    descripcion: '',
    categoria: '',
    borrador: true,
    activo: true
  };

  categorias = ['Comercial', 'Administrativo', 'Finanzas', 'Operaciones', 'RRHH', 'TI'];

  actividades: ActividadUI[] = [];
  gateways: GatewayUI[] = [];
  arcos: ArcoUI[] = [];

  deletedActividadIds: number[] = [];
  deletedGatewayIds: number[] = [];
  deletedArcoIds: number[] = [];

  // Anti-NG0103: estructura cacheada (no getter que regenere arrays en cada ciclo)
  nodosDisponibles: NodoOption[] = [];
  nodosLabelMap = new Map<number, string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private procesoService: ProcesoService,
    private actividadService: ActividadService,
    private gatewayService: GatewayService,
    private arcoService: ArcoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.reconstruirNodosDisponibles();
      return;
    }

    this.esEdicion = true;
    this.procesoId = Number(id);
    this.cargarEdicion(this.procesoId);
  }

  // ---------- Carga ----------
  private cargarEdicion(id: number): void {
    forkJoin({
      proceso: this.procesoService.obtenerPorId(id),
      actividades: this.actividadService.obtenerPorProceso(id),
      gateways: this.gatewayService.obtenerPorProceso(id),
      arcos: this.arcoService.obtenerPorProceso(id)
    }).subscribe({
      next: ({ proceso, actividades, gateways, arcos }) => {
        this.form = {
          nombre: proceso.nombre,
          descripcion: proceso.descripcion,
          categoria: proceso.categoria,
          borrador: proceso.borrador,
          activo: proceso.activo
        };

        this.actividades = actividades.map(a => ({
          id: a.id,
          nodoId: a.nodoId,
          descripcion: a.descripcion,
          nombreNodo: a.nombreNodo
        }));

        this.gateways = gateways.map(g => ({
          id: g.id,
          nodoId: g.nodoId,
          tipoGateway: g.tipoGateway,
          nombreNodo: g.nombreNodo
        }));

        this.arcos = arcos.map(a => ({
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

  // ---------- Historial por campo ----------
  private historialKey(procesoId: number): string {
    return `historial_proceso_${procesoId}`;
  }

  private snapshotNormalizado(): {
    proceso: {
      nombre: string;
      descripcion: string;
      categoria: string;
      borrador: boolean;
      activo: boolean;
    };
    actividades: Array<{ nodoId: number; nombreNodo: string; descripcion: string }>;
    gateways: Array<{ nodoId: number; nombreNodo: string; tipoGateway: GatewayTipo }>;
    arcos: Array<{ nodoOrigenId: number; nodoDestinoId: number }>;
  } {
    const actividades = [...this.actividades]
      .map(a => ({
        nodoId: a.nodoId,
        nombreNodo: (a.nombreNodo || '').trim(),
        descripcion: (a.descripcion || '').trim()
      }))
      .sort((x, y) => x.nodoId - y.nodoId);

    const gateways = [...this.gateways]
      .map(g => ({
        nodoId: g.nodoId,
        nombreNodo: (g.nombreNodo || '').trim(),
        tipoGateway: g.tipoGateway
      }))
      .sort((x, y) => x.nodoId - y.nodoId);

    const arcos = [...this.arcos]
      .map(a => ({
        nodoOrigenId: a.nodoOrigenId,
        nodoDestinoId: a.nodoDestinoId
      }))
      .sort((x, y) => {
        if (x.nodoOrigenId !== y.nodoOrigenId) return x.nodoOrigenId - y.nodoOrigenId;
        return x.nodoDestinoId - y.nodoDestinoId;
      });

    return {
      proceso: {
        nombre: (this.form.nombre || '').trim(),
        descripcion: (this.form.descripcion || '').trim(),
        categoria: (this.form.categoria || '').trim(),
        borrador: this.form.borrador,
        activo: this.form.activo
      },
      actividades,
      gateways,
      arcos
    };
  }

  private construirDiffCampos(
    antes: ReturnType<EditorProcesoComponent['snapshotNormalizado']> | null,
    despues: ReturnType<EditorProcesoComponent['snapshotNormalizado']>
  ): HistorialCampo[] {
    if (!antes) return [];

    const cambios: HistorialCampo[] = [];
    const fecha = new Date().toISOString();

    const pushCambio = (campo: string, oldVal: unknown, newVal: unknown): void => {
      const oldStr = oldVal === null || oldVal === undefined ? null : JSON.stringify(oldVal);
      const newStr = newVal === null || newVal === undefined ? null : JSON.stringify(newVal);
      if (oldStr === newStr) return;

      cambios.push({
        id: Date.now() + cambios.length,
        tipoAccion: 'EDICION',
        fechaCambio: fecha,
        campo,
        valorAnterior: oldStr,
        valorNuevo: newStr
      });
    };

    pushCambio('proceso.nombre', antes.proceso.nombre, despues.proceso.nombre);
    pushCambio('proceso.descripcion', antes.proceso.descripcion, despues.proceso.descripcion);
    pushCambio('proceso.categoria', antes.proceso.categoria, despues.proceso.categoria);
    pushCambio('proceso.borrador', antes.proceso.borrador, despues.proceso.borrador);
    pushCambio('proceso.activo', antes.proceso.activo, despues.proceso.activo);

    pushCambio('flujo.actividades', antes.actividades, despues.actividades);
    pushCambio('flujo.gateways', antes.gateways, despues.gateways);
    pushCambio('flujo.arcos', antes.arcos, despues.arcos);

    return cambios;
  }

  private guardarHistorialCampos(procesoId: number, eventos: HistorialCampo[]): void {
    if (!eventos.length) return;

    const key = this.historialKey(procesoId);
    const raw = localStorage.getItem(key);
    const listaActual: HistorialCampo[] = raw ? JSON.parse(raw) : [];
    const nuevaLista = [...eventos, ...listaActual];
    localStorage.setItem(key, JSON.stringify(nuevaLista));
  }

  // ---------- Helpers ----------
  reconstruirNodosDisponibles(): void {
    const deActividades = this.actividades.map(a => ({
      nodoId: a.nodoId,
      label: `[Actividad] ${a.nombreNodo || `Nodo ${a.nodoId}`}`
    }));

    const deGateways = this.gateways.map(g => ({
      nodoId: g.nodoId,
      label: `[Gateway ${g.tipoGateway}] ${g.nombreNodo || `Nodo ${g.nodoId}`}`
    }));

    this.nodosDisponibles = [...deActividades, ...deGateways].sort((x, y) => x.nodoId - y.nodoId);
    this.nodosLabelMap = new Map(this.nodosDisponibles.map(n => [n.nodoId, n.label]));
  }

  private siguienteNodoId(): number {
    const ids = this.nodosDisponibles.map(n => n.nodoId);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private existeNodo(nodoId: number): boolean {
    return this.nodosDisponibles.some(n => n.nodoId === nodoId);
  }

  private existeArcoDuplicado(origen: number, destino: number, idxActual: number): boolean {
    return this.arcos.some((a, i) => i !== idxActual && a.nodoOrigenId === origen && a.nodoDestinoId === destino);
  }

  getLabelNodo(nodoId: number): string {
    return this.nodosLabelMap.get(nodoId) ?? `Nodo ${nodoId}`;
  }

  // ---------- Actividades ----------
  agregarActividad(): void {
    this.actividades.push({
      nodoId: this.siguienteNodoId(),
      nombreNodo: '',
      descripcion: ''
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

  // ---------- Gateways ----------
  agregarGateway(): void {
    this.gateways.push({
      nodoId: this.siguienteNodoId(),
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

  // ---------- Arcos ----------
  agregarArco(): void {
    if (this.nodosDisponibles.length < 2) {
      this.error = 'Necesitas al menos dos nodos (actividades/gateways) para crear un arco.';
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

  // ---------- Validaciones ----------
  private validarFormulario(): string | null {
    if (!this.form.nombre.trim() || !this.form.categoria.trim()) {
      return 'El nombre y la categoría son obligatorios.';
    }

    for (const [idx, a] of this.actividades.entries()) {
      if (!a.nombreNodo.trim()) return `Actividad #${idx + 1}: el nombre del nodo es obligatorio.`;
      if (!a.descripcion.trim()) return `Actividad #${idx + 1}: la descripción es obligatoria.`;
      if (!a.nodoId || a.nodoId < 1) return `Actividad #${idx + 1}: nodoId inválido.`;
    }

    for (const [idx, g] of this.gateways.entries()) {
      if (!g.nombreNodo.trim()) return `Gateway #${idx + 1}: el nombre del nodo es obligatorio.`;
      if (!g.nodoId || g.nodoId < 1) return `Gateway #${idx + 1}: nodoId inválido.`;
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

  // ---------- Guardado ----------
  guardar(): void {
    const validacion = this.validarFormulario();
    if (validacion) {
      this.error = validacion;
      return;
    }

    this.guardando = true;
    this.error = '';
    this.exito = '';

    const snapshotAntes = this.esEdicion ? this.snapshotNormalizado() : null;

    const saveProceso$: Observable<ProcesoResponse> =
      this.esEdicion && this.procesoId
        ? this.procesoService.actualizar(this.procesoId, this.form)
        : this.procesoService.crear(this.form);

    saveProceso$
      .pipe(
        switchMap((proceso) => {
          const procesoId = proceso.id;
          return this.sincronizarFlujo(procesoId).pipe(map(() => procesoId));
        })
      )
      .subscribe({
        next: (procesoId) => {
          const snapshotDespues = this.snapshotNormalizado();
          const cambios = this.construirDiffCampos(snapshotAntes, snapshotDespues);
          this.guardarHistorialCampos(procesoId, cambios);

          this.exito = this.esEdicion
            ? 'Proceso y flujo actualizados correctamente.'
            : 'Proceso y flujo creados correctamente.';
          this.guardando = false;
          setTimeout(() => this.router.navigate(['/procesos', procesoId, 'detalle']), 1000);
        },
        error: () => {
          this.error = 'No fue posible guardar el proceso y su flujo.';
          this.guardando = false;
        }
      });
  }

  private sincronizarFlujo(procesoId: number): Observable<unknown> {
    const deleteOps: Observable<unknown>[] = [
      ...this.deletedArcoIds.map(id => this.arcoService.eliminar(id)),
      ...this.deletedActividadIds.map(id => this.actividadService.eliminar(id)),
      ...this.deletedGatewayIds.map(id => this.gatewayService.eliminar(id))
    ];

    const upsertActividades: Observable<unknown>[] = this.actividades.map(a => {
      const dto: ActividadRequest = {
        nodoId: a.nodoId,
        descripcion: a.descripcion
      };
      return a.id ? this.actividadService.actualizar(a.id, dto) : this.actividadService.crear(dto);
    });

    const upsertGateways: Observable<unknown>[] = this.gateways.map(g => {
      const dto: GatewayRequest = {
        nodoId: g.nodoId,
        tipoGateway: g.tipoGateway
      };
      return g.id ? this.gatewayService.actualizar(g.id, dto) : this.gatewayService.crear(dto);
    });

    const upsertArcos: Observable<unknown>[] = this.arcos.map(a => {
      const dto: ArcoRequest = {
        idProceso: procesoId,
        nodoOrigenId: a.nodoOrigenId,
        nodoDestinoId: a.nodoDestinoId
      };
      return a.id ? this.arcoService.actualizar(a.id, dto) : this.arcoService.crear(dto);
    });

    const allOps = [...deleteOps, ...upsertActividades, ...upsertGateways, ...upsertArcos];

    if (!allOps.length) return of(null);
    return forkJoin(allOps);
  }

  volver(): void {
    if (this.esEdicion && this.procesoId) {
      void this.router.navigate(['/procesos', this.procesoId, 'detalle']);
    } else {
      void this.router.navigate(['/procesos']);
    }
  }
}