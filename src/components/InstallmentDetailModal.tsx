import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Calendar, CheckCircle2, RotateCcw, Clock, CreditCard } from 'lucide-react';
import type { Installment } from '../types/ledger';
import { useLedger } from '../context/LedgerContext';
import { fmtBRL, fmtDate, addMonthsISO, getInstallmentSchedule } from '../lib/ledger';

interface InstallmentDetailModalProps {
  installment: Installment | null;
  onClose: () => void;
  onPayNext: (inst: Installment) => void;
  onRevertLast: (inst: Installment) => void;
}

export const InstallmentDetailModal: React.FC<InstallmentDetailModalProps> = ({
  installment,
  onClose,
  onPayNext,
  onRevertLast,
}) => {
  const { state } = useLedger();

  if (!installment) return null;

  const schedule = getInstallmentSchedule(installment);
  const account = state.accounts?.find(a => a.id === installment.accountId);
  const quitado = installment.parcelasPagas >= installment.parcelas;
  const pct = Math.round((installment.parcelasPagas / installment.parcelas) * 100);
  const totalPago = installment.parcelasPagas * installment.valorParcela;
  const totalRestante = Math.max(0, installment.parcelas - installment.parcelasPagas) * installment.valorParcela;
  const dataFinal = addMonthsISO(installment.dataInicio, installment.parcelas - 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="panel relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[22px] overflow-hidden shadow-2xl bg-[#FFFFFF]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#F2F2F7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#EBF2E4] flex items-center justify-center text-[#59694A]">
                <Layers size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#1D1D1F] leading-tight">
                  {installment.descricao}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[#8E8E93]">
                  <span>{installment.categoria || 'Compras'}</span>
                  {account && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-[#59694A]">
                        <CreditCard size={11} />
                        {account.nome}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] transition-colors"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-6 overflow-y-auto space-y-6">

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                  Progresso
                </span>
                <span className="text-[16px] font-bold text-[#1D1D1F] font-mono">
                  {installment.parcelasPagas}/{installment.parcelas}
                </span>
                <span className="text-[11px] text-[#6E6E73] ml-1">({pct}%)</span>
              </div>

              <div className="p-3.5 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                  Por Parcela
                </span>
                <span className="text-[16px] font-bold text-[#1D1D1F] font-mono">
                  {fmtBRL(installment.valorParcela)}
                </span>
              </div>

              <div className="p-3.5 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                  Já Pago
                </span>
                <span className="text-[16px] font-bold text-[#59694A] font-mono">
                  {fmtBRL(totalPago)}
                </span>
              </div>

              <div className="p-3.5 rounded-[15px] bg-[#FAFAFC] border border-[#F2F2F7]">
                <span className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                  Restante
                </span>
                <span className="text-[16px] font-bold text-[#C24138] font-mono">
                  {fmtBRL(totalRestante)}
                </span>
              </div>
            </div>

            {/* Progress Bar & Schedule Timeline */}
            <div className="p-4 rounded-[15px] bg-[#F9FAF8] border border-[#E9EFE6]">
              <div className="flex items-center justify-between text-[12px] text-[#6E6E73] mb-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#59694A]" />
                  Início: {fmtDate(installment.dataInicio)}
                </span>
                <span>Término previsto: {fmtDate(dataFinal)}</span>
              </div>

              <div className="w-full bg-[#E5E5EA] h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: quitado ? '#59694A' : '#77AC8D',
                  }}
                />
              </div>

              {/* Action Buttons: Pay Next & Revert Last */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E5EA]">
                <div className="flex items-center gap-2">
                  {!quitado ? (
                    <button
                      onClick={() => onPayNext(installment)}
                      className="pressable px-4 py-2 rounded-[50px] bg-[#59694A] text-white text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm hover:brightness-95 transition-all"
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Marcar parcela {installment.parcelasPagas + 1} como paga</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[50px] bg-[#EBF2E4] text-[#59694A] text-[12px] font-semibold">
                      <CheckCircle2 size={14} />
                      Parcelamento 100% quitado!
                    </span>
                  )}
                </div>

                {installment.parcelasPagas > 0 && (
                  <button
                    onClick={() => onRevertLast(installment)}
                    className="pressable px-3.5 py-1.5 rounded-[50px] border border-[#E5E5EA] bg-white text-[#C24138] hover:bg-[#FDF6F5] text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                    style={{ cursor: 'pointer' }}
                    title="Desfazer a última parcela paga e ajustar o saldo"
                  >
                    <RotateCcw size={13} />
                    <span>Desfazer parcela {installment.parcelasPagas}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cronograma Completo Mês a Mês */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Cronograma Mês a Mês
                </h3>
                <span className="text-[11.5px] text-[#8E8E93]">
                  {installment.parcelas} parcelas programadas
                </span>
              </div>

              <div className="border border-[#F2F2F7] rounded-[15px] overflow-hidden divide-y divide-[#F2F2F7]">
                {schedule.parcels.map(p => {
                  const isNext = !p.pago && schedule.proximaParcela?.numero === p.numero;
                  return (
                    <div
                      key={p.numero}
                      className={`p-3.5 flex items-center justify-between text-[12.5px] transition-colors ${
                        p.pago
                          ? 'bg-white text-[#6E6E73]'
                          : isNext
                          ? 'bg-[#FBF8EF] text-[#1D1D1F]'
                          : 'bg-[#FAFAFC] text-[#8E8E93]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold ${
                            p.pago
                              ? 'bg-[#EBF2E4] text-[#59694A]'
                              : isNext
                              ? 'bg-[#F2E5C9] text-[#92661E]'
                              : 'bg-[#E5E5EA] text-[#8E8E93]'
                          }`}
                        >
                          {p.numero}
                        </div>

                        <div>
                          <div className="font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <span>Parcela {p.numero} de {p.total}</span>
                            {p.isCurrentMonth && (
                              <span className="px-2 py-0.5 rounded-[50px] bg-[#EBF2E4] text-[#59694A] text-[10px] font-bold">
                                Mês Atual
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#8E8E93]">
                            Vencimento: {fmtDate(p.dataVencimento)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-[#1D1D1F]">
                          {fmtBRL(p.valor)}
                        </span>

                        {p.pago ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[50px] bg-[#EBF2E4] text-[#59694A] text-[11px] font-semibold">
                              <CheckCircle2 size={12} />
                              Paga
                            </span>
                            {p.numero === installment.parcelasPagas && (
                              <button
                                onClick={() => onRevertLast(installment)}
                                className="text-[11px] text-[#C24138] hover:underline"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                title="Desfazer pagamento desta parcela"
                              >
                                Desfazer
                              </button>
                            )}
                          </div>
                        ) : isNext ? (
                          <button
                            onClick={() => onPayNext(installment)}
                            className="pressable px-3 py-1 rounded-[50px] bg-[#59694A] text-white text-[11.5px] font-semibold hover:brightness-95 flex items-center gap-1 shadow-sm"
                            style={{ border: 'none', cursor: 'pointer' }}
                          >
                            <CheckCircle2 size={12} />
                            Pagar
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[50px] bg-[#F2F2F7] text-[#8E8E93] text-[11px] font-medium">
                            <Clock size={11} />
                            Prevista
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-[#F2F2F7] bg-[#FAFAFC] flex justify-end">
            <button
              onClick={onClose}
              className="pressable px-4 py-1.5 rounded-[50px] bg-[#E5E5EA] text-[#1D1D1F] hover:bg-[#D1D1D6] text-[12.5px] font-semibold transition-colors"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
