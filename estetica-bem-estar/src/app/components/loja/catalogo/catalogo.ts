import { Component, OnInit, OnDestroy } from '@angular/core';
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

  // As categorias agora começam vazias e são preenchidas dinamicamente pela API
  categorias: CategoriaLocal[] = [];

  private subItens?: Subscription;
  private subCategorias?: Subscription;

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService,
    private cadastroItensService: CadastroItensService,
    private categoriaService: CategoriaService
  ) {}

  ngOnInit(): void {
    // 1. Carrega os itens do catálogo
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.produtosFixos = itens || [];
        this.filtrarProdutos();
      },
      error: (err: any) => {
        console.error('Erro ao carregar catálogo:', err);
      }
    });

    // 2. Carrega as categorias do banco via CategoriaService
    this.carregarCategoriasBD();
  }

  carregarCategoriasBD(): void {
    this.subCategorias = this.categoriaService.obterTodas().subscribe({
      next: (dados: any[]) => {
        const lista = dados || [];
        // Mapeia os dados da API para o formato esperado pelo HTML
        this.categorias = lista.map((c: any) => ({
          idCategoria: Number(c.idCategoria || c.id),
          categoria: c.nomeCategoria || c.nome || c.categoria || 'Sem nome'
        }));
      },
      error: (err: any) => {
        console.error('Erro ao carregar categorias dinâmicas no catálogo:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
    this.subCategorias?.unsubscribe();
  }

  obterTipoNormalizado(prod: any): 'servico' | 'produto' {
    if (!prod) return 'produto';
    const t = String(prod.tipo || prod.tipoItem || prod.tipo_item || '').toLowerCase();
    return (t === 's' || t === 'servico' || t === 'serviço') ? 'servico' : 'produto';
  }

  filtrarProdutos(): void {
    const busca = this.termoBusca.toLowerCase().trim();

    this.produtosFiltrados = this.produtosFixos.filter(prod => {
      const pAny = prod as any;
      const nomeOuId = (prod.nome || prod.nomeItem || pAny.item || '').toLowerCase();
      const idStr = (prod.id || prod.idItem || pAny.iditem || '').toString();
      
      const tipoNormalizado = this.obterTipoNormalizado(prod);
      const idCatItem = Number(pAny.idCategoria || pAny.idcategoria || prod.categoria);

      const atendeTexto = !busca || nomeOuId.includes(busca) || idStr.includes(busca);
      const atendeTipo = this.filtroTipo === 'todos' || tipoNormalizado === this.filtroTipo;
      const atendeCategoria = this.categoriaSelecionada === 'TODAS' || idCatItem === Number(this.categoriaSelecionada);

      return atendeTexto && atendeTipo && atendeCategoria;
    });
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
    const nome = pAny.item || produto.nome || produto.nomeItem || 'Item';
    const preco = Number(produto.precoUnitario || produto.preco || pAny.valorUnitario || 0);
    const idValido = Number(produto.id || produto.idItem || pAny.iditem);
    const tipoNormalizado = this.obterTipoNormalizado(produto);

    this.carrinhoService.adicionarItem({
      id: idValido,
      nome: nome,
      precoUnitario: preco,
      tipo: tipoNormalizado,
      tipoItem: tipoNormalizado === 'servico' ? 'S' : 'P',
      categoria: produto.categoria || 'Geral',
      imagem: produto.imagem || 'assets/placeholder.jpg'
    });

    alert(`"${nome}" foi adicionado ao carrinho!`);
  }

  voltar(): void { this.router.navigate(['/home']); }
  irParaCadastro(): void { this.router.navigate(['/cliente']); }
  irParaCarrinho(): void { this.router.navigate(['/carrinho']); }
}