import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleProceso } from './detalle-proceso';

describe('DetalleProceso', () => {
  let component: DetalleProceso;
  let fixture: ComponentFixture<DetalleProceso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleProceso],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleProceso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
