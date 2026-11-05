import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';

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
  public filtroStatus: string = '';
  public pedidoSelecionado: any = null;
  public mensagemSucesso: string = '';
  public enviando: boolean = false;
  
  private catalogoItens: ItemSistema[] = [];
  private readonly apiUrl = 'https://localhost:7077/api/Atendimento';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cadastroItensService: CadastroItensService
  ) {}

  ngOnInit(): void {
    this.carregarCatalogoItens();
    this.carregarPedidos();
  }

  carregarCatalogoItens(): void {
    this.cadastroItensService.obterItens().subscribe({
      next: (itens) => this.catalogoItens = itens || [],
      error: (err) => console.error('Erro ao carregar catálogo para cruzamento:', err)
    });
  }

  carregarPedidos(): void {
    this.http.get<any[]>(this.apiUrl).pipe(
      catchError(err => {
        console.warn('API de Atendimento indisponível. Mantendo estado local.', err);
        return of([]);
      })
    ).subscribe({
      next: (dados) => {
        this.pedidos = dados || [];
        this.aplicarFiltros();
      }
    });
  }

  aplicarFiltros(): void {
    if (!this.filtroStatus) {
      this.pedidosFiltrados = [...this.pedidos];
    } else {
      this.pedidosFiltrados = this.pedidos.filter(p => {
        const status = this.normalizarStatus(p.statusAtendimento || p.status || p.status_atendimento);
        const filtro = this.normalizarStatus(this.filtroStatus);
        return status === filtro;
      });
    }
  }

  // Alias para retrocompatibilidade no HTML
  aplicarFiltro(): void {
    this.aplicarFiltros();
  }

  /** RF14: Normalização abrangente de status do banco MySQL */
  normalizarStatus(status: string): string {
    if (!status) return 'Aberto';
    const st = status.toString().trim().toUpperCase();
    if (st === 'A' || st === 'ABERTO') return 'Aberto';
    if (st === 'P' || st === 'EM PROCESSAMENTO' || st === 'PROCESSAMENTO') return 'Em Processamento';
    if (st === 'C' || st === 'F' || st === 'FINALIZADO' || st === 'CONCLUIDO' || st === 'CONCLUÍDO') return 'Concluído';
    if (st === 'X' || st === 'CANCELADO') return 'Cancelado';
    return status;
  }

  /** Resolve o nome dinâmico do cliente sem fallbacks estáticos */
  obterNomeCliente(pedido: any): string {
    if (!pedido) return 'Cliente Não Identificado';

    const nome = pedido.nomeCliente || 
                 pedido.nomePessoa || 
                 pedido.cliente || 
                 pedido.nome_pessoa || 
                 pedido.pessoa?.nome;

    if (nome && typeof nome === 'string' && nome.trim() !== '') {
      return nome;
    }

    const idCliente = pedido.idPessoa || pedido.idCliente || pedido.id_pessoa;
    return idCliente ? `Cliente ID #${idCliente}` : 'Cliente Não Identificado';
  }

  /** Resolve o nome do produto/serviço cruzando com o catálogo por ID */
  obterNomeItem(item: any): string {
    if (!item) return 'Item não identificado';

    const nomeDireto = item.nomeItem || item.nome_item || item.itemNome || item.produto || item.servico || item.nome || item.item || item.descricao;
    if (nomeDireto && typeof nomeDireto === 'string' && nomeDireto.trim() !== '') {
      return nomeDireto;
    }

    const idProcurado = Number(item.idItem || item.id_item || item.id || item.codigo);
    if (idProcurado > 0) {
      const itemEncontrado = this.catalogoItens.find(i => Number(i.id || i.idItem) === idProcurado);
      if (itemEncontrado) {
        return itemEncontrado.nome || itemEncontrado.nomeItem || itemEncontrado.item || `Item #${idProcurado}`;
      }
    }

    return idProcurado > 0 ? `Item #${idProcurado}` : 'Item';
  }

  /** Recalcula o valor total dinamicamente a partir dos subtotais dos itens */
  calcularValorTotal(pedido: any): number {
    if (!pedido) return 0;
    const valorDireto = Number(pedido.valorTotal || pedido.valor_total || pedido.total || 0);
    if (valorDireto > 0) return valorDireto;

    const itens = pedido.itens || pedido.atendimentoItens || pedido.itensAtendimento || [];
    return itens.reduce((acc: number, item: any) => {
      const qtd = Number(item.quantidade || item.qtd || 1);
      const preco = Number(item.valorUnitario || item.preco || item.precoUnitario || item.valor || 0);
      return acc + (qtd * preco);
    }, 0);
  }

  /** RF13: Seleciona o pedido para exibir na janela Modal */
  verDetalhes(idAtendimento: number): void {
    const p = this.pedidos.find(
      item => Number(item.idAtendimento || item.idatendimento || item.id) === Number(idAtendimento)
    );
    if (p) {
      this.pedidoSelecionado = { ...p };
    }
  }

  fecharDetalhes(): void {
    this.pedidoSelecionado = null;
  }

  /** RF15: Atualização de status síncrona com sincronização em segundo plano */
  alterarStatus(idAtendimento: number, novoStatus: string): void {
    if (this.enviando) return;

    const id = Number(idAtendimento);
    this.enviando = true;

    this.confirmarAtualizacaoStatus(id, novoStatus);

    this.http.put(`${this.apiUrl}/${id}/status`, { statusAtendimento: novoStatus }).pipe(
      catchError(err => {
        console.warn('Backend indisponível. Status mantido localmente.', err);
        return of(null);
      })
    ).subscribe(() => {
      this.enviando = false;
    });
  }

  private confirmarAtualizacaoStatus(idAtendimento: number, novoStatus: string): void {
    const pedido = this.pedidos.find(
      p => Number(p.idAtendimento || p.idatendimento || p.id) === Number(idAtendimento)
    );

    if (pedido) {
      pedido.statusAtendimento = novoStatus;
      if (this.pedidoSelecionado) {
        this.pedidoSelecionado.statusAtendimento = novoStatus;
      }
      this.aplicarFiltros();
      this.mensagemSucesso = `Status do Pedido #${idAtendimento} alterado para: ${novoStatus}`;
      
      setTimeout(() => {
        this.mensagemSucesso = '';
        this.enviando = false;
      }, 1000);
    } else {
      this.enviando = false;
    }
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}