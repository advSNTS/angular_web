import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'procesos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/procesos/lista-procesos/lista-procesos').then(m => m.ListaProcesosComponent)
  },
  {
    path: 'procesos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/procesos/editor-proceso/editor-proceso').then(m => m.EditorProcesoComponent)
  },
  {
    path: 'procesos/:id/detalle',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/procesos/detalle-proceso/detalle-proceso').then(m => m.DetalleProcesoComponent)
  },
  {
    path: 'procesos/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/procesos/editor-proceso/editor-proceso').then(m => m.EditorProcesoComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];