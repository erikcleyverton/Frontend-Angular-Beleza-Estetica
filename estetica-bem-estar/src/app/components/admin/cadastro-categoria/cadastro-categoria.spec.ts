import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastroCategoria } from './cadastro-categoria';

describe('CadastroCategoria', () => {
  let component: CadastroCategoria;
  let fixture: ComponentFixture<CadastroCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroCategoria],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroCategoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
