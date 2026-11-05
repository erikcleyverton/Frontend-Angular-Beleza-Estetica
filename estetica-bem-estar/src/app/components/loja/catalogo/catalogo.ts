import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarrinhoService } from '../../../services/carrinho.service';
import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';

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

  produtosFixos: ItemSistema[] = [];
  produtosFiltrados: ItemSistema[] = [];
  private subItens?: Subscription;

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService,
    private cadastroItensService: CadastroItensService
  ) {}

  ngOnInit(): void {
    // Inscreve-se no serviço centralizado para receber produtos e serviços
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.produtosFixos = itens || [];
        this.filtrarProdutos();
      },
      error: (err: any) => {
        console.error('Erro ao carregar catálogo:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
  }

  filtrarProdutos(): void {
    const busca = this.termoBusca.toLowerCase().trim();

    this.produtosFiltrados = this.produtosFixos.filter(prod => {
      const nomeOuId = (prod.nome || prod.nomeItem || prod.item || '').toLowerCase();
      const idStr = (prod.id || prod.idItem || '').toString();
      
      const tipoNormalizado = prod.tipo === 'servico' || prod.tipoItem === 'S' ? 'servico' : 'produto';

      const atendeTexto = !busca || nomeOuId.includes(busca) || idStr.includes(busca);
      const atendeTipo = this.filtroTipo === 'todos' || tipoNormalizado === this.filtroTipo;

      return atendeTexto && atendeTipo;
    });
  }

  setFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.filtrarProdutos();
  }

  limparFiltro(): void {
    this.termoBusca = '';
    this.filtroTipo = 'todos';
    this.filtrarProdutos();
  }

  abrirDetalhes(id: any): void {
    console.log('Detalhes do item ID:', id);
  }

  adicionarAoCarrinho(produto: ItemSistema): void {
    const nome = produto.nome || produto.nomeItem || produto.item || 'Item';
    const preco = Number(produto.precoUnitario || produto.preco || produto.valorUnitario || 0);

    this.carrinhoService.adicionarItem({
      id: Number(produto.id || produto.idItem),
      nome: nome,
      precoUnitario: preco,
      categoria: produto.categoria || 'Geral',
      imagem: produto.imagem || 'assets/placeholder.jpg'
    });

    alert(`${nome} foi adicionado ao carrinho!`);
  }

  voltar(): void { this.router.navigate(['/home']); }
  irParaCadastro(): void { this.router.navigate(['/cliente']); }
  irParaCarrinho(): void { this.router.navigate(['/carrinho']); }
}