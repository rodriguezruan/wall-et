import React, { useState, useMemo } from 'react';
import { Plus, Check, Trash2, Receipt, Calendar } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, LedgerRow, FormCard,
  TextField, SelectField, CheckboxField, ConfirmDelete, IconButton, CategoryChips
} from './ui';
import { uid, todayISO, addMonthsISO, daysUntil, fmtBRL, fmtDate, fmtMonthYear, DEFAULT_CATEGORIES } from '../lib/ledger';
import type { Bill } from '../types/ledger';

interface BillMonthGroup {
  monthKey: string;
  items: Bill[];
  total: number;
  paid: number;
  open: number;
}

export const FaturasTab: React.FC = () => {
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

  const [billForm, setBillForm] = useState<{
    nome: string;
    categoria: string;
    valor: string;
    vencimento: string;
    recorrente: boolean;
    accountId: string;
  } | null>(null);

  const billGroups = useMemo(() => {
    const groupsMap = new Map<string, typeof state.bills>();
    const sorted = [...(state.bills || [])].sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));

    sorted.forEach(b => {
      const key = (b.vencimento || todayISO()).slice(0, 7);
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(b);
    });

    const result: BillMonthGroup[] = [];
    groupsMap.forEach((items, monthKey) => {
      if (filterMonth === 'todos' || filterMonth === monthKey) {
        const total = items.reduce((s, b) => s + b.valor, 0);
        const paid = items.filter(b => b.pago).reduce((s, b) => s + b.valor, 0);
        const open = total - paid;
        result.push({ monthKey, items, total, paid, open });
      }
    });

    return result;
  }, [state.bills, filterMonth]);

  function saveBill() {
    if (!billForm?.nome.trim() || !billForm.valor || !billForm.vencimento) return;
    const bill = {
      id: uid(),
      nome: billForm.nome.trim(),
      categoria: billForm.categoria.trim() || 'Outros',
      valor: parseFloat(billForm.valor),
      vencimento: billForm.vencimento,
      recorrente: billForm.recorrente,
      pago: false,
      accountId: billForm.accountId || undefined,
    };
    let next = { ...state, bills: [...state.bills, bill] };
    next = pushHistory(next, 'fatura-nova', `Fatura: ${bill.nome}`, bill.valor);
    persist(next);
    setBillForm(null);
  }

  function toggleBillPaid(bill: typeof state.bills[number]) {
    const isPaying = !bill.pago;
    const bills = state.bills.map(b => b.id === bill.id ? { ...b, pago: !b.pago } : b);

    // Se tiver conta vinculada, debita ou estorna
    let updatedAccounts = state.accounts;
    if (bill.accountId) {
      updatedAccounts = state.accounts.map(acc => {
        if (acc.id === bill.accountId) {
          return {
            ...acc,
            saldo: isPaying ? acc.saldo - bill.valor : acc.saldo + bill.valor,
          };
        }
        return acc;
      });
    }

    let next = { ...state, bills, accounts: updatedAccounts };
    if (isPaying) {
      next = pushHistory(next, 'fatura-paga', `Pagamento: ${bill.nome}`, bill.valor);
      if (bill.recorrente) {
        next = {
          ...next,
          bills: [
            ...next.bills,
            {
              id: uid(),
              nome: bill.nome,
              categoria: bill.categoria,
              valor: bill.valor,
              vencimento: addMonthsISO(bill.vencimento, 1),
              recorrente: true,
              pago: false,
              accountId: bill.accountId,
            }
          ]
        };
      }
    } else {
      next = pushHistory(next, 'fatura-reaberta', `Pagamento desfeito: ${bill.nome}`, -bill.valor);
    }
    persist(next);
  }

  function deleteBill(id: string) {
    persist({ ...state, bills: state.bills.filter(b => b.id !== id) });
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

      {/* Resumo rápido no topo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="panel p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-1">
            Total em Aberto ({fmtMonthYear(selectedMonth)})
          </span>
          <span className="text-[20px] font-bold font-mono text-[#C24138]">
            {fmtBRL(totals.totalFaturas)}
          </span>
        </div>
        <div className="panel p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-1">
            Atrasadas
          </span>
          <span className={`text-[20px] font-bold font-mono ${totals.faturasAtrasadas > 0 ? 'text-[#C24138]' : 'text-[#59694A]'}`}>
            {totals.faturasAtrasadas} {totals.faturasAtrasadas === 1 ? 'conta' : 'contas'}
          </span>
        </div>
        <div className="panel p-4 col-span-2 md:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-1">
            Vencendo Hoje / 7 dias
          </span>
          <span className="text-[20px] font-bold font-mono text-[#1D1D1F]">
            {totals.faturasVencendoHoje + totals.faturasVencendo7Dias} contas
          </span>
        </div>
      </div>

      {/* Lista e formulário */}
      <div className="panel p-5">
        <SectionHeader
          icon={Receipt}
          title="Faturas & Contas a Pagar"
          action={!billForm && (
            <GhostButton
              onClick={() => setBillForm({
                nome: '',
                categoria: DEFAULT_CATEGORIES[0],
                valor: '',
                vencimento: todayISO(),
                recorrente: false,
                accountId: state.accounts?.[0]?.id || '',
              })}
            >
              <Plus size={12} strokeWidth={2.5} /> Nova fatura
            </GhostButton>
          )}
        />

        {billForm && (
          <FormCard>
            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Nome da Fatura / Boleto"
                placeholder="Ex: Aluguel, Luz, Internet, Cartão XP"
                required
                value={billForm.nome}
                onChange={e => setBillForm({ ...billForm, nome: e.target.value })}
              />
              <TextField
                label="Valor (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                required
                value={billForm.valor}
                onChange={e => setBillForm({ ...billForm, valor: e.target.value })}
              />
            </div>

            {/* Categorias rápidas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider">
                  Categoria: <strong className="text-[#1D1D1F]">{billForm.categoria}</strong>
                </span>
              </div>
              <CategoryChips
                selected={billForm.categoria}
                onSelect={cat => setBillForm({ ...billForm, categoria: cat })}
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Data de Vencimento"
                type="date"
                required
                value={billForm.vencimento}
                onChange={e => setBillForm({ ...billForm, vencimento: e.target.value })}
              />

              {state.accounts && state.accounts.length > 0 && (
                <SelectField
                  label="Pagar com a Conta"
                  value={billForm.accountId}
                  onChange={e => setBillForm({ ...billForm, accountId: e.target.value })}
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
              label="Recorrente — gerar automaticamente a do próximo mês ao pagar"
              checked={billForm.recorrente}
              onChange={v => setBillForm({ ...billForm, recorrente: v })}
            />

            <div className="flex gap-2 pt-1">
              <GhostButton onClick={saveBill} tone="paid">Salvar fatura</GhostButton>
              <GhostButton onClick={() => setBillForm(null)}>Cancelar</GhostButton>
            </div>
          </FormCard>
        )}

        {billGroups.length === 0 && !billForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '12px 0' }}>
            Nenhuma fatura cadastrada {filterMonth !== 'todos' ? `para ${fmtMonthYear(filterMonth)}` : 'ainda'}.
          </p>
        ) : (
          <div className="space-y-5 pt-2">
            {billGroups.map(group => (
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
                      · {group.items.length} {group.items.length === 1 ? 'conta' : 'contas'}
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
                        {fmtBRL(group.paid)}
                      </span>
                    </div>
                    {group.open > 0 && (
                      <div className="border-l border-[#D7E2CD] pl-3">
                        <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#C24138] block">
                          Em Aberto
                        </span>
                        <span className="font-bold font-mono text-[#C24138]">
                          {fmtBRL(group.open)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linhas de Faturas daquele Mês */}
                <div className="divide-y divide-[#F2F2F7]">
                  {group.items.map(b => {
                    const account = state.accounts?.find(a => a.id === b.accountId);
                    const dias = daysUntil(b.vencimento);
                    const statusSub = b.pago
                      ? 'pago'
                      : dias < 0
                      ? `atrasada há ${Math.abs(dias)}d`
                      : dias === 0
                      ? 'vence hoje'
                      : `vence em ${dias}d`;

                    return (
                      <div key={b.id}>
                        <LedgerRow
                          label={`${b.nome}${b.recorrente ? ' ↻' : ''}`}
                          sub={`${b.categoria || 'Geral'} · vence ${fmtDate(b.vencimento)} · ${statusSub}${account ? ` · (${account.instituicao})` : ''}`}
                          value={fmtBRL(b.valor)}
                          tone={b.pago ? 'paid' : dias < 0 ? 'debt' : dias <= 7 ? 'warn' : 'default'}
                          strong={!b.pago}
                          right={
                            confirmingId === b.id ? (
                              <ConfirmDelete onConfirm={() => deleteBill(b.id)} onCancel={() => setConfirmingId(null)} />
                            ) : (
                              <span className="flex gap-0.5">
                                <IconButton
                                  icon={Check}
                                  onClick={() => toggleBillPaid(b)}
                                  active={b.pago}
                                  title={b.pago ? 'Reabrir fatura' : 'Marcar como paga'}
                                />
                                <IconButton
                                  icon={Trash2}
                                  onClick={() => setConfirmingId(b.id)}
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
