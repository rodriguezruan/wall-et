import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import logoMark from '../assets/wallet-mark.png';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number; // ms, default 2800ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 2800 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, duration);
    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5F5F7] overflow-hidden select-none"
    >
      {/* ── Textura de Fundo: Dot Matrix Arquitetural Suave ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #59694A 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* ── Ambient Mesh Glows (Luzes orgânicas volumosas e animadas) ── */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.25, 0.95, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full blur-[100px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(119, 172, 141, 0.5) 0%, rgba(228, 235, 217, 0.1) 70%)',
        }}
      />

      <motion.div
        animate={{
          x: [0, -60, 40, 0],
          y: [0, 50, -40, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(248, 216, 213, 0.55) 0%, rgba(242, 229, 201, 0.1) 70%)',
        }}
      />

      <motion.div
        animate={{
          scale: [0.9, 1.2, 0.9],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] rounded-full blur-[130px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(235, 242, 228, 0.9) 0%, rgba(245, 245, 247, 0) 70%)',
        }}
      />

      {/* ── Elementos Flutuantes Dinâmicos ao Redor do Hero (Cards Vivos) ── */}

      {/* Card Flutuante 1 (Superior Esquerdo: Entrada/Renda) */}
      <motion.div
        initial={{ opacity: 0, x: -40, y: -20, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -8, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.7, delay: 0.2 },
          scale: { duration: 0.7, delay: 0.2 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute top-12 left-8 md:top-24 md:left-24 z-10 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-white/85 backdrop-blur-md border border-white/90 shadow-lg pointer-events-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center">
          <ArrowDownLeft size={16} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-[10.5px] font-semibold text-[#8E8E93] block">Renda Recebida</span>
          <span className="text-[13px] font-bold font-mono text-[#59694A]">+R$ 4.850,00</span>
        </div>
      </motion.div>

      {/* Card Flutuante 2 (Superior Direito: Privacidade) */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: -20, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, 8, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.7, delay: 0.3 },
          scale: { duration: 0.7, delay: 0.3 },
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute top-16 right-8 md:top-28 md:right-28 z-10 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-white/85 backdrop-blur-md border border-white/90 shadow-lg pointer-events-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center">
          <ShieldCheck size={16} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-[10.5px] font-semibold text-[#8E8E93] block">Privacidade Total</span>
          <span className="text-[12px] font-bold text-[#1D1D1F]">100% Offline & Seguro</span>
        </div>
      </motion.div>

      {/* Card Flutuante 3 (Inferior Esquerdo: Calendário/Compromissos) */}
      <motion.div
        initial={{ opacity: 0, x: -40, y: 20, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, 7, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.7, delay: 0.4 },
          scale: { duration: 0.7, delay: 0.4 },
          y: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute bottom-16 left-8 md:bottom-28 md:left-24 z-10 hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-white/85 backdrop-blur-md border border-white/90 shadow-lg pointer-events-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#F2E5C9] text-[#92661E] flex items-center justify-center">
          <Calendar size={15} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-[10.5px] font-semibold text-[#8E8E93] block">Agenda do Mês</span>
          <span className="text-[12px] font-bold text-[#1D1D1F]">Contas sob controle</span>
        </div>
      </motion.div>

      {/* Card Flutuante 4 (Inferior Direito: Sobra Estimada) */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: 20, scale: 0.9 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -7, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.7, delay: 0.45 },
          scale: { duration: 0.7, delay: 0.45 },
          y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute bottom-16 right-8 md:bottom-24 md:right-28 z-10 hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] bg-white/85 backdrop-blur-md border border-white/90 shadow-lg pointer-events-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center">
          <TrendingUp size={16} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-[10.5px] font-semibold text-[#8E8E93] block">Fluxo Positivo</span>
          <span className="text-[13px] font-bold font-mono text-[#59694A]">Sobra garantida</span>
        </div>
      </motion.div>

      {/* ── Bloco Central Harmonioso (Hero Unit) ── */}
      <div className="relative z-20 max-w-xl w-full px-6 flex flex-col items-center text-center">

        {/* Círculo Radiante e Squircle da Logo */}
        <div className="relative mb-5">
          {/* Anéis decorativos pulsantes concêntricos */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-6 rounded-full bg-gradient-to-tr from-[#77AC8D]/30 to-[#EBF2E4]/40 blur-xl pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-24 h-24 md:w-28 md:h-28 rounded-[30px] bg-white/95 backdrop-blur-2xl border border-white p-4 md:p-5 flex items-center justify-center shadow-2xl"
            style={{
              boxShadow: '0 25px 50px -12px rgba(89, 105, 74, 0.25), inset 0 1px 0 rgba(255, 255, 255, 1)',
            }}
          >
            <motion.img
              src={logoMark}
              alt="Wall-Et"
              className="w-full h-full object-contain"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        {/* Badge Sutil Superior */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[50px] bg-[#EBF2E4] border border-[#C8D6B5] text-[11px] font-bold text-[#59694A] mb-3"
        >
          <Sparkles size={12} strokeWidth={2.5} />
          <span>Controle Financeiro Descomplicado</span>
        </motion.div>

        {/* Título Principal Imponente */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[34px] md:text-[42px] font-extrabold tracking-tight text-[#1D1D1F] leading-none font-sans"
        >
          Wall-Et
        </motion.h1>

        {/* Descrição Encorpada e Harmoniosa */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[13.5px] md:text-[15px] text-[#6E6E73] mt-2.5 max-w-md leading-relaxed font-normal"
        >
          Seu painel financeiro pessoal elegante, intuitivo e 100% offline para organizar receitas, contas e parcelamentos com tranquilidade.
        </motion.p>

        {/* Pílulas de Benefícios Chave */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-4"
        >
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[50px] bg-white/80 border border-[#E5E5EA] text-[11px] font-medium text-[#4B564C] shadow-sm">
            <ShieldCheck size={12} className="text-[#59694A]" />
            100% no seu PC
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[50px] bg-white/80 border border-[#E5E5EA] text-[11px] font-medium text-[#4B564C] shadow-sm">
            <TrendingUp size={12} className="text-[#59694A]" />
            Gráficos e Saldo Real
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[50px] bg-white/80 border border-[#E5E5EA] text-[11px] font-medium text-[#4B564C] shadow-sm">
            <CheckCircle2 size={12} className="text-[#59694A]" />
            Sem assinaturas
          </span>
        </motion.div>

        {/* ── Barra de Progresso & Ação de Entrada ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-7 w-full max-w-xs flex flex-col items-center"
        >
          {/* Barra de Progresso */}
          <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden shadow-inner mb-3">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: duration / 1000 - 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-[#77AC8D] via-[#59694A] to-[#3B4731]"
            />
          </div>

          <div className="flex items-center justify-between w-full text-[11.5px]">
            <span className="text-[#8E8E93] font-medium">
              Abrindo painel pessoal...
            </span>

            {/* Botão de Entrada Imediata */}
            <button
              onClick={onFinish}
              className="pressable inline-flex items-center gap-1 font-bold text-[#59694A] hover:text-[#3B4731] transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Entrar agora</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
