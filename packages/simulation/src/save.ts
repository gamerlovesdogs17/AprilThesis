import type { SaveEnvelope, CampaignState } from '@april-thesis/shared-types';
import { SAVE_VERSION, GAME_VERSION, CONTENT_VERSION } from '@april-thesis/shared-types';
import { initializePoliticalSystems } from './politics';
import { captureCampaignSnapshot } from './history';

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
  const { checksum, ...rest } = envelope;
  const payload = JSON.stringify(rest);
  if (checksum && computeChecksum(payload) !== checksum) {
    throw new Error('Save checksum mismatch — possible corruption');
  }
  return envelope;
}

export function migrateSave(envelope: SaveEnvelope): SaveEnvelope {
  const migrated = structuredClone(envelope);
  if (migrated.saveVersion < SAVE_VERSION) {
    migrated.saveVersion = SAVE_VERSION;
  }
  if (!migrated.campaign.flags) migrated.campaign.flags = {};
  if (!migrated.campaign.decisions) migrated.campaign.decisions = [];
  const campaign = migrated.campaign;
  const political = initializePoliticalSystems(campaign.resources.intelligence);
  campaign.organizers ??= political.organizers;
  campaign.factionBlocs ??= political.factionBlocs;
  campaign.policyProposals ??= political.policyProposals;
  campaign.voteState ??= political.voteState;
  campaign.factionActionsRemaining ??= 2;
  campaign.politicalActionsRemaining ??= 2;
  campaign.operationCooldowns ??= {};
  campaign.operationHistory ??= [];
  campaign.institutionHistory ??= [];
  campaign.characterCommunications ??= [];
  campaign.historySnapshots ??= [captureCampaignSnapshot(campaign)];
  campaign.tutorialStep ??= campaign.settings.tutorialEnabled ? 0 : -1;
  campaign.tutorialComplete ??= !campaign.settings.tutorialEnabled;
  campaign.tutorialPaused ??= false;
  campaign.tutorialMilestones ??= [];
  campaign.tutorialEndPanelDismissed ??= false;
  campaign.settings.tutorialMode ??= campaign.settings.tutorialEnabled ? 'guided_opening' : 'none';
  campaign.dismissedHintIds ??= [];
  for (const character of Object.values(campaign.characters)) {
    character.availability ??= character.isArrested ? 'arrested' : character.isExiled ? 'exiled' : 'active';
    character.currentAgenda ??= 'Party business'; character.lastAction ??= 'No autonomous action recorded.';
    character.relationshipPressure ??= 0; character.knownSecrets ??= [];
  }
  for (const institution of Object.values(campaign.institutions)) {
    institution.attitude ??= 35; institution.autonomy ??= 40; institution.activeAgenda ??= 'Implement current directives';
    institution.pendingBusiness ??= []; institution.contactIds ??= []; institution.lastAction ??= 'No institutional approach recorded.';
  }
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
const DB_VERSION = 2;
const STORE_NAME = 'saves';
const QUARANTINE_STORE = 'quarantine';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUARANTINE_STORE)) db.createObjectStore(QUARANTINE_STORE, { keyPath: 'id' });
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
      const slots: SaveSlot[] = (request.result ?? []).map((r: { id: string; envelope: SaveEnvelope; slotName?: string }) => ({
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
