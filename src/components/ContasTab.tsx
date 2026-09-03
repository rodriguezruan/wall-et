import React, { useState } from 'react';
import {
  Landmark, Plus, Trash2, CreditCard,
  Wallet, PiggyBank, Coins, Edit3, Check
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, FormCard,
  TextField, SelectField, ConfirmDelete,
} from './ui';
import { fmtBRL } from '../lib/ledger';
import type { AccountType } from '../types/ledger';

const TYPE_ICONS: Record<AccountType, React.ElementType> = {
  corrente: Landmark,
  carteira: Wallet,
  cartao: CreditCard,
  poupanca: PiggyBank,
  investimento: Coins,
};

const TYPE_LABELS: Record<AccountType, string> = {
  corrente: 'Conta Corrente',
  carteira: 'Carteira / Dinheiro',
  cartao: 'Cartão de Crédito',
  poupanca: 'Poupança / Reserva',
  investimento: 'Investimentos',
};

// Paleta institucional inteligente em tons pastéis suaves (sem quebrar a estética minimalista)
function getInstitutionPalette(inst: string, type: AccountType) {
  const s = inst.toLowerCase();
  if (s.includes('nu') || s.includes('rox')) {
    return { bg: '#F6EFFB', text: '#7E22CE', border: '#EAD7F8' };
  }
  if (s.includes('ita') || s.includes('itau')) {
    return { bg: '#FEF4EB', text: '#C25E00', border: '#FCDCC6' };
  }
  if (s.includes('inter')) {
    return { bg: '#FFF5EC', text: '#D95D00', border: '#FCE0CE' };
  }
  if (s.includes('bradesco') || s.includes('santander')) {
    return { bg: '#FDF2F2', text: '#B82828', border: '#F9D5D5' };
  }
  if (s.includes('caixa') || s.includes('brasil') || s.includes('bb')) {
    return { bg: '#EEF5FC', text: '#1E6BB8', border: '#CCE0F5' };
  }
  if (s.includes('dinheiro') || s.includes('vivo') || s.includes('carteira') || type === 'carteira') {
    return { bg: '#EBF2E4', text: '#59694A', border: '#C8D6B5' };
  }
  if (s.includes('xp') || s.includes('btg') || type === 'investimento') {
    return { bg: '#FEF8EB', text: '#B8780E', border: '#FCE7C2' };
  }
  return { bg: '#F2F5EE', text: '#59694A', border: '#E4EBD9' };
}

