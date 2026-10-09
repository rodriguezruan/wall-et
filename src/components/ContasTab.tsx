import React, { useState } from 'react';
import {
  Landmark, Plus, Trash2, CreditCard,
  Wallet, PiggyBank, Coins, Edit3, Check,
  RefreshCw, ShieldCheck, Zap, Sparkles,
  Download, X, Loader2, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import {
  SectionHeader, GhostButton, FormCard,
  TextField, SelectField, ConfirmDelete,
} from './ui';
import { fmtBRL, fmtDate, toLocalISO } from '../lib/ledger';
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
  const {
    state,
    totals,
    addAccount,
    deleteAccount,
    updateAccountBalance,
    confirmingId,
    setConfirmingId,
    openPluggyConnect,
    syncPluggyItem,
    syncAllPluggy,
    disconnectPluggyItem,
    isSyncingPluggy,
  } = useLedger();

  const [formOpen, setFormOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [tipo, setTipo] = useState<AccountType>('corrente');
  const [saldo, setSaldo] = useState('');

  // Edição rápida de saldo
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState('');

  // ID da conexão sendo sincronizada individualmente
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null);

  // Importação direta por Item ID da Pluggy
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [customItemId, setCustomItemId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

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

  async function handleSyncSingle(id: string) {
    setSyncingConnId(id);
    try {
      await syncPluggyItem(id);
    } finally {
      setSyncingConnId(null);
    }
  }

  async function handleImportByItemId(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = customItemId.trim();
    if (!cleanId) return;

    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      await syncPluggyItem(cleanId);
      setImportSuccess('Instituição bancária e contas importadas com sucesso!');
      setTimeout(() => {
        setImportSuccess(null);
        setImportModalOpen(false);
        setCustomItemId('');
      }, 1400);
    } catch (err: any) {
      setImportError(err.message || 'Item ID não encontrado ou inválido. Verifique o ID no painel da Pluggy.');
    } finally {
      setImportLoading(false);
    }
  }

  const connections = state.pluggyConnections || [];

  return (
    <div className="space-y-6">
      {/* Resumo do Patrimônio Consolidado & Ações */}
      <div className="panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6E6E73]">
              Saldo Total Disponível em Contas
            </span>
            {connections.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#59694A] bg-[#EBF2E4] px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} />
                Open Finance Ativo
              </span>
            )}
          </div>
          <div className="text-[28px] md:text-[34px] font-bold tracking-tight text-[#1D1D1F] font-mono leading-none">
            {fmtBRL(totals.saldoTotalContas)}
          </div>
          <p className="text-[12px] text-[#6E6E73] mt-2">
            Reúne o saldo de todas as suas contas bancárias sincronizadas e manuais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {connections.length > 0 && (
            <button
              onClick={() => syncAllPluggy()}
              disabled={isSyncingPluggy}
              className="pressable inline-flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] text-[12.5px] font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-all disabled:opacity-50"
              style={{ border: 'none', cursor: 'pointer' }}
              title="Atualizar saldos e lançamentos de todas as instituições conectadas"
            >
              <RefreshCw size={14} className={isSyncingPluggy ? 'animate-spin text-[#59694A]' : ''} />
              <span>{isSyncingPluggy ? 'Sincronizando...' : 'Sincronizar Tudo'}</span>
            </button>
          )}

          <button
            onClick={() => openPluggyConnect()}
            className="pressable inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white shadow-sm hover:brightness-95"
            style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
          >
            <Zap size={14} className="fill-white" />
            <span>Conectar Banco (Open Finance)</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="pressable inline-flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] text-[12.5px] font-medium text-[#1D1D1F] bg-[#F2F2F7] hover:bg-[#E5E5EA] transition-all"
            style={{ border: 'none', cursor: 'pointer' }}
            title="Importar banco existente pelo Item ID do painel da Pluggy"
          >
            <Download size={13} />
            <span>Importar por ID</span>
          </button>

          <button
            onClick={() => setFormOpen(true)}
            className="pressable inline-flex items-center gap-1.5 px-3 py-2.5 rounded-[12px] text-[12.5px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-all"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* Seção de Conexões Open Finance */}
      {connections.length > 0 ? (
        <div className="panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-[#EBF2E4] text-[#59694A] flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Bancos & Instituições Conectadas ({connections.length})
                </h3>
                <p className="text-[11.5px] text-[#8E8E93]">
                  Sincronização bancária automática e segura via Pluggy
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setImportModalOpen(true)}
                className="pressable text-[12px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Importar por ID
              </button>
              <span className="text-[#E5E5EA]">·</span>
              <button
                onClick={() => openPluggyConnect()}
                className="pressable text-[12px] font-semibold text-[#59694A] hover:underline"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                + Conectar outro banco
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {connections.map(conn => {
              const isSyncingThis = isSyncingPluggy && syncingConnId === conn.id;
              const formattedSync = conn.lastSyncAt
                ? fmtDate(toLocalISO(new Date(conn.lastSyncAt)))
                : 'Pendente';

              return (
                <div
                  key={conn.id}
                  className="rounded-[14px] border border-[#E5E5EA] bg-[#FBFBFC] p-4 flex flex-col justify-between gap-3 hover:border-[#D1D1D6] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {conn.connectorImageUrl ? (
                        <div
                          className="w-9 h-9 rounded-[10px] p-1.5 flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E5E5EA',
                          }}
                        >
                          <img
                            src={conn.connectorImageUrl}
                            alt={conn.connectorName}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border text-white font-bold text-[13px]"
                          style={{
                            backgroundColor: conn.connectorPrimaryColor || '#59694A',
                            borderColor: '#E5E5EA',
                          }}
                        >
                          {conn.connectorName.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="text-[13.5px] font-bold text-[#1D1D1F] truncate">
                          {conn.connectorName}
                        </div>
                        <div className="text-[11px] text-[#8E8E93] truncate">
                          {conn.accountsCount || 1} conta(s) · Sincronizado em {formattedSync}
                        </div>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: conn.status === 'LOGIN_ERROR' ? '#FDF2F2' : '#EBF2E4',
                        color: conn.status === 'LOGIN_ERROR' ? '#C24138' : '#59694A',
                      }}
                    >
                      {conn.status === 'LOGIN_ERROR' ? 'Atenção' : 'Conectado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
                    <button
                      onClick={() => handleSyncSingle(conn.id)}
                      disabled={isSyncingThis}
                      className="pressable inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#59694A] hover:brightness-90 transition-all disabled:opacity-50"
                      style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <RefreshCw size={12} className={isSyncingThis ? 'animate-spin' : ''} />
                      <span>{isSyncingThis ? 'Atualizando...' : 'Atualizar Saldo'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openPluggyConnect(conn.id)}
                        className="text-[11px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] transition-colors"
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                        title="Revalidar credenciais com a instituição"
                      >
                        Reconectar
                      </button>
                      <span className="text-[#E5E5EA]">·</span>
                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja desconectar ${conn.connectorName}? As contas locais serão mantidas.`)) {
                            disconnectPluggyItem(conn.id);
                          }
                        }}
                        className="text-[11px] font-medium text-[#C24138] hover:underline transition-colors"
                        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                        title="Desconectar do Open Finance"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="panel p-5 bg-gradient-to-r from-[#FBFDF9] to-[#F5F8F2] border border-[#DCE8D2] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#EBF2E4] text-[#59694A] flex items-center justify-center shrink-0 border border-[#C8D6B5]">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-[14px] font-bold text-[#1D1D1F]">
                Conecte seus bancos reais via Open Finance
              </h4>
              <p className="text-[12px] text-[#6E6E73] mt-0.5 max-w-xl">
                Sincronize saldos, faturas de cartão e transações do Nubank, Itaú, Inter e outros bancos com 1 clique, sem precisar lançar nada manualmente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setImportModalOpen(true)}
              className="pressable inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12.5px] font-medium text-[#1D1D1F] bg-[#FFFFFF] border border-[#DCE8D2] hover:bg-[#F5F5F7] transition-all"
              style={{ cursor: 'pointer' }}
              title="Importar banco já conectado no painel da Pluggy pelo Item ID"
            >
              <Download size={13} />
              <span>Importar por Item ID</span>
            </button>
            <button
              onClick={() => openPluggyConnect()}
              className="pressable inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold text-white hover:brightness-95 shadow-sm"
              style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
            >
              <Zap size={13} className="fill-white" />
              <span>Conectar Banco Agora</span>
            </button>
          </div>
        </div>
      )}

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
                <GhostButton tone="paid" type="submit">Salvar conta</GhostButton>
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-[#1D1D1F] truncate">
                            {acc.instituicao}
                          </span>
                          {acc.pluggyAccountId && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-semibold text-[#59694A] bg-[#EBF2E4]">
                              <ShieldCheck size={9.5} />
                              Open Finance
                            </span>
                          )}
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

      {/* Modal para Importação Direta por Item ID da Pluggy */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !importLoading && setImportModalOpen(false)}
          />

          <div className="relative z-10 bg-white rounded-[20px] shadow-2xl border border-[#E5E5EA] p-6 max-w-lg w-full">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#EBF2E4] text-[#59694A] flex items-center justify-center shrink-0 border border-[#C8D6B5]">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#1D1D1F]">
                    Importar do Painel da Pluggy
                  </h3>
                  <p className="text-[12px] text-[#6E6E73]">
                    Vincule um banco que você já conectou em dashboard.pluggy.ai
                  </p>
                </div>
              </div>

              <button
                onClick={() => setImportModalOpen(false)}
                disabled={importLoading}
                className="text-[#8E8E93] hover:text-[#1D1D1F] p-1 rounded-full hover:bg-[#F2F2F7] transition-all"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 bg-[#F9F9FB] rounded-[12px] border border-[#E5E5EA] mb-4 text-[12px] text-[#6E6E73] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#1D1D1F]">
                <HelpCircle size={14} className="text-[#59694A]" />
                <span>Onde encontro o Item ID?</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11.5px] leading-relaxed">
                <li>Acesse seu painel em <strong>dashboard.pluggy.ai</strong></li>
                <li>Clique em <strong>Items</strong> ou na instituição conectada</li>
                <li>Copie o campo <strong>Item ID</strong> (formato UUID, ex: <code className="bg-[#E5E5EA] px-1 py-0.5 rounded text-[10.5px]">6d4c2b91-1234-4567-89ab-cdef01234567</code>)</li>
              </ol>
            </div>

            <form onSubmit={handleImportByItemId} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1D1D1F] mb-1.5">
                  Item ID da Conexão
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cole aqui o Item ID (UUID)"
                  value={customItemId}
                  onChange={e => setCustomItemId(e.target.value)}
                  disabled={importLoading}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#D1D1D6] focus:border-[#59694A] focus:outline-none text-[13px] font-mono"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-[10px] bg-[#FDF2F2] border border-[#F9D5D5] flex items-start gap-2 text-[12px] text-[#C24138]">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-[10px] bg-[#EBF2E4] border border-[#C8D6B5] flex items-start gap-2 text-[12px] text-[#59694A] font-medium">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{importSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  disabled={importLoading}
                  className="px-4 py-2 rounded-[10px] text-[12.5px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-all"
                  style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={importLoading || !customItemId.trim()}
                  className="pressable inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12.5px] font-semibold text-white hover:brightness-95 disabled:opacity-50"
                  style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
                >
                  {importLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Importando dados...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Importar e Sincronizar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
