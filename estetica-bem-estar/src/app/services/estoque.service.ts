import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemEstoque {
  idItem: number;
  nomeItem?: string;
  item?: string;
  quantidadeEstoque: number;
  unidade?: string;
  precoVenda?: number;
  tipoItem?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  // APONTA PARA A ROTA ONDE MAPEAMOS O ESTOQUE CORRETAMENTE
  private apiUrl = 'https://localhost:7077/api/ProdutoItem'; 

  constructor(private http: HttpClient) {}

  obterEstoque(): Observable<ItemEstoque[]> {
    return this.http.get<ItemEstoque[]>(this.apiUrl);
  }
}