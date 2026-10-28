import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemCarrinho {
  id: number;
  nome: string;
  categoria: string;
  precoUnitario: number;
  quantidade: number;
  imagem: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private itens: ItemCarrinho[] = [];
  
  // Endpoint exato da controller Atendimento no C#
  private readonly apiUrl = 'https://localhost:7077/api/Atendimento'; 

  constructor(private http: HttpClient) { }

  obterItens(): ItemCarrinho[] {
    return this.itens;
  }

  adicionarItem(itemNovo: Omit<ItemCarrinho, 'quantidade'>): void {
    const itemExistente = this.itens.find(i => i.id === itemNovo.id);
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.itens.push({ ...itemNovo, quantidade: 1 });
    }
  }

  aumentarQtd(id: number): void {
    const item = this.itens.find(i => i.id === id);
    if (item) item.quantidade++;
  }

  diminuirQtd(id: number): void {
    const item = this.itens.find(i => i.id === id);
    if (item) {
      item.quantidade--;
      if (item.quantidade <= 0) this.removerItem(id);
    }
  }

  removerItem(id: number): void {
    this.itens = this.itens.filter(i => i.id !== id);
  }

  obterTotal(): number {
    return this.itens.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  }

  limparCarrinho(): void {
    this.itens = [];
  }

  finalizarAgendamentoAPI(idPessoa: number = 1): Observable<any> {
  const payload = {
    idPessoa: idPessoa, // ID da pessoa/cliente
    dataAtendimento: new Date().toISOString().split('T')[0], // Formato "YYYY-MM-DD"
    statusAtendimento: 'A', // 'A' para Agendado ou Aberto
    itens: this.itens.map(item => ({
      idItem: item.id,
      quantidade: item.quantidade,
      valorUnitario: item.precoUnitario,
      idFuncionario: 1 // Opcional/Default se a API exigir um funcionário
    }))
  };

  return this.http.post(this.apiUrl, payload);
}
}