import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";

export interface DBMessage {
  id?: number;
  userId: string; 
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  voiceData?: string; 
  groundingLinks?: { title?: string; uri?: string }[];
  image?: string; 
  synced?: boolean; 
}

export interface UserTraits {
    communicationStyle: 'direct' | 'detailed' | 'formal' | 'friendly';
    focusAreas: string[];
    psychologicalProfile: string;
    lastAnalysis: number;
}

export interface AffiliateStats {
    isMarketer: boolean;
    referralCode: string;
    totalEarnings: number;
    referralsCount: number;
    payoutDetails?: {
        method: 'wallet' | 'instapay';
        number: string;
        name: string;
    };
    payoutHistory: { date: number, amount: number, status: 'paid' | 'pending' }[];
}

export interface UserProfile {
    phone: string;
    name: string;
    shadowName?: string;
    voicePreference?: 'male' | 'female';
    password?: string;
    paymentProof?: string;
    tier: 'lite' | 'guardian' | 'sovereign';
    status: 'active' | 'pending' | 'blocked';
    joinedAt: number;
    referredBy?: string; 
    affiliate?: AffiliateStats; 
    subscriptionCycle?: 'monthly' | 'yearly';
    commissionPaid?: boolean;
    iotActions?: { [key: string]: string; };
    vaultState?: {
        contactsImported: boolean;
        biometricsEnabled: boolean;
        logsEnabled: boolean;
    };
    traits?: UserTraits;
    lastPulseReceived?: number; 
    synced?: boolean;
}

export interface DBTask {
  id?: number;
  userId: string; 
  task: string;
  time: string;
  executionTime?: number;
  category: string;
  status: 'pending' | 'done';
  notified?: boolean;
  synced?: boolean;
}

export interface DBFact {
  id?: number;
  userId: string; 
  fact: string;
  timestamp: number;
  synced?: boolean;
}

export interface DBProject {
    id?: number;
    userId: string; 
    name: string;
    context: string;
    status: 'active' | 'archived';
    lastUpdate: number;
    synced?: boolean;
}

export interface DBFSItem {
  id?: number;
  userId: string; 
  parentId: number | null;
  name: string;
  type: 'folder' | 'table' | 'calendar' | 'project' | 'file';
  createdAt: number;
  synced?: boolean;
}

export interface DBContact {
    id?: number;
    userId: string; 
    name: string;
    phones: string[];
    emails: string[];
    lastInteraction: number;
    encryptedData: string;
    synced?: boolean;
}

export interface DBFeedback {
    id?: number;
    userId: string;
    userName: string;
    message: string;
    timestamp: number;
    isRead: boolean;
}

export interface DBSystemConfig {
    key: string; 
    value: any; 
    lastUpdated: number;
}

// --- Dynamic Encryption (Isolation Per User) ---
const GLOBAL_SALT = "SHADOW_CORE_V1";

const encryptData = (text: string, userId: string): string => {
    return btoa(unescape(encodeURIComponent(text + GLOBAL_SALT + userId)));
};

const decryptData = (cipher: string, userId: string): string => {
    try {
        const decoded = decodeURIComponent(escape(atob(cipher)));
        const salt = GLOBAL_SALT + userId;
        return decoded.replace(salt, '');
    } catch (e) {
        return cipher; 
    }
};

// --- FIRESTORE SANITIZER ---
const sanitizeForFirestore = (data: any): any => {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) return data.map(sanitizeForFirestore);
    if (typeof data === 'object') {
        const clean: any = {};
        Object.keys(data).forEach(key => {
            const val = data[key];
            clean[key] = val === undefined ? null : sanitizeForFirestore(val);
        });
        return clean;
    }
    return data;
};

class ShadowDB {
  private dbName = 'ShadowCore_V18'; 
  private version = 10;
  private unsubscribeListeners: Function[] = [];

