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
  filtroTipo: 'P' | 'S' = 'P';

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

    // Payload correspondente à estrutura do ProdutoDTO / ItemDTO[cite: 14]
    const payload = {
      // DADOS TABELA ITEM[cite: 14]
      idCategoria: 1,
      item: this.nomeItem.trim(),
      descricaoItem: this.descricao ? this.descricao.trim() : '',
      preco: Number(this.preco),
      tipoItem: this.tipoItem, 
      ativoProdutoServico: 'S',

      // DADOS TABELA PRODUTO[cite: 14]
      codigoPreco: this.tipoItem === 'P' ? 1 : null,
      precoVenda: Number(this.preco),
      unidade: this.tipoItem === 'P' ? 'UN' : ''
    };

    console.log('Dados enviados ao backend:', JSON.stringify(payload));

    this.cadastroItensService.cadastrarItem(payload as any).subscribe({
      next: () => {
        alert(`${this.tipoItem === 'P' ? 'Produto' : 'Serviço'} cadastrado com sucesso!`);
        this.limparFormulario();
        this.carregarItens();
      },
      error: (err: any) => {
        console.error('Erro vindo do backend:', err.error);
        const detalheErro = JSON.stringify(err.error);
        console.log('Detalhe serializado:', detalheErro);

        const mensagemBackend = err.error?.detalhe || err.error?.erro || err.error?.mensagem || 'Erro interno no servidor.';
        alert(`Falha no cadastro: ${mensagemBackend}`);
      }
    });
  }

  get itensFiltrados(): any[] {
    return this.itens.filter(item => {
      const tipo = item.tipoItem || item.tipo_item || 'P';
      return tipo === this.filtroTipo;
    });
  }

  alternarTipo(tipo: 'P' | 'S'): void {
    this.filtroTipo = tipo;
    this.tipoItem = tipo;
    this.limparFormulario(); // Garante formulário limpo ao alternar entre Produto e Serviço
  }

  limparFormulario(): void {
    this.idItem = 0;
    this.nomeItem = '';
    this.tipoItem = this.filtroTipo; // Mantém o tipo da aba ativa
    this.preco = 0;
    this.descricao = '';
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }
}