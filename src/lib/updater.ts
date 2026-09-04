import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  available: boolean;
  currentVersion?: string;
  version?: string;
  body?: string;
  date?: string;
}

let cachedUpdate: Update | null = null;

export async function checkForAppUpdates(): Promise<UpdateInfo> {
  try {
    const update = await check();
    if (update && update.available) {
      cachedUpdate = update;
      return {
        available: true,
        currentVersion: update.currentVersion,
        version: update.version,
        body: update.body,
        date: update.date,
      };
    }
    return { available: false };
  } catch (err) {
    // Em modo web ou sem conexão, o check falha de forma segura
    console.debug('Verificação de atualização indisponível no ambiente atual:', err);
    return { available: false };
  }
}

export async function installAppUpdate(
  onProgress?: (downloaded: number, total: number | null) => void
): Promise<void> {
  try {
    const update = cachedUpdate || (await check());
    if (update && update.available) {
      let downloaded = 0;
      let total: number | null = null;

      await update.downloadAndInstall(event => {
        if (event.event === 'Started') {
          total = event.data.contentLength || null;
          onProgress?.(0, total);
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          onProgress?.(downloaded, total);
        } else if (event.event === 'Finished') {
          onProgress?.(total || downloaded, total);
        }
      });

      await relaunch();
    }
  } catch (err) {
    console.error('Erro ao instalar atualização:', err);
    throw err;
  }
}
