import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { EntradaProdutoService, EntradaProduto } from '../../../services/entrada.service';
import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';

@Component({
  selector: 'app-entrada-produto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrada-produto.html',
  styleUrl: './entrada-produto.css'
})
export class EntradaProdutoComponent implements OnInit, OnDestroy {
  produtosDisponiveis: ItemSistema[] = [];
  historicoEntradas: EntradaProduto[] = [];
  produtoSelecionado?: ItemSistema;

  enviando: boolean = false;

  entrada: EntradaProduto = {
    idItem: 0,
    dataEntradaProduto: new Date().toISOString().split('T')[0],
    quantidadeEntrada: 1,
    unidade: 'UN',
    valorUnitarioEntrada: 0
  };

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  private subItens?: Subscription;

  constructor(
    private router: Router,
    private entradaService: EntradaProdutoService,
    private cadastroItensService: CadastroItensService
  ) {}

  ngOnInit(): void {
    this.carregarApenasProdutos();
    this.carregarHistorico();
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
  }

  carregarApenasProdutos(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.produtosDisponiveis = itens.filter(
          item => item.tipo === 'produto' || (item as any).tipoItem === 'P'
        );
      },
      error: (err: any) => console.error('Erro ao carregar produtos:', err)
    });
  }

  aoSelecionarProduto(): void {
    const id = Number(this.entrada.idItem);
    this.produtoSelecionado = this.produtosDisponiveis.find(
      p => Number((p as any).id || p.idItem || (p as any).iditem) === id
    );

    if (this.produtoSelecionado) {
      const prod = this.produtoSelecionado as any;
      this.entrada.valorUnitarioEntrada = Number(
        prod.preco || 
        prod.precoUnitario || 
        prod.preco_venda || 
        prod.precoVenda || 
        0
      );
    }
  }

  carregarHistorico(): void {
    this.entradaService.obterHistoricoEntradas().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (historico: EntradaProduto[]) => {
        this.historicoEntradas = historico || [];
      }
    });
  }

  registrarEntrada(): void {
    if (this.enviando) return;

    this.mensagemSucesso = '';
    this.mensagemErro = '';

    const idItemNum = Number(this.entrada.idItem);
    const qtdNum = Number(this.entrada.quantidadeEntrada);
    const valorNum = Number(this.entrada.valorUnitarioEntrada);

    if (!idItemNum || idItemNum === 0) {
      this.mensagemErro = 'Por favor, selecione um produto válido.';
      return;
    }
    if (!qtdNum || qtdNum <= 0) {
      this.mensagemErro = 'A quantidade deve ser maior que zero.';
      return;
    }
    if (!valorNum || valorNum <= 0) {
      this.mensagemErro = 'O valor unitário deve ser maior que zero.';
      return;
    }

    this.enviando = true;

    const payload: EntradaProduto = {
      ...this.entrada,
      idItem: idItemNum,
      quantidadeEntrada: qtdNum,
      valorUnitarioEntrada: valorNum
    };

    // 1. Atualiza o estoque local no serviço
    this.cadastroItensService.atualizarEstoqueProduto(idItemNum, qtdNum, valorNum);

    // 2. Atualiza a lista em memória do componente usando cast seguro
    const itemNaLista = this.produtosDisponiveis.find(
      p => Number((p as any).id || p.idItem || (p as any).iditem) === idItemNum
    );
    if (itemNaLista) {
      const prod = itemNaLista as any;
      prod.preco = valorNum;
      prod.precoUnitario = valorNum;
      prod.preco_venda = valorNum;
      prod.precoVenda = valorNum;
    }

    // 3. Atualiza histórico na tela e limpa formulário
    this.historicoEntradas.unshift(payload);
    this.mensagemSucesso = 'Entrada de produto registrada e estoque/preço atualizados!';
    this.limparFormulario();
    this.enviando = false;

    // 4. Envia para a API em segundo plano
    this.entradaService.registrarEntrada(payload).subscribe({
      next: () => console.log('Sincronizado com o backend com sucesso!'),
      error: (err: any) => console.warn('Backend indisponível. Mantido no estoque local.', err)
    });
  }

  limparFormulario(): void {
    this.produtoSelecionado = undefined;
    this.entrada = {
      idItem: 0,
      dataEntradaProduto: new Date().toISOString().split('T')[0],
      quantidadeEntrada: 1,
      unidade: 'UN',
      valorUnitarioEntrada: 0
    };
  }

  voltar(): void {
    this.router.navigate(['/catalogo']);
  }
}