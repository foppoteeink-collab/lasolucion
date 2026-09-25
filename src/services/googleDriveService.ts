import { AppBackupData, loadSavedShopRewards, saveShopRewards } from '../utils/storage';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { getTodayDateString } from '../utils/date';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

const BACKUP_FILENAME = 'la_solucion_cloud_backup.json';

/**
 * Searches for the app's backup file in the user's Google Drive.
 */
export async function findDriveBackupFile(accessToken: string): Promise<DriveFileInfo | null> {
  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&spaces=drive`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Sesión de Google expirada. Por favor, vuelve a iniciar sesión con Google.');
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error al consultar Google Drive (${response.status})`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileInfo;
  }
  return null;
}

/**
 * Downloads and parses the backup JSON file from Google Drive.
 */
export async function downloadBackupFromDrive(accessToken: string, fileId: string): Promise<AppBackupData> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo desde Google Drive (${response.status})`);
  }

  const parsed = await response.json();
  return parsed as AppBackupData;
}

/**
 * Uploads (creates or updates) the backup file in Google Drive.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  backupData: AppBackupData,
  existingFileId?: string
): Promise<DriveFileInfo> {
  const fileContent = JSON.stringify(backupData, null, 2);

  if (existingFileId) {
    // Update existing file content
    const url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error al actualizar archivo en Google Drive (${response.status})`);
    }

    const updated = await response.json();
    return {
      id: updated.id,
      name: updated.name || BACKUP_FILENAME,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      description: 'Respaldo de progreso de La Solución / TaskQuest',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error al crear archivo en Google Drive (${response.status})`);
    }

    const created = await response.json();
    return {
      id: created.id,
      name: created.name || BACKUP_FILENAME,
      modifiedTime: new Date().toISOString(),
    };
  }
}

/**
 * Packages all current application state for backup.
 */
export function gatherCurrentAppState(): AppBackupData {
  const playerStore = usePlayerStore.getState();
  const taskStore = useTaskStore.getState();
  const appStore = useAppStore.getState();

  const todayStr = getTodayDateString();
  const tasksForToday = taskStore.tasksByDate[todayStr] || [];

  return {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    stats: playerStore.stats,
    tasks: tasksForToday,
    shopRewards: loadSavedShopRewards(),
    pomodoroSessions: appStore.pomodoroSessions,
    notifications: appStore.notifications,
    customHabits: taskStore.customHabits,
    habitMastery: appStore.habitMastery,
    reflections: appStore.reflections,
    allTasksByDate: taskStore.tasksByDate,
  };
}

/**
 * Restores all state into the app from an AppBackupData package.
 */
export function restoreAppState(backup: AppBackupData): void {
  const playerStore = usePlayerStore.getState();
  const taskStore = useTaskStore.getState();
  const appStore = useAppStore.getState();

  if (backup.stats) {
    playerStore.setStats(backup.stats);
  }

  if (backup.allTasksByDate && typeof backup.allTasksByDate === 'object') {
    taskStore.setTasksByDate(backup.allTasksByDate);
  } else if (Array.isArray(backup.tasks)) {
    const todayStr = getTodayDateString();
    taskStore.setTasksByDate((prev) => ({ ...prev, [todayStr]: backup.tasks }));
  }

  if (Array.isArray(backup.customHabits)) {
    taskStore.setCustomHabits(backup.customHabits);
  }

  if (Array.isArray(backup.shopRewards)) {
    saveShopRewards(backup.shopRewards);
  }

  if (backup.habitMastery && typeof backup.habitMastery === 'object') {
    appStore.setHabitMastery(backup.habitMastery);
  }

  if (backup.reflections && typeof backup.reflections === 'object') {
    appStore.setReflections(backup.reflections);
  }

  if (Array.isArray(backup.pomodoroSessions)) {
    appStore.setPomodoroSessions(backup.pomodoroSessions);
  }
}
