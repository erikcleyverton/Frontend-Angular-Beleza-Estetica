import { Routes } from '@angular/router';

// Módulo 1 - Loja Virtual
import { Home } from './components/loja/home/home';
import { CadastroClienteComponent } from './components/loja/cadastro-cliente/cadastro-cliente';
import { CatalogoComponent } from './components/loja/catalogo/catalogo';
import { CarrinhoComponent } from './components/loja/carrinho/carrinho';

// Módulo 2 - Painel Administrativo
import { CadastroItemComponent } from './components/admin/cadastro-item/cadastro-item';
import { EntradaProdutoComponent } from './components/admin/entrada-produto/entrada-produto';
import { ClientesComponent } from './pages/admin/clientes/clientes';
import { ConsultaEstoqueComponent } from './pages/admin/estoque/estoque';
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
  { path: 'admin', redirectTo: 'admin/clientes', pathMatch: 'full' },
  { path: 'admin/itens', component: CadastroItemComponent },
  { path: 'admin/entrada-produto', component: EntradaProdutoComponent },
  { path: 'admin/clientes', component: ClientesComponent },
  { path: 'admin/estoque', component: ConsultaEstoqueComponent },
  { path: 'admin/pedidos', component: PedidosComponent },

  // Rota curinga para redirecionar em caso de 404
  { path: '**', redirectTo: 'home' }
];