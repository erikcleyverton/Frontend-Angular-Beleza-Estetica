import { Routes } from '@angular/router';
import { Home } from './components/loja/home/home';
import { CadastroClienteComponent } from './components/loja/cadastro-cliente/cadastro-cliente';
import { CatalogoComponent } from './components/loja/catalogo/catalogo';
import { CarrinhoComponent } from './components/loja/carrinho/carrinho';
import { CadastroItemComponent } from './components/admin/cadastro-item/cadastro-item';
import { EntradaProdutoComponent } from './components/admin/entrada-produto/entrada-produto';
import { EstoqueComponent } from './pages/admin/estoque/estoque';
import { PedidosComponent } from './pages/admin/pedidos/pedidos';

export const routes: Routes = [
  // Módulo 1 - Loja Virtual
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'cadastro-cliente', component: CadastroClienteComponent },
  { path: 'cadastro-cliente/:id', component: CadastroClienteComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'carrinho', component: CarrinhoComponent },

  // Módulo 2 - Painel Administrativo
  { path: 'admin/itens', component: CadastroItemComponent },
  { path: 'admin/entrada-produto', component: EntradaProdutoComponent },
  { path: 'admin', redirectTo: 'admin/itens', pathMatch: 'full' },
  { path: 'admin/estoque', component: EstoqueComponent },
  { path: 'admin/pedidos', component: PedidosComponent},
  
  { path: '**', redirectTo: 'home' }
];