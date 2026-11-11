import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoriaService, Categoria } from '../../../services/categoria.service';

@Component({
  selector: 'app-cadastro-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-categoria.html',
  styleUrl: './cadastro-categoria.css'
})
export class CadastroCategoriaComponent implements OnInit {
  public nomeCategoria: string = '';
  public categorias: Categoria[] = [];

  constructor(
    private categoriaService: CategoriaService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias(): void {
    this.categoriaService.obterTodas().subscribe({
      next: (dados: Categoria[]) => {
        this.categorias = dados || [];
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Erro ao listar categorias:', err)
    });
  }

  salvarCategoria(): void {
    if (!this.nomeCategoria.trim()) {
      alert('Por favor, informe o nome da categoria!');
      return;
    }

    this.categoriaService.cadastrar(this.nomeCategoria.trim()).subscribe({
      next: () => {
        alert(`Categoria "${this.nomeCategoria}" cadastrada com sucesso!`);
        this.nomeCategoria = '';
        this.carregarCategorias();
      },
      error: (err: any) => {
        console.error('Erro ao salvar categoria:', err);
        alert('Falha ao salvar a categoria no banco de dados.');
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/cadastro-item']);
  }
}