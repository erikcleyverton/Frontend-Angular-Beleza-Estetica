import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface ItemCarrinho {
  id: number;
  nome: string;
  categoria?: string;
  precoUnitario: number;
  quantidade: number;
  imagem?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private key = 'carrinho';
  private itens: ItemCarrinho[] = [];
  
  // Subject para emitir atualizações reativas para os componentes
  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  public itens$ = this.itensSubject.asObservable();

  private readonly apiUrl = 'https://localhost:7077/api/Atendimento'; 

  constructor(private http: HttpClient) {
    // Carrega do localStorage logo ao iniciar o serviço
    this.carregarDoLocalStorage();
  }

  private carregarDoLocalStorage(): void {
    const salvo = localStorage.getItem(this.key);
    if (salvo) {
      try {
        this.itens = JSON.parse(salvo);
      } catch (e) {
        this.itens = [];
      }
    }
    this.atualizarEstado();
  }

  private atualizarEstado(): void {
    // Persiste no localStorage e notifica os inscritos via BehaviorSubject
    localStorage.setItem(this.key, JSON.stringify(this.itens));
    this.itensSubject.next([...this.itens]);
  }

  obterItens(): ItemCarrinho[] {
    return this.itens;
  }

  adicionarItem(itemNovo: Omit<ItemCarrinho, 'quantidade'>): void {
    if (!itemNovo.id) {
      console.error('Tentativa de adicionar item sem ID:', itemNovo);
      return;
    }

    const itemExistente = this.itens.find(i => i.id === itemNovo.id);
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.itens.push({ ...itemNovo, quantidade: 1 });
    }
    this.atualizarEstado();
  }

  aumentarQtd(id: number): void {
    const item = this.itens.find(i => i.id === id);
    if (item) {
      item.quantidade++;
      this.atualizarEstado();
    }
  }

  diminuirQtd(id: number): void {
    const item = this.itens.find(i => i.id === id);
    if (item) {
      item.quantidade--;
      if (item.quantidade <= 0) {
        this.removerItem(id);
        return;
      }
      this.atualizarEstado();
    }
  }

  removerItem(id: number): void {
    this.itens = this.itens.filter(i => i.id !== id);
    this.atualizarEstado();
  }

  obterTotal(): number {
    return this.itens.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  }

  limparCarrinho(): void {
    this.itens = [];
    localStorage.removeItem(this.key);
    this.atualizarEstado();
  }

finalizarAgendamentoAPI(idPessoa: number = 1): Observable<any> {
  const agora = new Date();

  const payload = {
    idPessoa: idPessoa,
    idPessoaCliente: idPessoa,
    dataAtendimento: agora.toISOString(),
    statusAtendimento: 'A',
    valorTotal: this.obterTotal(),
    itens: this.itens.map(item => ({
      idItem: item.id,
      idFuncionario: 1,
      quantidade: item.quantidade,
      valorUnitario: item.precoUnitario
    }))
  };

  return this.http.post(this.apiUrl, payload);
}
}