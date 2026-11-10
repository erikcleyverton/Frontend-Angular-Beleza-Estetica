import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  public nomeItem: string = '';
  public tipoItem: 'P' | 'S' = 'P';
  public preco: number | null = null;
  public descricao: string = '';
  public quantidadeEstoque: number | null = null;
  public filtroTipo: 'P' | 'S' = 'P';

  public categorias: any[] = [];
  public todosOsItens: ItemSistema[] = [];
  public itensFiltrados: ItemSistema[] = [];

  private subItens?: Subscription;
  private subCategorias?: Subscription;

  constructor(
    private cadastroItensService: CadastroItensService,
    private categoriaService: CategoriaService,
    private router: Router,
    private cd: ChangeDetectorRef
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
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar categorias:', err)
    });
  }

  carregarItens(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens) => {
        this.todosOsItens = itens || [];
        this.filtrarTabela();
        this.cd.detectChanges();
      },
      error: (err) => console.error('Erro ao obter itens:', err)
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

  obterIdItem(item: any): number | string {
    if (!item) return '-';
    return item.id || item.idItem || item.iditem || item.Iditem || '-';
  }

  obterNomeCategoria(item: any): string {
    const idCat = Number(item.idCategoria || item.idcategoria || item.categoria || item.Idcategoria);
    if (!idCat && typeof item.categoria === 'string') return item.categoria;

    const encontrada = this.categorias.find(
      c => Number(c.idCategoria || c.id_categoria || c.id || c.IdCategoria) === idCat
    );

    return encontrada ? (encontrada.nomeCategoria || encontrada.nome || encontrada.categoria) : '-';
  }

  obterNomeItem(item: any): string {
    if (!item) return '-';
    return item.Item || item.item || item.Item1 || item.item1 || item.nomeItem || item.nome || '-';
  }

  obterPrecoItem(item: any): number {
    if (!item) return 0;
    return Number(item.preco || item.precoVenda || item.precoUnitario || item.Preco || item.PrecoVenda || 0);
  }

  obterDescricaoItem(item: any): string {
    if (!item) return '-';
    return item.DescricaoItem || item.descricaoItem || item.descricao || '-';
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

    const idCat = this.categorias.length > 0 
      ? Number(this.categorias[0].idCategoria || this.categorias[0].id_categoria || this.categorias[0].id || this.categorias[0].IdCategoria) 
      : 1;

    const payload = {
      IdCategoria: idCat,
      Item: this.nomeItem.trim(),
      DescricaoItem: this.descricao.trim(),
      Preco: Number(this.preco),
      TipoItem: this.tipoItem,
      AtivoProdutoServico: 'S',
      PrecoVenda: Number(this.preco),
      Unidade: 'UN',
      Estoque: this.quantidadeEstoque ? Number(this.quantidadeEstoque) : 0
    };

    this.cadastroItensService.cadastrarItem(payload).subscribe({
      next: () => {
        alert(`${this.tipoItem === 'P' ? 'Produto' : 'Serviço'} "${this.nomeItem}" cadastrado com sucesso!`);
        this.limparFormulario();
        this.carregarItens();
      },
      error: (err) => {
        console.error('Erro na API:', err);
        const msgErro = err?.error?.erro || err?.error?.mensagem || 'Erro ao comunicar com a API.';
        alert(`Falha ao salvar no banco de dados:\n${msgErro}`);
      }
    });
  }

  limparFormulario(): void {
    this.nomeItem = '';
    this.preco = null;
    this.descricao = '';
    this.quantidadeEstoque = null;
    this.cd.detectChanges();
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}