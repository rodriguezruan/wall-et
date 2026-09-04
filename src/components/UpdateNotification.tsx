import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, RefreshCw, X, AlertCircle } from 'lucide-react';
import type { UpdateInfo } from '../lib/updater';
import { installAppUpdate } from '../lib/updater';

interface UpdateNotificationProps {
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  updateInfo,
  onDismiss,
}) => {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'error'>('idle');
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!updateInfo || !updateInfo.available) return null;

  async function handleStartUpdate() {
    setStatus('downloading');
    setProgressPct(0);
    try {
      await installAppUpdate((downloaded, total) => {
        if (total && total > 0) {
          setProgressPct(Math.round((downloaded / total) * 100));
        } else {
          setProgressPct(null);
        }
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Falha ao baixar atualização.');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-[22px] bg-white border border-[#C8D6B5] shadow-2xl p-5"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#EBF2E4] text-[#59694A] flex items-center justify-center shrink-0">
              <Sparkles size={16} strokeWidth={2.3} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-[13.5px] font-bold text-[#1D1D1F]">
                  Nova Versão
                </h4>
                <span className="px-2 py-0.5 rounded-[50px] bg-[#59694A] text-white text-[10.5px] font-bold font-mono">
                  v{updateInfo.version}
                </span>
              </div>
              <span className="text-[11px] text-[#8E8E93] block">
                Uma nova versão do Wall-Et está pronta!
              </span>
            </div>
          </div>

          {status !== 'downloading' && (
            <button
              onClick={onDismiss}
              className="text-[#8E8E93] hover:text-[#1D1D1F] p-1 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Fechar"
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Release Notes Preview */}
        {updateInfo.body && (
          <p className="text-[12px] text-[#6E6E73] mb-3 line-clamp-2 leading-relaxed bg-[#F9FAF8] p-2.5 rounded-[12px] border border-[#F2F2F7]">
            {updateInfo.body}
          </p>
        )}

        {/* State: Downloading */}
        {status === 'downloading' && (
          <div className="space-y-2 my-2">
            <div className="w-full bg-[#E5E5EA] h-2 rounded-full overflow-hidden">
              {progressPct !== null ? (
                <div
                  className="bg-[#59694A] h-full transition-all duration-200 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              ) : (
                <div className="bg-[#59694A] h-full w-2/3 animate-pulse rounded-full" />
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin text-[#59694A]" />
                Instalando...
              </span>
              <span className="font-mono font-semibold text-[#1D1D1F]">
                {progressPct !== null ? `${progressPct}%` : 'Aguarde...'}
              </span>
            </div>
            <span className="text-[10px] text-[#8E8E93] block">
              O aplicativo reiniciará automaticamente ao concluir.
            </span>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="p-2.5 rounded-[10px] bg-[#FDF4F3] border border-[#F8D8D5] text-[11.5px] text-[#C24138] flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        {status !== 'downloading' && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[#F2F2F7]">
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-[50px] text-[11.5px] font-medium text-[#8E8E93] hover:text-[#1D1D1F] transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Depois
            </button>
            <button
              onClick={handleStartUpdate}
              className="pressable px-4 py-1.5 rounded-[50px] bg-[#59694A] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-sm hover:brightness-95 transition-all"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <Download size={13} strokeWidth={2.3} />
              <span>{status === 'error' ? 'Tentar novamente' : 'Atualizar agora'}</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
