import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';
import { CategoriaService } from '../../../services/categoria.service';

export interface CategoriaLocal {
  idCategoria: number;
  categoria: string;
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit, OnDestroy {
  termoBusca: string = '';
  filtroTipo: string = 'todos';
  categoriaSelecionada: number | string = 'TODAS';

  produtosFixos: ItemSistema[] = [];
  produtosFiltrados: ItemSistema[] = [];
  categorias: CategoriaLocal[] = [];

  private subItens?: Subscription;
  private subCategorias?: Subscription;

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService,
    private cadastroItensService: CadastroItensService,
    private categoriaService: CategoriaService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarCategoriasBD();
    this.carregarItensBD();
  }

  carregarItensBD(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.produtosFixos = (itens || []).map((item, idx) => {
          const pAny = item as any;
          const nomeFinal = pAny.Item || pAny.item || item.nomeItem || item.nome || 'Sem nome';
          const descFinal = pAny.DescricaoItem || pAny.descricaoItem || item.descricao || pAny.descricao_item || 'Sem descrição.';
          const precoFinal = Number(pAny.PrecoVenda || pAny.precoVenda || pAny.Preco || item.preco || item.precoUnitario || 0);

          return {
            ...item,
            id: Number(item.id || item.idItem || pAny.iditem || pAny.Iditem || (idx + 1)),
            nome: nomeFinal,
            item: nomeFinal,
            descricao: descFinal,
            preco: precoFinal,
            precoUnitario: precoFinal
          };
        });

        this.filtrarProdutos();
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar catálogo:', err)
    });
  }

  carregarCategoriasBD(): void {
    this.subCategorias = this.categoriaService.obterTodas().subscribe({
      next: (dados: any[]) => {
        const lista = dados || [];
        this.categorias = lista.map((c: any) => ({
          idCategoria: Number(c.idCategoria || c.id_categoria || c.id || c.IdCategoria || c.idcategoria),
          categoria: c.nomeCategoria || c.nome || c.categoria || c.categoria1 || c.Categoria1 || 'Sem nome'
        }));
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar categorias:', err)
    });
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
    this.subCategorias?.unsubscribe();
  }

  /**
   * Normalização inteligente para separar Produto e Serviço
   */
  obterTipoNormalizado(prod: any): 'servico' | 'produto' {
    if (!prod) return 'produto';

    const t = String(
      prod.tipoItem || prod.TipoItem || prod.tipo_item || prod.tipo || prod.AtivoProdutoServico || ''
    ).toLowerCase().trim();

    if (t === 's' || t === 'servico' || t === 'serviço') {
      return 'servico';
    }

    if (t === 'p' || t === 'produto') {
      return 'produto';
    }

    // Fallback por palavra-chave se vier NULL do banco
    const nome = this.obterNomeItem(prod).toLowerCase();
    const termosServico = [
      'botox', 'harmonização', 'harmonizacao', 'preenchimento', 
      'tratamento', 'limpeza', 'massagem', 'peeling', 'drenagem', 
      'aplicação', 'aplicacao', 'laser', 'facial'
    ];

    return termosServico.some(termo => nome.includes(termo)) ? 'servico' : 'produto';
  }

  obterNomeItem(prod: any): string {
    if (!prod) return 'Sem nome';
    return prod.Item || prod.item || prod.nomeItem || prod.nome || 'Sem nome';
  }

  obterPrecoItem(prod: any): number {
    if (!prod) return 0;
    return Number(prod.PrecoVenda || prod.precoVenda || prod.Preco || prod.preco || prod.precoUnitario || 0);
  }

  obterDescricaoItem(prod: any): string {
    if (!prod) return 'Sem descrição.';
    return prod.DescricaoItem || prod.descricaoItem || prod.descricao || 'Sem descrição.';
  }

  filtrarProdutos(): void {
    const busca = this.termoBusca.toLowerCase().trim();

    const catSelecionadaNum = (this.categoriaSelecionada === 'TODAS' || this.categoriaSelecionada === '')
      ? 'TODAS'
      : Number(this.categoriaSelecionada);

    this.produtosFiltrados = this.produtosFixos.filter(prod => {
      const pAny = prod as any;
      const nomeOuId = (this.obterNomeItem(prod)).toLowerCase();
      const idStr = (prod.id || prod.idItem || pAny.iditem || pAny.Iditem || '').toString();
      
      const tipoNormalizado = this.obterTipoNormalizado(prod);

      // Pega a categoria do item convertendo para Number
      const idCatItem = Number(
        pAny.IdCategoria || pAny.idCategoria || pAny.idcategoria || pAny.Idcategoria || prod.categoria || 0
      );

      const atendeTexto = !busca || nomeOuId.includes(busca) || idStr.includes(busca);
      
      const atendeTipo = 
        this.filtroTipo === 'todos' || 
        (this.filtroTipo === 'produtos' && tipoNormalizado === 'produto') ||
        (this.filtroTipo === 'servicos' && tipoNormalizado === 'servico');

      const atendeCategoria = 
        catSelecionadaNum === 'TODAS' || idCatItem === catSelecionadaNum;

      return atendeTexto && atendeTipo && atendeCategoria;
    });

    this.cd.detectChanges();
  }

  setFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.filtrarProdutos();
  }

  limparFiltro(): void {
    this.termoBusca = '';
    this.filtroTipo = 'todos';
    this.categoriaSelecionada = 'TODAS';
    this.filtrarProdutos();
  }

  abrirDetalhes(id: any): void {
    console.log('Detalhes do item ID:', id);
  }

  adicionarAoCarrinho(produto: ItemSistema): void {
    const pAny = produto as any;
    const nome = this.obterNomeItem(produto);
    const preco = this.obterPrecoItem(produto);
    const idValido = Number(produto.id || produto.idItem || pAny.iditem || pAny.Iditem || 1);
    const tipoNormalizado = this.obterTipoNormalizado(produto);

    this.carrinhoService.adicionarItem({
      id: idValido,
      nome: nome,
      precoUnitario: preco,
      tipo: tipoNormalizado,
      tipoItem: tipoNormalizado === 'servico' ? 'S' : 'P',
      categoria: pAny.categoria || 'Geral',
      imagem: pAny.imagem || 'assets/placeholder.png'
    });

    alert(`"${nome}" foi adicionado ao carrinho!`);
  }

  voltar(): void { this.router.navigate(['/home']); }
  irParaCadastro(): void { this.router.navigate(['/cliente']); }
  irParaCarrinho(): void { this.router.navigate(['/carrinho']); }
}