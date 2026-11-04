import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CarrinhoService } from '../../../services/carrinho.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class CatalogoComponent implements OnInit {
  termoBusca: string = '';
  filtroTipo: string = 'todos'; // 'todos', 'produto' ou 'servico' (RF03)

  // RF01, RF10 (Produtos) e RF11 (Serviços): Flag 'tipo' para diferenciar itens de estoque de procedimentos
  public produtosFixos = [
    {
      id: 1,
      nome: 'Botox Facial',
      precoUnitario: 350.00,
      categoria: 'Procedimentos Faciais',
      tipo: 'servico',
      descricao: 'Tratamento para suavizar linhas de expressão e rugas, proporcionando uma pele rejuvenescida.',
      imagem: 'assets/botox.jpg'
    },
    {
      id: 2,
      nome: 'Harmonização Facial',
      precoUnitario: 890.00,
      categoria: 'Procedimentos Faciais',
      tipo: 'servico',
      descricao: 'Procedimento estético para equilibrar os traços do rosto e realçar a sua beleza natural.',
      imagem: 'assets/harmonizacao.jpg'
    },
    {
      id: 3,
      nome: 'Hidratante Facial',
      precoUnitario: 95.00,
      categoria: 'Produtos',
      tipo: 'produto',
      descricao: 'Hidratação profunda para restaurar a maciez e o brilho saudável da pele.',
      imagem: 'assets/hidratante.jpg'
    },
    {
      id: 4,
      nome: 'Lavagem Especializada',
      precoUnitario: 60.00,
      categoria: 'Tratamentos',
      tipo: 'servico',
      descricao: 'Higienização profunda dos poros para remoção de impurezas.',
      imagem: 'assets/lavagem.jpg'
    },
    {
      id: 5,
      nome: 'Massagem Corporal',
      precoUnitario: 130.00,
      categoria: 'Massoterapia',
      tipo: 'servico',
      descricao: 'Técnica relaxante para alívio de tensões e renovação das energias.',
      imagem: 'assets/massagem-corporal.jpg'
    },
    {
      id: 6,
      nome: 'Massagem Facial',
      precoUnitario: 85.00,
      categoria: 'Massoterapia',
      tipo: 'servico',
      descricao: 'Estímulo da circulação e relaxamento dos músculos faciais.',
      imagem: 'assets/massagem-facial.jpg'
    },
    {
      id: 7,
      nome: 'Tónico Facial',
      precoUnitario: 70.00,
      categoria: 'Produtos',
      tipo: 'produto',
      descricao: 'Equilibra o pH da pele, fecha os poros e deixa a pele fresca durante todo o dia.',
      imagem: 'assets/tonico.jpg'
    }
  ];

  produtosFiltrados: any[] = [];

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService
  ) {}

  ngOnInit(): void {
    this.produtosFiltrados = [...this.produtosFixos];
  }

  // RF02 & RF03: Filtragem simultânea por Texto (ID/Nome) e Tipo (Produto/Serviço)
  filtrarProdutos(): void {
    const busca = this.termoBusca.toLowerCase().trim();

    this.produtosFiltrados = this.produtosFixos.filter(prod => {
      const atendeTexto = !busca || 
        (prod.nome || '').toLowerCase().includes(busca) || 
        (prod.id || '').toString().includes(busca);

      const atendeTipo = this.filtroTipo === 'todos' || prod.tipo === this.filtroTipo;

      return atendeTexto && atendeTipo;
    });
  }

  setFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.filtrarProdutos();
  }

  limparFiltro(): void {
    this.termoBusca = '';
    this.filtroTipo = 'todos';
    this.produtosFiltrados = [...this.produtosFixos];
  }

  adicionarAoCarrinho(produto: any): void {
    this.carrinhoService.adicionarItem({
      id: Number(produto.id),
      nome: produto.nome,
      precoUnitario: Number(produto.precoUnitario),
      categoria: produto.categoria,
      imagem: produto.imagem
    });

    alert(`${produto.nome} foi adicionado ao carrinho!`);
  }

  abrirDetalhes(id: number): void {
    console.log('Detalhes ID:', id);
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  irParaCadastro(): void {
    this.router.navigate(['/cliente']);
  }

  irParaCarrinho(): void {
    this.router.navigate(['/carrinho']);
  }
}