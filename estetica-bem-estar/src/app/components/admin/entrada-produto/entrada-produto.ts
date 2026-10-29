import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 1. Importar o Router
import { EntradaProdutoService, EntradaProduto } from '../../../services/entrada.service';

@Component({
  selector: 'app-entrada-produto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrada-produto.html',
  styleUrl: './entrada-produto.css'
})
export class EntradaProdutoComponent implements OnInit {

  idEntradaProduto = 0;
  idItem = 0;
  quantidadeEntrada = 1;
  valorUnitarioEntrada = 0;
  dataEntradaProduto = new Date().toISOString().split('T')[0];
  unidade = 'UN';

  produtos: any[] = [];
  historicoEntradas: EntradaProduto[] = [];

  constructor(
    private entradaService: EntradaProdutoService,
    private router: Router // 2. Injetar o Router
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.carregarHistorico();
  }

  // CORRIGIDO: Aceita todos os itens trazidos da tabela 'item' do MySQL
  carregarProdutos(): void {
    this.entradaService.obterProdutos().subscribe({
      next: (dados: any[]) => {
        console.log('Produtos vindos do Backend:', dados);
        // Guarda todos os itens para garantir que os Monitores aparecem
        this.produtos = dados;
      },
      error: (err: any) => console.error('Erro ao carregar produtos:', err)
    });
  }

  carregarHistorico(): void {
    this.entradaService.obterHistoricoEntradas().subscribe({
      next: (dados: EntradaProduto[]) => this.historicoEntradas = dados,
      error: (err: any) => console.error('Erro ao carregar histórico:', err)
    });
  }

  salvarEntrada(): void {
    if (this.idItem <= 0 || this.quantidadeEntrada <= 0 || this.valorUnitarioEntrada <= 0) {
      alert('Preencha todos os campos corretamente!');
      return;
    }

    const novaEntrada: EntradaProduto = {
      idItem: Number(this.idItem),
      quantidadeEntrada: Number(this.quantidadeEntrada),
      valorUnitarioEntrada: Number(this.valorUnitarioEntrada),
      dataEntradaProduto: this.dataEntradaProduto,
      unidade: this.unidade
    };

    this.entradaService.registrarEntrada(novaEntrada).subscribe({
      next: () => {
        alert('Entrada registrada com sucesso!');
        this.limparFormulario();
        this.carregarHistorico();
      },
      error: (err: any) => {
        console.error('Erro ao salvar entrada:', err);
        alert('Erro ao registrar entrada de produto.');
      }
    });
  }

  limparFormulario(): void {
    this.idItem = 0;
    this.quantidadeEntrada = 1;
    this.valorUnitarioEntrada = 0;
    this.dataEntradaProduto = new Date().toISOString().split('T')[0];
    this.unidade = 'UN';
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}