import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CarrinhoService, ItemCarrinho } from '../../../services/carrinho.service'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class CarrinhoComponent implements OnInit, OnDestroy {
  itens: ItemCarrinho[] = [];
  total: number = 0;
  carregando: boolean = false;
  private sub!: Subscription;

  constructor(
    private carrinhoService: CarrinhoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inscreve-se nas atualizações reativas do serviço
    this.sub = this.carrinhoService.itens$.subscribe(itens => {
      this.itens = itens;
      this.total = this.carrinhoService.obterTotal();
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  aumentarQtd(item: ItemCarrinho): void {
    this.carrinhoService.aumentarQtd(item.id);
  }

  diminuirQtd(item: ItemCarrinho): void {
    this.carrinhoService.diminuirQtd(item.id);
  }

  removerItem(item: ItemCarrinho): void {
    this.carrinhoService.removerItem(item.id);
  }

  finalizarAtendimento(): void {
    if (this.itens.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    this.carregando = true;

    this.carrinhoService.finalizarAgendamentoAPI(1).subscribe({
      next: (res: any) => {
        alert('Agendamento/Pedido realizado com sucesso!');
        this.carrinhoService.limparCarrinho();
        this.carregando = false;
        this.router.navigate(['/meus-pedidos']);
      },
      error: (err: any) => {
        this.carregando = false;
        console.error('Resposta de erro do backend (400):', err);

        let mensagem = 'Erro de validação no pedido.';
        if (err.error && err.error.errors) {
          mensagem = Object.entries(err.error.errors)
            .map(([campo, msgs]: [string, any]) => `${campo}: ${msgs.join(', ')}`)
            .join('\n');
        } else if (typeof err.error === 'string') {
          mensagem = err.error;
        }

        alert(`Falha no Agendamento (400):\n${mensagem}`);
      }
    });
  }

  voltarAoCatalogo(): void {
    this.router.navigate(['/home']);
  }
}