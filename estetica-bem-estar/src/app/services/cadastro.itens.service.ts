import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Item {
  idItem?: number;
  id?: number;
  item?: string;
  nomeItem?: string;
  nome?: string;
  tipoItem: string;
  preco: number;
  descricao?: string;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroItensService {
  // URL atualizada com a Controller correta do backend C#
  private apiUrl = 'https://localhost:7077/api/ProdutoItem';

  constructor(private http: HttpClient) {}

  obterItens(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiUrl);
  }

  cadastrarItem(item: Item): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item);
  }
}