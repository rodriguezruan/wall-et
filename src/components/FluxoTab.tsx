import React, { useState, useMemo } from 'react';
import { Plus, PlusCircle, MinusCircle, Check, Trash2, Calendar } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, LedgerRow, FormCard,
  TextField, SelectField, CheckboxField, ConfirmDelete, IconButton, CategoryChips
} from './ui';
import { uid, todayISO, addMonthsISO, fmtBRL, fmtDate, fmtMonthYear, DEFAULT_CATEGORIES } from '../lib/ledger';

interface MonthGroup<T> {
  monthKey: string;
  items: T[];
  total: number;
  paidOrReceived: number;
  pending: number;
}

function groupByMonth<T extends { data: string; valor: number }>(
  items: T[],
  isPaidOrReceived: (item: T) => boolean
): MonthGroup<T>[] {
  const groupsMap = new Map<string, T[]>();
  const sorted = [...items].sort((a, b) => (a.data || '').localeCompare(b.data || ''));

  sorted.forEach(item => {
    const key = (item.data || todayISO()).slice(0, 7);
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(item);
  });

  const result: MonthGroup<T>[] = [];
  groupsMap.forEach((groupItems, monthKey) => {
    const total = groupItems.reduce((s, i) => s + i.valor, 0);
    const paidOrReceived = groupItems.filter(isPaidOrReceived).reduce((s, i) => s + i.valor, 0);
    const pending = total - paidOrReceived;
    result.push({ monthKey, items: groupItems, total, paidOrReceived, pending });
  });

  return result;
}

