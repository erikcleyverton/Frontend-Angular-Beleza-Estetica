import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstoqueService, ItemEstoque } from '../../../services/estoque.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estoque.html', // <--- Mude de './estoque.component.html' para './estoque.html'
  styleUrl: './estoque.css'       // <--- Mude de './estoque.component.css' para './estoque.css'
})
export class EstoqueComponent implements OnInit {
  // ... mantenha o restante do código igual


  listaEstoque: ItemEstoque[] = [];
  estoqueFiltrado: ItemEstoque[] = [];
  termoBusca: string = '';

  constructor(
    private estoqueService: EstoqueService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarEstoque();
  }

  carregarEstoque(): void {
    this.estoqueService.obterEstoque().subscribe({
      next: (dados: ItemEstoque[]) => {
        console.log('Dados do Estoque:', dados);
        this.listaEstoque = dados;
        this.estoqueFiltrado = dados;
      },
      error: (err: any) => console.error('Erro ao carregar estoque:', err)
    });
  }

  filtrarEstoque(): void {
    if (!this.termoBusca.trim()) {
      this.estoqueFiltrado = this.listaEstoque;
      return;
    }

    const busca = this.termoBusca.toLowerCase();
    this.estoqueFiltrado = this.listaEstoque.filter(item => {
      const nome = item.item || item.nomeItem || '';
      return nome.toLowerCase().includes(busca) || item.idItem.toString().includes(busca);
    });
  }

  limparFiltro(): void {
    this.termoBusca = '';
    this.estoqueFiltrado = this.listaEstoque;
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}