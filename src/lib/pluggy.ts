import type {
  LedgerState,
  Account,
  Bill,
  IncomeItem,
  FixedExpense,
  AccountType,
  PluggyItemConnection,
} from '../types/ledger';
import { uid, DEFAULT_CATEGORIES } from './ledger';

const PLUGGY_API_URL = 'https://api.pluggy.ai';

const CLIENT_ID = import.meta.env.VITE_PLUGGY_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || '';

// Token em memória com tempo de expiração
let cachedApiKey: string | null = null;
let apiKeyExpiresAt = 0;

export function isPluggyConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

/**
 * Autentica com a API da Pluggy e armazena o token em cache (válido por ~2h)
 */
export async function getPluggyApiKey(): Promise<string> {
  if (!isPluggyConfigured()) {
    throw new Error('Credenciais da Pluggy não foram encontradas no arquivo .env.');
  }

  // Se já temos um token válido por pelo menos mais 1 minuto, reutiliza
  if (cachedApiKey && Date.now() < apiKeyExpiresAt - 60000) {
    return cachedApiKey;
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Falha na autenticação com Pluggy (Status ${response.status})`
    );
  }

  const data = await response.json();
  cachedApiKey = data.apiKey;
  // Expira em ~110 minutos (7200s total)
  apiKeyExpiresAt = Date.now() + 110 * 60 * 1000;

  return cachedApiKey!;
}

/**
 * Requisição autenticada genérica para a API da Pluggy
 */
async function pluggyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = await getPluggyApiKey();

  const response = await fetch(`${PLUGGY_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Erro na requisição da Pluggy (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) errorMessage = parsed.message;
    } catch {
      if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

/**
 * Cria um Connect Token para inicializar o widget Pluggy Connect
 */
export async function createConnectToken(itemId?: string): Promise<string> {
  const body: Record<string, unknown> = {};
  if (itemId) {
    body.itemId = itemId;
  }

  const data = await pluggyFetch<{ accessToken: string }>('/connect_token', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data.accessToken;
}

export interface PluggyConnector {
  id: number;
  name: string;
  primaryColor?: string;
  imageUrl?: string;
  type?: string;
}

export interface PluggyItem {
  id: string;
  connector: PluggyConnector;
  status: string; // 'UPDATED' | 'UPDATING' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR' | 'OUTDATED'
  executionStatus?: string;
  lastUpdatedAt?: string;
}

export interface PluggyAccount {
  id: string;
  type: 'BANK' | 'CREDIT';
  subtype: 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT' | 'CREDIT_CARD' | string;
  name: string;
  balance: number;
  currencyCode: string;
  itemId: string;
  number?: string;
  marketingName?: string;
  creditData?: {
    creditLimit?: number;
    availableCreditLimit?: number;
    balanceCloseDate?: string;
    balanceDueDate?: string;
  };
}

export interface PluggyTransaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  amount: number; // Negativo = débito/saída, Positivo = crédito/entrada
  date: string; // ISO
  category?: string;
  type: 'DEBIT' | 'CREDIT';
  status?: string;
}

export interface PluggyBill {
  id: string;
  dueDate: string; // ISO YYYY-MM-DD
  totalAmount: number;
  minimumPaymentAmount?: number;
  paidAmount?: number;
  status?: 'PAID' | 'OPEN' | 'OVERDUE' | string;
}

/**
 * Busca os detalhes do Item conectado
 */
export async function fetchPluggyItem(itemId: string): Promise<PluggyItem> {
  return pluggyFetch<PluggyItem>(`/items/${itemId}`);
}

/**
 * Busca as contas vinculadas a um Item
 */
export async function fetchPluggyAccounts(itemId: string): Promise<PluggyAccount[]> {
  const data = await pluggyFetch<{ results: PluggyAccount[] }>(`/accounts?itemId=${itemId}`);
  return data.results || [];
}

/**
 * Busca as transações de uma conta
 */
export async function fetchPluggyTransactions(
  accountId: string,
  from?: string,
  to?: string
): Promise<PluggyTransaction[]> {
  const params = new URLSearchParams();
  params.set('accountId', accountId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('pageSize', '100');

  const data = await pluggyFetch<{ results: PluggyTransaction[] }>(
    `/transactions?${params.toString()}`
  );
  return data.results || [];
}

/**
 * Busca as faturas de uma conta de cartão
 */
export async function fetchPluggyBills(accountId: string): Promise<PluggyBill[]> {
  try {
    const data = await pluggyFetch<{ results: PluggyBill[] }>(`/bills?accountId=${accountId}`);
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Desconecta/exclui uma instituição conectada
 */
export async function deletePluggyItem(itemId: string): Promise<void> {
  await pluggyFetch<void>(`/items/${itemId}`, { method: 'DELETE' });
}

/**
 * Dispara uma atualização no Pluggy para buscar dados novos no banco
 */
export async function triggerPluggySync(itemId: string): Promise<void> {
  try {
    await pluggyFetch<void>(`/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({}) });
  } catch {
    // Alguns conectores não aceitam PATCH imediato, prossegue normalmente
  }
}

/**
 * Converte a categoria do Pluggy para uma categoria padrão do Wall-Et
 */
function mapCategory(pluggyCat?: string): string {
  if (!pluggyCat) return 'Outros';
  const c = pluggyCat.toLowerCase();

  if (c.includes('aliment') || c.includes('restaur') || c.includes('mercado') || c.includes('comida') || c.includes('food')) {
    return 'Alimentação';
  }
  if (c.includes('mora') || c.includes('casa') || c.includes('aluguel') || c.includes('condom') || c.includes('luz') || c.includes('água') || c.includes('energia')) {
    return 'Moradia';
  }
  if (c.includes('transp') || c.includes('combust') || c.includes('uber') || c.includes('carro') || c.includes('posto') || c.includes('estacion')) {
    return 'Transporte';
  }
  if (c.includes('lazer') || c.includes('assinat') || c.includes('stream') || c.includes('netflix') || c.includes('spotify') || c.includes('cinema') || c.includes('viag')) {
    return 'Lazer & Assinaturas';
  }
  if (c.includes('saúde') || c.includes('saude') || c.includes('farm') || c.includes('médic') || c.includes('hospital')) {
    return 'Saúde';
  }
  if (c.includes('educa') || c.includes('curso') || c.includes('livr') || c.includes('faculd') || c.includes('escola')) {
    return 'Educação';
  }
  if (c.includes('compra') || c.includes('shopee') || c.includes('mercadolivre') || c.includes('amazon') || c.includes('roupa') || c.includes('eletr')) {
    return 'Compras';
  }

  return DEFAULT_CATEGORIES.includes(pluggyCat) ? pluggyCat : 'Outros';
}

/**
 * Mapeia o subtipo do Pluggy para o tipo de conta do Wall-Et
 */
function mapAccountType(account: PluggyAccount): AccountType {
  const sub = (account.subtype || '').toUpperCase();
  const type = (account.type || '').toUpperCase();

  if (sub === 'SAVINGS_ACCOUNT' || sub === 'SAVINGS') return 'poupanca';
  if (sub === 'CREDIT_CARD' || type === 'CREDIT') return 'cartao';
  if (sub.includes('INVEST') || type.includes('INVEST')) return 'investimento';
  return 'corrente';
}

/**
 * Sincroniza um Item do Pluggy com o estado do Wall-Et:
 * - Atualiza ou cadastra contas
 * - Atualiza faturas de cartão
 * - Puxa transações recentes sem duplicatas
 * - Atualiza metadados da conexão
 */
export async function syncPluggyItemData(
  currentState: LedgerState,
  itemId: string
): Promise<LedgerState> {
  const item = await fetchPluggyItem(itemId);
  const pluggyAccounts = await fetchPluggyAccounts(itemId);

  const connectorName = item.connector?.name || 'Banco';
  const connectorImageUrl = item.connector?.imageUrl;
  const connectorPrimaryColor = item.connector?.primaryColor
    ? `#${item.connector.primaryColor.replace('#', '')}`
    : undefined;

  let updatedAccounts = [...(currentState.accounts || [])];
  let updatedBills = [...(currentState.bills || [])];
  let updatedIncome = [...(currentState.income || [])];
  let updatedExpenses = [...(currentState.fixedExpenses || [])];

  // 60 dias atrás para puxar transações recentes
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const fromDate = sixtyDaysAgo.toISOString().slice(0, 10);

  // Mapear cada conta do Pluggy
  for (const pAcc of pluggyAccounts) {
    const accType = mapAccountType(pAcc);
    const accName = pAcc.name || pAcc.marketingName || (accType === 'cartao' ? `Cartão ${connectorName}` : `Conta ${connectorName}`);

    // Procura se a conta já existe no Wall-Et
    const existingIndex = updatedAccounts.findIndex(
      a => a.pluggyAccountId === pAcc.id || (a.instituicao.toLowerCase() === connectorName.toLowerCase() && a.nome === accName)
    );

    let wallEtAccountId = '';

    if (existingIndex >= 0) {
      // Atualiza saldo e metadados da conta existente
      const existing = updatedAccounts[existingIndex];
      wallEtAccountId = existing.id;
      updatedAccounts[existingIndex] = {
        ...existing,
        saldo: pAcc.balance,
        pluggyAccountId: pAcc.id,
        pluggyItemId: itemId,
        cor: existing.cor || connectorPrimaryColor,
      };
    } else {
      // Cria nova conta no Wall-Et
      wallEtAccountId = uid();
      const newAcc: Account = {
        id: wallEtAccountId,
        nome: accName,
        instituicao: connectorName,
        tipo: accType,
        saldo: pAcc.balance,
        cor: connectorPrimaryColor,
        pluggyAccountId: pAcc.id,
        pluggyItemId: itemId,
      };
      updatedAccounts.push(newAcc);
    }

    // Se for cartão de crédito, busca faturas
    if (accType === 'cartao') {
      try {
        const bills = await fetchPluggyBills(pAcc.id);
        for (const bill of bills) {
          if (!bill.dueDate) continue;
          const dueIso = bill.dueDate.slice(0, 10);
          const billAmount = Math.abs(bill.totalAmount || 0);
          const isPaid = bill.status === 'PAID' || (bill.paidAmount !== undefined && bill.paidAmount >= billAmount && billAmount > 0);

          const existingBillIdx = updatedBills.findIndex(
            b => b.pluggyBillId === bill.id || (b.accountId === wallEtAccountId && b.vencimento === dueIso)
          );

          if (existingBillIdx >= 0) {
            updatedBills[existingBillIdx] = {
              ...updatedBills[existingBillIdx],
              valor: billAmount > 0 ? billAmount : updatedBills[existingBillIdx].valor,
              pago: isPaid,
              pluggyBillId: bill.id,
              pluggyAccountId: pAcc.id,
            };
          } else if (billAmount > 0) {
            const newBill: Bill = {
              id: uid(),
              nome: `Fatura ${connectorName} (${dueIso.slice(5, 7)}/${dueIso.slice(0, 4)})`,
              categoria: 'Compras',
              valor: billAmount,
              vencimento: dueIso,
              recorrente: false,
              pago: isPaid,
              accountId: wallEtAccountId,
              pluggyBillId: bill.id,
              pluggyAccountId: pAcc.id,
            };
            updatedBills.push(newBill);
          }
        }
      } catch {
        // Prossegue se faturas não estiverem disponíveis
      }
    }

    // Busca transações recentes da conta
    try {
      const transactions = await fetchPluggyTransactions(pAcc.id, fromDate);

      for (const tx of transactions) {
        if (!tx.date || !tx.amount) continue;
        const txDate = tx.date.slice(0, 10);
        const absVal = Math.abs(tx.amount);
        const desc = (tx.description || tx.descriptionRaw || 'Transação Bancária').trim();

        // Se o valor for positivo ou tipo CREDIT -> Entrada de renda
        if (tx.amount > 0 || tx.type === 'CREDIT') {
          const alreadyExists = updatedIncome.some(
            r => r.pluggyTransactionId === tx.id || (r.accountId === wallEtAccountId && r.data === txDate && r.valor === absVal && r.nome === desc)
          );
          if (!alreadyExists) {
            const newIncome: IncomeItem = {
              id: uid(),
              nome: desc,
              categoria: 'Rendimento',
              valor: absVal,
              data: txDate,
              recorrente: false,
              recebido: true,
              accountId: wallEtAccountId,
              pluggyTransactionId: tx.id,
            };
            updatedIncome.push(newIncome);
          }
        } else {
          // Valor negativo ou tipo DEBIT -> Despesa/Gasto
          const alreadyExists = updatedExpenses.some(
            g => g.pluggyTransactionId === tx.id || (g.accountId === wallEtAccountId && g.data === txDate && g.valor === absVal && g.nome === desc)
          );
          if (!alreadyExists) {
            const newExpense: FixedExpense = {
              id: uid(),
              nome: desc,
              categoria: mapCategory(tx.category),
              valor: absVal,
              data: txDate,
              recorrente: false,
              pago: true,
              accountId: wallEtAccountId,
              pluggyTransactionId: tx.id,
            };
            updatedExpenses.push(newExpense);
          }
        }
      }
    } catch {
      // Prossegue se transações não puderem ser consultadas
    }
  }

  // Atualiza metadados da conexão PluggyItemConnection
  const currentConnections = currentState.pluggyConnections || [];
  const connIndex = currentConnections.findIndex(c => c.id === itemId);

  const newConn: PluggyItemConnection = {
    id: itemId,
    connectorId: item.connector?.id || 0,
    connectorName,
    connectorImageUrl,
    connectorPrimaryColor,
    lastSyncAt: new Date().toISOString(),
    status: item.status || 'UPDATED',
    accountsCount: pluggyAccounts.length,
  };

  let updatedConnections: PluggyItemConnection[];
  if (connIndex >= 0) {
    updatedConnections = [...currentConnections];
    updatedConnections[connIndex] = newConn;
  } else {
    updatedConnections = [...currentConnections, newConn];
  }

  return {
    ...currentState,
    accounts: updatedAccounts,
    bills: updatedBills,
    income: updatedIncome,
    fixedExpenses: updatedExpenses,
    pluggyConnections: updatedConnections,
  };
}
