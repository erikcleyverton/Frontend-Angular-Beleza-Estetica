import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
    private cadastroItensService: CadastroItensService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarApenasProdutos();
    this.carregarHistorico();
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
  }

  /**
   * Converte valores numéricos mesmo se digitados com vírgula (ex: "145,50" -> 145.5)
   */
  private converterParaNumero(valor: any): number {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
    const limpo = String(valor).replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(limpo);
    return isNaN(num) ? 0 : num;
  }

  carregarApenasProdutos(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.produtosDisponiveis = (itens || []).filter(
          item => item.tipo === 'produto' || (item as any).tipoItem === 'P'
        );
        this.cdr.detectChanges();
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
      // Preenche apenas como sugestão inicial ao trocar de produto
      this.entrada.valorUnitarioEntrada = this.converterParaNumero(
        prod.preco ?? prod.precoUnitario ?? prod.preco_venda ?? prod.precoVenda ?? 0
      );
      this.entrada.unidade = prod.unidade || 'UN';
    }
  }

  carregarHistorico(): void {
    this.entradaService.obterHistoricoEntradas().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (historico: EntradaProduto[]) => {
        this.historicoEntradas = [...(historico || [])].reverse();
        this.cdr.detectChanges();
      }
    });
  }

  registrarEntrada(): void {
    if (this.enviando) return;

    this.mensagemSucesso = '';
    this.mensagemErro = '';

    const idItemNum = Number(this.entrada.idItem);
    const qtdNum = this.converterParaNumero(this.entrada.quantidadeEntrada);
    const valorNum = this.converterParaNumero(this.entrada.valorUnitarioEntrada);

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
    this.cdr.detectChanges();

    const payload: EntradaProduto = {
      idItem: idItemNum,
      dataEntradaProduto: this.entrada.dataEntradaProduto,
      quantidadeEntrada: qtdNum,
      unidade: this.entrada.unidade || 'UN',
      valorUnitarioEntrada: valorNum
    };

    this.entradaService.registrarEntrada(payload).pipe(
      finalize(() => {
        this.enviando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.historicoEntradas = [payload, ...this.historicoEntradas];
        this.mensagemSucesso = 'Entrada de produto gravada com sucesso!';
        this.limparFormulario();
        this.cdr.detectChanges();

        this.carregarHistorico();
        this.carregarApenasProdutos();
      },
      error: (err: any) => {
        console.error('Erro detalhado do backend:', err);
        const msg = err?.error?.erro || err?.error?.mensagem || 'Falha ao gravar no banco de dados.';
        this.mensagemErro = msg;
      }
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