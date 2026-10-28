import { Component, ChangeDetectorRef, OnInit } from '@angular/core'; 
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; 
import { ClienteService } from '../../../services/cliente.service';

@Component({
  selector: 'app-cadastro-cliente',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cadastro-cliente.html',
  styleUrl: './cadastro-cliente.css'
})
export class CadastroClienteComponent implements OnInit {

  // Atributos de controle
  id = 0;
  idCliente = 0;
  editar = false;

  // Campos do formulário
  nome = '';
  cpf = '';
  sexo = 'F';
  email = '';
  telefone = '';
  cep = '';
  rua_logradouro = '';
  bairro = '';
  cidade = '';
  uf = '';
  data_nascimento = '';

  constructor(
    private clienteService: ClienteService, 
    private route: ActivatedRoute,
    private router: Router, 
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Verifica se existe ID na rota (Modo Edição)
    this.route.params.subscribe((params: any) => {
      const id = Number(params['id']);
      if (id && id > 0) {
        this.idCliente = id;
        this.editar = true;
        this.carregarDadosCliente(this.idCliente); 
      } else {
        this.limparFormulario();
      }
    });
  }

  // Preenche os campos ao editar um cliente existente
  carregarDadosCliente(idCliente: number): void {
    this.clienteService.obterPorId(idCliente).subscribe({
      next: (cliente: any) => {
        this.id = cliente.idPessoa ?? cliente.id ?? 0;
        this.nome = cliente.nome ?? '';
        this.cpf = cliente.cpf ?? '';
        this.sexo = cliente.sexo ?? 'F';
        this.email = cliente.email ?? '';
        this.telefone = cliente.telefone ? String(cliente.telefone) : '';
        this.data_nascimento = cliente.dataNascimento ? cliente.dataNascimento.split('T')[0] : '';

        // Carrega dados do primeiro endereço da lista se existir
        if (cliente.enderecos && cliente.enderecos.length > 0) {
          const primeiroEndereco = cliente.enderecos[0];
          this.cep = primeiroEndereco.cep ?? '';
          this.rua_logradouro = primeiroEndereco.logradouro ?? '';
          this.bairro = primeiroEndereco.bairro ?? '';
          this.cidade = primeiroEndereco.cidade ?? '';
          this.uf = primeiroEndereco.uf ?? '';
        }

        this.cdr.detectChanges();
      }, 
      error: (erro: any) => {
        console.error("Erro ao carregar dados do cliente:", erro);
      }
    });
  }

  // Envia os dados para a API (Cadastrar ou Atualizar)
 enviaDadosCliente(): void {
  // Limpeza de caracteres especiais
  const cpfLimpo = this.cpf ? this.cpf.replace(/\D/g, '') : '';
  const cepLimpo = this.cep ? this.cep.replace(/\D/g, '') : '';
  
  // Data de nascimento
  const dataValida = (this.data_nascimento && this.data_nascimento.trim() !== '') 
    ? this.data_nascimento 
    : null;

  // Telefone mantido como texto limpo
  const telefoneLimpo = this.telefone ? this.telefone.replace(/\D/g, '') : '';

  // Payload híbrido (cobre tanto DTO plana quanto DTO com lista/objeto aninhado)
  const payloadCliente: any = {
    nome: this.nome,
    cpf: cpfLimpo,
    sexo: this.sexo ? this.sexo.charAt(0).toUpperCase() : 'F',
    email: this.email,
    telefone: telefoneLimpo,
    ativoPessoa: 'S',
    dataNascimento: dataValida,
    
    // Propriedades planas (caso o PessoaDto espere os dados no mesmo nível)
    cep: cepLimpo,
    logradouro: this.rua_logradouro || 'Rua não informada',
    bairro: this.bairro || 'Bairro não informado',
    cidade: this.cidade || 'Cidade não informada',
    uf: (this.uf || 'SE').toUpperCase().substring(0, 2),
    numero: '123',
    complemento: 'Sem complemento',

    // Propriedade aninhada de lista (caso o PessoaDto espere a propriedade 'enderecos')
    enderecos: [
      {
        cep: cepLimpo,
        logradouro: this.rua_logradouro || 'Rua não informada',
        bairro: this.bairro || 'Bairro não informado',
        cidade: this.cidade || 'Cidade não informada',
        uf: (this.uf || 'SE').toUpperCase().substring(0, 2),
        numero: '123',
        complemento: 'Sem complemento'
      }
    ]
  };

  if (!this.editar) {
    this.clienteService.cadastrarCliente(payloadCliente).subscribe({
      next: (resposta: any) => {
        alert("Cliente cadastrado com sucesso!");
        this.limparFormulario();
        this.router.navigate(['/catalogo']);
      },
      error: (erro: any) => {
        console.error("Erro detalhado do C#:", erro);
        // Exibe a mensagem de erro exata vinda do backend no console
        if (erro.error) {
          console.log("Corpo da resposta do erro:", erro.error);
        }
        alert("Ocorreu um erro ao salvar no servidor. Verifique o console para os detalhes do C#.");
      }
    });
  } else {
    payloadCliente.idPessoa = this.idCliente > 0 ? this.idCliente : this.id;
    this.clienteService.atualizarCliente(payloadCliente).subscribe({
      next: () => {
        alert("Cliente atualizado com sucesso!");
        this.limparFormulario();
        this.router.navigate(['/catalogo']);
      },
      error: (erro: any) => console.error("Erro ao atualizar cliente:", erro)
    });
  }
}
  // Reseta todos os campos do formulário
  limparFormulario(): void {
    this.id = 0;
    this.idCliente = 0;
    this.editar = false;
    this.nome = '';
    this.cpf = '';
    this.sexo = 'F';
    this.email = '';
    this.telefone = '';
    this.cep = '';
    this.rua_logradouro = '';
    this.bairro = '';
    this.cidade = '';
    this.uf = '';
    this.data_nascimento = '';
  }

  // Volta para o catálogo
  voltarAoCatalogo(): void {
    this.router.navigate(['/catalogo']);
  }
}