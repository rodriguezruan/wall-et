import React, { useState } from 'react';
import { Plus, Check, Trash2, Receipt } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, LedgerRow, FormCard,
  TextField, SelectField, CheckboxField, ConfirmDelete, IconButton, CategoryChips
} from './ui';
import { uid, todayISO, addMonthsISO, daysUntil, fmtBRL, fmtDate, DEFAULT_CATEGORIES } from '../lib/ledger';

const SEP = { borderBottom: '1px solid #F2F2F7' };

export const FaturasTab: React.FC = () => {
  const { state, totals, persist, pushHistory, confirmingId, setConfirmingId } = useLedger();
  const [billForm, setBillForm] = useState<{
    nome: string;
    categoria: string;
    valor: string;
    vencimento: string;
    recorrente: boolean;
    accountId: string;
  } | null>(null);

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

      {/* Resumo rápido no topo */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="panel p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-1">
            Total em Aberto
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

        {state.bills.length === 0 && !billForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>
            Nenhuma fatura cadastrada ainda.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {[...state.bills].sort((a, b) => a.vencimento.localeCompare(b.vencimento)).map(b => {
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
                <div key={b.id} style={SEP}>
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
        )}
      </div>
    </div>
  );
};
