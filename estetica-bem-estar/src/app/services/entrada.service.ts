import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CadastroItensService } from './cadastro.itens.service';

export interface EntradaProduto {
  idEntradaProduto?: number;
  idItem: number;
  dataEntradaProduto: string;
  quantidadeEntrada: number;
  unidade: string;
  valorUnitarioEntrada: number;
}

@Injectable({
  providedIn: 'root'
})
export class EntradaProdutoService {
  private readonly apiUrlEntradas = 'https://localhost:7077/api/entradaprodutos';
  private readonly apiUrlItens = 'https://localhost:7077/api/itens';

  constructor(
    private http: HttpClient,
    private cadastroItensService: CadastroItensService
  ) {}

  obterProdutos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrlItens);
  }

  obterHistoricoEntradas(): Observable<EntradaProduto[]> {
    return this.http.get<EntradaProduto[]>(this.apiUrlEntradas);
  }

  registrarEntrada(entrada: EntradaProduto): Observable<EntradaProduto> {
    return this.http.post<EntradaProduto>(this.apiUrlEntradas, entrada).pipe(
      tap((res) => {
        // Ao confirmar a resposta com sucesso da API, atualiza a quantidade no cadastro/estoque local
        this.cadastroItensService.atualizarEstoqueProduto(
          Number(entrada.idItem), 
          Number(entrada.quantidadeEntrada)
        );
      })
    );
  }
}