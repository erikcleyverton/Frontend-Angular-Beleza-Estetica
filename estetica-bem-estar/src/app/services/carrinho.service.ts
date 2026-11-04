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
  private usuarioKey = 'usuario_logado'; // Chave onde os dados do usuário autenticado ficam salvos
  private itens: ItemCarrinho[] = [];
  
  // Subject para emitir atualizações reativas para os componentes
  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  public itens$ = this.itensSubject.asObservable();

  private readonly apiUrl = 'https://localhost:7077/api/Atendimento'; 

  constructor(private http: HttpClient) {
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
    localStorage.setItem(this.key, JSON.stringify(this.itens));
    this.itensSubject.next([...this.itens]);
  }

  /**
   * Obtém o idPessoa dinamicamente do utilizador logado no localStorage.
   * Retorna 1 (Carly Rae Jepsen) como fallback de segurança caso não haja login[cite: 3].
   */
  obterIdPessoaLogada(): number {
    const usuarioSalvo = localStorage.getItem(this.usuarioKey);
    if (usuarioSalvo) {
      try {
        const usuario = JSON.parse(usuarioSalvo);
        return usuario.idPessoa || usuario.id || 1;
      } catch (e) {
        console.error('Erro ao converter usuario_logado do localStorage:', e);
      }
    }
    return 1; // Fallback padronizado[cite: 3]
  }

  obterItens(): ItemCarrinho[] {
    return this.itens;
  }

  adicionarItem(itemNovo: Omit<ItemCarrinho, 'quantidade'>): void {
    if (!itemNovo.id) {
      console.error('Tentativa de adicionar item sem ID:', itemNovo);
      return;
    }

    // Compara por ID e por Nome para evitar agrupar serviços diferentes com o mesmo idBanco
    const itemExistente = this.itens.find(i => i.id === itemNovo.id && i.nome === itemNovo.nome);
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

  /**
   * Finaliza o agendamento na API ASP.NET Core.
   * Se um idPessoa for fornecido explicitamente, ele será usado.
   * Caso contrário, busca dinamicamente o cliente autenticado via `obterIdPessoaLogada()`.
   */
  finalizarAgendamentoAPI(idPessoa?: number): Observable<any> {
    const agora = new Date();
    const dataFormatada = agora.toISOString().split('T')[0]; // "YYYY-MM-DD"

    const idClienteFinal = idPessoa || this.obterIdPessoaLogada();

    const payload = {
      idPessoa: idClienteFinal,
      dataAtendimento: dataFormatada,
      statusAtendimento: 'A',
      valorTotal: this.obterTotal(),
      itens: this.itens.map(item => ({
        idItem: Number(item.id) || 1, // IDs 1 ou 2 aceitos no MySQL[cite: 6]
        idFuncionario: 2, // ID 2 é o funcionário no banco (Ethel)[cite: 4]
        quantidade: item.quantidade,
        valorUnitario: item.precoUnitario
      }))
    };

    return this.http.post(this.apiUrl, payload);
  }
}