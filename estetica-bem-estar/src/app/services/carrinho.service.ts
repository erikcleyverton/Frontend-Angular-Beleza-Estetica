import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ItemCarrinho {
  id: number;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  tipo?: string;
  tipoItem?: string;
  categoria?: string;
  imagem?: string;
  idFuncionarioSelecionado?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService {
  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  itens$ = this.itensSubject.asObservable();

  private readonly apiUrlAtendimento = 'https://localhost:7077/api/Atendimento';

  // IDs válidos cadastrados na tabela pessoa do teu MySQL
  private readonly idsClientesValidos: number[] = [1, 2, 3, 5, 6, 11, 12, 13, 14, 15, 16, 17];

  constructor(private http: HttpClient) {}

  obterTotal(): number {
    return this.itensSubject.getValue().reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);
  }

  adicionarItem(item: Omit<ItemCarrinho, 'quantidade'>): void {
    const atuais = this.itensSubject.getValue();
    const index = atuais.findIndex(i => i.id === item.id);

    if (index > -1) {
      atuais[index].quantidade += 1;
      this.itensSubject.next([...atuais]);
    } else {
      this.itensSubject.next([...atuais, { ...item, quantidade: 1 }]);
    }
  }

  aumentarQtd(id: number): void {
    const atuais = this.itensSubject.getValue();
    const item = atuais.find(i => i.id === id);
    if (item) {
      item.quantidade += 1;
      this.itensSubject.next([...atuais]);
    }
  }

  diminuirQtd(id: number): void {
    const atuais = this.itensSubject.getValue();
    const index = atuais.findIndex(i => i.id === id);
    if (index > -1) {
      if (atuais[index].quantidade > 1) {
        atuais[index].quantidade -= 1;
      } else {
        atuais.splice(index, 1);
      }
      this.itensSubject.next([...atuais]);
    }
  }

  removerItem(id: number): void {
    const atuais = this.itensSubject.getValue().filter(i => i.id !== id);
    this.itensSubject.next(atuais);
  }

  limparCarrinho(): void {
    this.itensSubject.next([]);
  }

  obterIdClienteAleatorio(): number {
    const indiceSorteado = Math.floor(Math.random() * this.idsClientesValidos.length);
    return this.idsClientesValidos[indiceSorteado];
  }

  /**
   * Finaliza o agendamento no exato formato esperado pelo AtendimentoPostDTO do C#
   */
  finalizarAgendamentoAPI(idClienteParam?: number): Observable<any> {
  const itensCarrinho = this.itensSubject.getValue();

  const idClienteFinal = (idClienteParam && idClienteParam > 0) 
    ? idClienteParam 
    : this.obterIdClienteAleatorio();

  // 1. Data e Hora no formato sem fuso horário (ex: "2026-11-06T00:34:27")
  const agora = new Date();
  const dataFormatada = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000))
    .toISOString()
    .slice(0, 19);

  // 2. Objeto de agendamento alinhado com as propriedades do AtendimentoPostDTO
  const dadosAgendamento = {
    idPessoa: idClienteFinal,
    dataAtendimento: dataFormatada,
    statusAtendimento: 'Agendado',
    itens: itensCarrinho.map(item => ({
      idItem: Number(item.id),
      idFuncionario: Number((item as any).idFuncionarioSelecionado || (item as any).idFuncionario || 2),
      quantidade: Number(item.quantidade || 1),
      valorUnitario: Number(item.precoUnitario || 0)
    }))
  };

  // 3. Encapsula na propriedade 'dto' que o C# exige na assinatura [FromBody] AtendimentoPostDTO dto
  const payload = {
    dto: dadosAgendamento
  };

  console.log(`🚀 Criando Agendamento (Cliente ID ${idClienteFinal}):`, payload);

  return this.http.post(this.apiUrlAtendimento, payload);
}
}