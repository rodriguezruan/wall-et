import React, { useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { fmtBRL, fmtMonthYear, todayISO } from '../lib/ledger';

export const GreetingHeader: React.FC = () => {
  const {
    state,
    totals,
    openQuickAdd,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    nextMonth,
    prevMonth,
    resetToCurrentMonth,
  } = useLedger();

  const userName = state.userProfile?.name?.trim() || 'Ruan';
  const currentMonth = useMemo(() => todayISO().slice(0, 7), []);
  const isCurrentMonth = selectedMonth === currentMonth;

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
    <div className="panel p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#59694A] bg-[#EBF2E4] px-3 py-0.5 rounded-[50px]">
            Painel Pessoal
          </span>
          <span className="text-[12px] text-[#8E8E93]">·</span>
          <span className="text-[12px] text-[#8E8E93] font-medium">
            {formattedToday}
          </span>
          {!isCurrentMonth && (
            <span className="text-[11px] font-semibold text-[#8E8E93] bg-[#F2F2F7] px-2.5 py-0.5 rounded-[50px]">
              Visualizando {fmtMonthYear(selectedMonth)}
            </span>
          )}
        </div>

        <h1 className="text-[26px] md:text-[28px] font-bold tracking-tight text-[#1D1D1F] leading-tight">
          Bem-vindo, {userName}!
        </h1>

        <p className="text-[13px] text-[#6E6E73] mt-1 max-w-xl leading-relaxed">
          {totals.faturasAtrasadas > 0 && isCurrentMonth
            ? `Você possui ${totals.faturasAtrasadas} conta atrasada precisando de atenção.`
            : totals.faturasVencendoHoje > 0 && isCurrentMonth
            ? `Você tem ${totals.faturasVencendoHoje} conta com vencimento programado para hoje.`
            : totals.rendaAReceber > 0
            ? `Você tem ${fmtBRL(totals.rendaAReceber)} a receber em ${fmtMonthYear(selectedMonth)}. Saldo disponível em contas: ${fmtBRL(totals.saldoTotalContas)}.`
            : totals.saldoLivreMensal >= 0
            ? `Fluxo de ${fmtMonthYear(selectedMonth)} positivo com sobra estimada de ${fmtBRL(totals.saldoLivreMensal)}.`
            : `Atenção: em ${fmtMonthYear(selectedMonth)}, seus compromissos superam a renda prevista em ${fmtBRL(Math.abs(totals.saldoLivreMensal))}.`
          }
        </p>
      </div>

      {/* Seletor de Mês & Ação Rápida */}
      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 shrink-0">
        
        {/* Controle de Navegação de Mês */}
        <div className="flex items-center gap-1.5 p-1 rounded-[50px] bg-[#F5F5F7] border border-[#E5E5EA]">
          <button
            onClick={prevMonth}
            className="pressable w-7 h-7 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white transition-all"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            title="Mês anterior"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="relative flex items-center">
            <Calendar size={13} className="text-[#59694A] ml-2 mr-1 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="appearance-none bg-transparent pr-7 pl-1 py-1 text-[12.5px] font-bold text-[#1D1D1F] cursor-pointer focus:outline-none"
              style={{ border: 'none' }}
              title="Escolha o mês de visualização"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {fmtMonthYear(m)} {m === currentMonth ? '· Atual' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="pointer-events-none text-[#8E8E93] absolute right-1.5" />
          </div>

          <button
            onClick={nextMonth}
            className="pressable w-7 h-7 rounded-full flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white transition-all"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            title="Próximo mês"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Botão de retorno rápido ao mês atual quando em outro mês */}
        {!isCurrentMonth && (
          <button
            onClick={resetToCurrentMonth}
            className="pressable inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#59694A] bg-[#EBF2E4] border border-[#C8D6B5] px-3 py-1.5 rounded-[50px] hover:brightness-95 transition-all cursor-pointer"
            title="Voltar para o mês atual"
          >
            <RotateCcw size={12} />
            <span>Mês Atual</span>
          </button>
        )}

        <button
          onClick={() => openQuickAdd('despesa')}
          className="pressable inline-flex items-center gap-2 px-4 py-2 rounded-[50px] text-[12.5px] font-semibold text-white hover:brightness-95 shrink-0"
          style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>+ Lançamento</span>
        </button>
      </div>
    </div>
  );
};
