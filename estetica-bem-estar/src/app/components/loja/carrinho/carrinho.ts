import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarrinhoService, ItemCarrinho } from '../../../services/carrinho.service';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.css']
})
export class CarrinhoComponent implements OnInit {

  carregando = false;

  constructor(
    private router: Router,
    public carrinhoService: CarrinhoService
  ) { }

  ngOnInit(): void { }

  get itens(): ItemCarrinho[] {
    return this.carrinhoService.obterItens();
  }

  get total(): number {
    return this.carrinhoService.obterTotal();
  }

  aumentarQtd(id: number): void {
    this.carrinhoService.aumentarQtd(id);
  }

  diminuirQtd(id: number): void {
    this.carrinhoService.diminuirQtd(id);
  }

  removerItem(id: number): void {
    this.carrinhoService.removerItem(id);
  }

  finalizarAtendimento(): void {
    if (this.itens.length === 0) return;

    this.carregando = true;

    this.carrinhoService.finalizarAgendamentoAPI().subscribe({
      next: (resposta) => {
        this.carregando = false;
        alert('Atendimento registrado com sucesso no banco de dados!');
        this.carrinhoService.limparCarrinho();
        this.router.navigate(['/home']);
      },
      error: (erro) => {
        this.carregando = false;
        console.error('Erro na integração com a API Atendimento:', erro);
        alert('Erro ao ligar ao servidor. Verifique se o CORS e a API estão ativos.');
      }
    });
  }

  voltarAoCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}