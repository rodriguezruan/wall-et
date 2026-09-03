import type { LedgerState, Totals, Installment } from '../types/ledger';

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
  userProfile: { name: '', onboarded: false },
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

export interface InstallmentScheduleParcel {
  numero: number;
  total: number;
  dataVencimento: string;
  mes: string;
  valor: number;
  pago: boolean;
  isCurrentMonth: boolean;
}

export interface InstallmentSchedule {
  parcels: InstallmentScheduleParcel[];
  isDueThisMonth: boolean;
  isPaidForThisMonth: boolean;
  amountDueThisMonth: number;
  proximaParcela: InstallmentScheduleParcel | null;
}

/**
 * Retorna as informações de vencimento e cronograma de um parcelamento para um determinado mês (YYYY-MM).
 * Se a data de início for futura, não afeta o mês atual.
 */
export function getInstallmentSchedule(
  inst: Installment,
  currentMonthStr: string = todayISO().slice(0, 7)
): InstallmentSchedule {
  const parcels: InstallmentScheduleParcel[] = [];
  let isDueThisMonth = false;
  let isPaidForThisMonth = false;
  let amountDueThisMonth = 0;

  for (let k = 1; k <= inst.parcelas; k++) {
    const dueIso = addMonthsISO(inst.dataInicio, k - 1);
    const monthStr = dueIso.slice(0, 7);
    const isPaid = k <= inst.parcelasPagas;

    const parcelObj: InstallmentScheduleParcel = {
      numero: k,
      total: inst.parcelas,
      dataVencimento: dueIso,
      mes: monthStr,
      valor: inst.valorParcela,
      pago: isPaid,
      isCurrentMonth: monthStr === currentMonthStr,
    };

    parcels.push(parcelObj);

    // Avalia impacto no mês selecionado:
    if (monthStr === currentMonthStr) {
      if (!isPaid) {
        isDueThisMonth = true;
        amountDueThisMonth += inst.valorParcela;
      } else {
        isPaidForThisMonth = true;
      }
    } else if (monthStr < currentMonthStr && !isPaid) {
      // Parcela anterior atrasada (pendente)
      isDueThisMonth = true;
      amountDueThisMonth += inst.valorParcela;
    }
  }

  const proximaParcela = parcels.find(p => !p.pago) || null;

  return {
    parcels,
    isDueThisMonth,
    isPaidForThisMonth,
    amountDueThisMonth,
    proximaParcela,
  };
}

export function computeTotals(state: LedgerState): Totals {
  const totalFaturas = (state.bills || []).filter(b => !b.pago).reduce((s, b) => s + b.valor, 0);
  const faturasPagas = (state.bills || []).filter(b => b.pago).reduce((s, b) => s + b.valor, 0);

  const totalDividas = (state.debts || []).reduce((s, d) => s + Math.max(0, d.valorTotal - d.valorPago), 0);
  const totalParcelamentos = (state.installments || []).reduce(
    (s, i) => s + Math.max(0, i.parcelas - i.parcelasPagas) * i.valorParcela,
    0
  );

  // Parcelas ativas com vencimento no mês atual (ou em atraso)
  // Se a primeira parcela começa em um mês futuro, NÃO afeta o mês atual!
  const currentMonthStr = todayISO().slice(0, 7);
  const parcelasMensaisAtivas = (state.installments || []).reduce((s, i) => {
    const schedule = getInstallmentSchedule(i, currentMonthStr);
    return s + schedule.amountDueThisMonth;
  }, 0);

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

  // Total de obrigações brutas
  const totalObrigacoes = totalFaturas + totalDividas + totalParcelamentos;

  // Saldo devedor líquido ajustado pela renda/saldo disponível:
  // Se você adicionar renda, o saldo devedor pendente diminui; se remover a renda, ele volta a aumentar!
  const recursosDisponiveis = Math.max(0, saldoTotalContas > 0 ? saldoTotalContas : rendaTotalMes);
  const saldoDevedor = Math.max(0, totalObrigacoes - recursosDisponiveis);

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
    saldoDevedor,
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

  // Parcelas ativas do mês atual
  const currentMonthStr = todayISO().slice(0, 7);
  (state.installments || []).forEach(i => {
    const schedule = getInstallmentSchedule(i, currentMonthStr);
    if (schedule.amountDueThisMonth > 0) {
      const cat = i.categoria?.trim() || 'Compras';
      map[cat] = (map[cat] || 0) + schedule.amountDueThisMonth;
    }
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
        userProfile: parsed.userProfile || { name: 'Ruan', onboarded: true },
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
