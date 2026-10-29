import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemPedido {
  idItem: number;
  nomeItem: string;
  quantidade: number;
  valorUnitario: number;
  funcionarioNome?: string;
  cargoFuncionario?: string;
}

export interface Pedido {
  idAtendimento: number;
  idCliente: number;
  nomeCliente: string;
  dataAtendimento: string;
  valorTotal: number;
  statusAtendimento: string; // 'Aberto', 'Em Processamento', 'Concluído', 'Cancelado'
  itens?: ItemPedido[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = 'https://localhost:7077/api/pedidos';

  constructor(private http: HttpClient) {}

  obterPedidos(status?: string): Observable<Pedido[]> {
    const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
    return this.http.get<Pedido[]>(url);
  }

  obterPedidoPorId(id: number): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  atualizarStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, { statusAtendimento: status });
  }
}