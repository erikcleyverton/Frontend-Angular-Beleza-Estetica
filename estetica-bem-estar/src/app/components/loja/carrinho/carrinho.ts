import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CarrinhoService, ItemCarrinho } from '../../../services/carrinho.service';

export interface FuncionarioExibicao {
  idFuncionario: number;
  idPessoa: number;
  nome: string;
  cargo: string;
}

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrinho.html',
  styleUrl: './carrinho.css'
})
export class CarrinhoComponent implements OnInit, OnDestroy {
  itens: ItemCarrinho[] = [];
  total: number = 0;
  carregando: boolean = false;
  funcionarios: FuncionarioExibicao[] = [];
  
  private sub!: Subscription;
// Altera no topo do carrinho.ts:
private readonly apiUrlFuncionarios = 'https://localhost:7077/api/Funcionarios';
private readonly apiUrlPessoas = 'https://localhost:7077/api/Pessoas';
  /**
   * Mapeamento base alinhado com as pessoas cadastradas no MySQL:
   * Ethel (2), Fernanda (3), Rafael (6) e Lucas Barber (17)
   */
  private readonly funcionariosPadrao: FuncionarioExibicao[] = [
    { idFuncionario: 2, idPessoa: 2, nome: 'Ethel', cargo: 'Técnico' },
    { idFuncionario: 3, idPessoa: 3, nome: 'Fernanda Oliveira', cargo: 'Gerente' },
    { idFuncionario: 6, idPessoa: 6, nome: 'Rafael Ferreira', cargo: 'Cabeleireiro' },
    { idFuncionario: 17, idPessoa: 17, nome: 'Lucas Barber', cargo: 'Cabeleireiro' }
  ];

  // Lista de IDs de pessoas cadastradas na base MySQL para sorteio aleatório de cliente
  private readonly idsClientesValidos: number[] = [1, 2, 3, 5, 6, 11, 12, 13, 14, 15, 16, 17];

  constructor(
    private carrinhoService: CarrinhoService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.carrinhoService.itens$.subscribe(itens => {
      this.itens = itens;
      this.total = this.carrinhoService.obterTotal();
    });

    this.carregarFuncionariosComNome();
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  /**
   * Sorteia um cliente aleatório da base de dados caso não haja cliente logado
   */
  obterIdClienteDinamico(): number {
    const idSalvo = Number(
      localStorage.getItem('idCliente') || 
      localStorage.getItem('idPessoa') || 
      localStorage.getItem('idClienteLogado')
    );

    if (idSalvo && idSalvo > 0) {
      return idSalvo;
    }

    // Sortear um ID aleatório da lista de pessoas ativas no MySQL
    const indiceSorteado = Math.floor(Math.random() * this.idsClientesValidos.length);
    return this.idsClientesValidos[indiceSorteado];
  }

  /**
   * Identifica se o item é um Serviço (para exibir o dropdown de profissional no HTML)
   */
  eServico(item: any): boolean {
    if (!item) return false;
    const tipo = String(item.tipo || item.tipoItem || item.tipo_item || '').toLowerCase();
    const cat = String(item.categoria || '').toLowerCase();

    if (tipo === 'p' || tipo === 'produto' || cat.includes('produto')) {
      return false;
    }
    return true; 
  }

  /**
   * Carrega funcionários da API do C# e mescla com a lista local
   */
  carregarFuncionariosComNome(): void {
    forkJoin({
      funcionarios: this.http.get<any[]>(this.apiUrlFuncionarios).pipe(catchError(() => of([]))),
      pessoas: this.http.get<any[]>(this.apiUrlPessoas).pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        if (res.funcionarios && res.funcionarios.length > 0 && res.pessoas && res.pessoas.length > 0) {
          const daApi = res.funcionarios.map(f => {
            const idPes = f.idPessoa || f.idpessoa || f.id;
            const pessoaEncontrada = res.pessoas.find(p => Number(p.idPessoa || p.idpessoa || p.id) === Number(idPes));
            
            return {
              idFuncionario: Number(f.idFuncionario || f.idfuncionario || f.id || idPes),
              idPessoa: Number(idPes),
              nome: pessoaEncontrada ? (pessoaEncontrada.nome || pessoaEncontrada.nomePessoa) : `Profissional #${idPes}`,
              cargo: f.cargo || 'Profissional'
            };
          });

          const idsExistentes = new Set(daApi.map(f => f.idPessoa));
          const faltantes = this.funcionariosPadrao.filter(f => !idsExistentes.has(f.idPessoa));
          
          this.funcionarios = [...daApi, ...faltantes];
        } else {
          this.funcionarios = [...this.funcionariosPadrao];
        }
      }
    });
  }

