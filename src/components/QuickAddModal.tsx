import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { TextField, SelectField, CheckboxField, CategoryChips } from './ui';
import { uid, todayISO, DEFAULT_CATEGORIES } from '../lib/ledger';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    closeQuickAdd,
    quickAddInitialType,
    state,
    persist,
    pushHistory,
  } = useLedger();

  const [tipo, setTipo] = useState<'despesa' | 'renda' | 'fatura'>('despesa');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(DEFAULT_CATEGORIES[0]);
  const [data, setData] = useState(todayISO());
  const [accountId, setAccountId] = useState('');
  const [recorrente, setRecorrente] = useState(false);

  useEffect(() => {
    if (isQuickAddOpen) {
      setTipo(quickAddInitialType);
      setNome('');
      setValor('');
      setCategoria(DEFAULT_CATEGORIES[0]);
      setData(todayISO());
      setRecorrente(false);
      setAccountId(state.accounts?.[0]?.id || '');
    }
  }, [isQuickAddOpen, quickAddInitialType, state.accounts]);

  if (!isQuickAddOpen) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !valor) return;

    const valNum = parseFloat(valor);
    if (isNaN(valNum) || valNum <= 0) return;

    if (tipo === 'despesa') {
      const expense = {
        id: uid(),
        nome: nome.trim(),
        categoria: categoria.trim(),
        valor: valNum,
        data,
        recorrente,
        pago: true,
        accountId: accountId || undefined,
      };

      let updatedAccounts = state.accounts || [];
      let targetAccountId = accountId;
      if (!targetAccountId && updatedAccounts.length > 0) {
        targetAccountId = updatedAccounts[0].id;
      }
      if (targetAccountId && updatedAccounts.length > 0) {
        updatedAccounts = updatedAccounts.map(acc =>
          acc.id === targetAccountId ? { ...acc, saldo: acc.saldo - valNum } : acc
        );
      }

      let next = {
        ...state,
        accounts: updatedAccounts,
        fixedExpenses: recorrente ? [...state.fixedExpenses, expense] : state.fixedExpenses,
      };
      next = pushHistory(next, 'despesa-rapida', `Gasto: ${expense.nome}`, valNum);
      persist(next);
    } else if (tipo === 'renda') {
      const income = {
        id: uid(),
        nome: nome.trim(),
        categoria: categoria.trim(),
        valor: valNum,
        data,
        recorrente,
        recebido: true,
        accountId: accountId || undefined,
      };

      // Se houver contas, soma o valor ao saldo da conta vinculada (ou primeira conta)
      let updatedAccounts = state.accounts || [];
      let targetAccountId = accountId;
      if (!targetAccountId && updatedAccounts.length > 0) {
        targetAccountId = updatedAccounts[0].id;
      }
      if (targetAccountId && updatedAccounts.length > 0) {
        updatedAccounts = updatedAccounts.map(acc =>
          acc.id === targetAccountId ? { ...acc, saldo: acc.saldo + valNum } : acc
        );
      }

      let next = {
        ...state,
        accounts: updatedAccounts,
        income: [...state.income, income],
      };
      next = pushHistory(next, 'renda-rapida', `Renda: ${income.nome}`, valNum);
      persist(next);
    } else if (tipo === 'fatura') {
      const bill = {
        id: uid(),
        nome: nome.trim(),
        categoria: categoria.trim(),
        valor: valNum,
        vencimento: data,
        recorrente,
        pago: false,
        accountId: accountId || undefined,
      };

      let next = {
        ...state,
        bills: [...state.bills, bill],
      };
      next = pushHistory(next, 'fatura-nova', `Fatura adicionada: ${bill.nome}`, valNum);
      persist(next);
    }

    closeQuickAdd();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) closeQuickAdd();
      }}
    >
      <div
        className="panel w-full max-w-lg p-6 relative"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        {/* Header do modal */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[17px] font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
              Lançamento Rápido
            </h3>
            <p className="text-[11.5px] text-[#6E6E73]">
              Insira gastos, ganhos ou contas a pagar em poucos cliques
            </p>
          </div>
          <button
            onClick={closeQuickAdd}
            className="pressable w-7 h-7 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Segmented control: Despesa / Renda / Fatura */}
        <div
          className="flex p-1 rounded-[11px] mb-5"
          style={{ background: '#F5F5F7', border: '1px solid #E5E5EA' }}
        >
          {(
            [
              { id: 'despesa', label: 'Gasto / Despesa' },
              { id: 'renda', label: 'Ganho / Renda' },
              { id: 'fatura', label: 'Fatura a Pagar' },
            ] as const
          ).map(t => {
            const active = tipo === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className="flex-1 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? (t.id === 'despesa' ? '#C24138' : t.id === 'renda' ? '#59694A' : '#1D1D1F') : '#6E6E73',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Valor de destaque */}
          <div>
            <label
              className="block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1"
            >
              Valor (R$)
            </label>
            <div className="relative flex items-center">
              <span
                className="absolute left-3.5 text-[17px] font-bold"
                style={{ color: tipo === 'renda' ? '#59694A' : '#C24138' }}
              >
                {tipo === 'renda' ? '+' : '-'} R$
              </span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="field-input font-mono text-[20px] font-bold"
                style={{ paddingLeft: '64px', height: '48px' }}
              />
            </div>
          </div>

          {/* Descrição */}
          <TextField
            label="Descrição"
            required
            placeholder={tipo === 'renda' ? 'Ex: Salário, PIX recebido' : 'Ex: Supermercado, Almoço, Gasolina'}
            value={nome}
            onChange={e => setNome(e.target.value)}
          />

          {/* Categoria rápida */}
          <div>
            <label className="block text-[11px] font-semibold text-[#6E6E73] uppercase tracking-wider mb-1">
              Categoria: <span className="font-bold text-[#1D1D1F]">{categoria}</span>
            </label>
            <CategoryChips
              selected={categoria}
              onSelect={cat => setCategoria(cat)}
            />
          </div>

          {/* Data e Conta */}
          <div className="flex gap-3 flex-wrap">
            <TextField
              label={tipo === 'fatura' ? 'Vencimento' : 'Data'}
              type="date"
              required
              value={data}
              onChange={e => setData(e.target.value)}
            />

            {state.accounts && state.accounts.length > 0 && (
              <SelectField
                label="Conta / Carteira"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
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

          {/* Recorrência */}
          <CheckboxField
            label={
              tipo === 'fatura'
                ? 'Fatura recorrente (gerar próxima ao pagar)'
                : tipo === 'renda'
                ? 'Renda mensal recorrente (ex: salário)'
                : 'Gasto recorrente (cobrado todo mês)'
            }
            checked={recorrente}
            onChange={setRecorrente}
          />

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5EA]">
            <button
              type="button"
              onClick={closeQuickAdd}
              className="pressable px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#6E6E73] hover:bg-[#F5F5F7] transition-colors"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pressable inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[13px] font-semibold text-white shadow-sm transition-all"
              style={{
                background: tipo === 'renda' ? '#59694A' : '#1D1D1F',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Confirmar lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
