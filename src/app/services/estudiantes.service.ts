import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Estudiante {
  id: number;
  nombre: string;
  carrera: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstudiantesService {

  constructor() { }

  listarEstudiantes(): Observable<Estudiante[]> {
    const estudiantes: Estudiante[] = [
      { id: 1, nombre: 'Pablo Márquez', carrera: 'Ingeniería de Sistemas' },
      { id: 2, nombre: 'María Pacheco', carrera: 'Diseño' },
      { id: 3, nombre: 'Francisco Márquez', carrera: 'Arquitectura' },
      { id: 4, nombre: 'Miguel Gómez', carrera: 'Administración' }
    ];

    return of(estudiantes);
  }

}