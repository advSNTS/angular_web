import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcesoService } from '../../../services/proceso.service';
import { ActividadService } from '../../../services/actividad.service';
import { GatewayService } from '../../../services/gateway.service';
import { ArcoService } from '../../../services/arco.service';
import { ProcesoResponse, ActividadResponse, GatewayResponse, ArcoResponse, HistorialProceso } from '../../../models/proceso';

@Component({
  selector: 'app-detalle-proceso',
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-proceso.html',
  styleUrl: './detalle-proceso.css'
})
export class DetalleProcesoComponent implements OnInit {

  proceso: ProcesoResponse | null = null;
  actividades: ActividadResponse[] = [];
  gateways: GatewayResponse[] = [];
  arcos: ArcoResponse[] = [];
  historial: HistorialProceso[] = [];
  cargando = true;
  tabActiva: 'flujo' | 'historial' = 'flujo';

  // Mock historial
  private historialMock: HistorialProceso[] = [
    { id: 1, tipoAccion: 'EDICION', fechaCambio: '2026-04-20T10:30:00', valorAnterior: '{"nombre":"Ventas v1"}', valorNuevo: '{"nombre":"Proceso de Ventas"}' },
    { id: 2, tipoAccion: 'EDICION', fechaCambio: '2026-04-22T14:15:00', valorAnterior: '{"borrador":true}', valorNuevo: '{"borrador":false}' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private procesoService: ProcesoService,
    private actividadService: ActividadService,
    private gatewayService: GatewayService,
    private arcoService: ArcoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarDatos(id);
  }

  cargarDatos(id: number): void {
    // Mock proceso — datos quemados 
    this.proceso = {
      id, nombre: 'Proceso de Ventas', descripcion: 'Gestión del ciclo completo de ventas',
      categoria: 'Comercial', borrador: false, activo: true
    };
    this.historial = this.historialMock;
    this.cargando = false;

    // Carga actividades, gateways y arcos
    this.actividadService.obtenerPorProceso(id).subscribe(d => this.actividades = d);
    this.gatewayService.obtenerPorProceso(id).subscribe(d => this.gateways = d);
    this.arcoService.obtenerPorProceso(id).subscribe(d => this.arcos = d);

    /* BACKEND: 
    this.procesoService.obtenerPorId(id).subscribe({
      next: (p) => { this.proceso = p; this.cargando = false; }
    });
    this.procesoService.obtenerHistorial(id).subscribe(h => this.historial = h);
    */
  }

  getEstado(proceso: ProcesoResponse): string {
    if (!proceso.activo) return 'Inactivo';
    return proceso.borrador ? 'Borrador' : 'Publicado';
  }

  getClaseEstado(proceso: ProcesoResponse): string {
    if (!proceso.activo) return 'estado-inactivo';
    return proceso.borrador ? 'estado-borrador' : 'estado-publicado';
  }

  getBadgeGateway(tipo: string): string {
    const map: Record<string, string> = { XOR: 'gateway-xor', AND: 'gateway-and', OR: 'gateway-or' };
    return map[tipo] || '';
  }

  parsearJson(json: string | null): string {
    if (!json) return '—';
    try { return JSON.stringify(JSON.parse(json), null, 2); }
    catch { return json; }
  }

  irAEditor(): void {
    this.router.navigate(['/procesos', this.proceso?.id, 'editar']);
  }

  volver(): void {
    this.router.navigate(['/procesos']);
  }
}