import { isTauri } from '@tauri-apps/api/core';
import type { LedgerState } from '../types/ledger';
import { serializeBackup, todayISO } from './ledger';

const FILTERS = [{ name: 'Backup Wall-Et', extensions: ['json'] }];

/**
 * Salva um backup em JSON. No app usa a janela nativa de "Salvar como";
 * no navegador (npm run dev) cai para um download comum.
 * Retorna false se o usuário cancelou.
 */
export async function exportBackup(state: LedgerState): Promise<boolean> {
  const content = serializeBackup(state);
  const fileName = `wall-et-backup-${todayISO()}.json`;

  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({ defaultPath: fileName, filters: FILTERS });
    if (!path) return false;
    await writeTextFile(path, content);
    return true;
  }

  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/** Abre um arquivo de backup e devolve o conteúdo, ou null se o usuário cancelou. */
export async function pickBackupFile(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await open({ multiple: false, directory: false, filters: FILTERS });
    if (!path) return null;
    return readTextFile(path);
  }

  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}
