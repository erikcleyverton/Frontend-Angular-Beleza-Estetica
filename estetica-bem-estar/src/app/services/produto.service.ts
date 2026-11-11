import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProdutoDTO {
  idCategoria: number;
  item: string;
  descricaoItem?: string;
  preco?: number;
  tipoItem?: string;
  ativoProdutoServico?: string;
  codigoPreco?: number;
  precoVenda: number;
  unidade?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private readonly apiUrl = 'https://localhost:7077/api/ProdutoItem';

  constructor(private http: HttpClient) {}

  /**
   * Obtém a lista de produtos cadastrados (retorna ProdutoDTO[])
   */
  obterTodos(): Observable<ProdutoDTO[]> {
    return this.http.get<ProdutoDTO[]>(this.apiUrl);
  }

  /**
   * Obtém um produto específico pelo ID do Item
   */
  obterPorId(id: number): Observable<ProdutoDTO> {
    return this.http.get<ProdutoDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Envia o DTO para cadastrar nas tabelas ITEM e PRODUTO
   */
  cadastrar(produto: ProdutoDTO): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Garante os valores padrão exigidos pelo backend
    const payload: ProdutoDTO = {
      idCategoria: Number(produto.idCategoria),
      item: produto.item,
      descricaoItem: produto.descricaoItem || '',
      preco: Number(produto.precoVenda || produto.preco || 0),
      tipoItem: produto.tipoItem || 'P',
      ativoProdutoServico: produto.ativoProdutoServico || 'S',
      codigoPreco: produto.codigoPreco || 1,
      precoVenda: Number(produto.precoVenda || 0),
      unidade: produto.unidade || 'UN'
    };

    return this.http.post<any>(this.apiUrl, payload, { headers });
  }

  /**
   * Atualiza um produto existente
   */
  atualizar(id: number, produto: ProdutoDTO): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, produto);
  }

  /**
   * Exclui o item e produto por ID
   */
  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}