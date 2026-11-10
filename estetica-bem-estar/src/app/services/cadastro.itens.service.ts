import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface ItemSistema {
  id?: number;
  idItem?: number;
  iditem?: number;
  Iditem?: number;
  nome?: string;
  nomeItem?: string;
  item?: string;
  Item?: string;
  descricao?: string;
  descricao_item?: string;
  descricaoItem?: string;
  DescricaoItem?: string;
  categoria?: string;
  idCategoria?: number;
  idcategoria?: number;
  IdCategoria?: number;
  imagem?: string;
  preco?: number;
  precoUnitario?: number;
  valorUnitario?: number;
  preco_venda?: number;
  precoVenda?: number;
  PrecoVenda?: number;
  Preco?: number;
  tipo?: string;
  tipoItem?: string;
  TipoItem?: string;
  ativo?: boolean;
  quantidade?: number;
  quantidade_estoque?: number;
  quantidadeEstoque?: number;
  qtdAtual?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroItensService {
  private readonly API_URL = 'https://localhost:7077/api/ProdutoItem';
  private STORAGE_KEY = 'estoque_cache_local';

  constructor(private http: HttpClient) {}

  private normalizarItem(item: any, index: number = 0): ItemSistema {
    if (!item) return {};

    const nomeFinal = item.item || item.Item || item.nomeItem || item.nome || item.item1 || '';
    const descFinal = item.descricaoItem || item.DescricaoItem || item.descricao || item.descricao_item || '';
    const precoFinal = Number(item.precoVenda || item.PrecoVenda || item.preco || item.Preco || 0);
    const idFinal = Number(item.idItem || item.iditem || item.Iditem || item.id || (index + 1));
    const tipoFinal = (item.tipoItem || item.TipoItem || item.tipo || 'P').toUpperCase();

    return {
      ...item,
      id: idFinal,
      idItem: idFinal,
      iditem: idFinal,
      nome: nomeFinal,
      nomeItem: nomeFinal,
      item: nomeFinal,
      Item: nomeFinal,
      descricao: descFinal,
      descricaoItem: descFinal,
      DescricaoItem: descFinal,
      preco: precoFinal,
      precoVenda: precoFinal,
      PrecoVenda: precoFinal,
      Preco: precoFinal,
      tipoItem: tipoFinal === 'S' ? 'S' : 'P',
      tipo: tipoFinal === 'S' ? 'servico' : 'produto',
      quantidade: item.quantidade ?? item.quantidade_estoque ?? item.quantidadeEstoque ?? 10
    };
  }

  obterItens(): Observable<ItemSistema[]> {
    return this.http.get<any[]>(this.API_URL).pipe(
      map((dados: any[]) => (dados || []).map((item: any, idx: number) => this.normalizarItem(item, idx))),
      tap(itens => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(itens));
      }),
      catchError(err => {
        console.warn('Erro ao conectar com a API. Lendo do cache local.', err);
        const salvos = localStorage.getItem(this.STORAGE_KEY);
        const dadosLocais: any[] = salvos ? JSON.parse(salvos) : [];
        return of(dadosLocais.map((item: any, idx: number) => this.normalizarItem(item, idx)));
      })
    );
  }

  cadastrarItem(payload: any): Observable<any> {
    return this.http.post<any>(this.API_URL, payload).pipe(
      map(resposta => this.normalizarItem(resposta)),
      catchError(err => {
        console.error('Erro ao enviar POST para a API:', err);
        throw err;
      })
    );
  }

  atualizarEstoqueProduto(idItem: number, quantidade: number, novoPreco?: number): Observable<any> {
    const body = {
      idItem: Number(idItem),
      quantidade: Number(quantidade),
      preco: novoPreco ? Number(novoPreco) : undefined
    };

    return this.http.put(`${this.API_URL}/${idItem}/estoque`, body).pipe(
      catchError(err => {
        console.warn('Endpoint de estoque indisponível.', err);
        return of(null);
      })
    );
  }
}