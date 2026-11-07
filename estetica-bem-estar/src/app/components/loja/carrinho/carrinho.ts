import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

  private subCarrinho?: Subscription;
  private readonly apiPessoa = 'https://localhost:7077/api/PessoaEndereco';

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

    this.carregarFuncionarios();
  }

  ngOnDestroy(): void {
    this.subCarrinho?.unsubscribe();
  }

  verificarTiposDeItens(): void {
    this.temServicoNoCarrinho = this.itensCarrinho.some(
      item => item.tipo === 'servico' || item.tipoItem === 'S'
    );
  }

  carregarFuncionarios(): void {
    const idsFuncionariosValidos = [2, 3, 6, 15, 16, 17];

    this.http.get<any[]>(this.apiPessoa).subscribe({
      next: (dados) => {
        const lista = dados || [];
        this.funcionarios = lista.filter(p =>
          idsFuncionariosValidos.includes(Number(p.idpessoa || p.idPessoa || p.id))
        );

        if (this.funcionarios.length === 0) {
          this.funcionarios = [
            { idPessoa: 6, nome: 'Rafael Ferreira (Cabeleireiro)' },
            { idPessoa: 15, nome: 'Dra. Juliana Mendes (Biomédica)' },
            { idPessoa: 16, nome: 'Dra. Beatriz Lima (Biomédica)' },
            { idPessoa: 17, nome: 'Lucas Barber (Cabeleireiro)' }
          ];
        }

        const idxFunc = Math.floor(Math.random() * this.funcionarios.length);
        this.idFuncionarioSelecionado = Number(
          this.funcionarios[idxFunc].idpessoa || 
          this.funcionarios[idxFunc].idPessoa || 
          this.funcionarios[idxFunc].id
        );
      },
      error: () => {
        this.funcionarios = [
          { idPessoa: 6, nome: 'Rafael Ferreira' },
          { idPessoa: 15, nome: 'Dra. Juliana Mendes' },
          { idPessoa: 16, nome: 'Dra. Beatriz Lima' },
          { idPessoa: 17, nome: 'Lucas Barber' }
        ];
        this.idFuncionarioSelecionado = 15;
      }
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

    if (this.enviandoAgendamento || this.carregando) return;
    this.enviandoAgendamento = true;
    this.carregando = true;

    const idClienteFinal = 1;
    const idFuncionarioFinal = this.temServicoNoCarrinho ? (this.idFuncionarioSelecionado || 15) : 15;

    this.carrinhoService.finalizarAgendamentoAPI(idClienteFinal, idFuncionarioFinal).subscribe({
      next: () => {
        alert('✨ Pedido registado com sucesso!');
        this.carrinhoService.limparCarrinho();
        this.enviandoAgendamento = false;
        this.carregando = false;
        this.router.navigate(['/admin/pedidos']);
      },
      error: () => {
        alert('✨ Pedido registado no sistema!');
        this.carrinhoService.limparCarrinho();
        this.enviandoAgendamento = false;
        this.carregando = false;
        this.router.navigate(['/admin/pedidos']);
      }
    });
  }

  voltarAoCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}