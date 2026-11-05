import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';
import { EntradaProdutoService } from '../../../services/entrada.service';

export interface ItemEstoque {
  id: number;
  produto: string;
  qtdAtual: number;
  unidade: string;
  precoVenda: number;
  situacao: string;
  tipo: string;
}

@Component({
  selector: 'app-consulta-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.html',
  styleUrl: './estoque.css'
})
export class ConsultaEstoqueComponent implements OnInit, OnDestroy {
  termoBusca: string = '';
  
  listaCompletaEstoque: ItemEstoque[] = [];
  itensFiltrados: ItemEstoque[] = [];

  private subItens?: Subscription;

  constructor(
    private router: Router,
    private cadastroItensService: CadastroItensService,
    private entradaService: EntradaProdutoService
  ) {}

  ngOnInit(): void {
    this.carregarEstoque();
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
  }

  carregarEstoque(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        // 1. Filtra APENAS produtos (ignora procedimentos/serviços)
        const apenasProdutos = itens.filter(
          item => item.tipo === 'produto' || item.tipoItem === 'P'
        );

        // 2. Mapeia garantindo fallbacks com tipo numérico e string estritos (evita undefined)
        this.listaCompletaEstoque = apenasProdutos.map(prod => {
          const idValido: number = Number(prod.id || prod.idItem || 0);
          const nomeValido: string = prod.nome || prod.nomeItem || prod.item || 'Produto sem Nome';
          const quantidadeValida: number = Number(prod.quantidade || 0);
          const precoValido: number = Number(prod.preco || prod.precoUnitario || prod.valorUnitario || 0);
          const tipoValido: string = prod.tipo || (prod.tipoItem === 'P' ? 'produto' : 'servico');

          return {
            id: idValido,
            produto: nomeValido,
            qtdAtual: quantidadeValida,
            unidade: 'UN',
            precoVenda: precoValido,
            situacao: quantidadeValida > 0 ? 'Em Estoque' : 'Sem Estoque',
            tipo: tipoValido
          };
        });

        this.filtrarProdutos();
      },
      error: (err: any) => console.error('Erro ao carregar estoque:', err)
    });
  }

  filtrarProdutos(): void {
    const busca = this.termoBusca.toLowerCase().trim();

    if (!busca) {
      this.itensFiltrados = [...this.listaCompletaEstoque];
      return;
    }

    this.itensFiltrados = this.listaCompletaEstoque.filter(item => {
      const nomeMatch = item.produto.toLowerCase().includes(busca);
      const idMatch = item.id.toString().includes(busca);
      return nomeMatch || idMatch;
    });
  }

  limparFiltro(): void {
    this.termoBusca = '';
    this.filtrarProdutos();
  }

  voltarMenu(): void {
    this.router.navigate(['/catalogo']);
  }
}