import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./pages/registro-empresa/registro-empresa.component').then((m) => m.RegistroEmpresaComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'procesos' },
      {
        path: 'procesos',
        loadComponent: () =>
          import('./pages/procesos/lista-procesos/lista-procesos').then((m) => m.ListaProcesosComponent)
      },
      {
        path: 'procesos/nuevo',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () =>
          import('./pages/procesos/editor-proceso/editor-proceso').then((m) => m.EditorProcesoComponent)
      },
      {
        path: 'procesos/:id/detalle',
        loadComponent: () =>
          import('./pages/procesos/detalle-proceso/detalle-proceso').then((m) => m.DetalleProcesoComponent)
      },
      {
        path: 'procesos/:id/editar',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () =>
          import('./pages/procesos/editor-proceso/editor-proceso').then((m) => m.EditorProcesoComponent)
      },
      {
        path: 'roles-proceso',
        canActivate: [roleGuard(['ADMIN', 'EDITOR'])],
        loadComponent: () =>
          import('./pages/roles-proceso/roles-proceso-page.component').then((m) => m.RolesProcesoPageComponent)
      },
      {
        path: 'admin/usuarios',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () =>
          import('./pages/admin/usuarios-empresa/usuarios-empresa.component').then((m) => m.UsuariosEmpresaComponent)
      },
      {
        path: 'admin/pool',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./pages/admin/pool-admin/pool-admin.component').then((m) => m.PoolAdminComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'procesos' }
];
