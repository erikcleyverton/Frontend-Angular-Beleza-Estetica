import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CarrinhoService, ItemCarrinho } from '../../../services/carrinho.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-carrinho',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrinho.html',
  styleUrls: ['./carrinho.css']
})
export class CarrinhoComponent implements OnInit, OnDestroy {
  itensCarrinho: ItemCarrinho[] = [];
  valorTotal: number = 0;
  enviandoAgendamento: boolean = false;
  carregando: boolean = false;

  funcionarios: any[] = [];
  idFuncionarioSelecionado: number | null = null;
  temServicoNoCarrinho: boolean = false;

  // ID da Carly Rae Jepsen (localizado dinamicamente pelas APIs)
  idClienteCarly: number | null = null;

  private subCarrinho?: Subscription;
  private readonly apiPessoa = 'https://localhost:7077/api/Pessoa';
  private readonly apiPessoaEndereco = 'https://localhost:7077/api/PessoaEndereco';

  constructor(
    private carrinhoService: CarrinhoService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subCarrinho = this.carrinhoService.itens$.subscribe({
      next: (itens: ItemCarrinho[]) => {
        this.itensCarrinho = itens || [];
        this.verificarTiposDeItens();
        this.calcularTotal();
      }
    });

    this.carregarDadosDasDuasApis();
  }

  ngOnDestroy(): void {
    this.subCarrinho?.unsubscribe();
  }

  verificarTiposDeItens(): void {
    this.temServicoNoCarrinho = this.itensCarrinho.some(
      item => item.tipo === 'servico' || item.tipoItem === 'S'
    );
  }

  carregarDadosDasDuasApis(): void {
    const idsFuncionariosValidos = [2, 3, 6, 15, 16, 17];

    forkJoin({
      pessoas: this.http.get<any[]>(this.apiPessoa).pipe(catchError(() => of([]))),
      pessoasEndereco: this.http.get<any[]>(this.apiPessoaEndereco).pipe(catchError(() => of([])))
    }).subscribe(({ pessoas, pessoasEndereco }) => {
      const listaUnificada = [...(pessoas || []), ...(pessoasEndereco || [])];

      // 1. Localiza automaticamente a cliente Carly Rae Jepsen
      const registroCarly = listaUnificada.find(item => {
        const nome = item?.nome || item?.pessoa?.nome || '';
        return nome.toLowerCase().includes('carly');
      });

      if (registroCarly) {
        const p = registroCarly.pessoa || registroCarly;
        this.idClienteCarly = Number(p.idpessoa || p.idPessoa || p.id);
        localStorage.setItem('idPessoa', String(this.idClienteCarly));
        localStorage.setItem('nomeCliente', p.nome || 'Carly Rae Jepsen');
        console.log('Carly Rae Jepsen localizada com ID:', this.idClienteCarly);
      } else {
        const idSalvo = localStorage.getItem('idPessoa');
        if (idSalvo) {
          this.idClienteCarly = Number(idSalvo);
        }
        console.warn('Carly não encontrada nas APIs. ID em cache:', this.idClienteCarly);
      }

      // 2. Carrega funcionários sem duplicar
      const mapaFuncs = new Map<number, any>();
      listaUnificada.forEach(item => {
        const p = item?.pessoa || item;
        const id = Number(p.idpessoa || p.idPessoa || p.id);
        if (idsFuncionariosValidos.includes(id) && !mapaFuncs.has(id)) {
          mapaFuncs.set(id, p);
        }
      });

      this.funcionarios = Array.from(mapaFuncs.values());

      if (this.funcionarios.length === 0) {
        this.funcionarios = [
          { idPessoa: 6, nome: 'Rafael Ferreira (Cabeleireiro)' },
          { idPessoa: 15, nome: 'Dra. Juliana Mendes (Biomédica)' },
          { idPessoa: 16, nome: 'Dra. Beatriz Lima (Biomédica)' },
          { idPessoa: 17, nome: 'Lucas Barber (Cabeleireiro)' }
        ];
      }

      const idxFunc = Math.floor(Math.random() * this.funcionarios.length);
      const funcEscolhido = this.funcionarios[idxFunc];
      this.idFuncionarioSelecionado = Number(
        funcEscolhido.idpessoa || funcEscolhido.idPessoa || funcEscolhido.id
      );
    });
  }

  calcularTotal(): void {
    this.valorTotal = this.carrinhoService.obterTotal();
  }

  removerItem(id: number): void {
    this.carrinhoService.removerItem(id);
  }

  limparCarrinho(): void {
    this.carrinhoService.limparCarrinho();
  }

  alterarQuantidade(item: ItemCarrinho, delta: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const quantidadeAtual = Number(item.quantidade || 1);
    const novaQtd = quantidadeAtual + delta;

    if (novaQtd <= 0) {
      this.removerItem(item.id);
    } else {
      this.carrinhoService.atualizarQuantidadeItem(item.id, novaQtd);
    }
  }

  finalizarAtendimento(): void {
    if (this.itensCarrinho.length === 0) {
      alert('O seu carrinho está vazio!');
      return;
    }

    if (!this.idClienteCarly) {
      alert('Não foi possível localizar o cadastro da cliente Carly Rae Jepsen na API.');
      return;
    }

    if (this.enviandoAgendamento || this.carregando) return;
    this.enviandoAgendamento = true;
    this.carregando = true;

    const idClienteFinal = this.idClienteCarly;
    const idFuncionarioFinal = this.temServicoNoCarrinho ? (this.idFuncionarioSelecionado || 15) : 15;

    this.carrinhoService.finalizarAgendamentoAPI(idClienteFinal, idFuncionarioFinal).subscribe({
      next: () => {
        localStorage.setItem('idPessoa', String(idClienteFinal));
        alert('✨ Pedido registado com sucesso para Carly Rae Jepsen!');
        this.carrinhoService.limparCarrinho();
        this.enviandoAgendamento = false;
        this.carregando = false;
        this.router.navigate(['/meus-pedidos']);
      },
      error: (err) => {
        console.error('Erro detalhado ao finalizar pedido:', err?.error || err);
        alert('Erro ao registar o pedido: ' + (err?.error?.message || err?.error || 'Verifique o console (F12).'));
        this.enviandoAgendamento = false;
        this.carregando = false;
      }
    });
  }

  voltarAoCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}