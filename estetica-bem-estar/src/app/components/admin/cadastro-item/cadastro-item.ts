import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CadastroItensService } from '../../../services/cadastro.itens.service';

@Component({
  selector: 'app-cadastro-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-item.html',
  styleUrl: './cadastro-item.css'
})
export class CadastroItemComponent implements OnInit {

  idItem = 0;
  nomeItem = '';
  tipoItem = 'P';
  preco = 0;
  descricao = '';

  itens: any[] = [];

  constructor(
    private cadastroItensService: CadastroItensService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarItens();
  }

  carregarItens(): void {
    this.cadastroItensService.obterItens().subscribe({
      next: (dados: any[]) => {
        this.itens = dados;
      },
      error: (err: any) => console.error('Erro ao carregar itens:', err)
    });
  }

  salvarItem(): void {
    if (!this.nomeItem.trim() || this.preco <= 0) {
      alert('Preencha o nome do item e um preço válido!');
      return;
    }
  
    // Payload correspondente à estrutura exata do ProdutoDTO
    const payload = {
      // DADOS TABELA ITEM
      idCategoria: 1, // Certifique-se de que a categoria ID 1 existe no seu banco
      item: this.nomeItem.trim(),
      descricaoItem: this.descricao ? this.descricao.trim() : '',
      preco: Number(this.preco),
      tipoItem: this.tipoItem, 
      ativoProdutoServico: 'S',
  
      // DADOS TABELA PRODUTO
      codigoPreco: 1,
      precoVenda: Number(this.preco),
      unidade: 'UN'
    };
  
    console.log('Dados enviados ao backend:', JSON.stringify(payload));
  
    this.cadastroItensService.cadastrarItem(payload as any).subscribe({
      next: () => {
        alert('Item cadastrado com sucesso!');
        this.limparFormulario();
        this.carregarItens();
      },
      error: (err: any) => {
        console.error('Erro detalhado da API:', err);
        alert('Erro 500 no servidor. Verifique o console do Visual Studio para a exceção do C#.');
      }
    });
  }
  limparFormulario(): void {
    this.idItem = 0;
    this.nomeItem = '';
    this.tipoItem = 'P';
    this.preco = 0;
    this.descricao = '';
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}