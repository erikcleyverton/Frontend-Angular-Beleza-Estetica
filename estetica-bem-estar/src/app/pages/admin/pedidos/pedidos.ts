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
  private mapaClientes: Map<number, string> = new Map<number, string>();

  private readonly apiUrl = 'https://localhost:7077/api/Atendimento';
  private readonly LOCAL_KEY = 'pedidos_cache_local';
  private readonly DELETADOS_KEY = 'pedidos_deletados_ids';

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

  carregarClientesReais(): void {
    this.clienteService.obterTodos().pipe(
      catchError(() => of([] as any[]))
    ).subscribe((dados: any[]) => {
      this.mapaClientes.clear();
      (dados || []).forEach((p: any) => {
        const id = Number(p.idPessoa || p.idpessoa || p.id);
        const nome = p.nomePessoa || p.nome;
        if (id > 0 && nome) {
          this.mapaClientes.set(id, nome.trim());
        }
      });
      this.cd.detectChanges();
    });
  }

  carregarCatalogoItens(): void {
    this.cadastroItensService.obterItens().subscribe({
      next: (itens: ItemSistema[]) => {
        this.catalogoItens = itens || [];
        this.cd.detectChanges();
      },
      error: (err: any) => console.error('Erro ao carregar catálogo:', err)
    });
  }

  carregarPedidos(): void {
    const deletados = this.obterIdsDeletados();

    this.http.get<any[]>(this.apiUrl).pipe(
      catchError((err: any) => {
        console.warn('API indisponível, exibindo lista local.', err);
        const salvosLocais = localStorage.getItem(this.LOCAL_KEY);
        return of((salvosLocais ? JSON.parse(salvosLocais) : []) as any[]);
      })
    ).subscribe({
      next: (dadosApi: any[]) => {
        const listaApi: any[] = dadosApi || [];
        const mapa = new Map<number, any>();

        listaApi.forEach((p: any) => {
          const id = Number(p.idAtendimento || p.idatendimento || p.id);
          if (id && !deletados.includes(id)) {
            mapa.set(id, this.normalizarObjetoPedido(p));
          }
        });

        this.pedidos = Array.from(mapa.values()).sort((a: any, b: any) => {
          const idA = Number(a.idAtendimento || a.idatendimento || a.id || 0);
          const idB = Number(b.idAtendimento || b.idatendimento || b.id || 0);
          return idB - idA;
        });

        localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.pedidos));

        this.aplicarFiltros();
        this.cd.detectChanges();
      }
    });
  }

  deletarPedido(pedido: any, event?: Event): void {
    if (event) event.stopPropagation();

    const id = Number(pedido?.idAtendimento || pedido?.idatendimento || pedido?.id);
    if (!id) return;

    if (!confirm(`Tem certeza que deseja excluir permanentemente o Pedido #${id}?`)) {
      return;
    }

    // 1. Remove visualmente na hora e registra na lista de excluídos
    this.registrarIdDeletado(id);
    this.pedidos = this.pedidos.filter(
      (p: any) => Number(p.idAtendimento || p.idatendimento || p.id) !== id
    );
    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.pedidos));

    if (this.pedidoSelecionado && Number(this.pedidoSelecionado.idAtendimento || this.pedidoSelecionado.id) === id) {
      this.pedidoSelecionado = null;
    }

    this.aplicarFiltros();
    this.mensagemSucesso = `Pedido #${id} excluído com sucesso!`;
    this.cd.detectChanges();

    setTimeout(() => {
      this.mensagemSucesso = '';
      this.cd.detectChanges();
    }, 2000);

    // 2. Envia o DELETE para a API em segundo plano
    this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError((err: any) => {
        console.warn(`API não suportou DELETE /${id} ou registro já removido:`, err);
        return of(null);
      })
    ).subscribe();
  }

  private obterIdsDeletados(): number[] {
    try {
      const raw = localStorage.getItem(this.DELETADOS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private registrarIdDeletado(id: number): void {
    const lista = this.obterIdsDeletados();
    if (!lista.includes(id)) {
      lista.push(id);
      localStorage.setItem(this.DELETADOS_KEY, JSON.stringify(lista));
    }
  }

  private normalizarObjetoPedido(pedido: any): any {
    const dataValida = this.resolverDataBruta(pedido);
    return {
      ...pedido,
      dataAtendimento: dataValida,
      data_atendimento: dataValida,
      dataHora: dataValida,
      data: dataValida
    };
  }

  private resolverDataBruta(pedido: any): string {
    const candidatos = [
      pedido?.dataAtendimento,
      pedido?.data_atendimento,
      pedido?.dataHora,
      pedido?.data_hora,
      pedido?.dataPedido,
      pedido?.dataCriacao,
      pedido?.data,
      pedido?.createdAt
    ];

    for (const val of candidatos) {
      if (!val) continue;
      const str = String(val).trim();
      if (str === '' || str.startsWith('0001-01-01')) continue;

      const matchBr = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
      if (matchBr) {
        const [, dia, mes, ano, hora = '12', min = '00'] = matchBr;
        return `${ano}-${mes}-${dia}T${hora}:${min}:00`;
      }

      return str;
    }

    return new Date().toISOString();
  }

  obterNomeCliente(pedido: any): string {
    if (!pedido) return 'Cliente Não Identificado';

    const nomeApi = pedido.nomeCliente || pedido.nomePessoa || pedido.cliente || pedido.pessoa?.nome;
    if (nomeApi && typeof nomeApi === 'string' && nomeApi.trim() !== '') {
      return nomeApi.trim();
    }

    const idCliente = Number(
      pedido.idPessoa ?? pedido.idpessoa ?? pedido.idCliente ?? pedido.id_pessoa ?? pedido.pessoa?.idPessoa ?? 0
    );

    if (idCliente > 0 && this.mapaClientes.has(idCliente)) {
      return this.mapaClientes.get(idCliente)!;
    }

    return idCliente > 0 ? `Cliente #${idCliente}` : 'Cliente Não Identificado';
  }

  aplicarFiltros(): void {
    if (!this.filtroStatus) {
      this.pedidosFiltrados = [...this.pedidos];
    } else {
      this.pedidosFiltrados = this.pedidos.filter((p: any) => {
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
      2: 'Ethel',
      3: 'Fernanda Oli',
      6: 'Rafael Ferreira',
      15: 'Dra. Juliana Mendes',
      16: 'Dra. Beatriz Lima',
      17: 'Lucas Barber'
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
      const itemEncontrado = this.catalogoItens.find((i: ItemSistema) => Number(i.id || i.idItem) === idProcurado);
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
    const p = this.pedidos.find((item: any) => Number(item.idAtendimento || item.idatendimento || item.id) === Number(idAtendimento));
    if (p) this.pedidoSelecionado = { ...p };
  }

  fecharDetalhes(): void {
    this.pedidoSelecionado = null;
  }

  alterarStatus(idAtendimento: number, novoStatus: string): void {
    if (this.enviando) return;

    const id = Number(idAtendimento);
    this.enviando = true;

    this.confirmarAtualizacaoStatus(id, novoStatus);

    const payload = {
      idAtendimento: id,
      statusAtendimento: novoStatus,
      status: novoStatus
    };

    this.http.put(`${this.apiUrl}/${id}`, payload).pipe(
      catchError(() => {
        return this.http.put(`${this.apiUrl}/${id}/status`, payload).pipe(
          catchError((err2: any) => {
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
      (p: any) => Number(p.idAtendimento || p.idatendimento || p.id) === Number(idAtendimento)
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
        (p: any) => Number(p.idAtendimento || p.idatendimento || p.id) === Number(idAtendimento)
      );
      if (pedidoFiltrado) {
        pedidoFiltrado.statusAtendimento = novoStatus;
        pedidoFiltrado.status = novoStatus;
        pedidoFiltrado.status_atendimento = novoStatus;
      }

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