import React, { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { SectionHeader, GhostButton, FormCard, TextField, ConfirmDelete, ProgressBar } from './ui';
import { uid, todayISO, fmtBRL } from '../lib/ledger';

const SEP = { borderBottom: '1px solid #F2F2F7' };

export const ParcelamentosTab: React.FC = () => {
  const { state, persist, pushHistory, confirmingId, setConfirmingId } = useLedger();
  const [instForm, setInstForm] = useState<{ descricao: string; valorTotal: string; parcelas: string; dataInicio: string; } | null>(null);

  function saveInstallment() {
    if (!instForm?.descricao.trim() || !instForm.valorTotal || !instForm.parcelas) return;
    const parcelas = parseInt(instForm.parcelas, 10);
    const valorTotal = parseFloat(instForm.valorTotal);
    const inst = { id: uid(), descricao: instForm.descricao.trim(), valorTotal, parcelas, valorParcela: valorTotal / parcelas, parcelasPagas: 0, dataInicio: instForm.dataInicio };
    let next = { ...state, installments: [...state.installments, inst] };
    next = pushHistory(next, 'parcelamento-novo', `Parcelamento: ${inst.descricao}`, valorTotal);
    persist(next); setInstForm(null);
  }

  function payInstallment(inst: typeof state.installments[number]) {
    if (inst.parcelasPagas >= inst.parcelas) return;
    const parcelasPagas = inst.parcelasPagas + 1;
    let next = { ...state, installments: state.installments.map(i => i.id === inst.id ? { ...i, parcelasPagas } : i) };
    next = pushHistory(next, 'parcela-paga', `Parcela ${parcelasPagas}/${inst.parcelas}: ${inst.descricao}`, inst.valorParcela);
    persist(next);
  }

  function deleteInstallment(id: string) { persist({ ...state, installments: state.installments.filter(i => i.id !== id) }); setConfirmingId(null); }

  return (
    <div className="panel p-5">
      <SectionHeader icon={Layers} title="Parcelamentos" action={!instForm &&
        <GhostButton onClick={() => setInstForm({ descricao: '', valorTotal: '', parcelas: '', dataInicio: todayISO() })}>
          <Plus size={12} strokeWidth={2.5} /> Novo parcelamento
        </GhostButton>}
      />
      {instForm && (
        <FormCard>
          <div className="flex gap-3 flex-wrap">
            <TextField label="Descrição" placeholder="Ex: Notebook, TV..." value={instForm.descricao} onChange={e => setInstForm({ ...instForm, descricao: e.target.value })} />
            <TextField label="Valor total (R$)" type="number" step="0.01" placeholder="0,00" value={instForm.valorTotal} onChange={e => setInstForm({ ...instForm, valorTotal: e.target.value })} />
          </div>
          <div className="flex gap-3 flex-wrap">
            <TextField label="Nº de parcelas" type="number" placeholder="12" value={instForm.parcelas} onChange={e => setInstForm({ ...instForm, parcelas: e.target.value })} />
            <TextField label="1ª parcela em" type="date" value={instForm.dataInicio} onChange={e => setInstForm({ ...instForm, dataInicio: e.target.value })} />
          </div>
          {instForm.valorTotal && instForm.parcelas && parseInt(instForm.parcelas) > 0 && (
            <p style={{ fontSize: 11.5, color: '#6E6E73' }}>
              Por parcela:{' '}
              <span style={{ fontWeight: 600, color: '#1D1D1F', fontFamily: 'monospace' }}>
                {fmtBRL(parseFloat(instForm.valorTotal) / parseInt(instForm.parcelas))}
              </span>
            </p>
          )}
          <div className="flex gap-2"><GhostButton onClick={saveInstallment} tone="paid">Salvar</GhostButton><GhostButton onClick={() => setInstForm(null)}>Cancelar</GhostButton></div>
        </FormCard>
      )}
      {state.installments.length === 0 && !instForm
        ? <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>Nenhum parcelamento cadastrado ainda.</p>
        : <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {state.installments.map(i => {
              const quitado = i.parcelasPagas >= i.parcelas;
              const restante = Math.max(0, i.parcelas - i.parcelasPagas) * i.valorParcela;
              return (
                <div key={i.id} style={{ ...SEP, padding: '14px 0' }}>
                  <div className="flex items-start justify-between gap-3" style={{ marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F' }}>{i.descricao}</div>
                      <div style={{ fontSize: 11.5, color: '#6E6E73', marginTop: 3 }}>
                        Parcela{' '}
                        <span style={{ fontWeight: 600, color: '#1D1D1F' }}>
                          {Math.min(i.parcelasPagas + 1, i.parcelas)}/{i.parcelas}
                        </span>
                        {' '}· {fmtBRL(i.valorParcela)} cada
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: quitado ? '#59694A' : '#1D1D1F' }}>
                        {fmtBRL(restante)}
                      </span>
                      {confirmingId === i.id
                        ? <ConfirmDelete onConfirm={() => deleteInstallment(i.id)} onCancel={() => setConfirmingId(null)} />
                        : <button onClick={() => setConfirmingId(i.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 2 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#C24138'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8E8E93'; }}>
                            <Trash2 size={13} strokeWidth={1.7} />
                          </button>
                      }
                    </div>
                  </div>
                  <ProgressBar pct={(i.parcelasPagas / i.parcelas) * 100} done={quitado} />
                  {!quitado && (
                    <div style={{ marginTop: 10 }}>
                      <GhostButton small onClick={() => payInstallment(i)} tone="paid">
                        Marcar parcela {i.parcelasPagas + 1} como paga
                      </GhostButton>
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
