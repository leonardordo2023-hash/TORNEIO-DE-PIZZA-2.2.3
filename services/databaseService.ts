
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

    saveToCloud: async (key: string, data: any) => {
        if (isAppStateTableMissing || !data) return;
        
        try {
            // Limpa o objeto de possíveis referências circulares antes de enviar
            const cleanData = JSON.parse(JSON.stringify(data));
            const { error } = await supabase
                .from('app_state')
                .upsert({ 
                    key, 
                    data: cleanData, 
                    updated_at: new Date().toISOString() 
                }, { onConflict: 'key' });
            
            if (error) {
                if (error.message.includes('app_state') || error.code === '42P01') {
                    isAppStateTableMissing = true;
                    console.warn("Sincronização pausada: Tabela 'app_state' não encontrada.");
                }
                throw error;
            }
        } catch (e: any) {
            console.error(`Erro ao salvar ${key} na nuvem:`, e.message);
        }
    },

    getFromCloud: async (key: string): Promise<any> => {
        if (isAppStateTableMissing) return null;
        try {
            const { data, error } = await supabase
                .from('app_state')
                .select('data')
                .eq('key', key)
                .maybeSingle();
            
            if (error) {
                if (error.message.includes('app_state') || error.code === '42P01') {
                    isAppStateTableMissing = true;
                }
                return null;
            }
            return data?.data || null;
        } catch (e) {
            return null;
        }
    },

    saveBackup: async (key: string, data: any) => {
        // Salva na nuvem (Persistência Global)
        databaseService.saveToCloud(key, data);
        
        // Salva no IndexedDB (Persistência Local Robusta)
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
        // Tenta Cloud primeiro (Fonte da verdade após atualização)
        const cloudData = await databaseService.getFromCloud(key);
        if (cloudData) {
            // Atualiza o local com o que veio da nuvem
            databaseService.saveLocalOnly(key, cloudData);
            return cloudData;
        }

        // Fallback para IndexedDB (Se estiver offline ou sem nuvem)
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

    // Apenas local para cache rápido
    saveLocalOnly: async (key: string, data: any) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_BACKUP, 'readwrite');
            tx.objectStore(STORE_BACKUP).put({ key, data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() });
        } catch (e) {}
    },

    createSnapshot: async (name: string, data: any) => {
        const db = await openDB();
        const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(STORE_SNAPSHOTS);
        const id = Math.random().toString(36).substring(2, 9);
        store.put({ id, name, data, timestamp: Date.now() });
        return tx.oncomplete;
    },

    getSnapshots: async (): Promise<any[]> => {
        const db = await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
            const store = tx.objectStore(STORE_SNAPSHOTS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    },

    deleteSnapshot: async (id: string) => {
        const db = await openDB();
        const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(STORE_SNAPSHOTS);
        store.delete(id);
        return tx.oncomplete;
    },

    archiveMedia: async (id: string, base64Data: string, type: string) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE_MEDIA, 'readwrite');
            const store = tx.objectStore(STORE_MEDIA);
            store.put({ id, data: base64Data, type, timestamp: Date.now() });
        } catch (e) {}
    },

    getStorageEstimate: async (): Promise<{ usage: number, quota: number }> => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return { usage: estimate.usage || 0, quota: estimate.quota || 0 };
        }
        return { usage: 0, quota: 0 };
    }
};

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e);
    });
}
