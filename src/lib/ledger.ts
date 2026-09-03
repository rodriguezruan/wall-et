import type { LedgerState, Totals } from '../types/ledger';

export const STORAGE_KEY = 'wall-et-ledger-v1';

export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Lazer & Assinaturas',
  'Saúde',
  'Educação',
  'Compras',
  'Outros',
];

export const EMPTY_STATE: LedgerState = {
  accounts: [],
  bills: [],
  debts: [],
  installments: [],
  income: [],
  fixedExpenses: [],
  history: [],
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addMonthsISO(iso: string, months: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  const t = new Date(todayISO() + 'T00:00:00');
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

export function fmtBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(v) ? v : 0
  );
}

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function computeTotals(state: LedgerState): Totals {
  const totalFaturas = (state.bills || []).filter(b => !b.pago).reduce((s, b) => s + b.valor, 0);
  const faturasPagas = (state.bills || []).filter(b => b.pago).reduce((s, b) => s + b.valor, 0);

  const totalDividas = (state.debts || []).reduce((s, d) => s + Math.max(0, d.valorTotal - d.valorPago), 0);
  const totalParcelamentos = (state.installments || []).reduce(
    (s, i) => s + Math.max(0, i.parcelas - i.parcelasPagas) * i.valorParcela,
    0
  );
  const parcelasMensaisAtivas = (state.installments || [])
    .filter(i => i.parcelasPagas < i.parcelas)
    .reduce((s, i) => s + i.valorParcela, 0);

  // Rendas: todas as rendas (pontuais + recorrentes)
  const rendaRecebida = (state.income || []).filter(r => r.recebido).reduce((s, r) => s + r.valor, 0);
  const rendaAReceber = (state.income || []).filter(r => !r.recebido).reduce((s, r) => s + r.valor, 0);
  const rendaTotalMes = rendaRecebida + rendaAReceber;

  // Gastos
  const gastosFixosMensais = (state.fixedExpenses || []).reduce((s, g) => s + g.valor, 0);
  const gastosFixosPagos = (state.fixedExpenses || []).filter(g => g.pago).reduce((s, g) => s + g.valor, 0);

  const comprometimentoMensal = gastosFixosMensais + totalFaturas + parcelasMensaisAtivas;
  const saldoLivreMensal = rendaTotalMes - comprometimentoMensal;

  // Saldo total disponível em contas ou caixa
  // Se o usuário tiver contas cadastradas, usa a soma das contas.
  // Se ainda não cadastrou contas bancárias específicas, calcula o saldo real em caixa: total recebido - total pago!
  let saldoTotalContas = 0;
  if (state.accounts && state.accounts.length > 0) {
    saldoTotalContas = state.accounts.reduce((acc, a) => acc + (a.saldo || 0), 0);
  } else {
    saldoTotalContas = rendaRecebida - faturasPagas - gastosFixosPagos;
  }

  // Alertas de vencimento
  const faturasAtrasadas = (state.bills || []).filter(b => !b.pago && daysUntil(b.vencimento) < 0).length;
  const faturasVencendoHoje = (state.bills || []).filter(b => !b.pago && daysUntil(b.vencimento) === 0).length;
  const faturasVencendo7Dias = (state.bills || []).filter(b => !b.pago && daysUntil(b.vencimento) > 0 && daysUntil(b.vencimento) <= 7).length;

  return {
    totalFaturas,
    totalDividas,
    totalParcelamentos,
    rendaTotalMes,
    rendaRecebida,
    rendaAReceber,
    rendaMensal: rendaTotalMes,
    gastosFixosMensais,
    gastosFixosPagos,
    faturasPagas,
    comprometimentoMensal,
    saldoLivreMensal,
    saldoDevedor: totalFaturas + totalDividas + totalParcelamentos,
    saldoTotalContas,
    faturasAtrasadas,
    faturasVencendoHoje,
    faturasVencendo7Dias,
  };
}

export interface CategoryBreakdownItem {
  categoria: string;
  valor: number;
  percentual: number;
}

export function computeCategoryBreakdown(state: LedgerState): CategoryBreakdownItem[] {
  const map: Record<string, number> = {};

  // Gastos fixos mensais
  (state.fixedExpenses || []).forEach(g => {
    const cat = g.categoria?.trim() || 'Outros';
    map[cat] = (map[cat] || 0) + g.valor;
  });

  // Faturas ativas (não pagas)
  (state.bills || []).filter(b => !b.pago).forEach(b => {
    const cat = b.categoria?.trim() || 'Outros';
    map[cat] = (map[cat] || 0) + b.valor;
  });

  // Parcelas ativas
  (state.installments || []).filter(i => i.parcelasPagas < i.parcelas).forEach(i => {
    const cat = i.categoria?.trim() || 'Compras';
    map[cat] = (map[cat] || 0) + i.valorParcela;
  });

  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(map)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: Math.round((valor / total) * 100),
    }))
    .sort((a, b) => b.valor - a.valor);
}

export function loadState(): LedgerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...EMPTY_STATE,
        ...parsed,
        accounts: parsed.accounts || [],
      };
    }
  } catch {
    // ignore
  }
  return EMPTY_STATE;
}

export function saveState(state: LedgerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
