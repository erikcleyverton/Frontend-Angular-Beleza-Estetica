import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntradaProduto } from './entrada-produto';

describe('EntradaProduto', () => {
  let component: EntradaProduto;
  let fixture: ComponentFixture<EntradaProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntradaProduto],
    }).compileComponents();

    fixture = TestBed.createComponent(EntradaProduto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
