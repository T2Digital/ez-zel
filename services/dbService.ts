
export interface DBMessage {
  id?: number;
  userId: string; // ADDED: Critical for isolation
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
    lastPulseReceived?: number; // ADDED: To track broadcast delivery
    synced?: boolean;
}

export interface DBTask {
  id?: number;
  userId: string; // ADDED
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
  userId: string; // ADDED
  fact: string;
  timestamp: number;
  synced?: boolean;
}

export interface DBProject {
    id?: number;
    userId: string; // ADDED
    name: string;
    context: string;
    status: 'active' | 'archived';
    lastUpdate: number;
    synced?: boolean;
}

export interface DBFSItem {
  id?: number;
  userId: string; // ADDED
  parentId: number | null;
  name: string;
  type: 'folder' | 'table' | 'calendar' | 'project' | 'file';
  createdAt: number;
  synced?: boolean;
}

export interface DBContact {
    id?: number;
    userId: string; // ADDED
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
    value: any; // Changed to any to support numbers
    lastUpdated: number;
}

// --- Dynamic Encryption (Isolation Per User) ---
const GLOBAL_SALT = "SHADOW_CORE_V1";

// Now accepts userId to ensure User A cannot decrypt User B's data even if they access the DB
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

class ShadowDB {
  private dbName = 'ShadowCore_V18'; 
  private version = 10;

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

  async syncWithBackend(userPhone: string): Promise<boolean> { return true; }

  // --- MESSAGES ---
  async saveMessage(msg: DBMessage): Promise<number> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const secureMsg = { ...msg, text: encryptData(msg.text, msg.userId), synced: false };
    const request = tx.objectStore('history').add(secureMsg);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }

  // UPDATED: Sets the Global Pulse Config
  async setGlobalPulse(text: string) {
      const db = await this.init();
      const tx = db.transaction('config', 'readwrite');
      const pulseData = { text, timestamp: Date.now() };
      return tx.objectStore('config').put({ key: 'latest_pulse', value: pulseData, lastUpdated: Date.now() });
  }

  async getGlobalPulse(): Promise<{ text: string, timestamp: number } | null> {
      const db = await this.init();
      const tx = db.transaction('config', 'readonly');
      const request = tx.objectStore('config').get('latest_pulse');
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result?.value || null);
          request.onerror = () => resolve(null);
      });
  }

  async updateLastPulseReceived(phone: string, timestamp: number) {
      const profile = await this.getProfile(phone);
      if (profile) {
          await this.saveProfile({ ...profile, lastPulseReceived: timestamp });
      }
  }

  async migrateGuestMessages(messages: DBMessage[]) {
      return; 
  }

  async updateMessage(id: number, updates: Partial<DBMessage>) {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const msg: DBMessage = await new Promise((resolve) => { store.get(id).onsuccess = (e: any) => resolve(e.target.result); });
    if (msg) {
        if (updates.text) updates.text = encryptData(updates.text, msg.userId);
        store.put({ ...msg, ...updates, synced: false });
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

  // --- TASKS ---
  async saveTask(task: DBTask) {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readwrite');
    if (task.notified === undefined) task.notified = false;
    return tx.objectStore('tasks').put({ ...task, synced: false }); 
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
          store.put({ ...task, ...updates, synced: false });
      }
  }

  // --- MEMORY ---
  async saveFact(fact: DBFact) {
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    return tx.objectStore('memory').add({ ...fact, synced: false });
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const db = await this.init();
    const tx = db.transaction('memory', 'readonly');
    const index = tx.objectStore('memory').index('userId');
    const request = index.getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  // --- PROJECTS ---
  async saveProject(project: DBProject) {
    const db = await this.init();
    const tx = db.transaction('projects', 'readwrite');
    const store = tx.objectStore('projects');
    const index = store.index('userId');
    const userProjects: DBProject[] = await new Promise(r => { index.getAll(project.userId).onsuccess = (e: any) => r(e.target.result) });
    
    const existing = userProjects.find(p => p.name === project.name);
    if (existing) {
        return store.put({ ...existing, context: project.context, lastUpdate: Date.now(), synced: false });
    } else {
        return store.add({ ...project, synced: false });
    }
  }

  async getProjects(userId: string): Promise<DBProject[]> {
      const db = await this.init();
      const tx = db.transaction('projects', 'readonly');
      const index = tx.objectStore('projects').index('userId');
      const request = index.getAll(userId);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async getSyncStats(): Promise<number> { return 100; }

  // --- FILESYSTEM ---
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

  // --- PROFILES ---
  async getProfile(phone: string): Promise<UserProfile | undefined> {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get(phone);
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
      });
  }

  async saveProfile(profile: UserProfile) {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      return tx.objectStore('profiles').put({ ...profile, synced: false });
  }

  async updateUserTraits(phone: string, traits: Partial<UserTraits>) {
      const profile = await this.getProfile(phone);
      if (profile) {
          const updatedTraits = { ...profile.traits, ...traits, lastAnalysis: Date.now() } as UserTraits;
          await this.saveProfile({ ...profile, traits: updatedTraits });
      }
  }

  async registerReferral(referrerCode: string, commissionAmount: number) {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const profiles: UserProfile[] = await new Promise(r => store.getAll().onsuccess = (e: any) => r(e.target.result));
      const referrer = profiles.find(p => p.affiliate?.referralCode === referrerCode);
      if (referrer && referrer.affiliate) {
          referrer.affiliate.totalEarnings += commissionAmount; 
          referrer.affiliate.referralsCount += 1;
          await store.put(referrer);
      }
  }

  async recordPayout(phone: string, amount: number) {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const profile: UserProfile = await new Promise(r => store.get(phone).onsuccess = (e: any) => r(e.target.result));
      if (profile && profile.affiliate) {
          profile.affiliate.payoutHistory.push({ date: Date.now(), amount: amount, status: 'paid' });
          profile.affiliate.totalEarnings = Math.max(0, profile.affiliate.totalEarnings - amount);
          await store.put(profile);
      }
  }

  async getAllProfiles(): Promise<UserProfile[]> {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').getAll();
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  }

  // --- CONTACTS ---
  async saveContact(contact: DBContact) {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readwrite');
      return tx.objectStore('contacts').add({ ...contact, synced: false });
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

  // --- FEEDBACK ---
  async saveFeedback(feedback: DBFeedback) {
      const db = await this.init();
      const tx = db.transaction('feedback', 'readwrite');
      return tx.objectStore('feedback').add(feedback);
  }

  async getAllFeedback(): Promise<DBFeedback[]> {
      const db = await this.init();
      const tx = db.transaction('feedback', 'readonly');
      const request = tx.objectStore('feedback').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  // --- CONFIG (Admin State) ---
  async getGlobalRules(): Promise<string> {
      const db = await this.init();
      const tx = db.transaction('config', 'readonly');
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
      const db = await this.init();
      const tx = db.transaction('config', 'readwrite');
      return tx.objectStore('config').put({ key: 'global_rules', value: rules, lastUpdated: Date.now() });
  }

  // NEW: Config Get/Set for Admin Notifications
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
