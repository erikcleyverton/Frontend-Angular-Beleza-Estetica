import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ItemPedidoCliente {
  idAtendimento: number;
  idItem: number;
  item: string;
  idFuncionario: number;
  nomeFuncionario: string;
  cargo: string;
  quantidade: number;
  valorUnitario: number;
}

export interface PedidoCliente {
  idAtendimento: number;
  idPessoa: number;
  nomePessoa: string;
  dataAtendimento: string;
  statusAtendimento: string;
  itens: ItemPedidoCliente[];
}

@Injectable({
  providedIn: 'root'
})
export class MeusPedidosService {
  private apiUrl = 'https://localhost:7077/api/Atendimento';
  private pessoaUrl = 'https://localhost:7077/api/Pessoa';

  constructor(private http: HttpClient) {}

  obterClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.pessoaUrl);
  }

  obterTodosPedidos(): Observable<PedidoCliente[]> {
    return this.http.get<PedidoCliente[]>(this.apiUrl);
  }

  obterPedidosPorCliente(idPessoa: number): Observable<PedidoCliente[]> {
    return this.http.get<PedidoCliente[]>(`${this.apiUrl}/pessoa/${idPessoa}`);
  }

cancelarPedido(pedido: PedidoCliente): Observable<any> {
    return this.http.put(`${this.apiUrl}/${pedido.idAtendimento}/cancelar`, {}).pipe(
      catchError(() => {
        const dtoPut = {
          idAtendimento: Number(pedido.idAtendimento),
          idPessoa: Number(pedido.idPessoa || 1),
          dataAtendimento: pedido.dataAtendimento,
          statusAtendimento: 'C',
          itens: (pedido.itens || []).map(i => ({
            idAtendimento: Number(pedido.idAtendimento),
            idItem: Number(i.idItem),
            idFuncionario: Number(i.idFuncionario || 15),
            quantidade: Number(i.quantidade),
            valorUnitario: Number(i.valorUnitario)
          }))
        };
        return this.http.put(`${this.apiUrl}/${pedido.idAtendimento}`, dtoPut);
      })
    );
}
}