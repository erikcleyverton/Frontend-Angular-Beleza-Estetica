import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Categoria {
  idCategoria?: number;
  idcategoria?: number;
  id?: number;
  nomeCategoria: string;
  nome?: string;
  categoria?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = 'https://localhost:7077/api/Categorium';
  private readonly apiUrlFallback = 'https://localhost:7077/api/Categoria';

  constructor(private http: HttpClient) {}

  /**
   * Helper para normalizar o objeto de Categoria retornado pela API
   */
  private normalizarCategoria(c: any): Categoria {
    const idValido = Number(c?.idCategoria || c?.idcategoria || c?.IdCategoria || c?.Idcategoria || c?.id || 0);
    const textoNome = String(
      c?.nomeCategoria || c?.nome || c?.categoria || c?.categoria1 || c?.Categoria || c?.Categoria1 || c?.Nome || 'Sem nome'
    );

    return {
      idCategoria: idValido,
      idcategoria: idValido,
      id: idValido,
      nomeCategoria: textoNome,
      nome: textoNome,
      categoria: textoNome
    };
  }

  /**
   * Mapeia todas as variações de chaves retornadas pelo C#/MySQL
   */
  obterTodas(): Observable<Categoria[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError(() => this.http.get<any[]>(this.apiUrlFallback)),
      map(dados => (dados || []).map(c => this.normalizarCategoria(c))),
      catchError(err => {
        console.warn('Erro ao carregar categorias (Categorium/Categoria):', err);
        return of([]);
      })
    );
  }

  /**
   * Envia a DTO esperada no C# e devolve o objeto formatado
   */
  cadastrar(nomeOuObjeto: any): Observable<Categoria> {
    const textoNome = typeof nomeOuObjeto === 'string' 
      ? nomeOuObjeto 
      : (nomeOuObjeto?.nomeCategoria || nomeOuObjeto?.nome || nomeOuObjeto?.Nome || nomeOuObjeto?.categoria || '');

    const payload = {
      nome: textoNome,
      nomeCategoria: textoNome
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.apiUrl, payload, { headers }).pipe(
      catchError(() => this.http.post<any>(this.apiUrlFallback, payload, { headers })),
      map(resposta => this.normalizarCategoria(resposta)),
      catchError(err => {
        console.error('Erro ao cadastrar categoria:', err);
        throw err;
      })
    );
  }

  cadastrarCategoria(categoria: any): Observable<Categoria> {
    return this.cadastrar(categoria);
  }

  excluirCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(() => this.http.delete(`${this.apiUrlFallback}/${id}`)),
      catchError(err => {
        console.error(`Erro ao excluir categoria ID ${id}:`, err);
        throw err;
      })
    );
  }
}