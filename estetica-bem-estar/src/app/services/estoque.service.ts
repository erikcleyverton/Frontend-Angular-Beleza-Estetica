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
}

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private apiUrl = 'https://localhost:7077/api/estoque';

  constructor(private http: HttpClient) {}

  obterEstoque(): Observable<ItemEstoque[]> {
    return this.http.get<ItemEstoque[]>(this.apiUrl);
  }
}