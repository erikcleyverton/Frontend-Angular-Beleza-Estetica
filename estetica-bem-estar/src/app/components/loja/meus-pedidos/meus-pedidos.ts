import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MeusPedidosService, PedidoCliente, ItemPedidoCliente } from '../../../services/meus.pedidos.service';

@Component({
  selector: 'app-meus-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.css'
})
export class MeusPedidosComponent implements OnInit {
  pedidos: PedidoCliente[] = [];
  pedidosFiltrados: PedidoCliente[] = [];
  pedidoExpandidoId: number | null = null;

  carregando: boolean = false;
  mensagemErro: string = '';
  mensagemSucesso: string = '';

  filtroStatus: string = 'TODOS';
  idClienteLogado: number | null = null;
  nomeClienteLogado: string = '';

  // Cliente fixa para demonstração: Carly Rae Jepsen
  private readonly CLIENTE_PADRAO_NOME = 'Carly';

  constructor(
    private pedidosService: MeusPedidosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarClienteCarly();
  }

  private inicializarClienteCarly(): void {
    this.carregando = true;
    this.pedidosService.obterClientes().subscribe({
      next: (clientes: any[]) => {
        const encontrada = (clientes || []).find(
          c => (c.nome || '').toLowerCase().includes(this.CLIENTE_PADRAO_NOME.toLowerCase())
        );

        if (encontrada) {
          this.idClienteLogado = Number(encontrada.idpessoa || encontrada.idPessoa);
          this.nomeClienteLogado = encontrada.nome;
          localStorage.setItem('idPessoa', String(this.idClienteLogado));
          localStorage.setItem('nomeCliente', this.nomeClienteLogado);
        }

        this.carregarPedidos();
      },
      error: () => {
        this.carregando = false;
        this.mensagemErro = 'Erro ao localizar o cadastro da cliente Carly.';
        this.cdr.detectChanges();
      }
    });
  }

  carregarPedidos(): void {
    if (!this.idClienteLogado) {
      this.carregando = false;
      this.pedidos = [];
      this.pedidosFiltrados = [];
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    this.pedidosService.obterPedidosPorCliente(this.idClienteLogado).pipe(
      finalize(() => {
        this.carregando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (dados: PedidoCliente[]) => {
        this.pedidos = (dados || []).sort((a, b) => b.idAtendimento - a.idAtendimento);
        if (this.pedidos.length > 0 && !this.nomeClienteLogado) {
          this.nomeClienteLogado = this.pedidos[0].nomePessoa;
        }
        this.aplicarFiltro();
        if (this.pedidosFiltrados.length > 0 && this.pedidoExpandidoId === null) {
          this.pedidoExpandidoId = this.pedidosFiltrados[0].idAtendimento;
        }
      },
      error: (err: any) => {
        console.error('Erro ao buscar pedidos:', err);
        this.mensagemErro = 'Não foi possível carregar seus pedidos no momento.';
      }
    });
  }

  aplicarFiltro(): void {
    if (this.filtroStatus === 'TODOS') {
      this.pedidosFiltrados = [...this.pedidos];
    } else {
      this.pedidosFiltrados = this.pedidos.filter(p => {
        const st = this.formatarStatus(p.statusAtendimento).toUpperCase();
        return st.includes(this.filtroStatus);
      });
    }
    this.cdr.detectChanges();
  }

  formatarStatus(status: string): string {
    const st = (status || '').trim().toUpperCase();
    if (st === 'A' || st === 'ABERTO') return 'ABERTO';
    if (st === 'C' || st === 'CANCELADO') return 'CANCELADO';
    if (st === 'F' || st === 'CONCLUIDO' || st === 'CONCLUÍDO') return 'CONCLUÍDO';
    return status || 'ABERTO';
  }

  alternarDetalhes(idAtendimento: number): void {
    this.pedidoExpandidoId = this.pedidoExpandidoId === idAtendimento ? null : idAtendimento;
  }

  calcularTotalPedido(pedido: PedidoCliente): number {
    if (!pedido.itens || pedido.itens.length === 0) return 0;
    return pedido.itens.reduce(
      (soma: number, item: ItemPedidoCliente) => soma + (item.quantidade * item.valorUnitario),
      0
    );
  }

  podeCancelar(status: string): boolean {
    const st = this.formatarStatus(status);
    return st === 'ABERTO' || st === 'PENDENTE' || st === 'AGENDADO' || st === 'EM ANDAMENTO';
  }

  cancelarPedido(pedido: PedidoCliente, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Deseja realmente cancelar o pedido #${pedido.idAtendimento}?`)) return;

    this.pedidosService.cancelarPedido(pedido).subscribe({
      next: () => {
        pedido.statusAtendimento = 'C';
        this.mensagemSucesso = `Pedido #${pedido.idAtendimento} cancelado com sucesso.`;
        this.mensagemErro = '';
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Erro detalhado ao cancelar:', err);
        this.mensagemErro = 'Erro ao tentar cancelar o pedido. Verifique se a API está rodando.';
        this.cdr.detectChanges();
      }
    });
  }

  obterClasseStatus(status: string): string {
    const st = this.formatarStatus(status);
    if (st.includes('CONCLU') || st.includes('FINALIZ') || st.includes('PAGO')) return 'badge-sucesso';
    if (st.includes('CANCEL')) return 'badge-cancelado';
    return 'badge-pendente';
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  irParaCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}