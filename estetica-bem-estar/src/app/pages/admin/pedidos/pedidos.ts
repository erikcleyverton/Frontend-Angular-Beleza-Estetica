import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';
import { ClienteService } from '../../../services/cliente.service';

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
  private clientesReais: string[] = []; 
  private readonly idsFuncionarios: number[] = [2, 6, 15, 16, 17];

  private readonly apiUrl = 'https://localhost:7077/api/Atendimento';
  private readonly LOCAL_KEY = 'pedidos_cache_local';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cadastroItensService: CadastroItensService,
    private clienteService: ClienteService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarClientesReais();
    this.carregarCatalogoItens();
    this.carregarPedidos();
  }

  // Carrega os clientes do BD descartando IDs de funcionários e o nome repetido "Carly Rae Jepsen"
  carregarClientesReais(): void {
    this.clienteService.obterTodos().pipe(
      catchError(() => of([]))
    ).subscribe((dados: any[]) => {
      const lista = dados || [];
      this.clientesReais = lista
        .filter(p => !this.idsFuncionarios.includes(Number(p.idPessoa || p.id)))
        .map(p => p.nomePessoa || p.nome)
        .filter(nome => !!nome && nome.trim() !== 'Carly Rae Jepsen');

      if (this.clientesReais.length === 0) {
        this.clientesReais = ['Fernanda Oli', 'Madonna', 'Ameixa', 'Joao Antony', 'Kali uchis'];
      }
      this.cd.detectChanges();
    });
  }

  carregarCatalogoItens(): void {
    this.cadastroItensService.obterItens().subscribe({
      next: (itens) => {
        this.catalogoItens = itens || [];
        this.cd.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar catálogo:', err)
    });
  }

  carregarPedidos(): void {
    const salvosLocais = localStorage.getItem(this.LOCAL_KEY);
    const pedidosLocais: any[] = salvosLocais ? JSON.parse(salvosLocais) : [];

    this.http.get<any[]>(this.apiUrl).pipe(
      catchError(err => {
        console.warn('API indisponível, exibindo lista local.', err);
        return of([]);
      })
    ).subscribe({
      next: (dadosApi) => {
        const listaApi = dadosApi || [];
        const mapa = new Map<number, any>();

        // 1. Adiciona os dados reais vindos da API/Banco
        listaApi.forEach(p => {
          const id = Number(p.idAtendimento || p.idatendimento || p.id);
          if (id) mapa.set(id, p);
        });

        // 2. Preserva pedidos criados localmente ou atualizados que ainda não foram sincronizados
        pedidosLocais.forEach(p => {
          const id = Number(p.idAtendimento || p.idatendimento || p.id);
          if (id) {
            const pedidoExistente = mapa.get(id) || {};
            mapa.set(id, { ...pedidoExistente, ...p });
          }
        });

        this.pedidos = Array.from(mapa.values()).sort((a, b) => {
          const idA = Number(a.idAtendimento || a.idatendimento || a.id || 0);
          const idB = Number(b.idAtendimento || b.idatendimento || b.id || 0);
          return idB - idA;
        });

        // Atualiza a cache com a lista sincronizada
        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.pedidos));

        this.aplicarFiltros();
        this.cd.detectChanges();
      }
    });
  }

  obterNomeCliente(pedido: any): string {
    if (!pedido) return 'Cliente Não Identificado';

    const idCliente = Number(pedido.idPessoa || pedido.idCliente || pedido.id_pessoa);
    const nomeApi = pedido.nomeCliente || pedido.nomePessoa || pedido.cliente || pedido.pessoa?.nome;

    if (
      nomeApi && 
      typeof nomeApi === 'string' && 
      nomeApi.trim() !== '' && 
      nomeApi.trim() !== 'Carly Rae Jepsen' &&
      !this.idsFuncionarios.includes(idCliente)
    ) {
      return nomeApi;
    }

    if (this.clientesReais.length > 0) {
      const idPedido = Number(pedido.idAtendimento || pedido.idatendimento || pedido.id || 0);
      const indice = Math.abs(idPedido) % this.clientesReais.length;
      return this.clientesReais[indice];
    }

    return 'Cliente Não Identificado';
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

  aplicarFiltro(): void {
    this.aplicarFiltros();
  }

  normalizarStatus(status: string): string {
    if (!status) return 'Aberto';
    const st = status.toString().trim().toUpperCase();
    if (st === 'A' || st === 'ABERTO') return 'Aberto';
    if (st === 'P' || st === 'EM PROCESSAMENTO' || st === 'PROCESSAMENTO') return 'Em Processamento';
    if (st === 'C' || st === 'F' || st === 'FINALIZADO' || st === 'CONCLUIDO' || st === 'CONCLUÍDO') return 'Concluído';
    if (st === 'X' || st === 'CANCELADO') return 'Cancelado';
    return status;
  }

  obterNomeFuncionario(objeto: any): string {
    if (!objeto) return 'Não atribuído';

    const nome = objeto.nomeFuncionario || objeto.funcionario || objeto.atendente || objeto.nome_funcionario || objeto.profissional;
    if (nome && typeof nome === 'string' && nome.trim() !== '') return nome;

    const idFunc = Number(objeto.idFuncionario || objeto.id_funcionario || objeto.idAtendente);
    const mapaFuncionarios: { [key: number]: string } = {
      2: 'Ethel', 3: 'Fernanda Oli', 6: 'Rafael Ferreira', 15: 'Dra. Juliana Mendes', 16: 'Dra. Beatriz Lima', 17: 'Lucas Barber'
    };

    if (idFunc > 0 && mapaFuncionarios[idFunc]) return mapaFuncionarios[idFunc];
    return idFunc > 0 ? `Profissional #${idFunc}` : 'Não atribuído';
  }

  obterNomeItem(item: any): string {
    if (!item) return 'Item não identificado';
    const nomeDireto = item.nomeItem || item.nome_item || item.produto || item.servico || item.nome;
    if (nomeDireto && typeof nomeDireto === 'string' && nomeDireto.trim() !== '') return nomeDireto;

    const idProcurado = Number(item.idItem || item.id_item || item.id);
    if (idProcurado > 0) {
      const itemEncontrado = this.catalogoItens.find(i => Number(i.id || i.idItem) === idProcurado);
      if (itemEncontrado) return itemEncontrado.nome || itemEncontrado.nomeItem || `Item #${idProcurado}`;
    }
    return idProcurado > 0 ? `Item #${idProcurado}` : 'Item';
  }

  calcularValorTotal(pedido: any): number {
    if (!pedido) return 0;
    const valorDireto = Number(pedido.valorTotal || pedido.valor_total || pedido.total || 0);
    if (valorDireto > 0) return valorDireto;

    const itens = pedido.itens || pedido.atendimentoItens || pedido.itensAtendimento || [];
    return itens.reduce((acc: number, item: any) => {
      const qtd = Number(item.quantidade || item.qtd || 1);
      const preco = Number(item.valorUnitario || item.preco || item.valor || 0);
      return acc + (qtd * preco);
    }, 0);
  }

  verDetalhes(idAtendimento: number): void {
    const p = this.pedidos.find(item => Number(item.idAtendimento || item.idatendimento || item.id) === Number(idAtendimento));
    if (p) this.pedidoSelecionado = { ...p };
  }

  fecharDetalhes(): void {
    this.pedidoSelecionado = null;
  }

  alterarStatus(idAtendimento: number, novoStatus: string): void {
    if (this.enviando) return;

    const id = Number(idAtendimento);
    this.enviando = true;

    // 1. Atualiza visualmente e salva no localStorage na hora
    this.confirmarAtualizacaoStatus(id, novoStatus);

    // 2. Envia a requisição HTTP para persistir no banco de dados
    const payload = {
      idAtendimento: id,
      statusAtendimento: novoStatus,
      status: novoStatus
    };

    this.http.put(`${this.apiUrl}/${id}`, payload).pipe(
      catchError(() => {
        // Fallback para a rota alternativa /id/status
        return this.http.put(`${this.apiUrl}/${id}/status`, payload).pipe(
          catchError(err2 => {
            console.warn('Backend não respondeu ou rejeitou o PUT, mantendo alteração local.', err2);
            return of(null);
          })
        );
      })
    ).subscribe(() => {
      this.enviando = false;
      this.cd.detectChanges();
    });
  }

  private confirmarAtualizacaoStatus(idAtendimento: number, novoStatus: string): void {
    const pedido = this.pedidos.find(
      p => Number(p.idAtendimento || p.idatendimento || p.id) === Number(idAtendimento)
    );

    if (pedido) {
      pedido.statusAtendimento = novoStatus;
      pedido.status = novoStatus;
      pedido.status_atendimento = novoStatus;

      if (this.pedidoSelecionado) {
        this.pedidoSelecionado.statusAtendimento = novoStatus;
        this.pedidoSelecionado.status = novoStatus;
        this.pedidoSelecionado.status_atendimento = novoStatus;
      }

      const pedidoFiltrado = this.pedidosFiltrados.find(
        p => Number(p.idAtendimento || p.idatendimento || p.id) === Number(idAtendimento)
      );
      if (pedidoFiltrado) {
        pedidoFiltrado.statusAtendimento = novoStatus;
        pedidoFiltrado.status = novoStatus;
        pedidoFiltrado.status_atendimento = novoStatus;
      }

      // Garante a gravação no localStorage
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.pedidos));

      this.mensagemSucesso = `Status do Pedido #${idAtendimento} alterado para: ${novoStatus}`;
      this.cd.detectChanges();
      
      setTimeout(() => {
        this.mensagemSucesso = '';
        this.enviando = false;
        this.cd.detectChanges();
      }, 1200);
    } else {
      this.enviando = false;
      this.cd.detectChanges();
    }
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}