import React, { useState } from 'react';
import { Plus, PlusCircle, MinusCircle, Check, Trash2 } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, LedgerRow, FormCard,
  TextField, SelectField, CheckboxField, ConfirmDelete, IconButton, CategoryChips
} from './ui';
import { uid, todayISO, addMonthsISO, fmtBRL, fmtDate, DEFAULT_CATEGORIES } from '../lib/ledger';

const SEP = { borderBottom: '1px solid #F2F2F7' };

export const FluxoTab: React.FC = () => {
  const { state, persist, pushHistory, confirmingId, setConfirmingId } = useLedger();

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
    next = pushHistory(next, 'renda-nova', `Renda cadastrada: ${item.nome}`, 0);
    persist(next);
    setIncomeForm(null);
  }

  function toggleIncomeReceived(item: typeof state.income[number]) {
    const isReceiving = !item.recebido;
    const income = state.income.map(r => r.id === item.id ? { ...r, recebido: !r.recebido } : r);

    // Se tiver conta vinculada, credita ou estorna
    let updatedAccounts = state.accounts;
    if (item.accountId) {
      updatedAccounts = state.accounts.map(acc => {
        if (acc.id === item.accountId) {
          return {
            ...acc,
            saldo: isReceiving ? acc.saldo + item.valor : acc.saldo - item.valor,
          };
        }
        return acc;
      });
    }

    let next = { ...state, income, accounts: updatedAccounts };
    if (isReceiving) {
      next = pushHistory(next, 'renda-recebida', `Recebido: ${item.nome}`, -item.valor);
      if (item.recorrente) {
        next = {
          ...next,
          income: [
            ...next.income,
            {
              id: uid(),
              nome: item.nome,
              valor: item.valor,
              data: addMonthsISO(item.data, 1),
              recorrente: true,
              recebido: false,
              accountId: item.accountId,
            }
          ]
        };
      }
    }
    persist(next);
  }

  function deleteIncome(id: string) {
    persist({ ...state, income: state.income.filter(r => r.id !== id) });
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

    let next = { ...state, fixedExpenses, accounts: updatedAccounts };
    if (isPaying) {
      next = pushHistory(next, 'gasto-fixo-pago', `Pago: ${item.nome}`, item.valor);
      if (item.recorrente) {
        next = {
          ...next,
          fixedExpenses: [
            ...next.fixedExpenses,
            {
              id: uid(),
              nome: item.nome,
              categoria: item.categoria,
              valor: item.valor,
              data: addMonthsISO(item.data, 1),
              recorrente: true,
              pago: false,
              accountId: item.accountId,
            }
          ]
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

        {state.income.length === 0 && !incomeForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>
            Nenhuma renda cadastrada ainda.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {[...state.income].sort((a, b) => a.data.localeCompare(b.data)).map(r => {
              const account = state.accounts?.find(a => a.id === r.accountId);
              return (
                <div key={r.id} style={SEP}>
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

        {state.fixedExpenses.length === 0 && !expenseForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>
            Nenhum gasto fixo cadastrado ainda.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {[...state.fixedExpenses].sort((a, b) => a.data.localeCompare(b.data)).map(g => {
              const account = state.accounts?.find(a => a.id === g.accountId);
              return (
                <div key={g.id} style={SEP}>
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
        )}
      </div>
    </div>
  );
};