export const FluxoTab: React.FC = () => {
  const {
    state,
    totals,
    persist,
    pushHistory,
    confirmingId,
    setConfirmingId,
    selectedMonth,
    availableMonths,
  } = useLedger();

  const [filterMonth, setFilterMonth] = useState<string>('todos');
  const currentMonthISO = useMemo(() => todayISO().slice(0, 7), []);

  const incomeGroups = useMemo(() => {
    const all = groupByMonth(state.income || [], r => r.recebido);
    if (filterMonth === 'todos') return all;
    return all.filter(g => g.monthKey === filterMonth);
  }, [state.income, filterMonth]);

  const expenseGroups = useMemo(() => {
    const all = groupByMonth(state.fixedExpenses || [], g => g.pago);
    if (filterMonth === 'todos') return all;
    return all.filter(g => g.monthKey === filterMonth);
  }, [state.fixedExpenses, filterMonth]);

  // ── Renda ──────────────────────────────────────────────────────────────────
  const [incomeForm, setIncomeForm] = useState<{
    nome: string;
    valor: string;
    data: string;
    recorrente: boolean;
    accountId: string;
  } | null>(null);

  function saveIncome() {
    if (!incomeForm?.nome.trim() || !incomeForm.valor) return;
    const item = {
      id: uid(),
      nome: incomeForm.nome.trim(),
      valor: parseFloat(incomeForm.valor),
      data: incomeForm.data,
      recorrente: incomeForm.recorrente,
      recebido: false,
      accountId: incomeForm.accountId || undefined,
    };
    let next = { ...state, income: [...state.income, item] };
    next = pushHistory(next, 'renda-nova', `Renda cadastrada: ${item.nome}`, item.valor);
    persist(next);
    setIncomeForm(null);
  }

  function toggleIncomeReceived(item: typeof state.income[number]) {
    const isReceiving = !item.recebido;
    const income = state.income.map(r => r.id === item.id ? { ...r, recebido: !r.recebido } : r);

    // Se tiver contas cadastradas, credita ou estorna na conta vinculada (ou na primeira se não houver vinculada)
    let updatedAccounts = state.accounts || [];
    let targetAccountId = item.accountId;

    if (!targetAccountId && updatedAccounts.length > 0) {
      targetAccountId = updatedAccounts[0].id;
    }

    if (targetAccountId && updatedAccounts.length > 0) {
      updatedAccounts = updatedAccounts.map(acc => {
        if (acc.id === targetAccountId) {
          return {
            ...acc,
            saldo: isReceiving ? acc.saldo + item.valor : acc.saldo - item.valor,
          };
        }
        return acc;
      });
    }

    const nextDate = addMonthsISO(item.data, 1);
    const nextMonth = nextDate.slice(0, 7);

    let next = { ...state, income, accounts: updatedAccounts };
    if (isReceiving) {
      next = pushHistory(next, 'renda-recebida', `Recebido: ${item.nome}`, item.valor);
      if (item.recorrente) {
        const alreadyExists = next.income.some(
          r => r.id !== item.id &&
               r.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() &&
               (r.data || '').slice(0, 7) === nextMonth
        );

        if (!alreadyExists) {
          next = {
            ...next,
            income: [
              ...next.income,
              {
                id: uid(),
                nome: item.nome,
                valor: item.valor,
                data: nextDate,
                recorrente: true,
                recebido: false,
                accountId: item.accountId,
              }
            ]
          };
        }
      }
    } else {
      next = pushHistory(next, 'renda-estorno', `Estorno: ${item.nome}`, -item.valor);
      if (item.recorrente) {
        // Ao desmarcar recebimento, remove do próximo mês o registro recorrente não recebido
        next = {
          ...next,
          income: next.income.filter(
            r => !(
              r.id !== item.id &&
              r.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() &&
              (r.data || '').slice(0, 7) === nextMonth &&
              !r.recebido
            )
          )
        };
      }
    }
    persist(next);
  }

  function deleteIncome(id: string) {
    const item = state.income.find(r => r.id === id);
    let updatedAccounts = state.accounts || [];
    if (item?.recebido && item.accountId) {
      updatedAccounts = updatedAccounts.map(acc =>
        acc.id === item.accountId ? { ...acc, saldo: acc.saldo - item.valor } : acc
      );
    }
    let next = {
      ...state,
      accounts: updatedAccounts,
      income: state.income.filter(r => r.id !== id),
    };
    if (item) {
      next = pushHistory(next, 'renda-removida', `Renda removida: ${item.nome}`, -item.valor);
    }
    persist(next);
    setConfirmingId(null);
  }

  // ── Gastos fixos ───────────────────────────────────────────────────────────
  const [expenseForm, setExpenseForm] = useState<{
    nome: string;
    categoria: string;
    valor: string;
    data: string;
    recorrente: boolean;
    accountId: string;
  } | null>(null);

  function saveExpense() {
    if (!expenseForm?.nome.trim() || !expenseForm.valor) return;
    const item = {
      id: uid(),
      nome: expenseForm.nome.trim(),
      categoria: expenseForm.categoria.trim() || 'Outros',
      valor: parseFloat(expenseForm.valor),
      data: expenseForm.data,
      recorrente: expenseForm.recorrente,
      pago: false,
      accountId: expenseForm.accountId || undefined,
    };
    let next = { ...state, fixedExpenses: [...state.fixedExpenses, item] };
    next = pushHistory(next, 'gasto-fixo-novo', `Gasto fixo: ${item.nome}`, 0);
    persist(next);
    setExpenseForm(null);
  }

  function toggleExpensePaid(item: typeof state.fixedExpenses[number]) {
    const isPaying = !item.pago;
    const fixedExpenses = state.fixedExpenses.map(g => g.id === item.id ? { ...g, pago: !g.pago } : g);

    // Se tiver conta vinculada, debita ou estorna
    let updatedAccounts = state.accounts;
    if (item.accountId) {
      updatedAccounts = state.accounts.map(acc => {
        if (acc.id === item.accountId) {
          return {
            ...acc,
            saldo: isPaying ? acc.saldo - item.valor : acc.saldo + item.valor,
          };
        }
        return acc;
      });
    }

    const nextDate = addMonthsISO(item.data, 1);
    const nextMonth = nextDate.slice(0, 7);

    let next = { ...state, fixedExpenses, accounts: updatedAccounts };
    if (isPaying) {
      next = pushHistory(next, 'gasto-fixo-pago', `Pago: ${item.nome}`, item.valor);
      if (item.recorrente) {
        const alreadyExists = next.fixedExpenses.some(
          g => g.id !== item.id &&
               g.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() &&
               (g.data || '').slice(0, 7) === nextMonth
        );

        if (!alreadyExists) {
          next = {
            ...next,
            fixedExpenses: [
              ...next.fixedExpenses,
              {
                id: uid(),
                nome: item.nome,
                categoria: item.categoria,
                valor: item.valor,
                data: nextDate,
                recorrente: true,
                pago: false,
                accountId: item.accountId,
              }
            ]
          };
        }
      }
    } else {
      next = pushHistory(next, 'gasto-fixo-estorno', `Estorno: ${item.nome}`, -item.valor);
      if (item.recorrente) {
        // Ao desmarcar pagamento, remove do próximo mês o registro recorrente não pago
        next = {
          ...next,
          fixedExpenses: next.fixedExpenses.filter(
            g => !(
              g.id !== item.id &&
              g.nome.trim().toLowerCase() === item.nome.trim().toLowerCase() &&
              (g.data || '').slice(0, 7) === nextMonth &&
              !g.pago
            )
          )
        };
      }
    }
    persist(next);
  }

  function deleteExpense(id: string) {
    persist({ ...state, fixedExpenses: state.fixedExpenses.filter(g => g.id !== id) });
    setConfirmingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtro de Mês */}
      <div className="panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[#59694A]" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#1D1D1F]">
            Visualização por Mês:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[12px]">
          <button
            onClick={() => setFilterMonth('todos')}
            className={`pressable px-3 py-1.5 rounded-[50px] font-semibold text-[12px] transition-all cursor-pointer ${
              filterMonth === 'todos'
                ? 'bg-[#59694A] text-white shadow-xs'
                : 'bg-[#F2F2F7] text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
            style={{ border: 'none' }}
          >
            Todos os Meses
          </button>
          {availableMonths.map(m => (
            <button
              key={m}
              onClick={() => setFilterMonth(m)}
              className={`pressable px-3 py-1.5 rounded-[50px] font-semibold text-[12px] transition-all cursor-pointer shrink-0 ${
                filterMonth === m
                  ? 'bg-[#59694A] text-white shadow-xs'
                  : 'bg-[#F2F2F7] text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
              style={{ border: 'none' }}
            >
              {fmtMonthYear(m)} {m === currentMonthISO ? '· Atual' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Renda */}
      <div className="panel p-5">
        <SectionHeader
          icon={PlusCircle}
          title="Fontes de Renda"
          action={!incomeForm && (
            <GhostButton
              onClick={() => setIncomeForm({
                nome: '',
                valor: '',
                data: todayISO(),
                recorrente: true,
                accountId: state.accounts?.[0]?.id || '',
              })}
              tone="paid"
            >
              <Plus size={12} strokeWidth={2.5} /> Nova renda
            </GhostButton>
          )}
        />

        {/* Mini Painel de Rendas: Recebido vs A Receber */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-[15px] bg-[#FAFAFC] border border-[#E5E5EA]">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#59694A] block mb-0.5">
              Já Recebido
            </span>
            <span className="text-[15px] font-bold font-mono text-[#59694A]">
              {fmtBRL(totals.rendaRecebida)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B86B1B] block mb-0.5">
              A Receber
            </span>
            <span className="text-[15px] font-bold font-mono text-[#B86B1B]">
              {fmtBRL(totals.rendaAReceber)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-0.5">
              Total Previsto ({fmtMonthYear(selectedMonth)})
            </span>
            <span className="text-[15px] font-bold font-mono text-[#1D1D1F]">
              {fmtBRL(totals.rendaTotalMes)}
            </span>
          </div>
        </div>

        {incomeForm && (
          <FormCard>
            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Descrição da Renda"
                placeholder="Ex: Salário, Freela, Rendimento"
                required
                value={incomeForm.nome}
                onChange={e => setIncomeForm({ ...incomeForm, nome: e.target.value })}
              />
              <TextField
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                required
                value={incomeForm.valor}
                onChange={e => setIncomeForm({ ...incomeForm, valor: e.target.value })}
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Data de Recebimento"
                type="date"
                required
                value={incomeForm.data}
                onChange={e => setIncomeForm({ ...incomeForm, data: e.target.value })}
              />

              {state.accounts && state.accounts.length > 0 && (
                <SelectField
                  label="Depositar na Conta"
                  value={incomeForm.accountId}
                  onChange={e => setIncomeForm({ ...incomeForm, accountId: e.target.value })}
                >
                  <option value="">Nenhuma / Manual</option>
                  {state.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.instituicao} ({acc.nome})
                    </option>
                  ))}
                </SelectField>
              )}
            </div>

            <CheckboxField
              label="Recorrente — renda mensal (ex: salário recebido todo mês)"
              checked={incomeForm.recorrente}
              onChange={v => setIncomeForm({ ...incomeForm, recorrente: v })}
            />

            <div className="flex gap-2 pt-1">
              <GhostButton onClick={saveIncome} tone="paid">Salvar renda</GhostButton>
              <GhostButton onClick={() => setIncomeForm(null)}>Cancelar</GhostButton>
            </div>
          </FormCard>
        )}

        {incomeGroups.length === 0 && !incomeForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '12px 0' }}>
            Nenhuma renda cadastrada {filterMonth !== 'todos' ? `para ${fmtMonthYear(filterMonth)}` : 'ainda'}.
          </p>
        ) : (
          <div className="space-y-5 pt-2">
            {incomeGroups.map(group => (
              <div key={group.monthKey} className="space-y-1">
                {/* Separador Visual de Mês */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-[12px] bg-[#F7F9F4] border border-[#D7E2CD]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[6px] bg-[#EBF2E4] flex items-center justify-center text-[#59694A] shrink-0">
                      <Calendar size={13} />
                    </div>
                    <span className="text-[13px] font-bold text-[#1D1D1F] tracking-tight">
                      {fmtMonthYear(group.monthKey)}
                    </span>
                    {group.monthKey === currentMonthISO && (
                      <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#59694A] text-white px-2 py-0.5 rounded-[50px]">
                        Mês Atual
                      </span>
                    )}
                    <span className="text-[11px] text-[#8E8E93]">
                      · {group.items.length} {group.items.length === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11.5px]">
                    <div>
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#6E6E73] block">
                        Previsto
                      </span>
                      <span className="font-bold font-mono text-[#1D1D1F]">
                        {fmtBRL(group.total)}
                      </span>
                    </div>
                    <div className="border-l border-[#D7E2CD] pl-3">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#59694A] block">
                        Recebido
                      </span>
                      <span className="font-bold font-mono text-[#59694A]">
                        {fmtBRL(group.paidOrReceived)}
                      </span>
                    </div>
                    {group.pending > 0 && (
                      <div className="border-l border-[#D7E2CD] pl-3">
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#B86B1B] block">
                          A Receber
                        </span>
                        <span className="font-bold font-mono text-[#B86B1B]">
                          {fmtBRL(group.pending)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linhas de Renda daquele Mês */}
                <div className="divide-y divide-[#F2F2F7]">
                  {group.items.map(r => {
                    const account = state.accounts?.find(a => a.id === r.accountId);
                    return (
                      <div key={r.id}>
                        <LedgerRow
                          label={`${r.nome}${r.recorrente ? ' ↻' : ''}`}
                          sub={`${fmtDate(r.data)}${r.recebido ? ' · recebido' : ' · previsto'}${account ? ` · (${account.instituicao})` : ''}`}
                          value={fmtBRL(r.valor)}
                          tone={r.recebido ? 'paid' : 'default'}
                          strong={!r.recebido}
                          right={
                            confirmingId === r.id ? (
                              <ConfirmDelete onConfirm={() => deleteIncome(r.id)} onCancel={() => setConfirmingId(null)} />
                            ) : (
                              <span className="flex gap-0.5">
                                <IconButton
                                  icon={Check}
                                  onClick={() => toggleIncomeReceived(r)}
                                  active={r.recebido}
                                  title={r.recebido ? 'Reabrir renda' : 'Marcar como recebido'}
                                />
                                <IconButton
                                  icon={Trash2}
                                  onClick={() => setConfirmingId(r.id)}
                                  danger
                                />
                              </span>
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gastos fixos */}
      <div className="panel p-5">
        <SectionHeader
          icon={MinusCircle}
          title="Gastos Fixos Mensais"
          action={!expenseForm && (
            <GhostButton
              onClick={() => setExpenseForm({
                nome: '',
                categoria: DEFAULT_CATEGORIES[0],
                valor: '',
                data: todayISO(),
                recorrente: true,
                accountId: state.accounts?.[0]?.id || '',
              })}
            >
              <Plus size={12} strokeWidth={2.5} /> Novo gasto
            </GhostButton>
          )}
        />

        {expenseForm && (
          <FormCard>
            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Descrição"
                placeholder="Ex: Internet, Academia, Spotify"
                required
                value={expenseForm.nome}
                onChange={e => setExpenseForm({ ...expenseForm, nome: e.target.value })}
              />
              <TextField
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                required
                value={expenseForm.valor}
                onChange={e => setExpenseForm({ ...expenseForm, valor: e.target.value })}
              />
            </div>

            {/* Chips de categorias */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  Categoria: <strong className="text-[#1D1D1F]">{expenseForm.categoria}</strong>
                </span>
              </div>
              <CategoryChips
                selected={expenseForm.categoria}
                onSelect={cat => setExpenseForm({ ...expenseForm, categoria: cat })}
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Data de Cobrança"
                type="date"
                required
                value={expenseForm.data}
                onChange={e => setExpenseForm({ ...expenseForm, data: e.target.value })}
              />

              {state.accounts && state.accounts.length > 0 && (
                <SelectField
                  label="Debitar da Conta"
                  value={expenseForm.accountId}
                  onChange={e => setExpenseForm({ ...expenseForm, accountId: e.target.value })}
                >
                  <option value="">Nenhuma / Manual</option>
                  {state.accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.instituicao} ({acc.nome})
                    </option>
                  ))}
                </SelectField>
              )}
            </div>

            <CheckboxField
              label="Recorrente — cobrado todo mês"
              checked={expenseForm.recorrente}
              onChange={v => setExpenseForm({ ...expenseForm, recorrente: v })}
            />

            <div className="flex gap-2 pt-1">
              <GhostButton onClick={saveExpense} tone="paid">Salvar gasto</GhostButton>
              <GhostButton onClick={() => setExpenseForm(null)}>Cancelar</GhostButton>
            </div>
          </FormCard>
        )}

        {expenseGroups.length === 0 && !expenseForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '12px 0' }}>
            Nenhum gasto fixo cadastrado {filterMonth !== 'todos' ? `para ${fmtMonthYear(filterMonth)}` : 'ainda'}.
          </p>
        ) : (
          <div className="space-y-5 pt-2">
            {expenseGroups.map(group => (
              <div key={group.monthKey} className="space-y-1">
                {/* Separador Visual de Mês */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-[12px] bg-[#F7F9F4] border border-[#D7E2CD]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-[6px] bg-[#EBF2E4] flex items-center justify-center text-[#59694A] shrink-0">
                      <Calendar size={13} />
                    </div>
                    <span className="text-[13px] font-bold text-[#1D1D1F] tracking-tight">
                      {fmtMonthYear(group.monthKey)}
                    </span>
                    {group.monthKey === currentMonthISO && (
                      <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#59694A] text-white px-2 py-0.5 rounded-[50px]">
                        Mês Atual
                      </span>
                    )}
                    <span className="text-[11px] text-[#8E8E93]">
                      · {group.items.length} {group.items.length === 1 ? 'lançamento' : 'lançamentos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11.5px]">
                    <div>
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#6E6E73] block">
                        Total
                      </span>
                      <span className="font-bold font-mono text-[#1D1D1F]">
                        {fmtBRL(group.total)}
                      </span>
                    </div>
                    <div className="border-l border-[#D7E2CD] pl-3">
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#59694A] block">
                        Pago
                      </span>
                      <span className="font-bold font-mono text-[#59694A]">
                        {fmtBRL(group.paidOrReceived)}
                      </span>
                    </div>
                    {group.pending > 0 && (
                      <div className="border-l border-[#D7E2CD] pl-3">
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#C24138] block">
                          Pendente
                        </span>
                        <span className="font-bold font-mono text-[#C24138]">
                          {fmtBRL(group.pending)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linhas de Gastos Fixos daquele Mês */}
                <div className="divide-y divide-[#F2F2F7]">
                  {group.items.map(g => {
                    const account = state.accounts?.find(a => a.id === g.accountId);
                    return (
                      <div key={g.id}>
                        <LedgerRow
                          label={`${g.nome}${g.recorrente ? ' ↻' : ''}`}
                          sub={`${g.categoria || 'Geral'} · dia ${fmtDate(g.data)}${g.pago ? ' · pago' : ' · pendente'}${account ? ` · (${account.instituicao})` : ''}`}
                          value={fmtBRL(g.valor)}
                          tone={g.pago ? 'paid' : 'debt'}
                          strong={!g.pago}
                          right={
                            confirmingId === g.id ? (
                              <ConfirmDelete onConfirm={() => deleteExpense(g.id)} onCancel={() => setConfirmingId(null)} />
                            ) : (
                              <span className="flex gap-0.5">
                                <IconButton
                                  icon={Check}
                                  onClick={() => toggleExpensePaid(g)}
                                  active={g.pago}
                                  title={g.pago ? 'Reabrir gasto' : 'Marcar como pago'}
                                />
                                <IconButton
                                  icon={Trash2}
                                  onClick={() => setConfirmingId(g.id)}
                                  danger
                                />
                              </span>
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
