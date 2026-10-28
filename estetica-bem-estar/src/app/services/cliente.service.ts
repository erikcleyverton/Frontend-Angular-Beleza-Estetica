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

  // Alterado para 'any' para evitar conflito de tipos com a interface Cliente
  cadastrarCliente(cliente: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cliente);
  }

  // Alterado para 'any' e usando o idPessoa passado no objeto
  atualizarCliente(cliente: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cliente.idPessoa}`, cliente);
  }
}