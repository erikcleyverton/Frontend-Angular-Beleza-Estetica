import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface ItemSistema {
  id?: number;
  idItem?: number;
  nome?: string;
  nomeItem?: string;
  item?: string;
  preco?: number;
  precoUnitario?: number;
  valorUnitario?: number;
  tipo?: string;
  tipoItem?: string;
  categoria?: string;
  descricao?: string;
  imagem?: string;
  quantidade?: number;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CadastroItensService {
  private STORAGE_KEY = 'estetica_itens_estoque_v1';

  private itensInicial: ItemSistema[] = [
    { id: 1, idItem: 1, nome: 'Botox Facial', preco: 550, tipo: 'servico', tipoItem: 'S', ativo: true, quantidade: 0 },
    { id: 2, idItem: 2, nome: 'Harmonização Facial', preco: 550, tipo: 'servico', tipoItem: 'S', ativo: true, quantidade: 0 },
    { id: 3, idItem: 3, nome: 'Hidratante Labial Nutritivo 10g', preco: 25, tipo: 'produto', tipoItem: 'P', ativo: true, quantidade: 0 },
    { id: 4, idItem: 4, nome: 'Sérum Anti-Idade Ácido Hialurónico', preco: 145, tipo: 'produto', tipoItem: 'P', ativo: true, quantidade: 0 }
  ];

  private itens: ItemSistema[] = [];
  private itensSubject = new BehaviorSubject<ItemSistema[]>([]);

  constructor() {
    this.carregarEstoqueSalvo();
  }

  private carregarEstoqueSalvo(): void {
    const dadosSalvos = localStorage.getItem(this.STORAGE_KEY);
    if (dadosSalvos) {
      try {
        this.itens = JSON.parse(dadosSalvos);
      } catch {
        this.itens = [...this.itensInicial];
      }
    } else {
      this.itens = [...this.itensInicial];
    }
    this.itensSubject.next([...this.itens]);
  }

  private salvarEstoque(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.itens));
    this.itensSubject.next([...this.itens]);
  }

  obterItens(): Observable<ItemSistema[]> {
    return this.itensSubject.asObservable();
  }

  /** MÉTODO RESTAURADO PARA O CADASTRO DE PRODUTOS E SERVIÇOS */
  cadastrarItem(novoItem: ItemSistema): Observable<ItemSistema> {
    const idGerado = this.itens.length > 0 
      ? Math.max(...this.itens.map(i => Number(i.id || i.idItem || 0))) + 1 
      : 1;

    const itemFormatado: ItemSistema = {
      ...novoItem,
      id: idGerado,
      idItem: idGerado,
      quantidade: novoItem.quantidade || 0,
      ativo: novoItem.ativo ?? true
    };

    this.itens.push(itemFormatado);
    this.salvarEstoque();

    return of(itemFormatado);
  }

  atualizarEstoqueProduto(idItem: number, quantidadeAdicionada: number): void {
    const itemEncontrado = this.itens.find(
      i => Number(i.id || i.idItem) === Number(idItem)
    );

    if (itemEncontrado) {
      itemEncontrado.quantidade = Number(itemEncontrado.quantidade || 0) + Number(quantidadeAdicionada);
      this.salvarEstoque();
    }
  }
}