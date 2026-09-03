import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';
import logoMark from '../assets/wallet-mark.png';

const OBJECTIVES = [
  'Organizar gastos do mês',
  'Quitar pendências e dívidas',
  'Acompanhar saldo e rendas',
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useLedger();

  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [selectedObjective, setSelectedObjective] = useState(OBJECTIVES[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim() || 'Amigo';
    const cleanBalance = initialBalance ? parseFloat(initialBalance.replace(',', '.')) : 0;
    completeOnboarding(cleanName, cleanBalance, selectedObjective);
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#F5F5F7] overflow-hidden">

      {/* ── Detalhes Artísticos Sutis no Fundo (Ambient Mesh Glows) ── */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(circle, #E4EBD9 0%, rgba(228, 235, 217, 0) 70%)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none opacity-50"
        style={{ background: 'radial-gradient(circle, #F8D8D5 0%, rgba(248, 216, 213, 0) 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[120px] pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, #F1F5EE 0%, rgba(241, 245, 238, 0) 70%)' }}
      />

      {/* ── Card Central Flutuante Apple-style (24px) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="panel relative z-10 w-full max-w-lg p-7 md:p-9 rounded-[24px]"
      >
        {/* Topo / Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#EBF2E4] border border-[#C8D6B5] p-2.5 mb-3.5 shadow-sm">
            <img src={logoMark} alt="Wall-Et" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-[24px] md:text-[26px] font-bold tracking-tight text-[#1D1D1F]">
            Boas-vindas ao Wall-Et
          </h1>
          <p className="text-[13px] text-[#6E6E73] mt-1 max-w-sm mx-auto leading-relaxed">
            Controle financeiro pessoal minimalista, elegante e 100% offline. Preencha seus dados para personalizar seu painel.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campo 1: Nome */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-1.5">
              Como gostaria de ser chamado(a)? <span className="text-[#C24138]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Ruan, Beatriz, Carlos"
              className="field-input"
            />
          </div>

          {/* Campo 2: Saldo Inicial Opcional */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-semibold text-[#1D1D1F]">
                Saldo inicial em caixa/contas
              </label>
              <span className="text-[11px] text-[#8E8E93] font-medium">Opcional</span>
            </div>
            <input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              placeholder="0,00"
              className="field-input font-mono"
            />
            <span className="text-[11px] text-[#8E8E93] mt-1 block">
              Se preenchido, criará uma conta &quot;Carteira Principal&quot; com este saldo.
            </span>
          </div>

          {/* Campo 3: Objetivo Principal */}
          <div>
            <label className="block text-[12px] font-semibold text-[#1D1D1F] mb-2">
              Seu foco principal agora:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OBJECTIVES.map(obj => {
                const active = selectedObjective === obj;
                return (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => setSelectedObjective(obj)}
                    className="pressable p-2.5 rounded-[12px] text-left text-[11.5px] font-medium border transition-all flex items-center justify-between"
                    style={{
                      background: active ? '#EBF2E4' : '#FAFAFC',
                      borderColor: active ? '#C8D6B5' : '#E5E5EA',
                      color: active ? '#59694A' : '#6E6E73',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{obj}</span>
                    {active && <Check size={13} strokeWidth={2.5} className="shrink-0 text-[#59694A]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão de Conclusão */}
          <div className="pt-2">
            <button
              type="submit"
              className="pressable w-full py-3 px-5 rounded-[50px] text-[13.5px] font-bold text-white flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-sm"
              style={{ background: '#59694A', border: 'none', cursor: 'pointer' }}
            >
              <span>Começar a usar o Wall-Et</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </form>

        {/* Rodapé de Privacidade */}
        <div className="mt-5 pt-4 border-t border-[#F2F2F7] flex items-center justify-center gap-1.5 text-[11.5px] text-[#8E8E93]">
          <ShieldCheck size={14} className="text-[#59694A]" />
          <span>Seus dados ficam salvos exclusivamente neste dispositivo.</span>
        </div>
      </motion.div>
    </div>
  );
};
