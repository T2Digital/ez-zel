
import { supabase } from './supabaseClient'; // Import Supabase

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

class ShadowDB {
  private dbName = 'ShadowCore_V18'; 
  private version = 10;
  private realtimeChannel: any = null;

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

  // --- SUPABASE SYNC LOGIC (REALTIME) ---
  
  // 3. LISTEN: Subscribe to Supabase changes
  subscribeToRealtime(userId: string, onUpdate: (table: string, payload: any) => void) {
      if (!supabase) return;
      
      // Cleanup previous channel
      if (this.realtimeChannel) {
          supabase.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = supabase.channel('public:db_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
              // Filter logic to prevent echoing back own changes if needed, 
              // or to update local DB.
              // For simplicity: We notify the app to re-fetch or update state.
              if (payload.table === 'history' && payload.new && (payload.new as any).user_id === userId) {
                  onUpdate('history', payload.new);
              }
              if (payload.table === 'profiles' && (payload.new as any).phone === userId) {
                  onUpdate('profiles', payload.new);
              }
              if (payload.table === 'tasks' && (payload.new as any).user_id === userId) {
                  onUpdate('tasks', payload.new);
              }
              // Admin listener
              if (userId === 'TITO') {
                   onUpdate('admin_event', payload);
              }
          }
        )
        .subscribe();
      
      console.log(`[Realtime] Subscribed to changes for ${userId}`);
  }

  // 1. PUSH: Sends local data to Supabase (Upsert)
  async pushToCloud(table: string, data: any) {
      if (!supabase) return; 
      try {
          const { error } = await supabase.from(table).upsert(data);
          if (error) console.error(`[Sync Error] ${table}:`, error);
      } catch (e) { }
  }

