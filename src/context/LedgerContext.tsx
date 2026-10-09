import React, { createContext, useContext, useState, useCallback } from 'react';
import type { LedgerState, Totals, TabId, Account, UserProfile } from '../types/ledger';
import { loadState, saveState, computeTotals, uid, todayISO, getAvailableMonths, addMonthsToMonthStr, EMPTY_STATE } from '../lib/ledger';
import {
  isPluggyConfigured,
  createConnectToken,
  fetchPluggySnapshot,
  applyPluggySnapshot,
  deletePluggyItem,
  triggerPluggySync,
  type PluggySnapshot,
} from '../lib/pluggy';

interface PluggyModalState {
  isOpen: boolean;
  token: string | null;
  updateItemId?: string;
  error?: string;
  loading: boolean;
}

interface LedgerContextType {
  state: LedgerState;
  totals: Totals;
  tab: TabId;
  setTab: (t: TabId) => void;
  persist: (next: LedgerState) => void;
  pushHistory: (base: LedgerState, tipo: string, descricao: string, valor: number) => LedgerState;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
  
  // Month Filtering & Navigation
  selectedMonth: string; // ISO YYYY-MM
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  nextMonth: () => void;
  prevMonth: () => void;
  resetToCurrentMonth: () => void;

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
  resetAllData: () => void;

  // Pluggy Open Finance
  isPluggyConfigured: boolean;
  isSyncingPluggy: boolean;
  pluggyModalState: PluggyModalState;
  openPluggyConnect: (updateItemId?: string) => Promise<void>;
  closePluggyConnect: () => void;
  syncPluggyItem: (itemId: string) => Promise<void>;
  syncAllPluggy: () => Promise<void>;
  disconnectPluggyItem: (itemId: string) => Promise<void>;
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

  // Month selection
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayISO().slice(0, 7));

  const nextMonth = useCallback(() => {
    setSelectedMonth(prev => addMonthsToMonthStr(prev, 1));
  }, []);

  const prevMonth = useCallback(() => {
    setSelectedMonth(prev => addMonthsToMonthStr(prev, -1));
  }, []);

  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonth(todayISO().slice(0, 7));
  }, []);

  const availableMonths = React.useMemo(() => getAvailableMonths(state), [state]);

  const totals = React.useMemo(() => computeTotals(state, selectedMonth), [state, selectedMonth]);

  const pushHistory = useCallback(
    (base: LedgerState, tipo: string, descricao: string, valor: number): LedgerState => {
      const currentTotals = computeTotals(base, selectedMonth);
      const entry = {
        id: uid(),
        data: todayISO(),
        tipo,
        descricao,
        valor,
        saldoApos: currentTotals.saldoDevedor,
      };
      return { ...base, history: [...(base.history || []), entry] };
    },
    [selectedMonth]
  );

  const resetAllData = useCallback(() => {
    const fresh: LedgerState = {
      ...EMPTY_STATE,
      userProfile: {
        name: state.userProfile?.name || 'Ruan',
        onboarded: true,
      },
      accounts: [],
      bills: [],
      debts: [],
      installments: [],
      income: [],
      fixedExpenses: [],
      history: [],
      pluggyConnections: [],
    };
    setState(fresh);
    saveState(fresh);
  }, [state.userProfile]);

  // Pluggy Open Finance State & Methods
  const [isSyncingPluggy, setIsSyncingPluggy] = useState(false);
  const [pluggyModalState, setPluggyModalState] = useState<PluggyModalState>({
    isOpen: false,
    token: null,
    loading: false,
  });

  const openPluggyConnect = useCallback(async (updateItemId?: string) => {
    setPluggyModalState({
      isOpen: true,
      token: null,
      updateItemId,
      loading: true,
      error: undefined,
    });

    try {
      const token = await createConnectToken(updateItemId);
      setPluggyModalState(prev => ({
        ...prev,
        token,
        loading: false,
      }));
    } catch (err: any) {
      setPluggyModalState(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Falha ao iniciar conexão com Pluggy.',
      }));
    }
  }, []);

  const closePluggyConnect = useCallback(() => {
    setPluggyModalState({
      isOpen: false,
      token: null,
      loading: false,
    });
  }, []);

  const syncPluggyItem = useCallback(async (itemId: string) => {
    setIsSyncingPluggy(true);
    try {
      await triggerPluggySync(itemId);
      const snapshot = await fetchPluggySnapshot(itemId);
      // Aplica sobre o estado mais recente para não perder edições feitas durante a busca
      setState(prev => {
        const next = applyPluggySnapshot(prev, snapshot);
        saveState(next);
        return next;
      });
    } catch (err) {
      console.error('Erro ao sincronizar Pluggy item:', err);
      throw err;
    } finally {
      setIsSyncingPluggy(false);
    }
  }, []);

  const syncAllPluggy = useCallback(async () => {
    const connections = state.pluggyConnections || [];
    if (connections.length === 0) return;

    setIsSyncingPluggy(true);
    try {
      const snapshots: PluggySnapshot[] = [];
      for (const conn of connections) {
        try {
          await triggerPluggySync(conn.id);
          snapshots.push(await fetchPluggySnapshot(conn.id));
        } catch (err) {
          console.error(`Erro ao sincronizar conexão ${conn.connectorName}:`, err);
        }
      }
      // Aplica sobre o estado mais recente para não perder edições feitas durante a busca
      setState(prev => {
        const next = snapshots.reduce(applyPluggySnapshot, prev);
        saveState(next);
        return next;
      });
    } finally {
      setIsSyncingPluggy(false);
    }
  }, [state.pluggyConnections]);

  const disconnectPluggyItem = useCallback(async (itemId: string) => {
    try {
      await deletePluggyItem(itemId).catch(() => {});
    } catch {
      // ignore
    }

    setState(prev => {
      const next: LedgerState = {
        ...prev,
        pluggyConnections: (prev.pluggyConnections || []).filter(c => c.id !== itemId),
        accounts: (prev.accounts || []).map(a =>
          a.pluggyItemId === itemId ? { ...a, pluggyItemId: undefined, pluggyAccountId: undefined } : a
        ),
      };
      saveState(next);
      return next;
    });
    setConfirmingId(null);
  }, []);

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
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        nextMonth,
        prevMonth,
        resetToCurrentMonth,
        isQuickAddOpen,
        quickAddInitialType,
        openQuickAdd,
        closeQuickAdd,
        addAccount,
        deleteAccount,
        updateAccountBalance,
        updateUserProfile,
        completeOnboarding,
        resetAllData,
        isPluggyConfigured: isPluggyConfigured(),
        isSyncingPluggy,
        pluggyModalState,
        openPluggyConnect,
        closePluggyConnect,
        syncPluggyItem,
        syncAllPluggy,
        disconnectPluggyItem,
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
