import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CadastroItem } from './cadastro-item';

describe('CadastroItem', () => {
  let component: CadastroItem;
  let fixture: ComponentFixture<CadastroItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroItem],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
