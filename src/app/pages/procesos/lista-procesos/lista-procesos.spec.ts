import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaProcesos } from './lista-procesos';

describe('ListaProcesos', () => {
  let component: ListaProcesos;
  let fixture: ComponentFixture<ListaProcesos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaProcesos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaProcesos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
