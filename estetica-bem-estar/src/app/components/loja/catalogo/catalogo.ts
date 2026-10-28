import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CarrinhoService } from '../../../services/carrinho.service'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-catalogo',
  standalone: true,
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent implements OnInit {

  // Mapeamento dos produtos estáticos do catálogo
  private produtosFixos = [
    { id: 1, nome: 'Botox Facial', categoria: 'Tratamento Estético', precoUnitario: 350.00, imagem: 'assets/botox.jpg' },
    { id: 2, nome: 'Harmonização Facial', categoria: 'Procedimento Estético', precoUnitario: 890.00, imagem: 'assets/harmonizacao.jpg' },
    { id: 3, nome: 'Hidratante Facial', categoria: 'Produto para Pele', precoUnitario: 95.00, imagem: 'assets/hidratantefacial.jpg' },
    { id: 4, nome: 'Lavagem Especializada', categoria: 'Higienização Profunda', precoUnitario: 60.00, imagem: 'assets/lavagem.jpg' },
    { id: 5, nome: 'Massagem Corporal', categoria: 'Bem-Estar', precoUnitario: 130.00, imagem: 'assets/massagem.jpg' },
    { id: 6, nome: 'Massagem Facial', categoria: 'Bem-Estar', precoUnitario: 85.00, imagem: 'assets/massagemfacial.jpg' },
    { id: 7, nome: 'Tónico Facial', categoria: 'Produto para Pele', precoUnitario: 70.00, imagem: 'assets/tonico.jpg' }
  ];

  constructor(
    private router: Router,
    private carrinhoService: CarrinhoService
  ) { }

  ngOnInit(): void { }

  abrirDetalhes(idItem: number): void {
    console.log('Ver detalhes:', idItem);
  }

  adicionarAoCarrinho(idItem: number): void {
    const produto = this.produtosFixos.find(p => p.id === idItem);
    if (produto) {
      this.carrinhoService.adicionarItem(produto);
      alert(`${produto.nome} adicionado ao carrinho!`);
    }
  }

  voltar(): void {
    this.router.navigate(['/home']);
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro-cliente']);
  }

  irParaCarrinho(): void {
    this.router.navigate(['/carrinho']);
  }
}