export const ContasTab: React.FC = () => {
  const { state, totals, addAccount, deleteAccount, updateAccountBalance, confirmingId, setConfirmingId } = useLedger();

  const [formOpen, setFormOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [tipo, setTipo] = useState<AccountType>('corrente');
  const [saldo, setSaldo] = useState('');

  // Edição rápida de saldo
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !instituicao.trim()) return;

    addAccount({
      nome: nome.trim(),
      instituicao: instituicao.trim(),
      tipo,
      saldo: parseFloat(saldo) || 0,
    });

    setNome('');
    setInstituicao('');
    setSaldo('');
    setFormOpen(false);
  }

  function handleSaveBalance(id: string) {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      updateAccountBalance(id, val);
    }
    setEditingBalanceId(null);
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Patrimônio Consolidado */}
      <div className="panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-1">
            Saldo Total Disponível em Contas
          </span>
          <div className="text-[28px] md:text-[34px] font-bold tracking-tight text-[#1D1D1F] font-mono leading-none">
            {fmtBRL(totals.saldoTotalContas)}
          </div>
          <p className="text-[12px] text-[#6E6E73] mt-2">
            Reúne o saldo de todas as suas contas bancárias, carteiras digitais e dinheiro em espécie.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="pressable inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white self-start md:self-auto hover:brightness-95"
          style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Nova Conta / Carteira</span>
        </button>
      </div>

      {/* Formulário de Nova Conta */}
      {formOpen && (
        <div className="panel p-5">
          <SectionHeader icon={Landmark} title="Cadastrar Conta ou Carteira" />
          <form onSubmit={handleCreate}>
            <FormCard>
              <div className="flex gap-3 flex-wrap">
                <TextField
                  label="Instituição / Banco"
                  placeholder="Ex: Nubank, Itaú, Dinheiro Vivo, Inter"
                  required
                  value={instituicao}
                  onChange={e => setInstituicao(e.target.value)}
                />
                <TextField
                  label="Apelido da Conta"
                  placeholder="Ex: Conta Principal, Reserva de Emergência"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <SelectField
                  label="Tipo de Conta"
                  value={tipo}
                  onChange={e => setTipo(e.target.value as AccountType)}
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="carteira">Carteira / Dinheiro em Espécie</option>
                  <option value="poupanca">Poupança / Reserva</option>
                  <option value="cartao">Cartão de Crédito</option>
                  <option value="investimento">Investimentos</option>
                </SelectField>

                <TextField
                  label="Saldo Inicial (R$)"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={saldo}
                  onChange={e => setSaldo(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GhostButton onClick={() => setFormOpen(false)}>Cancelar</GhostButton>
                <GhostButton tone="paid" onClick={() => {}}>Salvar conta</GhostButton>
              </div>
            </FormCard>
          </form>
        </div>
      )}

      {/* Lista de Contas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-semibold text-[#1D1D1F] tracking-tight">
            Suas Contas & Carteiras ({state.accounts?.length || 0})
          </h3>
        </div>

        {(!state.accounts || state.accounts.length === 0) ? (
          <div className="panel p-8 text-center">
            <div className="w-12 h-12 rounded-[12px] bg-[#EBF2E4] text-[#59694A] flex items-center justify-center mx-auto mb-3">
              <Landmark size={22} strokeWidth={1.8} />
            </div>
            <h4 className="text-[15px] font-bold text-[#1D1D1F]">Nenhuma conta cadastrada</h4>
            <p className="text-[12.5px] text-[#6E6E73] max-w-sm mx-auto mt-1 mb-4">
              Adicione suas contas bancárias, cartões e dinheiro para centralizar todo o seu controle financeiro.
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="pressable inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold text-white"
              style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Adicionar Primeira Conta</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {state.accounts.map(acc => {
              const Icon = TYPE_ICONS[acc.tipo] || Landmark;
              const isEditing = editingBalanceId === acc.id;
              const palette = getInstitutionPalette(acc.instituicao, acc.tipo);

              return (
                <div key={acc.id} className="panel p-4 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: palette.bg,
                          color: palette.text,
                          borderColor: palette.border,
                        }}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#1D1D1F] truncate">
                          {acc.instituicao}
                        </div>
                        <div className="text-[11.5px] text-[#6E6E73] truncate">
                          {acc.nome} · {TYPE_LABELS[acc.tipo]}
                        </div>
                      </div>
                    </div>

                    {confirmingId === acc.id ? (
                      <ConfirmDelete
                        onConfirm={() => deleteAccount(acc.id)}
                        onCancel={() => setConfirmingId(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setConfirmingId(acc.id)}
                        className="text-[#8E8E93] hover:text-[#C24138] transition-colors p-1"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Excluir conta"
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>

                  {/* Saldo e Ajuste */}
                  <div className="pt-2.5 border-t border-[#F2F2F7] flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[#8E8E93]">
                      Saldo Atual
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={tempBalance}
                          onChange={e => setTempBalance(e.target.value)}
                          className="field-input font-mono text-[13px] py-1 px-2 w-28 text-right"
                        />
                        <button
                          onClick={() => handleSaveBalance(acc.id)}
                          className="p-1 rounded bg-[#EBF2E4] text-[#59694A]"
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[17px] font-bold font-mono tabular-nums ${
                            acc.saldo < 0 ? 'text-[#C24138]' : 'text-[#1D1D1F]'
                          }`}
                        >
                          {fmtBRL(acc.saldo)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingBalanceId(acc.id);
                            setTempBalance(acc.saldo.toString());
                          }}
                          className="text-[#8E8E93] hover:text-[#59694A] transition-colors p-0.5"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Ajustar saldo manualmente"
                        >
                          <Edit3 size={12} strokeWidth={1.8} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
