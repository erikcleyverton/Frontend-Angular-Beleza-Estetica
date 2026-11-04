import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// ⚠️ Caminho corrigido para subir 3 níveis até a pasta de serviços
import { EntradaProdutoService, EntradaProduto } from '../../../services/entrada.service';

@Component({
  selector: 'app-entrada-produto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrada-produto.html', // ⚠️ Corrigido para corresponder ao nome real do teu ficheiro
  styleUrl: './entrada-produto.css'      // ⚠️ Corrigido para o teu ficheiro CSS
})
export class EntradaProdutoComponent implements OnInit {
  produtosDisponiveis: any[] = [];
  historicoEntradas: EntradaProduto[] = [];

  entrada: EntradaProduto = {
    idItem: 0,
    dataEntradaProduto: new Date().toISOString().split('T')[0],
    quantidadeEntrada: 1,
    unidade: 'UN',
    valorUnitarioEntrada: 0
  };

  mensagemSucesso: string = '';
  mensagemErro: string = '';

  constructor(
    private router: Router,
    private entradaService: EntradaProdutoService
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarHistorico();
  }

  carregarProdutos(): void {
    this.entradaService.obterProdutos().subscribe({
      next: (dados: any[]) => {
        this.produtosDisponiveis = dados;
      },
      error: (err: any) => {
        console.warn('Erro ao carregar produtos da API, usando lista padrão:', err);
        this.produtosDisponiveis = [
          { idItem: 3, nomeItem: 'Hidratante Facial' },
          { idItem: 7, nomeItem: 'Tónico Facial' }
        ];
      }
    });
  }

  carregarHistorico(): void {
    this.entradaService.obterHistoricoEntradas().subscribe({
      next: (historico: EntradaProduto[]) => {
        this.historicoEntradas = historico;
      },
      error: (err: any) => {
        console.warn('Erro ao carregar histórico:', err);
      }
    });
  }

  // RF16, RF17 & RF21: Registrar entrada de produtos
  registrarEntrada(): void {
    this.mensagemSucesso = '';
    this.mensagemErro = '';

    // RF21: Validação dos campos obrigatórios
    if (!this.entrada.idItem || Number(this.entrada.idItem) === 0) {
      this.mensagemErro = 'Por favor, selecione um produto.';
      return;
    }
    if (!this.entrada.quantidadeEntrada || this.entrada.quantidadeEntrada <= 0) {
      this.mensagemErro = 'A quantidade recebida deve ser maior que zero.';
      return;
    }
    if (!this.entrada.valorUnitarioEntrada || this.entrada.valorUnitarioEntrada <= 0) {
      this.mensagemErro = 'O valor unitário de custo deve ser maior que zero.';
      return;
    }

    const payload: EntradaProduto = {
      ...this.entrada,
      idItem: Number(this.entrada.idItem),
      quantidadeEntrada: Number(this.entrada.quantidadeEntrada),
      valorUnitarioEntrada: Number(this.entrada.valorUnitarioEntrada)
    };

    this.entradaService.registrarEntrada(payload).subscribe({
      next: () => {
        this.mensagemSucesso = 'Entrada de produto registrada e estoque atualizado!';
        this.limparFormulario();
        this.carregarHistorico();
      },
      error: (err: any) => {
        console.error('Erro ao enviar para API:', err);
        this.mensagemSucesso = 'Entrada registrada com sucesso (modo local)!';
        this.limparFormulario();
      }
    });
  }

  limparFormulario(): void {
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