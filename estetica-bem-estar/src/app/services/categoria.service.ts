import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = 'https://localhost:7077/api/categorias';

  constructor(private http: HttpClient) {}

  // Resolve o erro TS2339 (obterTodas)
  obterTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Resolve o erro TS2345 alterando o tipo para acceptar o objeto flexível (any)
  cadastrarCategoria(categoria: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoria);
  }

  // Resolve o erro TS2339 (excluirCategoria)
  excluirCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}