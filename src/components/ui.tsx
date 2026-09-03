import React from 'react';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../lib/ledger';

// ─── Paleta Semântica Refinada ───────────────────────────────────────────────
//  positivo/pago    → oliva nobre  #59694A / fundo #EBF2E4 / borda #C8D6B5
//  negativo/débito   → terracota    #C24138 / fundo #FDF4F3 / borda #F8D8D5
//  atenção/vencendo → âmbar ocre   #B86B1B / fundo #FEF6EB / borda #FBE6CB
//  texto 1 (título) → #1D1D1F
//  texto 2 (corpo)  → #6E6E73
//  texto 3 (apoio)  → #8E8E93 (Apple HIG legível)
//  separadores      → #F2F2F7
//  bordas neutras   → #E5E5EA

// ─── ConfirmDelete ───────────────────────────────────────────────────────────
interface ConfirmDeleteProps {
  onConfirm: () => void;
  onCancel: () => void;
}
export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({ onConfirm, onCancel }) => (
  <span className="inline-flex gap-2 items-center">
    <span className="text-[11px] font-medium" style={{ color: '#C24138' }}>excluir?</span>
    <button
      onClick={onConfirm}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C24138', padding: 2 }}
      title="Confirmar exclusão"
    >
      <Check size={13} strokeWidth={2.2} />
    </button>
    <button
      onClick={onCancel}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93', padding: 2 }}
      title="Cancelar"
    >
      <X size={13} strokeWidth={2.2} />
    </button>
  </span>
);

// ─── LedgerRow ───────────────────────────────────────────────────────────────
interface LedgerRowProps {
  label: string;
  sub?: string;
  value: string;
  tone?: 'default' | 'debt' | 'paid' | 'warn' | 'soft';
  strong?: boolean;
  right?: React.ReactNode;
}

const TONE_COLOR: Record<string, string> = {
  debt:    '#C24138',
  paid:    '#59694A',
  warn:    '#B86B1B',
  soft:    '#8E8E93',
  default: '#1D1D1F',
};

export const LedgerRow: React.FC<LedgerRowProps> = ({ label, sub, value, tone = 'default', strong, right }) => (
  <div className="flex items-center gap-3 py-[11px] group">
    <div className="min-w-0 flex-1">
      <div
        className="text-[13.5px] leading-snug"
        style={{ fontWeight: strong ? 600 : 400, color: '#1D1D1F' }}
      >
        {label}
      </div>
      {sub && (
        <div className="text-[11.5px] mt-[3px] leading-snug" style={{ color: '#6E6E73' }}>
          {sub}
        </div>
      )}
    </div>

    {/* Dotted leader */}
    <div
      className="hidden sm:block flex-none w-10 border-b border-dotted self-end mb-[5px]"
      style={{ borderColor: '#D1D1D6' }}
    />

    {/* Valor */}
    <div
      className="text-[13.5px] tabular-nums shrink-0 font-mono"
      style={{ fontWeight: strong ? 700 : 500, color: TONE_COLOR[tone] }}
    >
      {value}
    </div>

    {/* Ações — só no hover */}
    {right && (
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {right}
      </div>
    )}
  </div>
);

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon size={14} strokeWidth={1.7} style={{ color: '#59694A' }} />
      <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: '#1D1D1F' }}>
        {title}
      </h3>
    </div>
    {action}
  </div>
);

// ─── GhostButton ─────────────────────────────────────────────────────────────
interface GhostButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'paid' | 'debt';
  small?: boolean;
}

export const GhostButton: React.FC<GhostButtonProps> = ({ children, onClick, tone = 'default', small }) => {
  const style: React.CSSProperties =
    tone === 'paid'
      ? { color: '#59694A', borderColor: '#C8D6B5', backgroundColor: '#F9FCF7' }
      : tone === 'debt'
      ? { color: '#C24138', borderColor: '#F8D8D5', backgroundColor: '#FDF4F3' }
      : { color: '#1D1D1F', borderColor: '#D1D1D6', backgroundColor: '#FAFAFC' };

  return (
    <button
      onClick={onClick}
      className="pressable inline-flex items-center gap-1.5 border rounded-[50px] font-medium leading-none transition-all hover:brightness-98"
      style={{
        ...style,
        padding: small ? '5px 12px' : '7px 15px',
        fontSize: small ? 11 : 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
};

// ─── MetricCard ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'debt' | 'paid' | 'warn';
  formatter: (v: number) => string;
}

const METRIC_COLORS: Record<string, { halo: string; dot: string; value: string }> = {
  debt:    { halo: '#FDF4F3', dot: '#C24138', value: '#C24138' },
  paid:    { halo: '#EBF2E4', dot: '#59694A', value: '#59694A' },
  warn:    { halo: '#FEF6EB', dot: '#B86B1B', value: '#B86B1B' },
  default: { halo: '#F2F3F5', dot: '#5E6472', value: '#1D1D1F' },
};

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, tone = 'default', formatter }) => {
  const { halo, dot, value: valueColor } = METRIC_COLORS[tone];
  return (
    <div className="panel p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: halo }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
        </div>
        <span className="text-[11.5px] font-medium leading-snug" style={{ color: '#6E6E73' }}>
          {label}
        </span>
      </div>
      <span
        className="text-[22px] font-bold tabular-nums tracking-tight leading-none font-mono"
        style={{ color: valueColor }}
      >
        {formatter(value)}
      </span>
    </div>
  );
};

// ─── TextField ───────────────────────────────────────────────────────────────
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export const TextField: React.FC<TextFieldProps> = ({ label, ...props }) => (
  <label
    className="flex flex-col gap-1.5 flex-1 min-w-28"
    style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}
  >
    {label}
    <input {...props} className="field-input" />
  </label>
);

