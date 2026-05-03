import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { PoolService } from '../../../services/pool.service';
import { NotificationService } from '../../../services/notification.service';
import { PoolResponse } from '../../../models/proceso';

@Component({
  selector: 'app-pool-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pool-admin.component.html',
  styleUrl: './pool-admin.component.css'
})
export class PoolAdminComponent implements OnInit {
  private readonly poolApi = inject(PoolService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);

  pools: PoolResponse[] = [];
  cargando = true;

  ngOnInit(): void {
    this.poolApi.listar().subscribe({
      next: (p) => {
        this.pools = p;
        this.cargando = false;
      },
      error: () => {
        this.notify.error('No se pudieron cargar los pools.');
        this.cargando = false;
      }
    });
  }
}
