import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingDown, Layers, Receipt, PieChart } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { MetricCard, SectionHeader, LedgerRow, AlertBanner } from './ui';
import { GreetingCalendarHero } from './GreetingCalendarHero';
import { fmtBRL, fmtDate, fmtDateShort, daysUntil, todayISO, computeCategoryBreakdown } from '../lib/ledger';

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

  const proximosVencimentos = useMemo(() =>
    (state.bills || [])
      .filter(b => !b.pago)
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
      .slice(0, 6),
    [state.bills]
  );

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
    <div className="space-y-4">

      {/* Hero: Saudação personalizada + Calendário Financeiro Interativo */}
      <GreetingCalendarHero />

      {/* Alertas e Lembretes de Vencimento Inteligentes */}
      <AlertBanner
        atrasadas={totals.faturasAtrasadas}
        vencendoHoje={totals.faturasVencendoHoje}
        vencendo7Dias={totals.faturasVencendo7Dias}
        onNavigateToBills={() => setTab('faturas')}
      />

      {/* Métricas Principais */}
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

      {/* Grid de 2 Colunas: Para Onde Vai o Dinheiro + Próximos Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Relatório Visual: Para onde vai o dinheiro (Categorias) */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <SectionHeader icon={PieChart} title="Para onde vai o dinheiro (Despesas por Categoria)" />
            {categoryBreakdown.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '12px 0' }}>
                Nenhum gasto ou fatura registrada para categorização.
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
                    {/* Barra de progresso da categoria */}
                    <div className="h-1.5 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
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

          <div className="pt-4 mt-2 border-t border-[#F2F2F7] flex items-center justify-between text-[11.5px] text-[#6E6E73]">
            <span>Baseado em gastos fixos e faturas do mês</span>
            <button
              onClick={() => openQuickAdd('despesa')}
              className="text-[#59694A] font-semibold hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              + Novo gasto
            </button>
          </div>
        </div>

        {/* Próximos vencimentos com alerta visual */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader icon={Receipt} title="Próximos Vencimentos" />
              <button
                onClick={() => setTab('faturas')}
                className="text-[11.5px] font-semibold text-[#59694A] hover:underline"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Ver todas
              </button>
            </div>

            {proximosVencimentos.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '12px 0' }}>
                Nenhuma fatura em aberto no momento.
              </p>
            ) : (
              <div style={{ borderTop: '1px solid #F2F2F7' }}>
                {proximosVencimentos.map(b => {
                  const dias = daysUntil(b.vencimento);
                  return (
                    <div key={b.id} style={{ borderBottom: '1px solid #F2F2F7' }}>
                      <LedgerRow
                        label={b.nome}
                        sub={`${fmtDate(b.vencimento)}${dias < 0 ? ' · atrasada' : dias === 0 ? ' · vence hoje' : ` · em ${dias}d`}`}
                        value={fmtBRL(b.valor)}
                        tone={dias < 0 ? 'debt' : dias <= 7 ? 'warn' : 'default'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#F2F2F7] flex items-center justify-between text-[11.5px] text-[#6E6E73]">
            <span>Total em aberto: <strong className="text-[#1D1D1F] font-mono">{fmtBRL(totals.totalFaturas)}</strong></span>
            <button
              onClick={() => openQuickAdd('fatura')}
              className="text-[#59694A] font-semibold hover:underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              + Nova fatura
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos de Evolução e Comprometimento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

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
          <SectionHeader icon={Layers} title="Composição do Comprometimento Mensal" />
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comprometimentoData} layout="vertical" margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: TICK, fontFamily: 'inherit' }} axisLine={false} tickLine={false} tickFormatter={v => fmtBRL(v)} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11.5, fill: '#6E6E73', fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" fill="#A3B88C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
