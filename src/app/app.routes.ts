import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'procesos',                          
    canActivate: [authGuard],                  
    loadComponent: () =>
      import('./pages/procesos/lista-procesos/lista-procesos').then((m) => m.ListaProcesosComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];