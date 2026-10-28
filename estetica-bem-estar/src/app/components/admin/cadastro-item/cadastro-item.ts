import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-item.html',
  styleUrl: './cadastro-item.css'
})
export class CadastroItemComponent implements OnInit {

  private readonly apiUrl = 'https://localhost:7077/api/itens';

  // Campos do formulário
  nome = '';
  idCategoria = 1; // ID padrão de categoria
  descricaoItem = '';
  preco = 0;
  tipoItem = 'P'; // 'P' para Produto, 'S' para Serviço
  ativoProdutoServico = 'S';

  // Lista de itens cadastrados
  listaItens: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.carregarItens();
  }

  // Busca todos os produtos e serviços na API C#
  carregarItens(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (dados) => this.listaItens = dados,
      error: (erro) => console.error('Erro ao carregar itens:', erro)
    });
  }

  // Cadastra um novo item
  salvarItem(): void {
    if (!this.nome || this.preco <= 0) {
      alert('Por favor, preencha o nome e um preço válido!');
      return;
    }

    const novoItem = {
      nome: this.nome,
      idCategoria: Number(this.idCategoria),
      descricaoItem: this.descricaoItem,
      preco: Number(this.preco),
      tipoItem: this.tipoItem,
      ativoProdutoServico: this.ativoProdutoServico
    };

    this.http.post(this.apiUrl, novoItem).subscribe({
      next: () => {
        alert('Item cadastrado com sucesso!');
        this.limparFormulario();
        this.carregarItens(); // Atualiza a tabela
      },
      error: (erro) => {
        console.error('Erro ao salvar item:', erro);
        alert('Erro ao cadastrar item. Verifique o console.');
      }
    });
  }

  limparFormulario(): void {
    this.nome = '';
    this.idCategoria = 1;
    this.descricaoItem = '';
    this.preco = 0;
    this.tipoItem = 'P';
    this.ativoProdutoServico = 'S';
  }
}