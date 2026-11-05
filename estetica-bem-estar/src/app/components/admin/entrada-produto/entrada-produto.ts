import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

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
          item => item.tipo === 'produto' || item.tipoItem === 'P'
        );
      },
      error: (err: any) => console.error('Erro ao carregar produtos:', err)
    });
  }

  aoSelecionarProduto(): void {
    const id = Number(this.entrada.idItem);
    this.produtoSelecionado = this.produtosDisponiveis.find(p => Number(p.id || p.idItem) === id);

    if (this.produtoSelecionado) {
      this.entrada.valorUnitarioEntrada = Number(
        this.produtoSelecionado.preco || 
        this.produtoSelecionado.precoUnitario || 
        this.produtoSelecionado.valorUnitario || 
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

    // 1. Ativa a trava visual no botão
    this.enviando = true;

    const payload: EntradaProduto = {
      ...this.entrada,
      idItem: idItemNum,
      quantidadeEntrada: qtdNum,
      valorUnitarioEntrada: valorNum
    };

    // 2. Atualiza o estoque local no serviço centralizado (persistido via localStorage)
    this.cadastroItensService.atualizarEstoqueProduto(idItemNum, qtdNum);

    // 3. Atualiza a interface e limpa o formulário imediatamente
    this.historicoEntradas.unshift(payload);
    this.mensagemSucesso = 'Entrada de produto registrada e estoque atualizado com sucesso!';
    this.limparFormulario();
    this.enviando = false; // Liberado imediatamente!

    // 4. Envia para a API em segundo plano (sem travar a tela)
    this.entradaService.registrarEntrada(payload).subscribe({
      next: () => console.log('Sincronizado com o backend com sucesso!'),
      error: (err: any) => console.warn('Backend indisponível. Mantido no estoque local.', err)
    });
  }

  private finalizarSucesso(payload: EntradaProduto): void {
    this.historicoEntradas.unshift(payload);
    this.mensagemSucesso = 'Entrada de produto registrada e estoque atualizado com sucesso!';
    this.limparFormulario();
    this.enviando = false; // Desbloqueia o botão imediatamente
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