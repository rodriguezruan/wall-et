import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { fmtBRL } from '../lib/ledger';

export const GreetingHeader: React.FC = () => {
  const { state, totals, openQuickAdd } = useLedger();

  const userName = state.userProfile?.name?.trim() || 'Ruan';

  const formattedToday = useMemo(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return (
    <div className="panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#59694A] bg-[#EBF2E4] px-3 py-0.5 rounded-[50px]">
            Painel Pessoal
          </span>
          <span className="text-[12px] text-[#8E8E93]">·</span>
          <span className="text-[12px] text-[#8E8E93] font-medium">
            {formattedToday}
          </span>
        </div>

        <h1 className="text-[26px] md:text-[28px] font-bold tracking-tight text-[#1D1D1F] leading-tight">
          Bem-vindo, {userName}!
        </h1>

        <p className="text-[13px] text-[#6E6E73] mt-1 max-w-xl leading-relaxed">
          {totals.faturasAtrasadas > 0
            ? `Você possui ${totals.faturasAtrasadas} conta atrasada precisando de atenção.`
            : totals.faturasVencendoHoje > 0
            ? `Você tem ${totals.faturasVencendoHoje} conta com vencimento programado para hoje.`
            : totals.rendaAReceber > 0
            ? `Você tem ${fmtBRL(totals.rendaAReceber)} a receber este mês. Saldo disponível atual: ${fmtBRL(totals.saldoTotalContas)}.`
            : totals.saldoLivreMensal >= 0
            ? `Seu fluxo financeiro do mês está positivo com sobra estimada de ${fmtBRL(totals.saldoLivreMensal)}.`
            : `Atenção: seus compromissos superam a renda prevista em ${fmtBRL(Math.abs(totals.saldoLivreMensal))}.`
          }
        </p>
      </div>

      <button
        onClick={() => openQuickAdd('despesa')}
        className="pressable inline-flex items-center gap-2 px-4 py-2.5 rounded-[50px] text-[12.5px] font-semibold text-white self-start md:self-auto hover:brightness-95 shrink-0"
        style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
      >
        <Plus size={14} strokeWidth={2.5} />
        <span>+ Lançamento Rápido</span>
      </button>
    </div>
  );
};
