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
  public idCategoriaSelecionada: number | null = null;
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
        if (this.categorias.length > 0 && (!this.idCategoriaSelecionada || Number(this.idCategoriaSelecionada) === 0)) {
          const primeiraCat = this.categorias[0];
          this.idCategoriaSelecionada = Number(
            primeiraCat.idCategoria || primeiraCat.idcategoria || primeiraCat.id || primeiraCat.IdCategoria || 1
          );
        }
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

  // MÉTODO DE CATEGORIA CORRIGIDO: Busca resiliente por ID e Nome
  obterNomeCategoria(item: any): string {
    if (!item) return '-';

    const idCatItem = Number(item.idCategoria ?? item.idcategoria ?? item.IdCategoria ?? item.Idcategoria ?? 0);
    const catTextoDireto = item.categoria || item.nomeCategoria || item.categoria1 || item.Categoria1;

    // 1. Busca por ID numérico
    if (idCatItem > 0 && this.categorias.length > 0) {
      const encontrada = this.categorias.find(c => {
        const idC = Number(c.idCategoria ?? c.idcategoria ?? c.id ?? c.IdCategoria ?? 0);
        return idC === idCatItem;
      });

      if (encontrada) {
        return encontrada.nomeCategoria || encontrada.nome || encontrada.categoria || '-';
      }
    }

    // 2. Fallback caso venha o texto direto da categoria no item
    if (typeof catTextoDireto === 'string' && catTextoDireto.trim()) {
      return catTextoDireto;
    }

    return '-';
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

    const idCatNumber = Number(this.idCategoriaSelecionada);
    if (!idCatNumber || idCatNumber <= 0) {
      alert('Por favor, selecione uma categoria válida!');
      return;
    }

    if (!this.preco || this.preco <= 0) {
      alert('Por favor, insira um preço válido!');
      return;
    }

    const payload = {
      idCategoria: idCatNumber,
      IdCategoria: idCatNumber,
      item: this.nomeItem.trim(),
      Item: this.nomeItem.trim(),
      descricaoItem: this.descricao.trim(),
      DescricaoItem: this.descricao.trim(),
      preco: Number(this.preco),
      Preco: Number(this.preco),
      precoVenda: Number(this.preco),
      PrecoVenda: Number(this.preco),
      tipoItem: this.tipoItem,
      TipoItem: this.tipoItem,
      ativoProdutoServico: 'S',
      unidade: 'UN',
      quantidadeEstoque: Number(this.quantidadeEstoque || 0)
    };

    this.cadastroItensService.cadastrarItem(payload).subscribe({
      next: (itemCadastrado) => {
        alert(`${this.tipoItem === 'P' ? 'Produto' : 'Serviço'} "${this.nomeItem}" cadastrado com sucesso!`);
        
        this.limparFormulario();
        this.filtroTipo = this.tipoItem;
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
    if (this.categorias.length > 0) {
      const primeiraCat = this.categorias[0];
      this.idCategoriaSelecionada = Number(
        primeiraCat.idCategoria || primeiraCat.idcategoria || primeiraCat.id || primeiraCat.IdCategoria || 1
      );
    }
    this.cd.detectChanges();
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}