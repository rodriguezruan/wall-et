import React, { createContext, useContext, useState, useCallback } from 'react';
import type { LedgerState, Totals, TabId, Account, UserProfile } from '../types/ledger';
import { loadState, saveState, computeTotals, uid, todayISO } from '../lib/ledger';

interface LedgerContextType {
  state: LedgerState;
  totals: Totals;
  tab: TabId;
  setTab: (t: TabId) => void;
  persist: (next: LedgerState) => void;
  pushHistory: (base: LedgerState, tipo: string, descricao: string, valor: number) => LedgerState;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  
  // Quick Add Modal
  isQuickAddOpen: boolean;
  quickAddInitialType: 'despesa' | 'renda' | 'fatura';
  openQuickAdd: (type?: 'despesa' | 'renda' | 'fatura') => void;
  closeQuickAdd: () => void;

  // Account Management
  addAccount: (account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  updateAccountBalance: (id: string, novoSaldo: number) => void;

  // User Profile & Onboarding
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (name: string, initialBalance?: number, objetivo?: string) => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LedgerState>(() => loadState());
  const [tab, setTab] = useState<TabId>('resumo');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Quick Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialType, setQuickAddInitialType] = useState<'despesa' | 'renda' | 'fatura'>('despesa');

  const openQuickAdd = useCallback((type: 'despesa' | 'renda' | 'fatura' = 'despesa') => {
    setQuickAddInitialType(type);
    setIsQuickAddOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsQuickAddOpen(false);
  }, []);

  const persist = useCallback((next: LedgerState) => {
    setState(next);
    saveState(next);
  }, []);

  const pushHistory = useCallback(
    (base: LedgerState, tipo: string, descricao: string, valor: number): LedgerState => {
      const totals = computeTotals(base);
      const entry = {
        id: uid(),
        data: todayISO(),
        tipo,
        descricao,
        valor,
        saldoApos: totals.saldoDevedor,
      };
      return { ...base, history: [...(base.history || []), entry] };
    },
    []
  );

  // Accounts
  const addAccount = useCallback((accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: uid(),
    };
    setState(prev => {
      const next = { ...prev, accounts: [...(prev.accounts || []), newAcc] };
      saveState(next);
      return next;
    });
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, accounts: (prev.accounts || []).filter(a => a.id !== id) };
      saveState(next);
      return next;
    });
    setConfirmingId(null);
  }, []);

  const updateAccountBalance = useCallback((id: string, novoSaldo: number) => {
    setState(prev => {
      const next = {
        ...prev,
        accounts: (prev.accounts || []).map(a => a.id === id ? { ...a, saldo: novoSaldo } : a),
      };
      saveState(next);
      return next;
    });
  }, []);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    setState(prev => {
      const next = {
        ...prev,
        userProfile: {
          ...(prev.userProfile || { name: 'Ruan', onboarded: true }),
          ...profile,
        },
      };
      saveState(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((name: string, initialBalance?: number, objetivo?: string) => {
    setState(prev => {
      let accounts = [...(prev.accounts || [])];
      if (initialBalance && initialBalance > 0 && accounts.length === 0) {
        accounts = [{
          id: uid(),
          nome: 'Carteira Principal',
          instituicao: 'Carteira',
          tipo: 'carteira',
          saldo: initialBalance,
        }];
      }
      const next: LedgerState = {
        ...prev,
        accounts,
        userProfile: {
          name: name.trim() || 'Usuário',
          onboarded: true,
          objetivo,
        },
      };
      saveState(next);
      return next;
    });
  }, []);

  const totals = React.useMemo(() => computeTotals(state), [state]);

  return (
    <LedgerContext.Provider
      value={{
        state,
        totals,
        tab,
        setTab,
        persist,
        pushHistory,
        confirmingId,
        setConfirmingId,
        isQuickAddOpen,
        quickAddInitialType,
        openQuickAdd,
        closeQuickAdd,
        addAccount,
        deleteAccount,
        updateAccountBalance,
        updateUserProfile,
        completeOnboarding,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedger = () => {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error('useLedger must be used inside LedgerProvider');
  return ctx;
};
