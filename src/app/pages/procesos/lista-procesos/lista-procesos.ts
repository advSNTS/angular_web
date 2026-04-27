import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcesoService } from '../../../services/proceso.service'; 
import { ProcesoResponse } from '../../../models/proceso';      

@Component({
  selector: 'app-lista-procesos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-procesos.html',
  styleUrls: ['./lista-procesos.css']
})
export class ListaProcesosComponent implements OnInit {

  procesos: ProcesoResponse[] = [];
  procesosFiltrados: ProcesoResponse[] = [];
  cargando = true;
  error = '';
  busqueda = '';
  filtroCategoria = '';
  procesoSeleccionado: ProcesoResponse | null = null;

  constructor(private procesoService: ProcesoService) {}

  ngOnInit(): void {
    // DATOS MOCK (para probar sin backend)
    this.procesos = [
      { id: 1, nombre: 'Proceso de Ventas', descripcion: 'Gestión del ciclo de ventas', categoria: 'Comercial', borrador: false, activo: true },
      { id: 2, nombre: 'Proceso de RRHH', descripcion: 'Gestión de recursos humanos', categoria: 'Administrativo', borrador: true, activo: true },
      { id: 3, nombre: 'Proceso Contable', descripcion: 'Registro y control contable', categoria: 'Finanzas', borrador: false, activo: false }
    ];

    this.procesosFiltrados = this.procesos;
    this.cargando = false;

    //  Cuando conectes backend, usa esto en lugar del mock:
    // this.cargarProcesos();
  }

  cargarProcesos(): void {
    this.cargando = true;
    this.procesoService.obtenerTodos().subscribe({
      next: (data) => {
        this.procesos = data;
        this.procesosFiltrados = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar los procesos. Verifica que el backend esté corriendo.';
        this.cargando = false;
      }
    });
  }

  filtrar(): void {
    this.procesosFiltrados = this.procesos.filter(p => {
      const coincideNombre = p.nombre.toLowerCase()
        .includes(this.busqueda.toLowerCase());
      const coincideCategoria = this.filtroCategoria
        ? p.categoria === this.filtroCategoria
        : true;
      return coincideNombre && coincideCategoria;
    });
  }

  seleccionar(proceso: ProcesoResponse): void {
    this.procesoSeleccionado = proceso;
  }

  get categorias(): string[] {
    return [...new Set(this.procesos.map(p => p.categoria))];
  }

  getEstado(proceso: ProcesoResponse): string {
    if (!proceso.activo) return 'Inactivo';
    return proceso.borrador ? 'Borrador' : 'Publicado';
  }

  getClaseEstado(proceso: ProcesoResponse): string {
    if (!proceso.activo) return 'estado-inactivo';
    return proceso.borrador ? 'estado-borrador' : 'estado-publicado';
  }
}