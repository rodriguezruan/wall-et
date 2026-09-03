import React, { useState } from 'react';
import { Plus, Trash2, Landmark } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { SectionHeader, GhostButton, FormCard, TextField, ConfirmDelete, ProgressBar } from './ui';
import { uid, todayISO, fmtBRL } from '../lib/ledger';

const SEP = { borderBottom: '1px solid #F2F2F7' };

export const DividasTab: React.FC = () => {
  const { state, persist, pushHistory, confirmingId, setConfirmingId } = useLedger();
  const [debtForm, setDebtForm] = useState<{ credor: string; valorTotal: string; valorPago: string; taxaJuros: string; } | null>(null);
  const [debtPayment, setDebtPayment] = useState<Record<string, string>>({});

  function saveDebt() {
    if (!debtForm?.credor.trim() || !debtForm.valorTotal) return;
    const debt = { id: uid(), credor: debtForm.credor.trim(), valorTotal: parseFloat(debtForm.valorTotal), valorPago: parseFloat(debtForm.valorPago || '0'), taxaJuros: parseFloat(debtForm.taxaJuros || '0'), dataInicio: todayISO() };
    let next = { ...state, debts: [...state.debts, debt] };
    next = pushHistory(next, 'divida-nova', `Dívida: ${debt.credor}`, debt.valorTotal - debt.valorPago);
    persist(next); setDebtForm(null);
  }

  function payDebt(debt: typeof state.debts[number]) {
    const amount = parseFloat(debtPayment[debt.id] || '0');
    if (!amount || amount <= 0) return;
    const valorPago = Math.min(debt.valorTotal, debt.valorPago + amount);
    let next = { ...state, debts: state.debts.map(d => d.id === debt.id ? { ...d, valorPago } : d) };
    next = pushHistory(next, 'divida-pagamento', `Pagamento: ${debt.credor}`, amount);
    persist(next); setDebtPayment({ ...debtPayment, [debt.id]: '' });
  }

  function deleteDebt(id: string) { persist({ ...state, debts: state.debts.filter(d => d.id !== id) }); setConfirmingId(null); }

  return (
    <div className="panel p-5">
      <SectionHeader icon={Landmark} title="Dívidas" action={!debtForm &&
        <GhostButton onClick={() => setDebtForm({ credor: '', valorTotal: '', valorPago: '', taxaJuros: '' })}>
          <Plus size={12} strokeWidth={2.5} /> Nova dívida
        </GhostButton>}
      />
      {debtForm && (
        <FormCard>
          <div className="flex gap-3 flex-wrap">
            <TextField label="Credor" placeholder="Ex: Banco, pessoa..." value={debtForm.credor} onChange={e => setDebtForm({ ...debtForm, credor: e.target.value })} />
            <TextField label="Valor total (R$)" type="number" step="0.01" placeholder="0,00" value={debtForm.valorTotal} onChange={e => setDebtForm({ ...debtForm, valorTotal: e.target.value })} />
          </div>
          <div className="flex gap-3 flex-wrap">
            <TextField label="Já pago (R$)" type="number" step="0.01" placeholder="0,00" value={debtForm.valorPago} onChange={e => setDebtForm({ ...debtForm, valorPago: e.target.value })} />
            <TextField label="Juros a.m. (%, opcional)" type="number" step="0.01" placeholder="—" value={debtForm.taxaJuros} onChange={e => setDebtForm({ ...debtForm, taxaJuros: e.target.value })} />
          </div>
          <div className="flex gap-2"><GhostButton onClick={saveDebt} tone="paid">Salvar</GhostButton><GhostButton onClick={() => setDebtForm(null)}>Cancelar</GhostButton></div>
        </FormCard>
      )}
      {state.debts.length === 0 && !debtForm
        ? <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>Nenhuma dívida cadastrada ainda.</p>
        : <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {state.debts.map(d => {
              const restante = Math.max(0, d.valorTotal - d.valorPago);
              const pct = d.valorTotal ? Math.min(100, (d.valorPago / d.valorTotal) * 100) : 0;
              const quitado = restante === 0;
              return (
                <div key={d.id} style={{ ...SEP, padding: '14px 0' }}>
                  <div className="flex items-start justify-between gap-3" style={{ marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F' }}>{d.credor}</div>
                      <div style={{ fontSize: 11.5, color: '#6E6E73', marginTop: 3 }}>
                        {d.taxaJuros ? `${d.taxaJuros}% a.m. · ` : ''}
                        restante{' '}
                        <span style={{ fontWeight: 600, color: quitado ? '#59694A' : '#C24138' }}>
                          {fmtBRL(restante)}
                        </span>{' '}de {fmtBRL(d.valorTotal)}
                      </div>
                    </div>
                    {confirmingId === d.id
                      ? <ConfirmDelete onConfirm={() => deleteDebt(d.id)} onCancel={() => setConfirmingId(null)} />
                      : <button onClick={() => setConfirmingId(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 2 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C24138'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8E8E93'; }}>
                          <Trash2 size={13} strokeWidth={1.7} />
                        </button>
                    }
                  </div>
                  <ProgressBar pct={pct} done={quitado} />
                  {restante > 0 && (
                    <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                      <input type="number" step="0.01" placeholder="Valor do pagamento" value={debtPayment[d.id] || ''} onChange={e => setDebtPayment({ ...debtPayment, [d.id]: e.target.value })} className="field-input" style={{ maxWidth: 180 }} />
                      <GhostButton small onClick={() => payDebt(d)} tone="paid">Registrar pagamento</GhostButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      }
    </div>
  );
};
