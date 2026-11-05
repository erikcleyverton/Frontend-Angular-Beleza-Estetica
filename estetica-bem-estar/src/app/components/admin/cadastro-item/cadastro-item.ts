import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CadastroItensService, ItemSistema } from '../../../services/cadastro.itens.service';

@Component({
  selector: 'app-cadastro-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-item.html',
  styleUrl: './cadastro-item.css'
})
export class CadastroItemComponent implements OnInit, OnDestroy {
  nomeItem: string = '';
  tipoItem: 'P' | 'S' = 'P';
  preco: number | null = null;
  descricao: string = '';
  filtroTipo: 'P' | 'S' = 'P';

  todosOsItens: ItemSistema[] = [];
  itensFiltrados: ItemSistema[] = [];

  private subItens?: Subscription;

  constructor(
    private cadastroItensService: CadastroItensService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subItens = this.cadastroItensService.obterItens().subscribe({
      next: (itens) => {
        this.todosOsItens = itens;
        this.filtrarTabela();
      }
    });
  }

  ngOnDestroy(): void {
    this.subItens?.unsubscribe();
  }

  alternarTipo(tipo: 'P' | 'S'): void {
    this.filtroTipo = tipo;
    this.tipoItem = tipo;
    this.filtrarTabela();
  }

  filtrarTabela(): void {
    this.itensFiltrados = this.todosOsItens.filter(
      item => item.tipoItem === this.filtroTipo || (this.filtroTipo === 'P' ? item.tipo === 'produto' : item.tipo === 'servico')
    );
  }

  salvarItem(): void {
    if (!this.nomeItem.trim()) {
      alert('Por favor, preencha o nome!');
      return;
    }

    if (!this.preco || this.preco <= 0) {
      alert('Por favor, insira um preço válido!');
      return;
    }

    const payload = {
      nomeItem: this.nomeItem,
      tipoItem: this.tipoItem,
      preco: Number(this.preco),
      descricao: this.descricao
    };

    this.cadastroItensService.cadastrarItem(payload).subscribe({
      next: (itemCadastrado) => {
        alert(`${this.tipoItem === 'P' ? 'Produto' : 'Serviço'} "${itemCadastrado.nome}" cadastrado com sucesso!`);
        this.limparFormulario();
      },
      error: (err) => {
        console.error('Erro ao cadastrar:', err);
        alert('Erro ao salvar item.');
      }
    });
  }

  limparFormulario(): void {
    this.nomeItem = '';
    this.preco = null;
    this.descricao = '';
  }

  voltarHome(): void {
    this.router.navigate(['/catalogo']);
  }
}