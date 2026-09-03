import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus,
  ArrowDownLeft, ArrowUpRight, CheckCircle2,
  Calendar as CalendarIcon, Receipt
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { fmtBRL, fmtDate, todayISO, daysUntil } from '../lib/ledger';
import { LedgerRow } from './ui';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const RightCalendarPanel: React.FC = () => {
  const { state, totals, setTab, openQuickAdd } = useLedger();

  const today = useMemo(() => new Date(), []);
  const todayDateStr = useMemo(() => todayISO(), []);

  // Navegação de mês
  const [viewDate, setViewDate] = useState(() => new Date());
  // Dia selecionado
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const monthName = useMemo(() => {
    const name = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [viewDate]);

  function prevMonth() {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  function nextMonth() {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }
  function resetToToday() {
    setViewDate(new Date());
    setSelectedDate(todayDateStr);
  }

  // Cálculos do grid do mês
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
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
      if (!map[d]) map[d] = { incomes: [], bills: [], fixedExpenses: [] };
      return map[d];
    }

    (state.income || []).forEach(inc => { if (inc.data) ensure(inc.data).incomes.push(inc); });
    (state.bills || []).forEach(b => { if (b.vencimento) ensure(b.vencimento).bills.push(b); });
    (state.fixedExpenses || []).forEach(g => { if (g.data) ensure(g.data).fixedExpenses.push(g); });

    return map;
  }, [state.income, state.bills, state.fixedExpenses]);

  // Eventos do dia selecionado
  const selectedDayEvents = useMemo(() => {
    return eventsByDate[selectedDate] || { incomes: [], bills: [], fixedExpenses: [] };
  }, [eventsByDate, selectedDate]);

  const hasEventsOnSelectedDay =
    selectedDayEvents.incomes.length > 0 ||
    selectedDayEvents.bills.length > 0 ||
    selectedDayEvents.fixedExpenses.length > 0;

  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }, [selectedDate]);

  // Próximas faturas para o rodapé do painel
  const proximosVencimentos = useMemo(() =>
    (state.bills || [])
      .filter(b => !b.pago)
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      .slice(0, 4),
    [state.bills]
  );

  return (
    <aside className="w-full space-y-4">

      {/* ── Card 1: Calendário Financeiro Interativo (20px) ── */}
      <div className="panel p-5">

        {/* Topo do Calendário */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-[#1D1D1F] tracking-tight">
              {monthName}
            </span>
            {viewDate.getMonth() !== today.getMonth() && (
              <button
                onClick={resetToToday}
                className="text-[11px] font-medium text-[#59694A] hover:underline px-2 py-0.5 rounded-[50px] bg-[#EBF2E4]"
                style={{ border: 'none', cursor: 'pointer' }}
              >
                Hoje
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="pressable w-6 h-6 rounded-[50px] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Mês anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextMonth}
              className="pressable w-6 h-6 rounded-[50px] flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Próximo mês"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 text-center mb-1">
          {WEEKDAYS.map((w, idx) => (
            <span
              key={idx}
              className="text-[10.5px] font-semibold uppercase tracking-wider"
              style={{ color: idx === 0 || idx === 6 ? '#8E8E93' : '#6E6E73' }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {calendarDays.map((item, idx) => {
            if (!item) return <div key={`empty-${idx}`} className="h-7 w-7" />;

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
                className="pressable relative h-8 w-full rounded-[10px] flex flex-col items-center justify-center transition-all"
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
              >
                <span
                  className="text-[12px] leading-none"
                  style={{
                    fontWeight: isSelected || isToday ? 700 : 400,
                    color: isSelected ? '#59694A' : isToday ? '#1D1D1F' : '#3A3A3C',
                  }}
                >
                  {day}
                </span>

                <div className="flex items-center gap-0.5 mt-0.5 h-1">
                  {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-[#59694A]" />}
                  {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-[#C24138]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="mt-3 pt-2.5 border-t border-[#F2F2F7] flex items-center justify-between text-[11px] text-[#6E6E73]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#59694A]" />
              <span>Entrada</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#C24138]" />
              <span>Saída</span>
            </div>
          </div>
          <span className="text-[10px] text-[#8E8E93]">Clique no dia</span>
        </div>

      </div>

      {/* ── Card 2: Lançamentos do Dia Selecionado (20px) ── */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-[#59694A]" />
            <h3 className="text-[13px] font-bold text-[#1D1D1F]">
              {selectedDate === todayDateStr ? 'Hoje' : selectedDateFormatted}
            </h3>
          </div>

          <button
            onClick={() => openQuickAdd('fatura')}
            className="pressable text-[11px] font-semibold text-[#59694A] bg-[#EBF2E4] px-2.5 py-0.5 rounded-[50px] flex items-center gap-1 hover:brightness-95"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Plus size={11} strokeWidth={2.5} />
            <span>Agendar</span>
          </button>
        </div>

        {!hasEventsOnSelectedDay ? (
          <p className="text-[12px] text-[#8E8E93] py-2 text-center">
            Nenhum lançamento previsto para este dia.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedDayEvents.incomes.map(inc => (
              <div
                key={inc.id}
                className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#F9FAF7] border border-[#E5E5EA] text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={11} strokeWidth={2.5} />
                  </div>
                  <span className="font-medium text-[#1D1D1F] truncate">{inc.nome}</span>
                </div>
                <span className="font-bold font-mono text-[#59694A] shrink-0 ml-2">
                  +{fmtBRL(inc.valor)}
                </span>
              </div>
            ))}

            {selectedDayEvents.bills.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FDFBFB] border border-[#E5E5EA] text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${b.pago ? 'bg-[#EBF2E4] text-[#59694A]' : 'bg-[#FDF4F3] text-[#C24138]'}`}>
                    {b.pago ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <ArrowUpRight size={11} strokeWidth={2.5} />}
                  </div>
                  <span className="font-medium text-[#1D1D1F] truncate">{b.nome}</span>
                </div>
                <span className={`font-bold font-mono shrink-0 ml-2 ${b.pago ? 'text-[#8E8E93] line-through' : 'text-[#C24138]'}`}>
                  -{fmtBRL(b.valor)}
                </span>
              </div>
            ))}

            {selectedDayEvents.fixedExpenses.map(g => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#FAFAFC] border border-[#E5E5EA] text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${g.pago ? 'bg-[#EBF2E4] text-[#59694A]' : 'bg-[#FDF4F3] text-[#C24138]'}`}>
                    {g.pago ? <CheckCircle2 size={11} strokeWidth={2.5} /> : <ArrowUpRight size={11} strokeWidth={2.5} />}
                  </div>
                  <span className="font-medium text-[#1D1D1F] truncate">{g.nome}</span>
                </div>
                <span className={`font-bold font-mono shrink-0 ml-2 ${g.pago ? 'text-[#8E8E93] line-through' : 'text-[#C24138]'}`}>
                  -{fmtBRL(g.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Card 3: Próximos Vencimentos na Lateral ── */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={14} className="text-[#59694A]" />
            <h3 className="text-[13px] font-bold text-[#1D1D1F]">Próximas Faturas</h3>
          </div>
          <button
            onClick={() => setTab('faturas')}
            className="text-[11px] font-semibold text-[#59694A] hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Ver todas
          </button>
        </div>

        {proximosVencimentos.length === 0 ? (
          <p className="text-[12px] text-[#8E8E93] py-2 text-center">
            Nenhuma fatura em aberto.
          </p>
        ) : (
          <div className="divide-y divide-[#F2F2F7]">
            {proximosVencimentos.map(b => {
              const dias = daysUntil(b.vencimento);
              return (
                <LedgerRow
                  key={b.id}
                  label={b.nome}
                  sub={`${fmtDate(b.vencimento)}${dias < 0 ? ' · atrasada' : dias === 0 ? ' · vence hoje' : ` · em ${dias}d`}`}
                  value={fmtBRL(b.valor)}
                  tone={dias < 0 ? 'debt' : dias <= 7 ? 'warn' : 'default'}
                />
              );
            })}
          </div>
        )}

        <div className="pt-3 mt-1 border-t border-[#F2F2F7] flex items-center justify-between text-[11px] text-[#6E6E73]">
          <span>Total: <strong className="text-[#1D1D1F] font-mono">{fmtBRL(totals.totalFaturas)}</strong></span>
          <button
            onClick={() => openQuickAdd('fatura')}
            className="text-[#59694A] font-semibold hover:underline"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            + Nova fatura
          </button>
        </div>
      </div>

    </aside>
  );
};
