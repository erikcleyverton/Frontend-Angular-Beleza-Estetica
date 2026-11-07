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
  private readonly LOCAL_KEY = 'pedidos_cache_local';

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
    const salvosLocais = localStorage.getItem(this.LOCAL_KEY);
    const pedidosLocais: any[] = salvosLocais ? JSON.parse(salvosLocais) : [];

    this.http.get<any[]>(this.apiUrl).pipe(
      catchError(err => {
        console.warn('API de Atendimento indisponível. Exibindo apenas pedidos locais.', err);
        return of([]);
      })
    ).subscribe({
      next: (dadosApi) => {
        const listaApi = dadosApi || [];
        const mapa = new Map<number, any>();

        // Insere primeiro os dados vindos da API
        listaApi.forEach(p => {
          const id = Number(p.idAtendimento || p.idatendimento || p.id);
          if (id) mapa.set(id, p);
        });

        // Insere ou sobrepõe com os pedidos locais (preservando o status alterado localmente)
        pedidosLocais.forEach(p => {
          const id = Number(p.idAtendimento || p.idatendimento || p.id);
          if (id) {
            mapa.set(id, p);
          }
        });

        this.pedidos = Array.from(mapa.values()).sort((a, b) => {
          const idA = Number(a.idAtendimento || a.idatendimento || a.id || 0);
          const idB = Number(b.idAtendimento || b.idatendimento || b.id || 0);
          return idB - idA;
        });

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

  obterNomeFuncionario(objeto: any): string {
    if (!objeto) return 'Não atribuído';

    const nome = objeto.nomeFuncionario || 
                 objeto.funcionario || 
                 objeto.atendente || 
                 objeto.nome_funcionario || 
                 objeto.funcionarioNome ||
                 objeto.profissional;

    if (nome && typeof nome === 'string' && nome.trim() !== '') {
      return nome;
    }

    const idFunc = Number(objeto.idFuncionario || objeto.id_funcionario || objeto.idAtendente);
    
    const mapaFuncionarios: { [key: number]: string } = {
      2: 'Ethel',
      3: 'Fernanda Olivia',
      6: 'Rafael Ferreira',
      15: 'Dra. Juliana Mendes',
      16: 'Dra. Beatriz Lima',
      17: 'Lucas Barber'
    };

    if (idFunc > 0 && mapaFuncionarios[idFunc]) {
      return mapaFuncionarios[idFunc];
    }

    if (this.pedidoSelecionado && objeto !== this.pedidoSelecionado) {
      return this.obterNomeFuncionario(this.pedidoSelecionado);
    }

    return idFunc > 0 ? `Profissional #${idFunc}` : 'Não atribuído';
  }

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

  alterarStatus(idAtendimento: number, novoStatus: string): void {
    if (this.enviando) return;

    const id = Number(idAtendimento);
    this.enviando = true;

    // Atualiza imediatamente na memória e no localStorage
    this.confirmarAtualizacaoStatus(id, novoStatus);

    // Tenta sincronizar com o backend
    this.http.put(`${this.apiUrl}/${id}/status`, { statusAtendimento: novoStatus }).pipe(
      catchError(err => {
        console.warn('Backend indisponível. Status alterado localmente com sucesso.', err);
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
      // 1. Atualiza todas as propriedades de status no objeto ativo
      pedido.statusAtendimento = novoStatus;
      pedido.status = novoStatus;
      pedido.status_atendimento = novoStatus;

      if (this.pedidoSelecionado) {
        this.pedidoSelecionado.statusAtendimento = novoStatus;
        this.pedidoSelecionado.status = novoStatus;
        this.pedidoSelecionado.status_atendimento = novoStatus;
      }

      // 2. Persiste a lista inteira atualizada no localStorage
      localStorage.setItem(this.LOCAL_KEY, JSON.stringify(this.pedidos));

      // 3. Atualiza os filtros e notifica o utilizador
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