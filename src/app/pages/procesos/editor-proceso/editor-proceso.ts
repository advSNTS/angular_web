import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProcesoService } from '../../../services/proceso.service';
import { ProcesoResponse, ProcesoRequest } from '../../../models/proceso';

@Component({
  selector: 'app-editor-proceso',
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private procesoService: ProcesoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.procesoId = Number(id);
      this.cargarProceso(this.procesoId);
    }
  }

  cargarProceso(id: number): void {
    // Mock —
    this.form = {
      nombre: 'Proceso de Ventas',
      descripcion: 'Gestión del ciclo completo de ventas',
      categoria: 'Comercial',
      borrador: false,
      activo: true
    };
    /* BACKEND:
    this.procesoService.obtenerPorId(id).subscribe(p => {
      this.form = { nombre: p.nombre, descripcion: p.descripcion, categoria: p.categoria, borrador: p.borrador, activo: p.activo };
    });
    */
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.categoria.trim()) {
      this.error = 'El nombre y la categoría son obligatorios.';
      return;
    }

    this.guardando = true;
    this.error = '';

    if (this.esEdicion && this.procesoId) {
      this.procesoService.actualizar(this.procesoId, this.form).subscribe({
        next: () => {
          this.exito = ' Proceso actualizado correctamente.';
          this.guardando = false;
          setTimeout(() => this.router.navigate(['/procesos', this.procesoId, 'detalle']), 1500);
        },
        error: () => { this.error = 'Error al actualizar el proceso.'; this.guardando = false; }
      });
    } else {
      this.procesoService.crear(this.form).subscribe({
        next: (p) => {
          this.exito = ' Proceso creado correctamente.';
          this.guardando = false;
          setTimeout(() => this.router.navigate(['/procesos', p.id, 'detalle']), 1500);
        },
        error: () => { this.error = 'Error al crear el proceso.'; this.guardando = false; }
      });
    }
  }

  volver(): void {
    if (this.esEdicion && this.procesoId) {
      this.router.navigate(['/procesos', this.procesoId, 'detalle']);
    } else {
      this.router.navigate(['/procesos']);
    }
  }
}