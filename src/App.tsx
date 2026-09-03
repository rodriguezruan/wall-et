import React from 'react';
import { LedgerProvider, useLedger } from './context/LedgerContext';
import { ResumoTab } from './components/ResumoTab';
import { ContasTab } from './components/ContasTab';
import { FluxoTab } from './components/FluxoTab';
import { FaturasTab } from './components/FaturasTab';
import { DividasTab } from './components/DividasTab';
import { ParcelamentosTab } from './components/ParcelamentosTab';
import { HistoricoTab } from './components/HistoricoTab';
import { QuickAddModal } from './components/QuickAddModal';
import type { TabId } from './types/ledger';
import {
  Wallet, Repeat, Receipt, Landmark,
  Layers, History, Plus, Coins
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'resumo',         label: 'Resumo',              icon: Wallet   },
  { id: 'contas',        label: 'Contas & Carteiras',  icon: Landmark },
  { id: 'fluxo',         label: 'Renda & Gastos',       icon: Repeat   },
  { id: 'faturas',       label: 'Faturas',              icon: Receipt  },
  { id: 'dividas',       label: 'Dívidas',              icon: Coins    },
  { id: 'parcelamentos', label: 'Parcelamentos',         icon: Layers   },
  { id: 'historico',     label: 'Histórico',             icon: History  },
];

const TAB_CONTENT: Record<TabId, React.ReactNode> = {
  resumo:         <ResumoTab />,
  contas:         <ContasTab />,
  fluxo:          <FluxoTab />,
  faturas:        <FaturasTab />,
  dividas:        <DividasTab />,
  parcelamentos:  <ParcelamentosTab />,
  historico:      <HistoricoTab />,
};

// Verde oliva/musgo principal
const OLIVE     = '#59694A';
const OLIVE_BG  = '#E4EBD9';

function AppShell() {
  const { tab, setTab, totals, openQuickAdd } = useLedger();

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F5F7' }}>

      {/* ── Sidebar flutuante ─────────────────────────────────────── */}
      <div className="sticky top-0 h-screen p-4 flex flex-col w-[224px] shrink-0">
        <aside className="sidebar flex-1 flex flex-col overflow-hidden">

          {/* Logo/Marca */}
          <div className="px-4 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: OLIVE }}
              >
                <Wallet size={15} strokeWidth={1.9} color="white" />
              </div>
              <div className="leading-none">
                <div className="text-[14px] font-bold tracking-tight" style={{ color: '#1D1D1F' }}>
                  Wall-et
                </div>
                <div className="text-[11px] font-medium mt-0.5" style={{ color: '#8E8E93' }}>
                  Livro-caixa
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Lançamento Rápido */}
          <div className="px-3 pb-2">
            <button
              onClick={() => openQuickAdd('despesa')}
              className="pressable w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[11px] text-[12.5px] font-semibold text-white shadow-sm"
              style={{ background: OLIVE, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Novo Lançamento</span>
            </button>
          </div>

          {/* Separador */}
          <div className="mx-4 mb-2 h-px" style={{ background: '#E5E5EA' }} />

          {/* Navegação */}
          <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              const hasUrgentBills = t.id === 'faturas' && (totals.faturasAtrasadas > 0 || totals.faturasVencendoHoje > 0);

              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="pressable w-full flex items-center gap-2.5 px-3 py-[8.5px] rounded-[10px] text-[12px] font-medium text-left relative"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  {/* Pill ativo */}
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-[10px]"
                      style={{ background: OLIVE_BG }}
                      transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                    />
                  )}
                  <Icon
                    size={14}
                    strokeWidth={active ? 2 : 1.6}
                    style={{ position: 'relative', zIndex: 1, color: active ? OLIVE : '#8E8E93', transition: 'color 0.15s' }}
                  />
                  <span
                    style={{
                      position: 'relative', zIndex: 1,
                      color: active ? OLIVE : '#6E6E73',
                      fontWeight: active ? 600 : 400,
                      transition: 'color 0.15s',
                    }}
                  >
                    {t.label}
                  </span>

                  {/* Badge de Alerta de Vencimento na Tab Faturas */}
                  {hasUrgentBills && (
                    <span
                      className="relative z-10 ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono"
                      style={{
                        background: totals.faturasAtrasadas > 0 ? '#C24138' : '#B86B1B',
                        color: '#FFFFFF',
                      }}
                      title={`${totals.faturasAtrasadas} atrasadas, ${totals.faturasVencendoHoje} hoje`}
                    >
                      {totals.faturasAtrasadas > 0 ? totals.faturasAtrasadas : totals.faturasVencendoHoje}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Rodapé */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderTop: '1px solid #E5E5EA' }}
          >
            <span className="text-[10.5px] font-medium" style={{ color: '#8E8E93' }}>
              Salvo localmente (offline)
            </span>
          </div>
        </aside>
      </div>

      {/* ── Conteúdo principal ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto py-6 pr-6">

        {/* Título com Ações */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-[22px] font-bold tracking-tight leading-none"
            style={{ color: '#1D1D1F' }}
          >
            {TABS.find(t => t.id === tab)?.label}
          </h1>

          <button
            onClick={() => openQuickAdd('despesa')}
            className="pressable inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[12px] font-semibold text-[#59694A] bg-[#E4EBD9]"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>+ Lançamento Rápido</span>
          </button>
        </div>

        {/* Conteúdo com transição */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {TAB_CONTENT[tab]}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modal de Lançamento Rápido */}
      <QuickAddModal />
    </div>
  );
}

export default function App() {
  return (
    <LedgerProvider>
      <AppShell />
    </LedgerProvider>
  );
}
