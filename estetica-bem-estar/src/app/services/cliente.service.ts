import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly apiUrl = 'https://localhost:7077/api/PessoaEndereco';

  constructor(private http: HttpClient) {}

  obterTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  obterPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  cadastrarCliente(cliente: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cliente);
  }

  atualizarCliente(cliente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cliente.idPessoa}`, cliente);
  }

  // MÉTODO QUE FALTAVA PARA RESOLVER O TS2339:
  excluirCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}