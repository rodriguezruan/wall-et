import React, { useState } from 'react';
import { Plus, Trash2, Layers, RotateCcw, CheckCircle2, ChevronRight, CreditCard, Clock } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import { SectionHeader, GhostButton, FormCard, TextField, SelectField, ConfirmDelete, ProgressBar, CategoryChips } from './ui';
import { uid, todayISO, fmtBRL, fmtDate, getInstallmentSchedule, DEFAULT_CATEGORIES } from '../lib/ledger';
import { InstallmentDetailModal } from './InstallmentDetailModal';
import type { Installment } from '../types/ledger';

const SEP = { borderBottom: '1px solid #F2F2F7' };

export const ParcelamentosTab: React.FC = () => {
  const { state, persist, pushHistory, confirmingId, setConfirmingId } = useLedger();

  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

  const [instForm, setInstForm] = useState<{
    descricao: string;
    categoria: string;
    valorTotal: string;
    parcelas: string;
    dataInicio: string;
    accountId: string;
  } | null>(null);

  const activeModalInstallment = state.installments.find(i => i.id === selectedInstId) || null;

  function saveInstallment() {
    if (!instForm?.descricao.trim() || !instForm.valorTotal || !instForm.parcelas) return;
    const parcelas = parseInt(instForm.parcelas, 10);
    const valorTotal = parseFloat(instForm.valorTotal);
    if (parcelas <= 0 || valorTotal <= 0) return;

    const inst: Installment = {
      id: uid(),
      descricao: instForm.descricao.trim(),
      categoria: instForm.categoria || 'Compras',
      valorTotal,
      parcelas,
      valorParcela: valorTotal / parcelas,
      parcelasPagas: 0,
      dataInicio: instForm.dataInicio,
      accountId: instForm.accountId || undefined,
    };

    let next = { ...state, installments: [...state.installments, inst] };
    next = pushHistory(next, 'parcelamento-novo', `Parcelamento: ${inst.descricao}`, valorTotal);
    persist(next);
    setInstForm(null);
  }

  function payInstallment(inst: Installment) {
    if (inst.parcelasPagas >= inst.parcelas) return;
    const novaParcelasPagas = inst.parcelasPagas + 1;

    // Se tiver conta associada, debita o valor da parcela
    let updatedAccounts = state.accounts || [];
    if (inst.accountId) {
      updatedAccounts = updatedAccounts.map(acc =>
        acc.id === inst.accountId ? { ...acc, saldo: acc.saldo - inst.valorParcela } : acc
      );
    }

    let next = {
      ...state,
      accounts: updatedAccounts,
      installments: state.installments.map(i => i.id === inst.id ? { ...i, parcelasPagas: novaParcelasPagas } : i),
    };

    next = pushHistory(
      next,
      'parcela-paga',
      `Parcela ${novaParcelasPagas}/${inst.parcelas}: ${inst.descricao}`,
      inst.valorParcela
    );

    persist(next);
  }

  function revertInstallment(inst: Installment) {
    if (inst.parcelasPagas <= 0) return;
    const revertida = inst.parcelasPagas;
    const novaParcelasPagas = inst.parcelasPagas - 1;

    // Se tiver conta associada, estorna o valor da parcela de volta na conta
    let updatedAccounts = state.accounts || [];
    if (inst.accountId) {
      updatedAccounts = updatedAccounts.map(acc =>
        acc.id === inst.accountId ? { ...acc, saldo: acc.saldo + inst.valorParcela } : acc
      );
    }

    let next = {
      ...state,
      accounts: updatedAccounts,
      installments: state.installments.map(i => i.id === inst.id ? { ...i, parcelasPagas: novaParcelasPagas } : i),
    };

    next = pushHistory(
      next,
      'parcela-estorno',
      `Estorno parcela ${revertida}/${inst.parcelas}: ${inst.descricao}`,
      -inst.valorParcela
    );

    persist(next);
  }

  function deleteInstallment(id: string) {
    persist({ ...state, installments: state.installments.filter(i => i.id !== id) });
    setConfirmingId(null);
    if (selectedInstId === id) setSelectedInstId(null);
  }

  // Totais rápidos de parcelamentos
  const totalRestanteGlobal = state.installments.reduce(
    (s, i) => s + Math.max(0, i.parcelas - i.parcelasPagas) * i.valorParcela,
    0
  );
  const totalPagoGlobal = state.installments.reduce(
    (s, i) => s + i.parcelasPagas * i.valorParcela,
    0
  );

  return (
    <div className="space-y-4">
      {/* Painel Principal */}
      <div className="panel p-5">
        <SectionHeader
          icon={Layers}
          title="Parcelamentos"
          action={
            !instForm && (
              <GhostButton
                onClick={() =>
                  setInstForm({
                    descricao: '',
                    categoria: 'Compras',
                    valorTotal: '',
                    parcelas: '',
                    dataInicio: todayISO(),
                    accountId: state.accounts[0]?.id || '',
                  })
                }
              >
                <Plus size={12} strokeWidth={2.5} /> Novo parcelamento
              </GhostButton>
            )
          }
        />

        {/* Resumo de Destaque */}
        {state.installments.length > 0 && !instForm && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 mt-2">
            <div className="p-3 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Total Restante
              </span>
              <span className="text-[16px] font-bold text-[#C24138] font-mono">
                {fmtBRL(totalRestanteGlobal)}
              </span>
            </div>

            <div className="p-3 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Parcelas Devidas Neste Mês
              </span>
              <span className="text-[16px] font-bold text-[#1D1D1F] font-mono">
                {fmtBRL(
                  state.installments.reduce((s, i) => {
                    const sch = getInstallmentSchedule(i);
                    return s + sch.amountDueThisMonth;
                  }, 0)
                )}
              </span>
            </div>

            <div className="p-3 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
              <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Total Já Amortizado
              </span>
              <span className="text-[16px] font-bold text-[#59694A] font-mono">
                {fmtBRL(totalPagoGlobal)}
              </span>
            </div>
          </div>
        )}

        {/* Formulário de Novo Parcelamento */}
        {instForm && (
          <FormCard>
            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Descrição"
                placeholder="Ex: Notebook Dell, Sofá, Geladeira..."
                value={instForm.descricao}
                onChange={e => setInstForm({ ...instForm, descricao: e.target.value })}
              />
              <TextField
                label="Valor total da compra (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={instForm.valorTotal}
                onChange={e => setInstForm({ ...instForm, valorTotal: e.target.value })}
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <TextField
                label="Número de parcelas"
                type="number"
                placeholder="10"
                value={instForm.parcelas}
                onChange={e => setInstForm({ ...instForm, parcelas: e.target.value })}
              />
              <TextField
                label="Data da 1ª parcela"
                type="date"
                value={instForm.dataInicio}
                onChange={e => setInstForm({ ...instForm, dataInicio: e.target.value })}
              />
              {state.accounts.length > 0 && (
                <SelectField
                  label="Conta / Cartão vinculado"
                  value={instForm.accountId}
                  onChange={e => setInstForm({ ...instForm, accountId: e.target.value })}
                >
                  <option value="">Nenhuma conta específica</option>
                  {state.accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.instituicao})
                    </option>
                  ))}
                </SelectField>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-[#1D1D1F] mb-1.5">
                Categoria
              </span>
              <CategoryChips
                selected={instForm.categoria}
                onSelect={cat => setInstForm({ ...instForm, categoria: cat })}
                categories={DEFAULT_CATEGORIES}
              />
            </div>

            {instForm.valorTotal && instForm.parcelas && parseInt(instForm.parcelas) > 0 && (
              <div className="p-3 rounded-[12px] bg-[#F1F5EE] text-[12px] text-[#59694A] flex items-center justify-between">
                <span>
                  Valor calculado por parcela:
                </span>
                <span className="font-bold font-mono text-[14px]">
                  {fmtBRL(parseFloat(instForm.valorTotal) / parseInt(instForm.parcelas))} / mês
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <GhostButton onClick={saveInstallment} tone="paid">
                Salvar parcelamento
              </GhostButton>
              <GhostButton onClick={() => setInstForm(null)}>
                Cancelar
              </GhostButton>
            </div>
          </FormCard>
        )}

        {/* Lista de Parcelamentos */}
        {state.installments.length === 0 && !instForm ? (
          <p style={{ fontSize: 12.5, color: '#8E8E93', padding: '8px 0' }}>
            Nenhum parcelamento cadastrado ainda.
          </p>
        ) : (
          <div style={{ borderTop: '1px solid #F2F2F7' }}>
            {state.installments.map(i => {
              const quitado = i.parcelasPagas >= i.parcelas;
              const restante = Math.max(0, i.parcelas - i.parcelasPagas) * i.valorParcela;
              const schedule = getInstallmentSchedule(i);
              const proxima = schedule.proximaParcela;
              const account = state.accounts?.find(a => a.id === i.accountId);
              const pct = Math.round((i.parcelasPagas / i.parcelas) * 100);

              return (
                <div key={i.id} style={{ ...SEP, padding: '16px 0' }}>
                  {/* Linha Superior: Título, Categorias e Valor Restante */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="cursor-pointer" onClick={() => setSelectedInstId(i.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#1D1D1F] hover:text-[#59694A] transition-colors">
                          {i.descricao}
                        </span>
                        {i.categoria && (
                          <span className="text-[10.5px] px-2 py-0.5 rounded-[50px] bg-[#F2F2F7] text-[#6E6E73] font-medium">
                            {i.categoria}
                          </span>
                        )}
                        {account && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-[50px] bg-[#EBF2E4] text-[#59694A] font-medium">
                            <CreditCard size={10} />
                            {account.nome}
                          </span>
                        )}
                      </div>

                      {/* Subtítulo com Status da Próxima Parcela */}
                      <div className="flex items-center gap-2 mt-1 text-[11.5px] text-[#6E6E73] flex-wrap">
                        <span>
                          Parcela{' '}
                          <strong className="text-[#1D1D1F]">
                            {i.parcelasPagas}/{i.parcelas}
                          </strong>
                          {' '}· {fmtBRL(i.valorParcela)}/mês
                        </span>

                        <span>·</span>

                        {quitado ? (
                          <span className="text-[#59694A] font-semibold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Quitado
                          </span>
                        ) : proxima ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className={schedule.isDueThisMonth ? 'text-[#92661E]' : 'text-[#8E8E93]'} />
                            <span>
                              Próx: {fmtDate(proxima.dataVencimento)}
                            </span>
                            {schedule.isDueThisMonth && (
                              <span className="px-1.5 py-0.2 rounded bg-[#FBF8EF] text-[#92661E] font-semibold text-[10px]">
                                Devida este mês
                              </span>
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[14px] font-bold font-mono text-[#1D1D1F] block">
                          {fmtBRL(restante)}
                        </span>
                        <span className="text-[10px] text-[#8E8E93]">restante</span>
                      </div>

                      {confirmingId === i.id ? (
                        <ConfirmDelete
                          onConfirm={() => deleteInstallment(i.id)}
                          onCancel={() => setConfirmingId(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setConfirmingId(i.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#8E8E93',
                            padding: 4,
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.color = '#C24138';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.color = '#8E8E93';
                          }}
                          title="Excluir parcelamento"
                        >
                          <Trash2 size={14} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="my-2">
                    <ProgressBar pct={pct} done={quitado} />
                  </div>

                  {/* Ações Rápidas: Pagar, Desfazer e Cronograma */}
                  <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!quitado && (
                        <GhostButton
                          small
                          onClick={() => payInstallment(i)}
                          tone="paid"
                        >
                          <CheckCircle2 size={12} strokeWidth={2.2} />
                          <span>Marcar parcela {i.parcelasPagas + 1} como paga</span>
                        </GhostButton>
                      )}

                      {i.parcelasPagas > 0 && (
                        <button
                          onClick={() => revertInstallment(i)}
                          className="pressable px-2.5 py-1 rounded-[50px] border border-[#E5E5EA] bg-white text-[#C24138] hover:bg-[#FDF6F5] text-[11px] font-medium flex items-center gap-1 transition-colors"
                          style={{ cursor: 'pointer' }}
                          title="Desfazer o pagamento da última parcela"
                        >
                          <RotateCcw size={11} />
                          <span>Desfazer parcela {i.parcelasPagas}</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedInstId(i.id)}
                      className="text-[11.5px] font-semibold text-[#59694A] hover:underline flex items-center gap-1"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span>Ver cronograma detalhado</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes e Cronograma Completo */}
      <InstallmentDetailModal
        installment={activeModalInstallment}
        onClose={() => setSelectedInstId(null)}
        onPayNext={payInstallment}
        onRevertLast={revertInstallment}
      />
    </div>
  );
};
