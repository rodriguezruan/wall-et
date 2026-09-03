import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingDown, Layers, PieChart } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { MetricCard, SectionHeader, AlertBanner } from './ui';
import { GreetingHeader } from './GreetingHeader';
import { RightCalendarPanel } from './RightCalendarPanel';
import { fmtBRL, fmtDateShort, todayISO, computeCategoryBreakdown } from '../lib/ledger';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-3 py-2" style={{ fontSize: 12 }}>
      <div style={{ color: '#6E6E73', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#1D1D1F', fontFamily: 'monospace' }}>
        {fmtBRL(payload[0].value)}
      </div>
    </div>
  );
};

const GRID = 'rgba(0,0,0,0.04)';
const TICK = '#8E8E93';

export const ResumoTab: React.FC = () => {
  const { state, totals, setTab, openQuickAdd } = useLedger();

  const chartData = useMemo(() => {
    const pts = (state.history || []).map(h => ({ data: fmtDateShort(h.data), saldo: h.saldoApos }));
    return pts.length === 0 ? [{ data: fmtDateShort(todayISO()), saldo: 0 }] : pts.slice(-30);
  }, [state.history]);

  const comprometimentoData = useMemo(() => [
    { nome: 'Gastos fixos',    valor: totals.gastosFixosMensais },
    { nome: 'Faturas abertas', valor: totals.totalFaturas },
    { nome: 'Parcelas ativas', valor: Math.max(0, totals.comprometimentoMensal - totals.gastosFixosMensais - totals.totalFaturas) },
  ], [totals]);

  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(state), [state]);

  return (
    /* Grid em 2 áreas principais (Coluna Central Fluida + Painel Direito de Agenda) */
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

      {/* ── Coluna Central Fluida (xl:col-span-7 ou 8) ── */}
      <div className="xl:col-span-7 2xl:col-span-8 space-y-4 min-w-0">

        {/* Saudação e Diagnóstico Personalizado */}
        <GreetingHeader />

        {/* Banner de Alerta de Vencimentos */}
        <AlertBanner
          atrasadas={totals.faturasAtrasadas}
          vencendoHoje={totals.faturasVencendoHoje}
          vencendo7Dias={totals.faturasVencendo7Dias}
          onNavigateToBills={() => setTab('faturas')}
        />

        {/* Métricas Principais (Cards de 20px) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Saldo Total em Contas" value={totals.saldoTotalContas}      tone="paid"    formatter={fmtBRL} />
          <MetricCard label="Saldo Devedor Total"   value={totals.saldoDevedor}          tone="debt"    formatter={fmtBRL} />
          <MetricCard label="Comprometido no Mês"   value={totals.comprometimentoMensal} tone="warn"    formatter={fmtBRL} />
          <MetricCard
            label="Sobra Mensal Estimada"
            value={totals.saldoLivreMensal}
            tone={totals.saldoLivreMensal >= 0 ? 'paid' : 'debt'}
            formatter={fmtBRL}
          />
        </div>

        {/* Relatório Visual: Para onde vai o dinheiro */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-2">
            <SectionHeader icon={PieChart} title="Para onde vai o dinheiro (Despesas por Categoria)" />
            <button
              onClick={() => openQuickAdd('despesa')}
              className="text-[#59694A] font-semibold text-[11.5px] hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              + Novo gasto
            </button>
          </div>

          {categoryBreakdown.length === 0 ? (
            <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '10px 0' }}>
              Nenhum gasto ou fatura registrada para categorização neste mês.
            </p>
          ) : (
            <div className="space-y-3 mt-2">
              {categoryBreakdown.slice(0, 5).map(cat => (
                <div key={cat.categoria} className="space-y-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-[#1D1D1F]">{cat.categoria}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[#6E6E73]">{cat.percentual}%</span>
                      <span className="font-bold text-[#1D1D1F]">{fmtBRL(cat.valor)}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-[50px] bg-[#E5E5EA] overflow-hidden">
                    <div
                      className="h-full rounded-[50px] transition-all duration-500"
                      style={{
                        width: `${cat.percentual}%`,
                        background: '#59694A',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos de Evolução e Comprometimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Gráfico — saldo devedor */}
          <div className="panel p-5">
            <SectionHeader icon={TrendingDown} title="Evolução do Saldo Devedor" />
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: TICK, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: TICK, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={82} tickFormatter={v => fmtBRL(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="saldo" stroke="#C24138" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#C24138', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico — comprometimento mensal */}
          <div className="panel p-5">
            <SectionHeader icon={Layers} title="Comprometimento Mensal" />
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comprometimentoData} layout="vertical" margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: TICK, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={v => fmtBRL(v)} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 11.5, fill: '#6E6E73', fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" fill="#A3B88C" radius={[0, 50, 50, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* ── Coluna Direita: Painel de Calendário & Agenda (xl:col-span-5 ou 4) ── */}
      <div className="xl:col-span-5 2xl:col-span-4 w-full">
        <RightCalendarPanel />
      </div>

    </div>
  );
};
