// ─── Tipos do Livro-caixa e Controle Financeiro ─────────────────────────────

export type AccountType = 'corrente' | 'carteira' | 'cartao' | 'poupanca' | 'investimento';

export interface Account {
  id: string;
  nome: string;
  instituicao: string; // Ex: Nubank, Itaú, Carteira, Inter
  tipo: AccountType;
  saldo: number;
  cor?: string;
}

export interface Bill {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  vencimento: string; // ISO YYYY-MM-DD
  recorrente: boolean;
  pago: boolean;
  accountId?: string;
}

export interface Debt {
  id: string;
  credor: string;
  valorTotal: number;
  valorPago: number;
  taxaJuros: number; // % a.m.
  dataInicio: string;
}

export interface Installment {
  id: string;
  descricao: string;
  categoria?: string;
  valorTotal: number;
  parcelas: number;
  valorParcela: number;
  parcelasPagas: number;
  dataInicio: string;
  accountId?: string;
}

export interface IncomeItem {
  id: string;
  nome: string;
  categoria?: string;
  valor: number;
  data: string;
  recorrente: boolean;
  recebido: boolean;
  accountId?: string;
}

export interface FixedExpense {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  data: string;
  recorrente: boolean;
  pago: boolean;
  accountId?: string;
}

export interface HistoryEntry {
  id: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  saldoApos: number;
}

export interface LedgerState {
  accounts: Account[];
  bills: Bill[];
  debts: Debt[];
  installments: Installment[];
  income: IncomeItem[];
  fixedExpenses: FixedExpense[];
  history: HistoryEntry[];
}

export interface Totals {
  totalFaturas: number;
  totalDividas: number;
  totalParcelamentos: number;
  rendaTotalMes: number;
  rendaRecebida: number;
  rendaAReceber: number;
  rendaMensal: number;
  gastosFixosMensais: number;
  gastosFixosPagos: number;
  faturasPagas: number;
  comprometimentoMensal: number;
  saldoLivreMensal: number;
  saldoDevedor: number;
  saldoTotalContas: number;
  faturasAtrasadas: number;
  faturasVencendoHoje: number;
  faturasVencendo7Dias: number;
}

export type TabId = 'resumo' | 'contas' | 'fluxo' | 'faturas' | 'dividas' | 'parcelamentos' | 'historico';
