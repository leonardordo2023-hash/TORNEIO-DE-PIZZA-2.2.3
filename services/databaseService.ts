
import { PizzaData, SocialData, UserAccount } from "../types";
import { supabase } from "./supabaseClient";

const DB_NAME = 'PizzaTorneioDB';
const DB_VERSION = 2; 
const STORE_BACKUP = 'app_backups';
const STORE_MEDIA = 'media_archive';
const STORE_SNAPSHOTS = 'app_snapshots'; 

let isAppStateTableMissing = false;
let isUsersTableMissing = false;

export const databaseService = {
    getCloudStatus: () => ({
        isReady: !isAppStateTableMissing && !isUsersTableMissing,
        appStateMissing: isAppStateTableMissing,
        usersMissing: isUsersTableMissing
    }),

    init: async (): Promise<void> => {
        if (navigator.storage && navigator.storage.persist) {
            try {
                const alreadyPersisted = await navigator.storage.persisted();
                if (!alreadyPersisted) await navigator.storage.persist();
            } catch (e) {}
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_BACKUP)) db.createObjectStore(STORE_BACKUP, { keyPath: 'key' });
                if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
            };
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    },

    getStorageEstimate: async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
        }
        return { usage: 0, quota: 0 };
    },

    getSnapshots: async (): Promise<any[]> => {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
                const store = tx.objectStore(STORE_SNAPSHOTS);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
    },

    createSnapshot: async (name: string, data: any) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
            const store = tx.objectStore(STORE_SNAPSHOTS);
            const snapshot = {
                id: Math.random().toString(36).substring(2, 15),
                name,
                data: JSON.parse(JSON.stringify(data)),
                timestamp: Date.now()
            };
            store.put(snapshot);
            return new Promise((resolve) => {
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    },

    deleteSnapshot: async (id: string) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
            const store = tx.objectStore(STORE_SNAPSHOTS);
            store.delete(id);
            return new Promise((resolve) => {
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    },

    archiveMedia: async (id: string, url: string, type: string) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_MEDIA, 'readwrite');
            const store = tx.objectStore(STORE_MEDIA);
            store.put({ id, url, type, timestamp: Date.now() });
            return new Promise((resolve) => {
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return false;
        }
    },

    getAllMedia: async (): Promise<any[]> => {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_MEDIA, 'readonly');
                const store = tx.objectStore(STORE_MEDIA);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
    },

    saveToCloud: async (key: string, data: any) => {
        if (isAppStateTableMissing || !data || !navigator.onLine) return;
        
        try {
            let cleanData = JSON.parse(JSON.stringify(data));
            if (key === 'pizzas' && Array.isArray(cleanData)) {
                cleanData = cleanData.map((p: any) => ({
                    ...p,
                    photos: [],
                    media: p.media?.map((m: any) => ({ ...m, url: "" }))
                }));
            }

            const { error } = await supabase
                .from('app_state')
                .upsert({ 
                    key, 
                    data: cleanData, 
                    updated_at: new Date().toISOString() 
                }, { onConflict: 'key' });
            
            if (error) {
                if (error.code === '42P01') {
                    isAppStateTableMissing = true;
                }
                throw error;
            }
        } catch (e: any) {
            const errorMsg = e?.message || String(e);
            const isNetworkError = errorMsg.toLowerCase().includes('fetch') || 
                                 errorMsg.toLowerCase().includes('network') || 
                                 errorMsg.toLowerCase().includes('load failed');
            
            if (!isNetworkError) {
                console.error(`Cloud Sync Error (${key}):`, errorMsg);
            }
        }
    },

    getFromCloud: async (key: string): Promise<any> => {
        if (isAppStateTableMissing || !navigator.onLine) return null;
        try {
            const { data, error } = await supabase
                .from('app_state')
                .select('data')
                .eq('key', key);
            
            if (error) {
                if (error.code === '42P01') isAppStateTableMissing = true;
                throw error;
            }
            
            if (data && data.length > 0) {
                return data[0].data;
            }
            return null;
        } catch (e: any) {
            const errorMsg = e?.message || String(e);
            const isNetworkError = errorMsg.toLowerCase().includes('fetch') || 
                                 errorMsg.toLowerCase().includes('network') || 
                                 errorMsg.toLowerCase().includes('load failed');
            
            if (isNetworkError) {
                console.info(`[Offline Mode] Cloud storage unreachable for ${key}.`);
            } else {
                console.error(`Database Error (${key}):`, errorMsg);
            }
            return null;
        }
    },

    saveBackup: async (key: string, data: any) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_BACKUP, 'readwrite');
            const store = tx.objectStore(STORE_BACKUP);
            store.put({ key, data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() });
            return new Promise((resolve) => {
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            });
        } catch (e) {
            return null;
        }
    },

    getBackup: async (key: string): Promise<any> => {
        const cloudData = await databaseService.getFromCloud(key);
        if (cloudData) {
            await databaseService.saveLocalOnly(key, cloudData);
            return cloudData;
        }

        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction(STORE_BACKUP, 'readonly');
                const store = tx.objectStore(STORE_BACKUP);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result?.data || null);
                request.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    },

    saveLocalOnly: async (key: string, data: any) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_BACKUP, 'readwrite');
            tx.objectStore(STORE_BACKUP).put({ key, data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() });
        } catch (e) {}
    }
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e);
    });
}