// ─── SelectField ──────────────────────────────────────────────────────────────
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}
export const SelectField: React.FC<SelectFieldProps> = ({ label, children, ...props }) => (
  <label
    className="flex flex-col gap-1.5 flex-1 min-w-28"
    style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}
  >
    {label}
    <select {...props} className="field-input cursor-pointer bg-white">
      {children}
    </select>
  </label>
);

// ─── CategoryChips ───────────────────────────────────────────────────────────
interface CategoryChipsProps {
  selected: string;
  onSelect: (cat: string) => void;
  categories?: string[];
}
export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selected,
  onSelect,
  categories = DEFAULT_CATEGORIES,
}) => (
  <div className="flex flex-wrap gap-1.5 pt-1">
    {categories.map(cat => {
      const active = selected.toLowerCase() === cat.toLowerCase();
      return (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className="pressable px-3 py-1.5 rounded-[50px] text-[11.5px] font-medium transition-colors"
          style={{
            background: active ? '#E4EBD9' : '#F5F5F7',
            color: active ? '#59694A' : '#6E6E73',
            border: `1px solid ${active ? '#C8D6B5' : '#E5E5EA'}`,
            cursor: 'pointer',
          }}
        >
          {cat}
        </button>
      );
    })}
  </div>
);

// ─── AlertBanner (Lembretes e Alertas de Vencimento) ───────────────────────────
interface AlertBannerProps {
  atrasadas: number;
  vencendoHoje: number;
  vencendo7Dias: number;
  onNavigateToBills: () => void;
}
export const AlertBanner: React.FC<AlertBannerProps> = ({
  atrasadas,
  vencendoHoje,
  vencendo7Dias,
  onNavigateToBills,
}) => {
  if (atrasadas === 0 && vencendoHoje === 0 && vencendo7Dias === 0) return null;

  const isUrgent = atrasadas > 0 || vencendoHoje > 0;

  return (
    <div
      className="panel p-4 flex items-center justify-between gap-4 border"
      style={{
        background: isUrgent ? '#FDF4F3' : '#F9FAF7',
        borderColor: isUrgent ? '#F8D8D5' : '#E4EBD9',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
          style={{
            background: isUrgent ? '#FCE8E6' : '#EBF2E4',
            color: isUrgent ? '#C24138' : '#59694A',
          }}
        >
          {isUrgent ? <AlertTriangle size={15} strokeWidth={2} /> : <Clock size={15} strokeWidth={2} />}
        </div>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: '#1D1D1F' }}>
            {atrasadas > 0
              ? `${atrasadas} fatura${atrasadas > 1 ? 's' : ''} em atraso!`
              : vencendoHoje > 0
              ? `${vencendoHoje} conta vence hoje`
              : `${vencendo7Dias} conta${vencendo7Dias > 1 ? 's' : ''} vencem nos próximos 7 dias`}
          </div>
          <div className="text-[11.5px]" style={{ color: '#6E6E73' }}>
            {atrasadas > 0 && vencendoHoje > 0
              ? `Evite encargos e juros quitando as pendências prioritárias.`
              : `Mantenha seu fluxo mensal sob controle programando os pagamentos.`}
          </div>
        </div>
      </div>
      <button
        onClick={onNavigateToBills}
        className="pressable px-3.5 py-1.5 rounded-[50px] text-[12px] font-semibold text-white shrink-0 hover:opacity-95"
        style={{
          background: isUrgent ? '#C24138' : '#59694A',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Ver faturas
      </button>
    </div>
  );
};

// ─── CheckboxField ────────────────────────────────────────────────────────────
interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
export const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2.5 cursor-pointer select-none" style={{ userSelect: 'none' }}>
    <div
      className="w-4 h-4 rounded-[5px] flex items-center justify-center shrink-0 transition-all"
      style={{
        border: `1.5px solid ${checked ? '#59694A' : '#D1D1D6'}`,
        backgroundColor: checked ? '#59694A' : 'transparent',
      }}
    >
      {checked && <Check size={10} color="white" strokeWidth={3} />}
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
    </div>
    <span className="text-[12.5px]" style={{ color: '#6E6E73' }}>{label}</span>
  </label>
);

// ─── FormCard ─────────────────────────────────────────────────────────────────
export const FormCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="rounded-[15px] p-4 mb-4 space-y-3"
    style={{ background: '#F5F5F7', border: '1px solid #E5E5EA' }}
  >
    {children}
  </div>
);

// ─── ProgressBar ──────────────────────────────────────────────────────────────
interface ProgressBarProps { pct: number; done?: boolean; }
export const ProgressBar: React.FC<ProgressBarProps> = ({ pct, done }) => (
  <div className="h-[5px] w-full rounded-[4px] overflow-hidden" style={{ background: '#E5E5EA' }}>
    <div
      className="h-full rounded-[4px] transition-all duration-700 ease-out"
      style={{
        width: `${Math.min(100, pct)}%`,
        background: done ? '#59694A' : '#DCA048',
      }}
    />
  </div>
);

// ─── IconButton ───────────────────────────────────────────────────────────────
interface IconButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  title?: string;
  active?: boolean;
  danger?: boolean;
}
export const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, onClick, title, active, danger }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-[3px] rounded-[6px] transition-all"
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: danger ? '#8E8E93' : active ? '#59694A' : '#8E8E93',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.color = danger ? '#C24138' : active ? '#59694A' : '#1D1D1F';
      (e.currentTarget as HTMLElement).style.background = danger ? '#FDF4F3' : '#F5F5F7';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.color = danger ? '#8E8E93' : active ? '#59694A' : '#8E8E93';
      (e.currentTarget as HTMLElement).style.background = 'none';
    }}
  >
    <Icon size={13} strokeWidth={1.8} />
  </button>
);
