import type { CanvasDraftRecord } from '../types/collections.types';
import {
  CANVAS_DRAFT_DB_NAME,
  CANVAS_DRAFT_DB_VERSION,
  CANVAS_DRAFT_STORE_NAME,
  CANVAS_STALE_DRAFT_THRESHOLD_MS,
} from '../constants/collections.constants';

export type { CanvasDraftRecord };

const memoryFallback = new Map<string, CanvasDraftRecord>();

function isIndexedDBAvailable(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
  );
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is not available'));
    }

    const request = window.indexedDB.open(
      CANVAS_DRAFT_DB_NAME,
      CANVAS_DRAFT_DB_VERSION,
    );

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CANVAS_DRAFT_STORE_NAME)) {
        const store = db.createObjectStore(CANVAS_DRAFT_STORE_NAME, {
          keyPath: 'pageId',
        });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('schemaSlug', 'schemaSlug', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveCanvasDraft(
  record: CanvasDraftRecord,
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryFallback.set(record.pageId, record);
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CANVAS_DRAFT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CANVAS_DRAFT_STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn(
      '[canvasDraftStorage] Failed to save to IndexedDB, falling back to memory:',
      error,
    );
    memoryFallback.set(record.pageId, record);
  }
}

export async function getCanvasDraft(
  pageId: string,
): Promise<CanvasDraftRecord | null> {
  if (!isIndexedDBAvailable()) {
    return memoryFallback.get(pageId) || null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CANVAS_DRAFT_STORE_NAME, 'readonly');
      const store = tx.objectStore(CANVAS_DRAFT_STORE_NAME);
      const request = store.get(pageId);

      request.onsuccess = () => {
        resolve((request.result as CanvasDraftRecord) || null);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn(
      '[canvasDraftStorage] Failed to read from IndexedDB, checking memory:',
      error,
    );
    return memoryFallback.get(pageId) || null;
  }
}

export async function deleteCanvasDraft(pageId: string): Promise<void> {
  memoryFallback.delete(pageId);

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CANVAS_DRAFT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CANVAS_DRAFT_STORE_NAME);
      const request = store.delete(pageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn(
      '[canvasDraftStorage] Failed to delete from IndexedDB:',
      error,
    );
  }
}

export async function listCanvasDrafts(): Promise<CanvasDraftRecord[]> {
  if (!isIndexedDBAvailable()) {
    return Array.from(memoryFallback.values());
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CANVAS_DRAFT_STORE_NAME, 'readonly');
      const store = tx.objectStore(CANVAS_DRAFT_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as CanvasDraftRecord[]) || []);
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn('[canvasDraftStorage] Failed to list from IndexedDB:', error);
    return Array.from(memoryFallback.values());
  }
}

export async function purgeStaleDrafts(
  maxAgeMs = CANVAS_STALE_DRAFT_THRESHOLD_MS,
): Promise<number> {
  const cutoff = Date.now() - maxAgeMs;
  let purgedCount = 0;

  for (const [key, record] of memoryFallback.entries()) {
    if (record.updatedAt < cutoff) {
      memoryFallback.delete(key);
      purgedCount++;
    }
  }

  if (!isIndexedDBAvailable()) {
    return purgedCount;
  }

  try {
    const drafts = await listCanvasDrafts();
    for (const draft of drafts) {
      if (draft.updatedAt < cutoff) {
        await deleteCanvasDraft(draft.pageId);
        purgedCount++;
      }
    }
  } catch (error) {
    console.warn('[canvasDraftStorage] Failed to purge stale drafts:', error);
  }

  return purgedCount;
}

export async function clearAllCanvasDrafts(): Promise<void> {
  memoryFallback.clear();

  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CANVAS_DRAFT_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CANVAS_DRAFT_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn('[canvasDraftStorage] Failed to clear IndexedDB:', error);
  }
}
