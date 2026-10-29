import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PedidoService, Pedido } from '../../../services/pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  pedidoSelecionado: Pedido | null = null;
  filtroStatus: string = 'Aberto';

  constructor(
    private pedidoService: PedidoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.pedidoService.obterPedidos(this.filtroStatus).subscribe({
      next: (dados) => {
        this.pedidos = dados;
        this.pedidoSelecionado = null;
      },
      error: (err) => console.error('Erro ao carregar pedidos:', err)
    });
  }

  verDetalhes(id: number): void {
    this.pedidoService.obterPedidoPorId(id).subscribe({
      next: (dados) => {
        this.pedidoSelecionado = dados;
      },
      error: (err) => console.error('Erro ao obter detalhes do pedido:', err)
    });
  }

  alterarStatus(id: number, novoStatus: string): void {
    if (!confirm(`Deseja alterar o status do pedido para "${novoStatus}"?`)) return;

    this.pedidoService.atualizarStatus(id, novoStatus).subscribe({
      next: () => {
        alert('Status atualizado com sucesso!');
        this.carregarPedidos();
      },
      error: (err) => {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao alterar status do pedido.');
      }
    });
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}