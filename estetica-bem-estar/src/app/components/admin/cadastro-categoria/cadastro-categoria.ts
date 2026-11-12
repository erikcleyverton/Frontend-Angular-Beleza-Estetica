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
    const nomeLimpo = this.nomeCategoria.trim();

    if (!nomeLimpo) {
      alert('Por favor, informe o nome da categoria!');
      return;
    }

    this.categoriaService.cadastrar(nomeLimpo).subscribe({
      next: (catCadastrada: Categoria) => {
        alert(`Categoria "${nomeLimpo}" cadastrada com sucesso!`);
        this.nomeCategoria = '';
        
        // Adiciona na lista local imediatamente e sincroniza com a API
        if (catCadastrada && catCadastrada.nomeCategoria) {
          this.categorias = [...this.categorias, catCadastrada];
        }
        this.carregarCategorias();
      },
      error: (err: any) => {
        console.error('Erro ao salvar categoria:', err);
        const msg = err?.error?.mensagem || 'Falha ao salvar a categoria no banco de dados.';
        alert(msg);
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/cadastro-item']);
  }
}