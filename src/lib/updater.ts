import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  body?: string;
}

export async function checkForAppUpdates(): Promise<UpdateInfo> {
  try {
    const update = await check();
    if (update) {
      return {
        available: true,
        version: update.version,
        body: update.body,
      };
    }
    return { available: false };
  } catch (err) {
    // Em modo web/dev normal o plugin não conecta, o que é esperado
    console.debug('Verificação de atualização indisponível no ambiente atual:', err);
    return { available: false };
  }
}

export async function installAppUpdate(): Promise<void> {
  try {
    const update = await check();
    if (update) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (err) {
    console.error('Erro ao instalar atualização:', err);
    throw err;
  }
}
