import { Routes } from '@angular/router';

// Módulo 1 - Loja Virtual
import { Home } from './components/loja/home/home';
import { CadastroClienteComponent } from './components/loja/cadastro-cliente/cadastro-cliente';
import { CatalogoComponent } from './components/loja/catalogo/catalogo';
import { CarrinhoComponent } from './components/loja/carrinho/carrinho';
import { MeusPedidosComponent } from './components/loja/meus-pedidos/meus-pedidos';

// Módulo 2 - Painel Administrativo
import { CadastroItemComponent } from './components/admin/cadastro-item/cadastro-item';
import { EntradaProdutoComponent } from './components/admin/entrada-produto/entrada-produto';
import { CadastroCategoriaComponent } from './components/admin/cadastro-categoria/cadastro-categoria';
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
  { path: 'meus-pedidos', component: MeusPedidosComponent },

  // Módulo 2 - Painel Administrativo
  { path: 'admin', redirectTo: 'admin/clientes', pathMatch: 'full' },
  { path: 'admin/itens', component: CadastroItemComponent },
  { path: 'admin/categoria', component: CadastroCategoriaComponent },
  { path: 'admin/entrada-produto', component: EntradaProdutoComponent },
  { path: 'admin/clientes', component: ClientesComponent },
  { path: 'admin/estoque', component: ConsultaEstoqueComponent },
  { path: 'admin/pedidos', component: PedidosComponent },

  // Alias direto para compatibilidade de navegação
  { path: 'cadastro-categoria', component: CadastroCategoriaComponent },

  // Rota curinga para 404
  { path: '**', redirectTo: 'home' }
];