  /**
   * Filtra quem pode realizar cada serviço de acordo com a função/cargo
   */
  obterFuncionariosPorServico(item: any): FuncionarioExibicao[] {
    if (!this.funcionarios || this.funcionarios.length === 0) return [];

    const nomeServico = String(item.nome || item.nomeItem || item.item || '').toLowerCase();
    const catServico = String(item.categoria || '').toLowerCase();

    // 1. Serviços Capilares -> Cabeleireiros (Rafael Ferreira e Lucas Barber)
    if (
      nomeServico.includes('corte') || 
      nomeServico.includes('cabelo') || 
      nomeServico.includes('barba') ||
      nomeServico.includes('estilização') ||
      catServico.includes('cabelo') ||
      catServico.includes('capilar')
    ) {
      return this.funcionarios.filter(f => 
        f.cargo.toLowerCase().includes('cabeleireiro') || 
        f.cargo.toLowerCase().includes('barbeiro')
      );
    }

    // 2. Procedimentos Estéticos / Botox -> Ethel (Técnico) e Fernanda (Gerente)
    if (
      nomeServico.includes('botox') || 
      nomeServico.includes('facial') || 
      nomeServico.includes('limpeza') || 
      catServico.includes('estética')
    ) {
      return this.funcionarios.filter(f => 
        f.cargo.toLowerCase().includes('esteticista') || 
        f.cargo.toLowerCase().includes('biomédic') || 
        f.cargo.toLowerCase().includes('técnico') ||
        f.cargo.toLowerCase().includes('gerente')
      );
    }

    return this.funcionarios;
  }

  aumentarQtd(item: ItemCarrinho): void {
    this.carrinhoService.aumentarQtd(item.id);
  }

  diminuirQtd(item: ItemCarrinho): void {
    this.carrinhoService.diminuirQtd(item.id);
  }

  removerItem(item: ItemCarrinho): void {
    this.carrinhoService.removerItem(item.id);
  }
finalizarAtendimento(): void {
  if (this.itens.length === 0) {
    alert('Seu carrinho está vazio!');
    return;
  }

  const servicoSemProfissional = this.itens.find(
    item => this.eServico(item) && !(item as any).idFuncionarioSelecionado
  );

  if (servicoSemProfissional) {
    alert(`Por favor, escolha o profissional responsável para o serviço: ${servicoSemProfissional.nome}`);
    return;
  }

  const idClienteSelecionado = this.obterIdClienteDinamico();
  this.carregando = true;

  this.carrinhoService.finalizarAgendamentoAPI(idClienteSelecionado).subscribe({
    next: () => {
      this.carregando = false;
      alert(`Agendamento/Pedido realizado com sucesso para o Cliente ID (${idClienteSelecionado})!`);
      this.carrinhoService.limparCarrinho();
      this.router.navigate(['/meus-pedidos']);
    },
    error: (err: any) => {
      this.carregando = false;
      console.error('❌ Erro 400 retornado pelo C#:', err);
      
      // Imprime a chave e valor dos erros do model validation do C#
      if (err.error && err.error.errors) {
        console.table(err.error.errors);
      } else if (err.error) {
        console.log('Mensagem da API:', JSON.stringify(err.error));
      }

      alert('Falha no Agendamento. Abra o console do navegador (F12) para ver a propriedade recusada.');
    }
  });
}
  voltarAoCatalogo(): void {
    this.router.navigate(['/home']);
  }
}