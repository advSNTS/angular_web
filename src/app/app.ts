import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importante para el *ngFor o @for
import { EstudiantesService, Estudiante } from './services/estudiantes.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // Datos de bienvenida
  titulo: string = 'Bienvenidos';
  nombreProfesor: string = 'Pablo';
  cantidadEstudiantes: number = 25;

  // Datos de la lista
  estudiantes: Estudiante[] = [];

  constructor(private estudiantesService: EstudiantesService) {}

  ngOnInit(): void {
    this.obtenerLista();
  }

  obtenerLista(): void {
    this.estudiantesService.listarEstudiantes().subscribe(data => {
      this.estudiantes = data;
    });
  }
}