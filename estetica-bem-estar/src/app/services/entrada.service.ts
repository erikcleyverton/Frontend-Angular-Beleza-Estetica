import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  private readonly apiUrlEntradas = 'https://localhost:7077/api/EntradaProduto';

  constructor(
    private http: HttpClient,
    private cadastroItensService: CadastroItensService
  ) {}

  obterProdutos(): Observable<any[]> {
    return this.cadastroItensService.obterItens();
  }

  obterHistoricoEntradas(): Observable<EntradaProduto[]> {
    // Busca o histórico diretamente da tabela entrada_produto no MySQL
    return this.http.get<EntradaProduto[]>(this.apiUrlEntradas);
  }

  registrarEntrada(entrada: EntradaProduto): Observable<any> {
    // Envia exatamente os campos mapeados no EntradaProdutoDTO do C#
    const payload = {
      idItem: Number(entrada.idItem),
      dataEntradaProduto: entrada.dataEntradaProduto,
      quantidadeEntrada: Number(entrada.quantidadeEntrada),
      unidade: entrada.unidade || 'UN',
      valorUnitarioEntrada: Number(entrada.valorUnitarioEntrada)
    };

    // Dispara o POST real para gravar em 'entrada_produto' e somar em 'estoque'
    return this.http.post<any>(this.apiUrlEntradas, payload);
  }
}