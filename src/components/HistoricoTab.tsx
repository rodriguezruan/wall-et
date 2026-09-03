import React from 'react';
import { History } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { SectionHeader, LedgerRow } from './ui';
import { fmtBRL, fmtDate } from '../lib/ledger';

export const HistoricoTab: React.FC = () => {
  const { state } = useLedger();
  return (
    <div className="panel p-5">
      <SectionHeader icon={History} title="Histórico de lançamentos" />
      {state.history.length === 0
        ? <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>Nenhum lançamento ainda.</p>
        : <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {[...state.history].reverse().map(h => (
              <div key={h.id} style={{ borderBottom: '1px solid #F2F2F7' }}>
                <LedgerRow
                  label={h.descricao}
                  sub={`${fmtDate(h.data)} · saldo após: ${fmtBRL(h.saldoApos)}`}
                  value={`${h.valor >= 0 ? '+' : ''}${fmtBRL(h.valor)}`}
                  tone={h.valor >= 0 ? 'debt' : 'paid'}
                />
              </div>
            ))}
          </div>
      }
    </div>
  );
};
