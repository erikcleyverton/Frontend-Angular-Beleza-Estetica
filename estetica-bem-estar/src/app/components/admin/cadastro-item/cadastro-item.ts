import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
  selector: 'app-cadastro-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-item.html',
  styleUrl: './cadastro-item.css'
})
export class CadastroItemComponent implements OnInit, OnDestroy {
  nomeItem: string = '';
  tipoItem: 'P' | 'S' = 'P';
  preco: number | null = null;
  descricao: string = '';
  idCategoria: number | null = null;
  filtroTipo: 'P' | 'S' = 'P';

  exibirNovoCampoCategoria: boolean = false;
  novaCategoriaNome: string = '';
  salvandoCategoria: boolean = false;

  categorias: any[] = [];
  todosOsItens: ItemSistema[] = [];
  itensFiltrados: ItemSistema[] = [];

  private subItens?: Subscription;
  private subCategorias?: Subscription;

  constructor(
    private cadastroItensService: CadastroItensService,
    private categoriaService: CategoriaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
    this.carregarItens();
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
    this.subCategorias?.unsubscribe();
  }

  carregarCategorias(): void {
    this.subCategorias = this.categoriaService.obterTodas().subscribe({
      next: (dados: any[]) => {
        this.categorias = dados || [];
        this.filtrarTabela();
      },
      error: (err: any) => console.error('Erro ao carregar categorias:', err)
    });
  }

  carregarItens(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens) => {
        this.todosOsItens = itens || [];
        this.filtrarTabela();
      },
      error: (err) => console.error('Erro ao obter itens:', err)
    });
  }

  toggleCampoCategoria(): void {
    this.exibirNovoCampoCategoria = !this.exibirNovoCampoCategoria;
    this.novaCategoriaNome = '';
  }

  cadastrarCategoriaRapida(): void {
    if (!this.novaCategoriaNome.trim()) {
      alert('Informe o nome da categoria!');
      return;
    }

    this.salvandoCategoria = true;
    const nomeCat = this.novaCategoriaNome.trim();
    const payloadCat = {
      categoria: nomeCat,
      nome: nomeCat,
      nomeCategoria: nomeCat
    };

    this.categoriaService.cadastrarCategoria(payloadCat).subscribe({
      next: () => {
        alert(`Categoria "${nomeCat}" cadastrada e guardada no banco com sucesso!`);
        this.salvandoCategoria = false;
        this.novaCategoriaNome = '';
        this.exibirNovoCampoCategoria = false;
        
        // Atualiza a lista de categorias e seleciona a nova automaticamente
        this.categoriaService.obterTodas().subscribe({
          next: (dados: any[]) => {
            this.categorias = dados || [];
            const criada = this.categorias.find(
              c => (c.nomeCategoria || c.nome || c.categoria) === nomeCat
            );
            if (criada) {
              this.idCategoria = Number(criada.idCategoria || criada.id);
            }
          }
        });
      },
      error: (err: any) => {
        console.error('Erro ao cadastrar categoria:', err);
        alert('Erro ao guardar categoria no servidor.');
        this.salvandoCategoria = false;
      }
    });
  }

  alternarTipo(tipo: 'P' | 'S'): void {
    this.filtroTipo = tipo;
    this.tipoItem = tipo;
    this.filtrarTabela();
  }

  filtrarTabela(): void {
    this.itensFiltrados = this.todosOsItens.filter(
      item => item.tipoItem === this.filtroTipo || (this.filtroTipo === 'P' ? item.tipo === 'produto' : item.tipo === 'servico')
    );
  }

  obterNomeCategoria(item: any): string {
    const idCat = Number(item.idCategoria || item.idcategoria || item.categoria);
    if (!idCat && typeof item.categoria === 'string') return item.categoria;

    const encontrada = this.categorias.find(
      c => Number(c.idCategoria || c.id) === idCat
    );

    return encontrada ? (encontrada.nomeCategoria || encontrada.nome || encontrada.categoria) : '-';
  }

  salvarItem(): void {
    if (!this.nomeItem.trim()) {
      alert('Por favor, preencha o nome!');
      return;
    }

    if (!this.preco || this.preco <= 0) {
      alert('Por favor, insira um preço válido!');
      return;
    }

    const payload = {
      nomeItem: this.nomeItem,
      tipoItem: this.tipoItem,
      preco: Number(this.preco),
      descricao: this.descricao,
      idCategoria: this.idCategoria ? Number(this.idCategoria) : null
    };

    this.cadastroItensService.cadastrarItem(payload).subscribe({
      next: (itemCadastrado) => {
        const nomeFinal = itemCadastrado?.nome || itemCadastrado?.nomeItem || this.nomeItem;
        alert(`${this.tipoItem === 'P' ? 'Produto' : 'Serviço'} "${nomeFinal}" cadastrado com sucesso!`);
        this.limparFormulario();
        this.carregarItens();
      },
      error: (err) => {
        console.error('Erro ao cadastrar:', err);
        alert('Erro ao salvar item.');
      }
    });
  }

  limparFormulario(): void {
    this.nomeItem = '';
    this.preco = null;
    this.descricao = '';
    this.idCategoria = null;
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}