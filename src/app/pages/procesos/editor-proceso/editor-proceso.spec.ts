import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorProceso } from './editor-proceso';

describe('EditorProceso', () => {
  let component: EditorProceso;
  let fixture: ComponentFixture<EditorProceso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorProceso],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorProceso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
