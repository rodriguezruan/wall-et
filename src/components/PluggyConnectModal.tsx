import React, { useEffect, useState } from 'react';
import { useLedger } from '../context/LedgerContext';
import { PluggyConnect } from 'react-pluggy-connect';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { openUrl } from '@tauri-apps/plugin-opener';

export const PluggyConnectModal: React.FC = () => {
  const {
    pluggyModalState,
    closePluggyConnect,
    syncPluggyItem,
    isSyncingPluggy,
  } = useLedger();

  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Bancos que usam Open Finance regulado (OAuth) pedem para abrir a tela de
  // login/consentimento em uma pop-up. O WebView do Tauri bloqueia a criação
  // de pop-ups nativas (bug conhecido do WebView2/WKWebView), o que faz o
  // widget "travar" na tela de autorização sem nunca abrir nada.
  // Aqui a gente intercepta window.open enquanto o widget estiver aberto e
  // manda a URL pro navegador padrão do sistema via plugin-opener, onde o
  // usuário consegue concluir o login/consentimento normalmente.
  useEffect(() => {
    if (!pluggyModalState.token) return;

    const originalOpen = window.open;
    window.open = (url?: string | URL, ...rest: any[]) => {
      if (url) {
        const href = typeof url === 'string' ? url : url.toString();
        openUrl(href).catch(err => {
          console.error('Falha ao abrir navegador externo para autorização:', err);
        });
      }
      // Retorna null pois não há uma janela real do webview pra devolver.
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, [pluggyModalState.token]);

  if (!pluggyModalState.isOpen) return null;

  async function handleSuccess(data: { item: { id: string } }) {
    try {
      setSyncSuccessMsg('Conexão realizada com sucesso! Sincronizando contas e transações...');
      await syncPluggyItem(data.item.id);
      setSyncSuccessMsg('Dados sincronizados com sucesso!');
      setTimeout(() => {
        setSyncSuccessMsg(null);
        closePluggyConnect();
      }, 1500);
    } catch (err: any) {
      console.error('Erro na sincronização pós-conexão:', err);
      setSyncSuccessMsg(null);
      closePluggyConnect();
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop escuro translúcido */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closePluggyConnect}
        />

        {/* Modal de Carregamento / Status / Erro */}
        {(pluggyModalState.loading || pluggyModalState.error || isSyncingPluggy || syncSuccessMsg) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative z-10 bg-white rounded-[20px] shadow-2xl border border-[#E5E5EA] p-6 max-w-md w-full text-center"
          >
            <button
              onClick={closePluggyConnect}
              className="absolute top-4 right-4 text-[#8E8E93] hover:text-[#1D1D1F] p-1.5 rounded-full hover:bg-[#F2F2F7] transition-all"
              style={{ border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            {pluggyModalState.loading && (
              <div className="py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center mx-auto">
                  <Loader2 size={28} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                    Iniciando Open Finance...
                  </h3>
                  <p className="text-[13px] text-[#6E6E73] mt-1">
                    Conectando com segurança à API da Pluggy para gerar sua sessão bancária.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F7] rounded-full text-[11px] text-[#8E8E93]">
                  <ShieldCheck size={13} className="text-[#59694A]" />
                  <span>Criptografia de ponta a ponta</span>
                </div>
              </div>
            )}

            {syncSuccessMsg && (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#EBF2E4] text-[#59694A] flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                    Sucesso!
                  </h3>
                  <p className="text-[13px] text-[#59694A] mt-1 font-medium">
                    {syncSuccessMsg}
                  </p>
                </div>
              </div>
            )}

            {pluggyModalState.error && !syncSuccessMsg && (
              <div className="py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-[#FDF2F2] text-[#C24138] flex items-center justify-center mx-auto">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#1D1D1F]">
                    Não foi possível iniciar a conexão
                  </h3>
                  <p className="text-[12.5px] text-[#6E6E73] mt-1.5">
                    {pluggyModalState.error}
                  </p>
                </div>
                <button
                  onClick={closePluggyConnect}
                  className="px-5 py-2.5 rounded-[12px] bg-[#1D1D1F] text-white text-[13px] font-semibold hover:brightness-95 transition-all"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Widget Oficial do Pluggy Connect (quando temos o token e não estamos em tela de carregamento/sucesso) */}
        {pluggyModalState.token && !syncSuccessMsg && (
          <div className="relative z-10 w-full max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[11px] text-[#6E6E73] shadow-sm">
              <ShieldCheck size={12} className="text-[#59694A] shrink-0" />
              <span>Para alguns bancos, seu navegador padrão pode abrir para você concluir o login com segurança.</span>
            </div>
            <PluggyConnect
              connectToken={pluggyModalState.token}
              includeSandbox={true}
              countries={['BR']}
              language="pt"
              onSuccess={handleSuccess}
              onError={err => {
                console.error('Pluggy Connect Error:', err);
              }}
              onClose={() => {
                closePluggyConnect();
              }}
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