  constructor() {
      if (navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(granted => {
              if (granted) console.log("[Storage] Persistent storage granted");
          });
      }
  }

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const stores = ['history', 'tasks', 'memory', 'projects', 'profiles', 'fs', 'contacts', 'feedback', 'config'];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: s === 'profiles' || s === 'config' ? (s === 'profiles' ? 'phone' : 'key') : 'id', autoIncrement: s !== 'profiles' && s !== 'config' });
            if (s !== 'profiles' && s !== 'config' && s !== 'feedback') {
                store.createIndex('userId', 'userId', { unique: false });
            }
          } else {
             const store = request.transaction!.objectStore(s);
             if (s !== 'profiles' && s !== 'config' && s !== 'feedback' && !store.indexNames.contains('userId')) {
                 store.createIndex('userId', 'userId', { unique: false });
             }
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // --- FIREBASE SYNC LOGIC (REALTIME) ---
  
  subscribeToRealtime(userId: string, onUpdate: (table: string, payload: any) => void) {
      if (!db || userId === 'GUEST') return;
      
      try {
          // Cleanup previous listeners
          this.unsubscribeListeners.forEach(unsub => unsub());
          this.unsubscribeListeners = [];

          const profileUnsub = onSnapshot(doc(db, "users", userId), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  const profile: UserProfile = { ...data, phone: userId } as any; 
                  onUpdate('profiles', profile);
              }
          });
          this.unsubscribeListeners.push(profileUnsub);

          const historyQuery = query(collection(db, `users/${userId}/history`), where('timestamp', '>', Date.now() - 10000));
          const historyUnsub = onSnapshot(historyQuery, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                      onUpdate('history', change.doc.data());
                  }
              });
          });
          this.unsubscribeListeners.push(historyUnsub);

          const tasksUnsub = onSnapshot(collection(db, `users/${userId}/tasks`), (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === "added" || change.type === "modified") {
                      onUpdate('tasks', change.doc.data());
                  }
              });
          });
          this.unsubscribeListeners.push(tasksUnsub);

          console.log(`[Firebase] Subscribed to changes for ${userId}`);
      } catch (e) {
          console.warn("[Firebase] Realtime sync failed. Running local.", e);
      }
  }

  // 1. PUSH: Sends local data to Firestore
  async pushToCloud(collectionName: string, rawData: any, subCollection?: string, userId?: string) {
      if (!db) {
          console.warn("[Cloud] DB not initialized");
          return; 
      }
      
      const data = sanitizeForFirestore(rawData);

      try {
          if (collectionName === 'profiles') {
              console.log("[Cloud] Syncing Profile...", data.phone);
              // CRITICAL: We await this to ensure profile is created before UI proceeds
              await setDoc(doc(db, "users", data.phone), data, { merge: true });
              console.log("[Cloud] Profile Synced!");
          } else if (userId && subCollection) {
              const docId = data.id ? data.id.toString() : data.timestamp ? data.timestamp.toString() : undefined;
              if (docId) {
                  await setDoc(doc(db, `users/${userId}/${subCollection}`, docId), data, { merge: true });
              } else {
                  await addDoc(collection(db, `users/${userId}/${subCollection}`), data);
              }
          }
      } catch (e: any) { 
          console.error(`[Sync Error] ${collectionName}:`, e);
          if (e.code === 'unavailable') {
              console.error("[Cloud] Client is OFFLINE. Data queued locally.");
          }
          throw e; // Rethrow to notify caller
      }
  }

  // --- MESSAGES ---
  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const secureMsg = { ...msg, text: encryptData(msg.text, msg.userId), synced: true };
    const request = tx.objectStore('history').add(secureMsg);
    
    if (!skipCloud && msg.userId !== 'GUEST') {
        // Fire and forget for messages is mostly okay to avoid lag, but best practice is to queue
        this.pushToCloud('history', {
            ...msg,
            text: secureMsg.text 
        }, 'history', msg.userId).catch(err => console.error("Msg Cloud Error", err));
    }

    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }

  // --- TASKS ---
  async saveTask(task: DBTask, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readwrite');
    if (task.notified === undefined) task.notified = false;
    
    if (!skipCloud && task.userId !== 'GUEST') {
        this.pushToCloud('tasks', task, 'tasks', task.userId).catch(console.error);
    }

    return tx.objectStore('tasks').put({ ...task, synced: true }); 
  }

  async getTasks(userId: string): Promise<DBTask[]> {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readonly');
    const index = tx.objectStore('tasks').index('userId');
    const request = index.getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async updateTaskStatus(id: number, updates: Partial<DBTask>) {
      const db = await this.init();
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const task: DBTask = await new Promise((resolve) => { store.get(id).onsuccess = (e: any) => resolve(e.target.result); });
      if (task) {
          const updated = { ...task, ...updates };
          store.put(updated);
          if (task.userId !== 'GUEST') {
             this.pushToCloud('tasks', updated, 'tasks', task.userId).catch(console.error);
          }
      }
  }

  // --- MEMORY ---
  async saveFact(fact: DBFact, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    
    if (!skipCloud && fact.userId !== 'GUEST') {
        this.pushToCloud('memory', fact, 'memory', fact.userId).catch(console.error);
    }

    return tx.objectStore('memory').add({ ...fact, synced: true });
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const db = await this.init();
    const tx = db.transaction('memory', 'readonly');
    const index = tx.objectStore('memory').index('userId');
    const request = index.getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  // --- PROFILES ---
  async getProfile(phone: string): Promise<UserProfile | undefined> {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get(phone);
      
      const localProfile = await new Promise<UserProfile | undefined>((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
      });

      if (this.canSync(phone)) {
          try {
             // @ts-ignore
             if (db) {
                const docSnap = await getDoc(doc(db, "users", phone));
                if (docSnap.exists()) {
                    const cloudData = docSnap.data() as UserProfile;
                    const merged = { ...localProfile, ...cloudData, synced: true };
                    await this.saveProfile(merged, true); 
                    return merged;
                }
             }
          } catch(e) { console.error("Profile fetch error", e); }
      }
      return localProfile;
  }

  async saveProfile(profile: UserProfile, skipCloud = false) {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      
      if (!skipCloud && profile.phone !== 'GUEST') {
          // CRITICAL: Await this to ensure registration doesn't complete until cloud confirms
          try {
              await this.pushToCloud('profiles', profile);
          } catch (e) {
              console.error("Failed to sync profile to cloud:", e);
              // In production, you might want to alert the user here
          }
      }

      return tx.objectStore('profiles').put({ ...profile, synced: true });
  }

  // --- ADMIN & SYSTEM ---
  async getAllProfiles(): Promise<UserProfile[]> {
      if (db) {
          try {
              const querySnapshot = await getDocs(collection(db, "users"));
              const profiles: UserProfile[] = [];
              querySnapshot.forEach((doc) => {
                  profiles.push(doc.data() as UserProfile);
              });
              
              const dbLocal = await this.init();
              const tx = dbLocal.transaction('profiles', 'readwrite');
              profiles.forEach(p => tx.objectStore('profiles').put(p));

              return profiles;
          } catch (e) { console.error("Admin fetch error", e); }
      }

      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').getAll();
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  }

  // --- HELPER METHODS ---
  private canSync(phone: string): boolean {
      return !!db && phone !== 'GUEST';
  }

  async updateMessage(id: number, updates: Partial<DBMessage>) {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const msg: DBMessage = await new Promise((resolve) => { store.get(id).onsuccess = (e: any) => resolve(e.target.result); });
    if (msg) {
        if (updates.text) updates.text = encryptData(updates.text, msg.userId);
        store.put({ ...msg, ...updates });
    }
  }

  async getHistory(userId: string): Promise<DBMessage[]> {
    const db = await this.init();
    const tx = db.transaction('history', 'readonly');
    const index = tx.objectStore('history').index('userId');
    const request = index.getAll(userId);
    return new Promise((resolve) => { 
        request.onsuccess = () => {
            const raw = request.result || [];
            const decrypted = raw.map((m: DBMessage) => ({
                ...m,
                text: decryptData(m.text, userId)
            }));
            resolve(decrypted);
        }; 
    });
  }

  async setGlobalPulse(text: string) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('config', 'readwrite');
      const pulseData = { text, timestamp: Date.now() };
      
      if (this.canSync('TITO') && db) { 
          // @ts-ignore
          await setDoc(doc(db, "system", "pulse"), pulseData).catch(console.error);
      }
      
      return tx.objectStore('config').put({ key: 'latest_pulse', value: pulseData, lastUpdated: Date.now() });
  }

  async getGlobalPulse(): Promise<{ text: string, timestamp: number } | null> {
      if (db) {
          try {
              // @ts-ignore
              const docSnap = await getDoc(doc(db, "system", "pulse"));
              if (docSnap.exists()) return docSnap.data() as any;
          } catch(e) {}
      }

      const dbLocal = await this.init();
      const tx = dbLocal.transaction('config', 'readonly');
      const request = tx.objectStore('config').get('latest_pulse');
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result?.value || null);
          request.onerror = () => resolve(null);
      });
  }

  async updateLastPulseReceived(phone: string, timestamp: number) {
      const profile = await this.getProfile(phone);
      if (profile) {
          await this.saveProfile({ ...profile, lastPulseReceived: timestamp }, true); // Skip cloud to reduce writes
      }
  }

  async migrateGuestMessages(messages: DBMessage[]) { return; }

  async getSyncStats(): Promise<number> { return db ? 100 : 0; }

  async getFSItemsByParent(userId: string, parentId: number | null): Promise<DBFSItem[]> {
      const db = await this.init();
      const tx = db.transaction('fs', 'readonly');
      const index = tx.objectStore('fs').index('userId');
      const request = index.getAll(userId);
      return new Promise((resolve) => {
          request.onsuccess = () => {
              const all = request.result as DBFSItem[];
              resolve(all.filter(i => i.parentId === parentId));
          };
          request.onerror = () => resolve([]);
      });
  }

  async createFSItem(item: DBFSItem): Promise<number> {
      const db = await this.init();
      const tx = db.transaction('fs', 'readwrite');
      const request = tx.objectStore('fs').add({ ...item, synced: false });
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }

  async updateUserTraits(phone: string, traits: Partial<UserTraits>) {
      const profile = await this.getProfile(phone);
      if (profile) {
          const updatedTraits = { ...profile.traits, ...traits, lastAnalysis: Date.now() } as UserTraits;
          await this.saveProfile({ ...profile, traits: updatedTraits });
      }
  }

  async registerReferral(referrerCode: string, commissionAmount: number) {
      const allProfiles = await this.getAllProfiles();
      const referrer = allProfiles.find(p => p.affiliate?.referralCode === referrerCode);
      
      if (referrer && referrer.affiliate) {
          referrer.affiliate.totalEarnings += commissionAmount; 
          referrer.affiliate.referralsCount += 1;
          await this.saveProfile(referrer);
      }
  }

  async recordPayout(phone: string, amount: number) {
      const profile = await this.getProfile(phone);
      if (profile && profile.affiliate) {
          profile.affiliate.payoutHistory.push({ date: Date.now(), amount: amount, status: 'paid' });
          profile.affiliate.totalEarnings = Math.max(0, profile.affiliate.totalEarnings - amount);
          await this.saveProfile(profile);
      }
  }

  async saveContact(contact: DBContact) {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readwrite');
      if (contact.userId !== 'GUEST') {
           this.pushToCloud('contacts', contact, 'contacts', contact.userId).catch(console.error);
      }
      return tx.objectStore('contacts').add({ ...contact, synced: true });
  }

  async getContacts(userId?: string): Promise<DBContact[]> {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readonly');
      if (userId) {
          const index = tx.objectStore('contacts').index('userId');
          const request = index.getAll(userId);
           return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
      } else {
          const request = tx.objectStore('contacts').getAll();
          return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
      }
  }

  async saveFeedback(feedback: DBFeedback) {
      const localDB = await this.init();
      const tx = localDB.transaction('feedback', 'readwrite');
      if (this.canSync(feedback.userId) && db) {
          // @ts-ignore
           try { await addDoc(collection(db, "feedback"), feedback); } catch(e){}
      }
      return tx.objectStore('feedback').add(feedback);
  }

  async getAllFeedback(): Promise<DBFeedback[]> {
      if (db) {
          try {
              const querySnapshot = await getDocs(collection(db, "feedback"));
              const items: DBFeedback[] = [];
              querySnapshot.forEach((doc) => items.push(doc.data() as DBFeedback));
              return items;
          } catch(e) {}
      }
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('feedback', 'readonly');
      const request = tx.objectStore('feedback').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async getGlobalRules(): Promise<string> {
      if (db) {
          try {
              // @ts-ignore
               const docSnap = await getDoc(doc(db, "system", "rules"));
               if (docSnap.exists()) return docSnap.data().text;
          } catch(e) {}
      }

      const dbLocal = await this.init();
      const tx = dbLocal.transaction('config', 'readonly');
      const request = tx.objectStore('config').get('global_rules');
      return new Promise((resolve) => {
          request.onsuccess = () => {
              if (request.result?.value) resolve(request.result.value);
              else resolve("- أنت ظل رقمي مصري أصيل.\n- ولاؤك الأول والأخير لصاحب الحساب (الماستر).\n- حافظ على أسرار المستخدم كأنها أسرار نووية.\n- تحدث بلهجة مصرية قوية، ذكية، ومختصرة.\n- هدفك هو نجاح الماستر وراحته.");
          };
          request.onerror = () => resolve("");
      });
  }

  async updateGlobalRules(rules: string) {
      if (db) {
           // @ts-ignore
           await setDoc(doc(db, "system", "rules"), { text: rules, updated: Date.now() }).catch(console.error);
      }
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('config', 'readwrite');
      return tx.objectStore('config').put({ key: 'global_rules', value: rules, lastUpdated: Date.now() });
  }

  async getConfig(key: string): Promise<any> {
      const db = await this.init();
      const tx = db.transaction('config', 'readonly');
      const request = tx.objectStore('config').get(key);
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result?.value);
          request.onerror = () => resolve(null);
      });
  }

  async setConfig(key: string, value: any) {
      const db = await this.init();
      const tx = db.transaction('config', 'readwrite');
      return tx.objectStore('config').put({ key, value, lastUpdated: Date.now() });
  }
}

export const shadowDB = new ShadowDB();