import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Categoria {
  idCategoria?: number;
  nomeCategoria: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = 'https://localhost:7077/api/Categorium';

  constructor(private http: HttpClient) {}

  /**
   * Mapeia a coluna 'categoria' trazida do banco MySQL pelo EF Core
   */
  obterTodas(): Observable<Categoria[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(dados => (dados || []).map(c => {
        // Pega o valor exato retornado da coluna 'categoria' / 'categoria1' do MySQL
        const textoNome = c.categoria || c.categoria1 || c.Categoria || c.Categoria1 || c.nome || c.Nome || 'Sem nome';

        return {
          idCategoria: Number(c.idcategoria || c.Idcategoria || c.id || 0),
          nomeCategoria: String(textoNome)
        };
      })),
      catchError(err => {
        console.warn('Erro ao carregar categorias (/api/Categorium):', err);
        return of([]);
      })
    );
  }

  /**
   * Envia a DTO simples esperada no C#
   */
  cadastrar(nomeOuObjeto: any): Observable<any> {
    const textoNome = typeof nomeOuObjeto === 'string' 
      ? nomeOuObjeto 
      : (nomeOuObjeto?.nomeCategoria || nomeOuObjeto?.nome || nomeOuObjeto?.Nome || '');

    const payload = {
      nome: textoNome
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.apiUrl, payload, { headers }).pipe(
      catchError(err => {
        console.error('Erro ao cadastrar categoria:', err);
        throw err;
      })
    );
  }

  cadastrarCategoria(categoria: any): Observable<any> {
    return this.cadastrar(categoria);
  }

  excluirCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.error(`Erro ao excluir categoria ID ${id}:`, err);
        throw err;
      })
    );
  }
}