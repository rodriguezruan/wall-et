import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import logoMark from '../assets/wallet-mark.png';

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number; // ms, default 2200ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 2200 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, duration);
    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onFinish}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5F5F7] overflow-hidden select-none cursor-pointer"
      title="Clique para pular"
    >
      {/* ── Ambient Background Blobs (Luzes orgânicas animadas em degradê) ── */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.18, 0.92, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full blur-[90px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(119, 172, 141, 0.45) 0%, rgba(228, 235, 217, 0.1) 70%)',
        }}
      />

      <motion.div
        animate={{
          x: [0, -45, 35, 0],
          y: [0, 40, -35, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] rounded-full blur-[100px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(248, 216, 213, 0.45) 0%, rgba(242, 229, 201, 0.1) 70%)',
        }}
      />

      <motion.div
        animate={{
          scale: [0.85, 1.25, 0.85],
          opacity: [0.25, 0.55, 0.25],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] rounded-full blur-[110px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(235, 242, 228, 0.8) 0%, rgba(245, 245, 247, 0) 70%)',
        }}
      />

      {/* ── Conteúdo Central Flutuante ── */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glow de respiração ao redor do card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-4 rounded-[36px] bg-[#77AC8D]/20 blur-xl pointer-events-none"
        />

        {/* Squircle da Logo */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-20 h-20 rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/80 p-3.5 flex items-center justify-center shadow-xl"
          style={{
            boxShadow: '0 20px 40px -15px rgba(89, 105, 74, 0.2), inset 0 1px 0 rgba(255, 255, 255, 1)',
          }}
        >
          <motion.img
            src={logoMark}
            alt="Wall-Et"
            className="w-full h-full object-contain"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Tipografia da Marca */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-center"
        >
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#1D1D1F] leading-tight font-sans">
            Wall-Et
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="text-[10.5px] font-bold tracking-[0.28em] uppercase text-[#59694A] mt-1"
          >
            Finanças Pessoais
          </motion.p>
        </motion.div>

        {/* Linha de Progresso Sutil */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.9 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 w-36 h-1 bg-[#E5E5EA] rounded-full overflow-hidden shadow-inner"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: duration / 1000 - 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-[#77AC8D] to-[#59694A]"
          />
        </motion.div>

        {/* Indicador de inicialização */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ delay: 0.5, duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[11px] text-[#8E8E93] mt-2.5 font-medium"
        >
          Iniciando ambiente seguro...
        </motion.span>
      </div>
    </motion.div>
  );
};
