export interface Item {
  idItem: number;
  nome: string;
  descricaoItem: string;
  preco: number;
  tipoItem: 'P' | 'S'; 
  idCategoria: number;
  categoria?: string;
  ativo: boolean;
  quantidadeEstoque?: number;
}

export interface Cliente {
  idPessoa?: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  telefone: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

export interface Pedido {
  idAtendimento?: number;
  idPessoa: number;
  dataAtendimento?: string;
  statusAtendimento?: string;
  valorTotal?: number;
  itens: {
    idItem: number;
    quantidade: number;
    valorUnitario: number;
  }[];
}