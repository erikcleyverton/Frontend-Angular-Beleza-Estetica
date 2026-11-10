import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {
  todosClientes: any[] = [];
  clientesFiltrados: any[] = [];
  buscaId: string = '';
  carregando: boolean = false;

  clienteEditando: any | null = null;
  salvandoEdicao: boolean = false;

  // IDs dos funcionários a filtrar da listagem
  private idsFuncionarios: number[] = [2, 6, 15, 16, 17];

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private cd: ChangeDetectorRef // Injetado para forçar a renderização do Angular
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  voltarHome(): void {
    this.router.navigate(['/home']);
  }

  carregarClientes(): void {
    this.carregando = true;
    this.buscaId = ''; 

    this.clienteService.obterTodos().subscribe({
      next: (dados: any[]) => {
        const lista = Array.isArray(dados) ? dados : [];

        // Exclui os funcionários da listagem de clientes
        this.todosClientes = lista.filter(p => {
          const id = Number(p.idPessoa ?? p.id);
          return !this.idsFuncionarios.includes(id);
        });

        // Cria uma nova referência de array para o Angular perceber a mudança de estado
        this.clientesFiltrados = [...this.todosClientes];
        this.carregando = false;

        // FORÇA A ATUALIZAÇÃO DA TELA INSTANTANEAMENTE
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error('Erro ao carregar clientes:', err);
        this.carregando = false;
        this.cd.detectChanges();
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.buscaId || this.buscaId.toString().trim() === '') {
      this.clientesFiltrados = [...this.todosClientes];
      return;
    }

    const term = this.buscaId.toString().trim().toLowerCase();

    this.clientesFiltrados = this.todosClientes.filter(c => {
      const idStr = (c.idPessoa ?? c.id)?.toString() || '';
      const nomeStr = (c.nomePessoa || c.nome || '').toString().toLowerCase();
      return idStr.includes(term) || nomeStr.includes(term);
    });
  }

  iniciarEdicao(cliente: any): void {
    this.clienteEditando = {
      ...cliente,
      nomePessoa: cliente.nomePessoa || cliente.nome || ''
    };
  }

  cancelarEdicao(): void {
    this.clienteEditando = null;
  }

  salvarEdicao(): void {
    if (!this.clienteEditando) return;

    this.salvandoEdicao = true;

    const payload = {
      ...this.clienteEditando,
      idPessoa: Number(this.clienteEditando.idPessoa || this.clienteEditando.id),
      nome: this.clienteEditando.nomePessoa || this.clienteEditando.nome,
      nomePessoa: this.clienteEditando.nomePessoa || this.clienteEditando.nome
    };

    this.clienteService.atualizarCliente(payload).subscribe({
      next: () => {
        alert('Cliente atualizado com sucesso no banco de dados!');
        this.clienteEditando = null;
        this.salvandoEdicao = false;
        this.carregarClientes();
      },
      error: (err: any) => {
        console.error('Erro na atualização:', err);
        alert('Erro ao guardar no banco: ' + (err.error?.erro || err.error?.message || err.message || 'Erro no servidor'));
        this.salvandoEdicao = false;
        this.cd.detectChanges();
      }
    });
  }

  excluirCliente(cliente: any): void {
    const id = cliente.idPessoa || cliente.id;
    const nome = cliente.nomePessoa || cliente.nome;

    if (confirm(`Tem certeza que deseja excluir o cliente ${nome} (#${id})?`)) {
      this.clienteService.excluirCliente(id).subscribe({
        next: () => {
          alert('Cliente excluído com sucesso!');
          this.carregarClientes();
        },
        error: (err: any) => {
          console.error('Erro ao excluir cliente:', err);
          alert('Erro ao excluir cliente: ' + (err.error?.erro || err.error?.message || 'Falha no servidor'));
          this.cd.detectChanges();
        }
      });
    }
  }
}