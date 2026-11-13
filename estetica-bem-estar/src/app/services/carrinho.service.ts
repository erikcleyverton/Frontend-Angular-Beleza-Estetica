import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface ItemCarrinho {
  id: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  tipo?: string;
  tipoItem?: string;
  categoria?: string;
  imagem?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private readonly apiUrl = 'https://localhost:7077/api/Atendimento';
  private readonly STORAGE_KEY = 'carrinho_estetica';

  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  public itens$ = this.itensSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarCarrinhoSalvo();
  }

  private carregarCarrinhoSalvo(): void {
    const salvos = localStorage.getItem(this.STORAGE_KEY);
    if (salvos) {
      try {
        this.itensSubject.next(JSON.parse(salvos));
      } catch (e) {
        console.error('Erro ao ler carrinho do localStorage:', e);
      }
    }
  }

  private atualizarStorage(itens: ItemCarrinho[]): void {
    this.itensSubject.next(itens);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(itens));
  }

  obterItens(): ItemCarrinho[] {
    return this.itensSubject.getValue();
  }

  obterTotal(): number {
    return this.obterItens().reduce((acc, item) => {
      const preco = Number(item.precoUnitario || 0);
      const qtd = Number(item.quantidade || 1);
      return acc + (preco * qtd);
    }, 0);
  }

  adicionarItem(item: any): void {
    const itensAtuais = [...this.obterItens()];
    const idItem = Number(item.id || item.idItem);
    const index = itensAtuais.findIndex(i => Number(i.id) === idItem);

    if (index > -1) {
      itensAtuais[index].quantidade += Number(item.quantidade || 1);
    } else {
      itensAtuais.push({
        id: idItem,
        nome: item.nome || item.nomeItem || 'Item',
        precoUnitario: Number(item.precoUnitario || item.preco || 0),
        quantidade: Number(item.quantidade || 1),
        tipo: item.tipo || 'produto',
        tipoItem: item.tipoItem || 'P',
        categoria: item.categoria || 'Geral'
      });
    }

    this.atualizarStorage(itensAtuais);
  }

  atualizarQuantidadeItem(id: number, novaQuantidade: number): void {
    if (novaQuantidade <= 0) {
      this.removerItem(id);
      return;
    }

    const itensAtuais = this.obterItens().map(item => {
      if (Number(item.id) === Number(id)) {
        return { ...item, quantidade: Number(novaQuantidade) };
      }
      return item;
    });

    this.atualizarStorage(itensAtuais);
  }

  removerItem(id: number): void {
    const filtrados = this.obterItens().filter(i => Number(i.id) !== Number(id));
    this.atualizarStorage(filtrados);
  }

  limparCarrinho(): void {
    this.atualizarStorage([]);
  }

  finalizarAgendamentoAPI(idPessoa: number = 1, idFuncionario: number = 15): Observable<any> {
    const itensCarrinho = this.obterItens();

    if (!itensCarrinho || itensCarrinho.length === 0) {
      return throwError(() => new Error('O carrinho está vazio.'));
    }

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataFormatada = `${ano}-${mes}-${dia}`;

    const payload = {
      idPessoa: Number(idPessoa),
      dataAtendimento: dataFormatada,
      statusAtendimento: 'A',
      itens: itensCarrinho.map((item: ItemCarrinho) => ({
        idItem: Number(item.id),
        idFuncionario: Number(idFuncionario || 15),
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.precoUnitario)
      }))
    };

    console.log('Enviando payload para POST /api/Atendimento:', payload);

    return this.http.post<any>(this.apiUrl, payload).pipe(
      tap((res) => this.salvarEmCacheLocal(res || payload, idFuncionario)),
      catchError((err) => {
        console.warn('Erro ao enviar para API:', err);
        return throwError(() => err);
      })
    );
  }

  private salvarEmCacheLocal(pedido: any, idFuncionarioParam: number = 15): void {
    const LOCAL_KEY = 'pedidos_cache_local';
    const salvos = localStorage.getItem(LOCAL_KEY);
    const lista: any[] = salvos ? JSON.parse(salvos) : [];

    const maiorId = lista.reduce((max, p) => {
      const idNum = Number(p.idAtendimento || p.idatendimento || p.id || 0);
      return (idNum < 100000 && idNum > max) ? idNum : max;
    }, 14);

    const novoId = pedido.idAtendimento && Number(pedido.idAtendimento) < 100000
      ? Number(pedido.idAtendimento)
      : maiorId + 1;

    const idFunc = Number(pedido.idFuncionario || idFuncionarioParam || 15);

    const mapaFuncionarios: { [key: number]: string } = {
      2: 'Ethel',
      3: 'Fernanda Olivia',
      6: 'Rafael Ferreira',
      15: 'Dra. Juliana Mendes',
      16: 'Dra. Beatriz Lima',
      17: 'Lucas Barber'
    };

    const nomeFuncionario = mapaFuncionarios[idFunc] || `Profissional #${idFunc}`;

    const itensComFuncionario = (pedido.itens || []).map((item: any) => ({
      ...item,
      idFuncionario: idFunc,
      id_funcionario: idFunc,
      nomeFuncionario: nomeFuncionario,
      funcionario: nomeFuncionario,
      atendente: nomeFuncionario,
      profissional: nomeFuncionario
    }));

    const novoPedido = {
      idAtendimento: novoId,
      id: novoId,
      idPessoa: pedido.idPessoa || 1,
      nomeCliente: 'Carly Rae Jepsen',
      idFuncionario: idFunc,
      id_funcionario: idFunc,
      nomeFuncionario: nomeFuncionario,
      funcionario: nomeFuncionario,
      atendente: nomeFuncionario,
      dataAtendimento: new Date().toLocaleDateString('pt-BR'),
      valorTotal: Number(pedido.valorTotal || this.obterTotal()),
      statusAtendimento: 'Aberto',
      status: 'Aberto',
      itens: itensComFuncionario
    };

    lista.unshift(novoPedido);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(lista));
  }
}