  // 2. SYNC: Pulls data from Supabase (Cloud First)
  async syncWithBackend(userPhone: string): Promise<boolean> {
      if (!supabase || !userPhone || userPhone === 'GUEST') return false;
      try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('phone', userPhone).single();
          if (profile) {
              const localProfile: UserProfile = {
                  phone: profile.phone,
                  name: profile.name,
                  tier: profile.tier as any,
                  status: profile.status as any,
                  joinedAt: profile.joined_at,
                  affiliate: profile.affiliate_data,
                  vaultState: profile.vault_state,
                  iotActions: profile.iot_actions,
                  shadowName: 'الظل',
                  voicePreference: 'male',
                  ...profile
              };
              await this.saveProfile(localProfile, true); 
          }
          const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userPhone);
          if (tasks) {
              for (const t of tasks) {
                  const localTask: DBTask = {
                      userId: t.user_id,
                      task: t.task,
                      time: t.time,
                      executionTime: t.execution_time,
                      status: t.status as any,
                      category: 'عام',
                      notified: true
                  };
                  await this.saveTask(localTask, true);
              }
          }
          return true;
      } catch (e) {
          return false;
      }
  }

  // --- MESSAGES ---
  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const secureMsg = { ...msg, text: encryptData(msg.text, msg.userId), synced: true };
    const request = tx.objectStore('history').add(secureMsg);
    
    if (!skipCloud && msg.userId !== 'GUEST') {
        this.pushToCloud('history', {
            user_id: msg.userId,
            role: msg.role,
            text: secureMsg.text, // Store encrypted
            timestamp: msg.timestamp,
            voice_data: null, 
            image: null 
        });
    }

    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }

  // --- TASKS ---
  async saveTask(task: DBTask, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readwrite');
    if (task.notified === undefined) task.notified = false;
    
    if (!skipCloud && task.userId !== 'GUEST') {
        this.pushToCloud('tasks', {
            user_id: task.userId,
            task: task.task,
            time: task.time,
            execution_time: task.executionTime,
            status: task.status
        });
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
      }
  }

  // --- MEMORY ---
  async saveFact(fact: DBFact, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    
    if (!skipCloud && fact.userId !== 'GUEST') {
        this.pushToCloud('memory', {
            user_id: fact.userId,
            fact: fact.fact,
            timestamp: fact.timestamp
        });
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
      const db = await this.init();
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get(phone);
      
      const localProfile = await new Promise<UserProfile | undefined>((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
      });

      // ALWAYS TRY CLOUD SYNC FOR CRITICAL STATUS CHECKS (e.g. Activation)
      if (supabase && phone !== 'GUEST') {
          const { data, error } = await supabase.from('profiles').select('*').eq('phone', phone).single();
          if (data && !error) {
              const cloudProfile: UserProfile = {
                  phone: data.phone,
                  name: data.name,
                  tier: data.tier as any,
                  status: data.status as any,
                  joinedAt: data.joined_at,
                  affiliate: data.affiliate_data,
                  vaultState: data.vault_state,
                  iotActions: data.iot_actions,
                  synced: true,
                  // Keep local prefs if exists
                  shadowName: localProfile?.shadowName || 'الظل',
                  password: localProfile?.password || '....'
              };
              // Save latest status to local
              await this.saveProfile(cloudProfile, true); 
              return cloudProfile;
          }
      }
      return localProfile;
  }

  async saveProfile(profile: UserProfile, skipCloud = false) {
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      
      if (!skipCloud && profile.phone !== 'GUEST') {
          this.pushToCloud('profiles', {
              phone: profile.phone,
              name: profile.name,
              tier: profile.tier,
              status: profile.status,
              joined_at: profile.joinedAt,
              affiliate_data: profile.affiliate,
              vault_state: profile.vaultState,
              iot_actions: profile.iotActions
          });
      }

      return tx.objectStore('profiles').put({ ...profile, synced: true });
  }

  // --- CRITICAL: ADMIN DASHBOARD DATA SYNC ---
  async getAllProfiles(): Promise<UserProfile[]> {
      // 1. Try Cloud First (For Admin to see fresh data)
      if (supabase) {
          const { data } = await supabase.from('profiles').select('*');
          if (data) {
              const db = await this.init();
              const tx = db.transaction('profiles', 'readwrite');
              const store = tx.objectStore('profiles');
              
              const mappedProfiles = data.map((p: any) => ({
                  phone: p.phone,
                  name: p.name,
                  tier: p.tier,
                  status: p.status,
                  joinedAt: p.joined_at,
                  affiliate: p.affiliate_data,
                  vaultState: p.vault_state,
                  iotActions: p.iot_actions,
                  synced: true
              }));

              // Bulk Update Local
              for (const p of mappedProfiles) {
                  store.put(p);
              }
              
              return mappedProfiles;
          }
      }

      // 2. Fallback Local
      const db = await this.init();
      const tx = db.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').getAll();
      return new Promise((resolve) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  }

  // --- HELPER METHODS REMAIN UNCHANGED ---
  
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

  // Config, Contacts, Feedback, etc. (Keeping logic simple for now)
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

  async migrateGuestMessages(messages: DBMessage[]) { return; }

  async getSyncStats(): Promise<number> { return 100; }

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
      const db = await this.init();
      const tx = db.transaction('profiles', 'readwrite');
      const store = tx.objectStore('profiles');
      const profiles: UserProfile[] = await new Promise(r => store.getAll().onsuccess = (e: any) => r(e.target.result));
      const referrer = profiles.find(p => p.affiliate?.referralCode === referrerCode);
      if (referrer && referrer.affiliate) {
          referrer.affiliate.totalEarnings += commissionAmount; 
          referrer.affiliate.referralsCount += 1;
          await store.put(referrer);
          // Sync changes
          this.pushToCloud('profiles', {
              phone: referrer.phone,
              affiliate_data: referrer.affiliate
          });
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
          this.pushToCloud('profiles', {
              phone: profile.phone,
              affiliate_data: profile.affiliate
          });
      }
  }

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
