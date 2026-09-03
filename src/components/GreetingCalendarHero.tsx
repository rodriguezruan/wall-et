import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus,
  ArrowDownLeft, ArrowUpRight, CheckCircle2,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { fmtBRL, todayISO } from '../lib/ledger';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const GreetingCalendarHero: React.FC = () => {
  const { state, totals, openQuickAdd } = useLedger();

  // Data atual real
  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => todayISO(), []);

  // Navegação de mês no calendário
  const [viewDate, setViewDate] = useState(() => new Date());

  // Dia selecionado para ver detalhes interativos
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Nome do mês exibido
  const monthName = useMemo(() => {
    const name = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [viewDate]);

  // Data de hoje por extenso
  const formattedToday = useMemo(() => {
    const formatted = today.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [today]);

  // Navegação de mês
  function prevMonth() {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }
  function resetToCurrentMonth() {
    setViewDate(new Date());
    setSelectedDate(todayDateStr);
  }

  // Cálculos do Grid do Calendário
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days: ({ day: number; dateStr: string } | null)[] = [];

    // Preenchimento de dias vazios antes do 1º dia
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Mapeamento de eventos por data
  const eventsByDate = useMemo(() => {
    const map: Record<string, {
      incomes: typeof state.income;
      bills: typeof state.bills;
      fixedExpenses: typeof state.fixedExpenses;
    }> = {};

    function ensure(d: string) {
      if (!map[d]) {
        map[d] = { incomes: [], bills: [], fixedExpenses: [] };
      }
      return map[d];
    }

    // Rendas
    (state.income || []).forEach(inc => {
      if (inc.data) ensure(inc.data).incomes.push(inc);
    });

    // Faturas
    (state.bills || []).forEach(b => {
      if (b.vencimento) ensure(b.vencimento).bills.push(b);
    });

    // Gastos fixos
    (state.fixedExpenses || []).forEach(g => {
      if (g.data) ensure(g.data).fixedExpenses.push(g);
    });

    return map;
  }, [state.income, state.bills, state.fixedExpenses]);

  // Detalhes do dia selecionado
  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDate] || { incomes: [], bills: [], fixedExpenses: [] };
  }, [eventsByDate, selectedDate]);

  const hasEventsOnSelectedDay =
    selectedDayEvents.incomes.length > 0 ||
    selectedDayEvents.bills.length > 0 ||
    selectedDayEvents.fixedExpenses.length > 0;

  // Formatação amigável da data selecionada
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  }, [selectedDate]);

  return (
    <div className="panel p-6 overflow-hidden relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Coluna Esquerda: Saudação, Resumo do Dia e Detalhes Interativos ── */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-5">
          <div>
            {/* Saudação com visual limpo macOS */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-semibold tracking-wider uppercase text-[#59694A] bg-[#EBF2E4] px-2.5 py-0.5 rounded-full">
                Painel Pessoal
              </span>
              <span className="text-[12px] text-[#8E8E93]">·</span>
              <span className="text-[12px] text-[#8E8E93] font-medium">
                {formattedToday}
              </span>
            </div>

            <h1 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[#1D1D1F] leading-tight">
              Bem-vindo, Ruan!
            </h1>

            <p className="text-[13px] text-[#6E6E73] mt-1.5 max-w-lg leading-relaxed">
              {totals.faturasAtrasadas > 0
                ? `Você possui ${totals.faturasAtrasadas} conta atrasada precisando de atenção.`
                : totals.faturasVencendoHoje > 0
                ? `Você tem ${totals.faturasVencendoHoje} conta com vencimento programado para hoje.`
                : totals.saldoLivreMensal >= 0
                ? `Seu fluxo mensal está equilibrado com sobra estimada de ${fmtBRL(totals.saldoLivreMensal)}.`
                : `Atenção: seus compromissos superam a renda do mês em ${fmtBRL(Math.abs(totals.saldoLivreMensal))}.`
              }
            </p>
          </div>

          {/* Painel Interativo de Lançamentos do Dia Selecionado */}
          <div
            className="rounded-[14px] p-4 border transition-all"
            style={{
              background: '#F9FAF7',
              borderColor: '#E4EBD9',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#59694A]" />
                <span className="text-[12px] font-bold text-[#1D1D1F]">
                  {selectedDate === todayDateStr ? 'Compromissos de Hoje' : `Lançamentos de ${selectedDateFormatted}`}
                </span>
              </div>

              <button
                onClick={() => openQuickAdd('despesa')}
                className="pressable text-[11.5px] font-semibold text-[#59694A] hover:underline flex items-center gap-1"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>Lançar</span>
              </button>
            </div>

            {!hasEventsOnSelectedDay ? (
              <div className="py-2.5 text-center">
                <p className="text-[12px] text-[#8E8E93]">
                  Nenhum recebimento ou vencimento para este dia.
                </p>
                <button
                  onClick={() => openQuickAdd('fatura')}
                  className="pressable mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-[7px] bg-white border border-[#D1D1D6] text-[#1D1D1F] inline-flex items-center gap-1"
                  style={{ cursor: 'pointer' }}
                >
                  <Plus size={11} /> Agendar conta nesta data
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {/* Rendas do Dia */}
                {selectedDayEvents.incomes.map(inc => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between p-2 rounded-[9px] bg-white border border-[#E5E5EA] text-[12px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center shrink-0">
                        <ArrowDownLeft size={11} strokeWidth={2.5} />
                      </div>
                      <span className="font-medium text-[#1D1D1F] truncate">{inc.nome}</span>
                      <span className="text-[10px] text-[#59694A] bg-[#EBF2E4] px-1.5 py-0.2 rounded font-medium shrink-0">
                        Recebimento
                      </span>
                    </div>
                    <span className="font-bold font-mono text-[#59694A] shrink-0 ml-2">
                      +{fmtBRL(inc.valor)}
                    </span>
                  </div>
                ))}

                {/* Faturas do Dia */}
                {selectedDayEvents.bills.map(b => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded-[9px] bg-white border border-[#E5E5EA] text-[12px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${b.pago ? 'bg-[#EBF2E4] text-[#59694A]' : 'bg-[#FDF4F3] text-[#C24138]'}`}>
                        {b.pago ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <ArrowUpRight size={11} strokeWidth={2.5} />}
                      </div>
                      <span className="font-medium text-[#1D1D1F] truncate">{b.nome}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${b.pago ? 'bg-[#EBF2E4] text-[#59694A]' : 'bg-[#FDF4F3] text-[#C24138]'}`}>
                        {b.pago ? 'Quitada' : 'Fatura'}
                      </span>
                    </div>
                    <span className={`font-bold font-mono shrink-0 ml-2 ${b.pago ? 'text-[#8E8E93] line-through' : 'text-[#C24138]'}`}>
                      -{fmtBRL(b.valor)}
                    </span>
                  </div>
                ))}

                {/* Gastos fixos do Dia */}
                {selectedDayEvents.fixedExpenses.map(g => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2 rounded-[9px] bg-white border border-[#E5E5EA] text-[12px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${g.pago ? 'bg-[#EBF2E4] text-[#59694A]' : 'bg-[#FDF4F3] text-[#C24138]'}`}>
                        {g.pago ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <ArrowUpRight size={11} strokeWidth={2.5} />}
                      </div>
                      <span className="font-medium text-[#1D1D1F] truncate">{g.nome}</span>
                      <span className="text-[10px] text-[#6E6E73] bg-[#F5F5F7] px-1.5 py-0.2 rounded font-medium shrink-0">
                        {g.pago ? 'Pago' : 'Gasto fixo'}
                      </span>
                    </div>
                    <span className={`font-bold font-mono shrink-0 ml-2 ${g.pago ? 'text-[#8E8E93] line-through' : 'text-[#C24138]'}`}>
                      -{fmtBRL(g.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Coluna Direita: Calendário Financeiro Interativo ── */}
        <div className="lg:col-span-5 bg-[#FAFAFC] rounded-[16px] p-4 border border-[#E5E5EA] shadow-sm flex flex-col justify-between">

          {/* Cabeçalho do Calendário (Mês + Controles) */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E5EA]">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[#1D1D1F] tracking-tight">
                {monthName}
              </span>
              {viewDate.getMonth() !== today.getMonth() && (
                <button
                  onClick={resetToCurrentMonth}
                  className="text-[10.5px] font-medium text-[#59694A] hover:underline ml-1"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Hoje
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="pressable w-6 h-6 rounded-[6px] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white border border-transparent hover:border-[#E5E5EA]"
                style={{ background: 'none', cursor: 'pointer' }}
                title="Mês anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={nextMonth}
                className="pressable w-6 h-6 rounded-[6px] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-white border border-transparent hover:border-[#E5E5EA]"
                style={{ background: 'none', cursor: 'pointer' }}
                title="Próximo mês"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Dias da semana (D S T Q Q S S) */}
          <div className="grid grid-cols-7 text-center mb-1">
            {WEEKDAYS.map((w, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: idx === 0 || idx === 6 ? '#8E8E93' : '#6E6E73' }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
            {calendarDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-7 w-7" />;
              }

              const { day, dateStr } = item;
              const isToday = dateStr === todayDateStr;
              const isSelected = dateStr === selectedDate;

              const dayEvents = eventsByDate[dateStr];
              const hasIncome = dayEvents && dayEvents.incomes.length > 0;
              const hasExpense = dayEvents && (dayEvents.bills.length > 0 || dayEvents.fixedExpenses.length > 0);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className="pressable relative h-8 w-full rounded-[8px] flex flex-col items-center justify-center transition-all"
                  style={{
                    background: isSelected
                      ? '#EBF2E4'
                      : isToday
                      ? '#F2F5EE'
                      : 'transparent',
                    border: isSelected
                      ? '1.5px solid #C8D6B5'
                      : isToday
                      ? '1.5px solid #59694A'
                      : '1.5px solid transparent',
                    cursor: 'pointer',
                  }}
                  title={
                    hasIncome && hasExpense
                      ? `Dia ${day}: Recebimentos e Pagamentos programados`
                      : hasIncome
                      ? `Dia ${day}: Recebimento programado`
                      : hasExpense
                      ? `Dia ${day}: Vencimento de conta`
                      : `Dia ${day}`
                  }
                >
                  {/* Número do dia */}
                  <span
                    className="text-[12px] leading-none"
                    style={{
                      fontWeight: isSelected || isToday ? 700 : 400,
                      color: isSelected
                        ? '#59694A'
                        : isToday
                        ? '#1D1D1F'
                        : '#3A3A3C',
                    }}
                  >
                    {day}
                  </span>

                  {/* Indicadores Coloridos de Eventos */}
                  <div className="flex items-center gap-0.5 mt-0.5 h-1">
                    {hasIncome && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#59694A' }}
                      />
                    )}
                    {hasExpense && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#C24138' }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda do Calendário */}
          <div className="mt-3 pt-2.5 border-t border-[#E5E5EA] flex items-center justify-between text-[11px] text-[#6E6E73]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#59694A]" />
                <span>Recebimento</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C24138]" />
                <span>Vencimento / Gasto</span>
              </div>
            </div>
            <span className="text-[10px] text-[#8E8E93]">Toque para ver</span>
          </div>

        </div>

      </div>
    </div>
  );
};
