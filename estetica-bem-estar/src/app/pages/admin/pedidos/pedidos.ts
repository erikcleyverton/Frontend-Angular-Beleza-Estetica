import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css']
})
export class PedidosComponent implements OnInit {
  public pedidos: any[] = [];
  public pedidosFiltrados: any[] = [];
  public filtroStatus: string = ''; // Inicia como "Todos" para exibir tudo
  public pedidoSelecionado: any = null;

  private readonly apiUrl = 'https://localhost:7077/api/Atendimento'; 

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (dados) => {
        console.log('Pedidos carregados:', dados);
        this.pedidos = dados;
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Erro ao buscar pedidos:', err);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroStatus) {
      this.pedidosFiltrados = [...this.pedidos];
    } else {
      this.pedidosFiltrados = this.pedidos.filter(p => {
        const st = p.statusAtendimento || p.status;
        return st === this.filtroStatus || (this.filtroStatus === 'A' && st === 'Aberto');
      });
    }
  }

  verDetalhes(idAtendimento: number): void {
    this.pedidoSelecionado = this.pedidos.find(p => (p.idAtendimento || p.idatendimento) === idAtendimento);
  }

  alterarStatus(idAtendimento: number, novoStatus: string): void {
    // Altera o status localmente e/ou faz o PUT na API
    const pedido = this.pedidos.find(p => (p.idAtendimento || p.idatendimento) === idAtendimento);
    if (pedido) {
      pedido.statusAtendimento = novoStatus;
      this.aplicarFiltro();
      alert(`Status do pedido #${idAtendimento} alterado para: ${novoStatus}`);
    }
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}