import type { SaveEnvelope, CampaignState } from '@april-thesis/shared-types';
import { SAVE_VERSION, GAME_VERSION, CONTENT_VERSION, MINIMUM_SUPPORTED_SAVE_VERSION } from '@april-thesis/shared-types';

export function computeChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function createSaveEnvelope(
  campaign: CampaignState,
  slotName?: string,
): SaveEnvelope {
  const now = new Date().toISOString();
  const envelope: SaveEnvelope = {
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    contentVersion: CONTENT_VERSION,
    seed: campaign.settings.seed,
    createdAt: now,
    updatedAt: now,
    campaign,
    slotName,
  };
  const payload = JSON.stringify({ ...envelope, checksum: undefined });
  envelope.checksum = computeChecksum(payload);
  return envelope;
}

export function validateSaveEnvelope(data: unknown): SaveEnvelope {
  if (!data || typeof data !== 'object') throw new Error('Invalid save: not an object');
  const envelope = data as SaveEnvelope;
  if (!envelope.saveVersion || !envelope.campaign) throw new Error('Invalid save: missing fields');
  if (envelope.saveVersion > SAVE_VERSION) throw new Error('Save from newer version');
  if (envelope.saveVersion < MINIMUM_SUPPORTED_SAVE_VERSION) {
    throw new Error('Prototype saves from before Phase Six are no longer supported. Start a new campaign.');
  }
  const { checksum, ...rest } = envelope;
  const payload = JSON.stringify(rest);
  if (checksum && computeChecksum(payload) !== checksum) {
    throw new Error('Save checksum mismatch — possible corruption');
  }
  return envelope;
}

export function migrateSave(envelope: SaveEnvelope): SaveEnvelope {
  if (envelope.saveVersion < MINIMUM_SUPPORTED_SAVE_VERSION) {
    throw new Error('Prototype saves from before Phase Six are no longer supported. Start a new campaign.');
  }
  const migrated = structuredClone(envelope);
  migrated.saveVersion = SAVE_VERSION;
  migrated.gameVersion = GAME_VERSION;
  migrated.contentVersion = CONTENT_VERSION;
  migrated.checksum = computeChecksum(JSON.stringify({ ...migrated, checksum: undefined }));
  return migrated;
}

export interface SaveSlot {
  id: string;
  name: string;
  date: string;
  turnNumber: number;
  updatedAt: string;
  ironman: boolean;
  tutorial: boolean;
}

const DB_NAME = 'april-thesis-saves';
const DB_VERSION = 3;
const STORE_NAME = 'saves';
const QUARANTINE_STORE = 'quarantine';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const store = db.objectStoreNames.contains(STORE_NAME)
        ? request.transaction!.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(QUARANTINE_STORE)) db.createObjectStore(QUARANTINE_STORE, { keyPath: 'id' });
      if (event.oldVersion > 0 && event.oldVersion < DB_VERSION) {
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor) return;
          const version = cursor.value?.envelope?.saveVersion;
          if (typeof version !== 'number' || version < MINIMUM_SUPPORTED_SAVE_VERSION) cursor.delete();
          cursor.continue();
        };
      }
    };
  });
}

export async function saveToSlot(id: string, envelope: SaveEnvelope): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    envelope.updatedAt = new Date().toISOString();
    envelope.checksum = computeChecksum(JSON.stringify({ ...envelope, checksum: undefined }));
    const record = { id, envelope, slotName: envelope.slotName ?? id };
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadFromSlot(id: string): Promise<SaveEnvelope | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (!record) resolve(null);
      else resolve(migrateSave(validateSaveEnvelope(record.envelope)));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function listSaveSlots(): Promise<SaveSlot[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const slots: SaveSlot[] = (request.result ?? [])
        .filter((r: { envelope?: SaveEnvelope }) => (r.envelope?.saveVersion ?? 0) >= MINIMUM_SUPPORTED_SAVE_VERSION)
        .map((r: { id: string; envelope: SaveEnvelope; slotName?: string }) => ({
        id: r.id,
        name: r.slotName ?? r.envelope.slotName ?? r.id,
        date: r.envelope.campaign.currentDate,
        turnNumber: r.envelope.campaign.turnNumber,
        updatedAt: r.envelope.updatedAt,
        ironman: r.envelope.campaign.settings.ironman,
        tutorial: r.envelope.campaign.settings.tutorialMode === 'guided_tutorial',
        }));
      resolve(slots);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSaveSlot(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function duplicateSaveSlot(sourceId: string, targetId: string, name: string): Promise<void> {
  const source = await loadFromSlot(sourceId);
  if (!source) throw new Error('Source save not found');
  const copy = createSaveEnvelope(structuredClone(source.campaign), name);
  await saveToSlot(targetId, copy);
}

export async function quarantineImport(file: File, reason: string): Promise<void> {
  const db = await openDb();
  const raw = await file.text().catch(() => '');
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUARANTINE_STORE, 'readwrite');
    tx.objectStore(QUARANTINE_STORE).put({ id: `quarantine-${Date.now()}`, fileName: file.name, reason, raw, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  });
}

export function exportSaveToFile(envelope: SaveEnvelope): void {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `april-thesis-save-${envelope.campaign.currentDate}-${envelope.seed.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSaveFromFile(file: File): Promise<SaveEnvelope> {
  const text = await file.text();
  const data = JSON.parse(text);
  return migrateSave(validateSaveEnvelope(data));
}

const PREFS_KEY = 'april-thesis-preferences';

export function loadPreferences(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePreferences(prefs: Record<string, unknown>): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
