import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc, orderBy, deleteDoc, writeBatch, limit } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, User } from "firebase/auth";

export interface DBMessage {
  id?: number;
  userId: string; // Now Email
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  voiceData?: string; 
  groundingLinks?: { title?: string; uri?: string }[];
  image?: string; 
  uiCards?: any[]; // CHANGED: Array to support multitasking cards
  isHidden?: boolean;
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
    payoutHistory: { id?: number; date: number; amount: number; status: 'paid' | 'pending' }[];
}

export interface AgentPowers {
    developer?: boolean;
    trader?: boolean;
    social?: boolean;
}

export interface SystemKeys {
    githubToken?: string;
    vercelToken?: string;
    binanceApiKey?: string;
    binanceSecretKey?: string;
    metaToken?: string;
    metaPageId?: string;
    openAIBaseUrl?: string;
    openAIApiKey?: string;
    openAIModelName?: string;
    geminiApiKey?: string;
}

export interface UserProfile {
    email: string; // Primary Key
    phone?: string; // Legacy ID / Identifier
    password?: string; // Admin Bypass / Local Auth
    uid?: string; // Firebase Auth UID
    name: string;
    shadowName?: string;
    voicePreference?: 'male' | 'female';
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
    pin?: string;
    traits?: UserTraits;
    lastPulseReceived?: number; 
    synced?: boolean;
    agentPowers?: AgentPowers;
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
  embedding?: number[];
}

export interface DBFSItem {
  id?: number;
  userId: string; 
  parentId: number | null;
  name: string;
  type: 'folder' | 'table' | 'calendar' | 'project' | 'file';
  content?: string;
  l0_summary?: string;
  l1_metadata?: string;
  l2_content?: string;
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

export interface DBPlugin {
    id?: number;
    userId: string;
    name: string;
    description: string;
    parametersSchema: string; // JSON string representations of the parameters
    jsCode: string;
    createdAt: number;
    synced?: boolean;
}

export interface DBCoupon {
    code: string;
    discountAmount: number; // e.g. 200 or 1000
    type: 'fixed' | 'percent'; // currently logic supports fixed reduction mainly
    maxUses: number;
    usedCount: number;
    expiryDate?: number;
}

export interface AgentProfile {
    id: string; 
    name: string;
    role: string;
    isActive: boolean;
    systemInstruction: string; 
    knowledgeBase: string[]; 
    documents?: { name: string; mimeType: string; data: string; }[]; // New: PDF/File Storage
    lastUpdated: number;
}

// --- Dynamic Encryption ---
const GLOBAL_SALT = "SHADOW_CORE_V1";
const encryptData = (text: string, userId: string): string => btoa(unescape(encodeURIComponent(text + GLOBAL_SALT + userId)));
const decryptData = (cipher: string, userId: string): string => {
    try { return decodeURIComponent(escape(atob(cipher))).replace(GLOBAL_SALT + userId, ''); } catch (e) { return cipher; }
};

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
  private dbName = 'ShadowCore_V20_Email'; 
  private version = 17; // Incremented version for schema change
  private unsubscribeListeners: Function[] = [];
  private systemUnsubscribe: Function[] = [];
  private adminUnsubscribe: Function | null = null;
  
  private syncQueue: { collectionName: string, data: any, subCollection?: string, userId?: string }[] = [];
  private syncTimer: any = null;
  public syncStatus: 'synced' | 'syncing' | 'offline' | 'error' = 'synced';
  public onSyncStatusChange: ((status: 'synced' | 'syncing' | 'offline' | 'error') => void) | null = null;

  private updateSyncStatus(status: 'synced' | 'syncing' | 'offline' | 'error') {
      this.syncStatus = status;
      if (this.onSyncStatusChange) this.onSyncStatusChange(status);
  }

  constructor() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then(granted => { if (granted) console.log("[Storage] Persistent storage granted"); });
      }
  }

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = (event) => reject((event.target as any).error);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const stores = ['history', 'tasks', 'memory', 'profiles', 'fs', 'contacts', 'feedback', 'config', 'agents', 'coupons', 'plugins'];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: s === 'profiles' ? 'email' : (s === 'config' ? 'key' : (s === 'agents' || s === 'coupons' ? 'code' : 'id')), autoIncrement: s === 'feedback' || s === 'history' || s === 'tasks' || s === 'memory' || s === 'plugins' });
            if (s !== 'profiles' && s !== 'config' && s !== 'agents' && s !== 'coupons' && !store.indexNames.contains('userId')) store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  // --- AUTHENTICATION (Firebase) ---
  onAuthStateChanged(callback: (user: any) => void) {
      if (auth) {
          return onAuthStateChanged(auth, callback);
      }
      return () => {};
  }

  async registerUser(email: string, password: string, name: string, isAffiliate: boolean, referralCode?: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const cleanEmail = email.toLowerCase();
      const isAdmin = cleanEmail === 'admin@shadow.com';
      
      const newUser: UserProfile = {
          email: cleanEmail,
          phone: cleanEmail,
          uid,
          name: isAdmin ? 'تيتو (الماستر)' : name, 
          shadowName: isAdmin ? 'الماستر' : (isAffiliate ? 'Marketer' : 'الظل'),
          voicePreference: 'male',
          tier: isAdmin ? 'sovereign' : (isAffiliate ? 'lite' : 'sovereign'),
          status: isAdmin ? 'active' : (isAffiliate ? 'active' : 'pending'),
          joinedAt: Date.now(),
          referredBy: referralCode,
          affiliate: isAdmin ? { 
              isMarketer: true, 
              referralCode: 'ADMIN_BOSS', 
              totalEarnings: 0, 
              referralsCount: 0, 
              payoutHistory: [] 
          } : { 
              isMarketer: isAffiliate, 
              referralCode: (name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(), 
              totalEarnings: 0, 
              referralsCount: 0, 
              payoutHistory: [] 
          },
          subscriptionCycle: isAdmin ? 'yearly' : (isAffiliate ? undefined : 'monthly'),
      };
      await this.saveProfile(newUser, true);
      return newUser;
  }

  async nukeLocalDatabase() {
      try {
          localStorage.clear();
          sessionStorage.clear();
          const req = indexedDB.deleteDatabase(this.dbName);
          req.onsuccess = () => console.log("IndexedDB wiped");
          if (auth) await auth.signOut();
          return true;
      } catch (e) {
          console.error("Nuke failed", e);
          return false;
      }
  }

  async syncHistoryFast(email: string) {
      if (!db || !email || email === 'GUEST') return;
      try {
          const q = query(collection(db, `users/${email}/history`), orderBy('timestamp', 'desc'), limit(100));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
              const item = d.data();
              if (item) {
                  await this.saveMessage({...item, userId: email} as any, true);
              }
          }
      } catch (e) {
          console.error("Fast sync failed:", e);
      }
  }

  async downloadUserCloudData(email: string) {
      if (!db || !email) return;
      try {
          console.log('[Shadow Core] Downloading cloud data for', email);
          
          const collectionsList = ['history', 'tasks', 'memory', 'filesystem'];
          for (const col of collectionsList) {
             const q = query(collection(db, 'users/' + email + '/' + col));
             const snap = await getDocs(q);
             for (const d of snap.docs) {
                const item = d.data();
                if (item) {
                   if (col === 'history') await this.saveMessage({...item, userId: email} as any, true);
                   if (col === 'tasks') await this.saveTask({...item, userId: email} as any, true);
                   if (col === 'memory') await this.saveFact({...item, userId: email} as any, true);
                   if (col === 'filesystem') await this.createFSItem({...item, userId: email} as any);
                }
             }
          }
          console.log('[Shadow Core] Cloud data download complete.');
      } catch (e) {
          console.error('[Shadow Core] Failed to download cloud data', e);
      }
  }

  async loginUser(email: string, password: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const cleanEmail = email.toLowerCase();
      let profile = await this.getProfile(cleanEmail);

      // AUTO-HEAL
      if (!profile) {
          if (db) {
              try {
                  const docSnap = await getDoc(doc(db, "users", cleanEmail));
                  if (docSnap.exists()) {
                      profile = docSnap.data() as UserProfile;
                      await this.saveProfile(profile, true);
                      this.downloadUserCloudData(cleanEmail);
                      return profile;
                  }
              } catch(e) {}
          }

          console.warn("[Shadow Core] Profile missing locally. Creating default/healing...");
          const namePart = email.split('@')[0];
          const isAdmin = cleanEmail === 'admin@shadow.com';
          
          profile = {
              email: cleanEmail,
              phone: cleanEmail,
              uid: uid,
              name: isAdmin ? 'تيتو (الماستر)' : namePart,
              shadowName: isAdmin ? 'الماستر' : 'الظل',
              tier: isAdmin ? 'sovereign' : 'lite',
              status: 'active',
              joinedAt: Date.now(),
              affiliate: isAdmin ? {
                  isMarketer: true,
                  referralCode: 'ADMIN_BOSS',
                  totalEarnings: 0,
                  referralsCount: 0,
                  payoutHistory: []
              } : undefined
          };
          
          try {
              if (db) await setDoc(doc(db, "users", cleanEmail), profile, { merge: true });
              await this.saveProfile(profile);
          } catch(e) {
              await this.saveProfile(profile, true);
          }
      }

      if (!profile) throw new Error("Profile creation failed");
      this.downloadUserCloudData(cleanEmail);
      return profile;
  }

  async resetPassword(email: string) {
      if (!auth) throw new Error("Firebase Auth not initialized");
      await sendPasswordResetEmail(auth, email);
  }

  async logout() {
      if (auth) await signOut(auth);
  }

  // --- FIREBASE SYNC (USER SPECIFIC) ---
  subscribeToRealtime(email: string, onUpdate: (table: string, payload: any) => void) {
      if (!db || email === 'GUEST' || !auth?.currentUser) return;
      try {
          this.unsubscribeListeners.forEach(unsub => unsub());
          this.unsubscribeListeners = [];
          
          const profileUnsub = onSnapshot(doc(db, "users", email), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  const profile: UserProfile = { ...data, email } as any; 
                  onUpdate('profiles', profile);
                  this.saveProfile(profile, true);
              }
          }, (error) => { console.warn("[Firebase] Profile sync error:", error); });
          this.unsubscribeListeners.push(profileUnsub);

          const historyQuery = query(collection(db, `users/${email}/history`), where('timestamp', '>', Date.now() - 10000));
          const historyUnsub = onSnapshot(historyQuery, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                      const data = change.doc.data();
                      this.saveMessage(data as any, true).then((id) => {
                          data.text = decryptData(data.text, email);
                          onUpdate('history', { ...data, id });
                      });
                  }
              });
          }, (error) => { console.warn("[Firebase] History sync error:", error); });
          this.unsubscribeListeners.push(historyUnsub);
      } catch (e) { console.warn("[Firebase] Realtime sync init failed.", e); }
  }

  // --- GLOBAL SYSTEM SYNC (ALL USERS) ---
  subscribeToSystem(onPulse: (pulse: any) => void, onRules: (rules: string) => void) {
      if (!db || !auth?.currentUser) return; // Wait for auth
      this.systemUnsubscribe.forEach(unsub => unsub());
      this.systemUnsubscribe = [];

      try {
          const pulseUnsub = onSnapshot(doc(db, "system", "pulse"), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  this.setConfig('latest_pulse', data); 
                  onPulse(data);
              }
          }, (error) => { console.warn("[Firebase] Pulse sync error:", error); });
          this.systemUnsubscribe.push(pulseUnsub);

          const rulesUnsub = onSnapshot(doc(db, "system", "rules"), (doc) => {
              if (doc.exists()) {
                  const data = doc.data();
                  if (data.text) {
                      this.updateGlobalRules(data.text, true); 
                      onRules(data.text);
                  }
              }
          }, (error) => { console.warn("[Firebase] Rules sync error:", error); });
          this.systemUnsubscribe.push(rulesUnsub);

          const agentsUnsub = onSnapshot(collection(db, "system_agents"), (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  const agent = change.doc.data() as AgentProfile;
                  this.saveAgentProfile(agent, true);
              });
          }, (error) => { console.warn("[Firebase] Agents sync error:", error); });
          this.systemUnsubscribe.push(agentsUnsub);

      } catch (e) { console.warn("[Firebase] System sync failed", e); }
  }

  subscribeToAdminFeed(onProfilesUpdate: (profiles: UserProfile[]) => void, onFeedbackUpdate: (feedbacks: DBFeedback[]) => void) {
      if (!db || !auth?.currentUser) return;
      if (this.adminUnsubscribe) this.adminUnsubscribe();
      
      try {
          const q = query(collection(db, "users"));
          const unsubProfiles = onSnapshot(q, (snapshot) => {
              const profiles: UserProfile[] = [];
              snapshot.forEach((doc) => profiles.push({ ...doc.data(), email: doc.id } as UserProfile));
              onProfilesUpdate(profiles);
          }, (error) => { console.warn("[Firebase] Admin profiles sync error:", error); });

          const qFeed = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
          const unsubFeedback = onSnapshot(qFeed, (snapshot) => {
             const items: DBFeedback[] = [];
             snapshot.forEach(doc => items.push(doc.data() as DBFeedback));
             onFeedbackUpdate(items);
          }, (error) => { console.warn("[Firebase] Admin feedback sync error:", error); });

          this.adminUnsubscribe = () => { unsubProfiles(); unsubFeedback(); };
      } catch (e) { console.error("[Admin] Sync Error:", e); }
  }

  async pushToCloud(collectionName: string, rawData: any, subCollection?: string, userId?: string) {
      if (!db) return; 
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.updateSyncStatus('offline');
      }
      const data = sanitizeForFirestore(rawData);
      console.log(`[pushToCloud] collection: ${collectionName}, subCollection: ${subCollection}, userId: ${userId}, data:`, data);
      this.syncQueue.push({ collectionName, data, subCollection, userId });
      this.updateSyncStatus('syncing');

      if (!this.syncTimer) {
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 500); // Batched quickly
      }
  }

  async flushSyncQueue() {
      if (this.syncQueue.length === 0) {
          this.updateSyncStatus('synced');
          this.syncTimer = null;
          return;
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
          this.updateSyncStatus('offline');
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 10000); // Retry later
          return;
      }

      this.updateSyncStatus('syncing');
      const batch = this.syncQueue.splice(0, 50); // Process up to 50 items with writeBatch
      try {
          const firestoreBatch = writeBatch(db);
          let hasWrites = false;

          for (const item of batch) {
              const { collectionName, data, subCollection, userId } = item;
              if (collectionName === 'profiles') {
                  firestoreBatch.set(doc(db, "users", data.email), data, { merge: true });
                  hasWrites = true;
              } else if (collectionName === 'coupons') {
                  firestoreBatch.set(doc(db, "system_coupons", data.code), data, { merge: true });
                  hasWrites = true;
              } else if (collectionName === 'system_agents') {
                 firestoreBatch.set(doc(db, "system_agents", data.id), data, { merge: true });
                 hasWrites = true;
              } else if (collectionName === 'feedback') {
                 const newDocRef = doc(collection(db, "feedback"));
                 firestoreBatch.set(newDocRef, data);
                 hasWrites = true;
              } else if (userId && subCollection) {
                  const docId = data.id ? data.id.toString() : data.timestamp ? data.timestamp.toString() : undefined;
                  if (docId) {
                      firestoreBatch.set(doc(db, `users/${userId}/${subCollection}`, docId), data, { merge: true });
                      hasWrites = true;
                  } else {
                      const newDocRef = doc(collection(db, `users/${userId}/${subCollection}`));
                      firestoreBatch.set(newDocRef, data);
                      hasWrites = true;
                  }
              }
          }

          if (hasWrites) {
              await firestoreBatch.commit();
          }

          if (this.syncQueue.length > 0) {
              this.syncTimer = setTimeout(() => this.flushSyncQueue(), 2000);
          } else {
              this.updateSyncStatus('synced');
              this.syncTimer = null;
          }
      } catch (e: any) { 
          console.warn(`[Cloud Sync Warning] Batch flush failed:`, e.message);
          if (e?.code === 'resource-exhausted' || e?.message?.includes('resource-exhausted')) {
              console.warn("[Sync] Resource exhausted, dropping batch to recover.");
          } else {
              this.syncQueue.unshift(...batch); // Put failed items back
          }
          this.updateSyncStatus('error');
          this.syncTimer = setTimeout(() => this.flushSyncQueue(), 10000);
      }
  }

  // --- CRUD OPERATIONS ---
  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const id = (msg as any).id || Date.now() + Math.floor(Math.random() * 1000);
    // If skipCloud is true, it came from the cloud where it is already encrypted!
    const textToSave = skipCloud ? msg.text : encryptData(msg.text, msg.userId);
    const secureMsg = { ...msg, id, text: textToSave, synced: true };
    const request = tx.objectStore('history').put(secureMsg);
    // Skip cloud sync for system messages to prevent resource-exhausted errors
    if (!skipCloud && msg.userId !== 'GUEST' && msg.role !== 'system') this.pushToCloud('history', { ...msg, id, text: secureMsg.text }, 'history', msg.userId);
    return new Promise((resolve, reject) => { 
        request.onsuccess = () => resolve(request.result as number); 
        request.onerror = () => reject(request.error);
    });
  }

  async updateMessage(id: number, updates: Partial<DBMessage>) {
      const db = await this.init();
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      return new Promise<void>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
              const data = req.result;
              if (data) {
                  const updatedData = { ...data, ...updates, synced: true };
                  store.put(updatedData);
                  if (data.userId !== 'GUEST') this.pushToCloud('history', updatedData, 'history', data.userId);
              }
              resolve();
          };
          req.onerror = () => resolve();
      });
  }

  async getTasks(userId: string): Promise<DBTask[]> {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readonly');
    const request = tx.objectStore('tasks').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async savePlugin(plugin: DBPlugin) {
    const db = await this.init();
    const tx = db.transaction('plugins', 'readwrite');
    const pluginWithId = { ...plugin, id: plugin.id || Date.now() + Math.floor(Math.random() * 1000) };
    return tx.objectStore('plugins').put(pluginWithId);
  }

  async getPluginsByUserId(userId: string): Promise<DBPlugin[]> {
    const db = await this.init();
    const tx = db.transaction('plugins', 'readonly');
    const request = tx.objectStore('plugins').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async saveTask(task: DBTask, skipCloud = false) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('tasks', 'readwrite');
        const taskWithId = { ...task, id: task.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
        if (!skipCloud && task.userId !== 'GUEST') this.pushToCloud('tasks', taskWithId, 'tasks', task.userId);
        const req = tx.objectStore('tasks').put(taskWithId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
  }

  async updateTaskStatus(id: number, updates: Partial<DBTask>) {
      const db = await this.init();
      return new Promise<void>((resolve, reject) => {
          const tx = db.transaction('tasks', 'readwrite');
          const store = tx.objectStore('tasks');
          const req = store.get(id);
          req.onsuccess = () => {
              const task = req.result;
              if (task) {
                  const updated = { ...task, ...updates };
                  store.put(updated);
                  if (task.userId !== 'GUEST') this.pushToCloud('tasks', updated, 'tasks', task.userId);
              }
          };
          req.onerror = () => reject(req.error);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }

  async saveFact(fact: DBFact, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    const factWithId = { ...fact, id: fact.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
    if (!skipCloud && fact.userId !== 'GUEST') this.pushToCloud('memory', factWithId, 'memory', fact.userId);
    return tx.objectStore('memory').put(factWithId); // Changed to put to allow updates
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const db = await this.init();
    const tx = db.transaction('memory', 'readonly');
    const request = tx.objectStore('memory').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async deleteFact(id: number, skipCloud = false) {
      const db = await this.init();
      const tx = db.transaction('memory', 'readwrite');
      if (!skipCloud) {
          // If we had a mechanism to delete from cloud, we'd do it here, or we just rely on IndexedDB for now
          // For a true SCI-FI implementation, we'd delete from Firestore as well. We can just ignore for now or add a delete stub
      }
      return new Promise<void>((resolve, reject) => {
          const req = tx.objectStore('memory').delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
      });
  }

  async getProfile(email: string): Promise<UserProfile | undefined> {
      const cleanEmail = email.toLowerCase();
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readonly');
      const request = tx.objectStore('profiles').get(cleanEmail);
      
      let localProfile = await new Promise<UserProfile | undefined>((resolve) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
      });

      if (!localProfile && db && cleanEmail !== 'guest') {
         try {
             const docSnap = await getDoc(doc(db, "users", cleanEmail));
             if (docSnap.exists()) {
                 const cloudData = docSnap.data() as UserProfile;
                 localProfile = { ...cloudData, email: cleanEmail };
                 await this.saveProfile(localProfile, true); 
             }
         } catch(e) { console.warn("[DB] Cloud fetch failed/skipped:", e); }
      }

      if (localProfile && !localProfile.affiliate) {
          localProfile.affiliate = {
              isMarketer: false,
              referralCode: (localProfile.name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(),
              totalEarnings: 0,
              referralsCount: 0,
              payoutHistory: []
          };
          await this.saveProfile(localProfile, true);
      }

      return localProfile;
  }

  async saveProfile(profile: UserProfile, skipCloud = false) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readwrite');
      const request = tx.objectStore('profiles').put({ ...profile, email: profile.email.toLowerCase(), synced: true });
      if (!skipCloud && profile.email !== 'GUEST') this.pushToCloud('profiles', profile);
      return new Promise((resolve, reject) => { request.onsuccess = () => resolve(true); request.onerror = () => reject(request.error); });
  }

  async getAllProfiles(): Promise<UserProfile[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('profiles', 'readonly').objectStore('profiles').getAll();
      
      const localProfiles = await new Promise<UserProfile[]>((resolve) => { request.onsuccess = () => resolve(request.result || []); request.onerror = () => resolve([]); });

      if (db) {
          try {
              const snap = await getDocs(collection(db, "users"));
              const cloudProfiles: UserProfile[] = [];
              snap.forEach((doc) => cloudProfiles.push({ ...doc.data(), email: doc.id } as UserProfile));
              return cloudProfiles;
          } catch(e) {}
      }
      return localProfiles;
  }

  // --- PAYOUT APPROVAL ---
  async approvePayout(email: string, payoutId: number) {
      const profile = await this.getProfile(email);
      if (profile && profile.affiliate?.payoutHistory) {
          const updatedHistory = profile.affiliate.payoutHistory.map(p => 
              (p.date === payoutId || p.id === payoutId) ? { ...p, status: 'paid' as const } : p
          );
          
          const updatedProfile = { 
              ...profile, 
              affiliate: { ...profile.affiliate, payoutHistory: updatedHistory } 
          };
          
          await this.saveProfile(updatedProfile);
      }
  }

  async getHistory(userId: string, limit?: number, offset?: number): Promise<DBMessage[]> {
    const db = await this.init();
    const tx = db.transaction('history', 'readonly');
    const index = tx.objectStore('history').index('userId');
    
    return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(userId), 'prev');
        const results: DBMessage[] = [];
        let hasAdvanced = false;

        request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
                if (offset && offset > 0 && !hasAdvanced) {
                    hasAdvanced = true;
                    cursor.advance(offset);
                    return;
                }
                
                const msg = cursor.value;
                results.push({ ...msg, text: decryptData(msg.text, userId) });
                
                if (limit && results.length >= limit) {
                    resolve(results.reverse());
                    return;
                }
                cursor.continue();
            } else {
                resolve(results.reverse());
            }
        };
        request.onerror = () => reject(request.error);
    });
  }

  async setGlobalPulse(text: string) {
      const dbLocal = await this.init();
      return new Promise<void>((resolve, reject) => {
          const tx = dbLocal.transaction('config', 'readwrite');
          const pulseData = { text, timestamp: Date.now() };
          if (db) setDoc(doc(db, "system", "pulse"), pulseData).catch(console.error);
          const req = tx.objectStore('config').put({ key: 'latest_pulse', value: pulseData, lastUpdated: Date.now() });
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
      });
  }

  async getGlobalPulse(): Promise<{ text: string, timestamp: number } | null> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('config', 'readonly').objectStore('config').get('latest_pulse');
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value || null); request.onerror = () => resolve(null); });
  }

  async updateLastPulseReceived(email: string, timestamp: number) {
      const profile = await this.getProfile(email);
      if (profile) await this.saveProfile({ ...profile, lastPulseReceived: timestamp }, true); 
  }

  async getSyncStats(): Promise<number> { return db ? 100 : 0; }
  async migrateGuestMessages(messages: DBMessage[]) { return; }

  async getFSItemsByParent(userId: string, parentId: number | null): Promise<DBFSItem[]> {
      const db = await this.init();
      const request = db.transaction('fs', 'readonly').objectStore('fs').index('userId').getAll(userId);
      return new Promise((resolve) => { request.onsuccess = () => { const all = request.result as DBFSItem[]; resolve(all.filter(i => i.parentId === parentId)); }; request.onerror = () => resolve([]); });
  }
  async getFSItemsByUserId(userId: string): Promise<DBFSItem[]> {
      const db = await this.init();
      const request = db.transaction('fs', 'readonly').objectStore('fs').index('userId').getAll(userId);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as DBFSItem[]); request.onerror = () => resolve([]); });
  }
  async createFSItem(item: DBFSItem): Promise<number> {
      const db = await this.init();
      const itemWithId = { ...item, id: item.id || Date.now() + Math.floor(Math.random() * 1000), synced: false };
      const request = db.transaction('fs', 'readwrite').objectStore('fs').add(itemWithId);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }
  async updateFSItem(id: number, updates: Partial<DBFSItem>) {
      const db = await this.init();
      const tx = db.transaction('fs', 'readwrite');
      const store = tx.objectStore('fs');
      return new Promise<void>((resolve) => {
          const req = store.get(id);
          req.onsuccess = () => {
              const data = req.result;
              if (data) {
                  const updatedData = { ...data, ...updates, synced: false };
                  store.put(updatedData);
              }
              resolve();
          };
          req.onerror = () => resolve();
      });
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

  async recordPayout(email: string, amount: number) {
      const profile = await this.getProfile(email);
      if (profile && profile.affiliate) {
          const payout = { date: Date.now(), amount: amount, status: 'pending' as const };
          profile.affiliate.payoutHistory.push(payout);
          profile.affiliate.totalEarnings = Math.max(0, profile.affiliate.totalEarnings - amount);
          await this.saveProfile(profile);
      }
  }

  async getSystemKeys(): Promise<SystemKeys | null> {
      try {
          if (!db) return null;
          const snap = await getDoc(doc(db, 'system', 'keys'));
          return snap.exists() ? snap.data() as SystemKeys : null;
      } catch (e) { console.error("Error fetching system keys", e); return null; }
  }

  async saveSystemKeys(keys: SystemKeys) {
      try {
          if (!db) return;
          await setDoc(doc(db, 'system', 'keys'), keys, { merge: true });
      } catch (e) { console.error("Error saving system keys", e); }
  }

  async saveContact(contact: DBContact) {
      const db = await this.init();
      const contactWithId = { ...contact, id: contact.id || Date.now() + Math.floor(Math.random() * 1000), synced: true };
      if (contact.userId !== 'GUEST') this.pushToCloud('contacts', contactWithId, 'contacts', contact.userId);
      return db.transaction('contacts', 'readwrite').objectStore('contacts').add(contactWithId);
  }
  async getContacts(userId?: string): Promise<DBContact[]> {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readonly');
      const request = userId ? tx.objectStore('contacts').index('userId').getAll(userId) : tx.objectStore('contacts').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async saveFeedback(feedback: DBFeedback) {
      const localDB = await this.init();
      const feedbackWithId = { ...feedback, id: feedback.id || Date.now() + Math.floor(Math.random() * 1000) };
      const request = localDB.transaction('feedback', 'readwrite').objectStore('feedback').add(feedbackWithId);
      this.pushToCloud('feedback', feedbackWithId);
      return request;
  }
  async getAllFeedback(): Promise<DBFeedback[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('feedback', 'readonly').objectStore('feedback').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async getGlobalRules(): Promise<string> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('config', 'readonly').objectStore('config').get('global_rules');
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value || "- أنت ظل رقمي مصري أصيل.\n- ولاؤك الأول والأخير لصاحب الحساب (الماستر).\n- حافظ على أسرار المستخدم كأنها أسرار نووية.\n- تحدث بلهجة مصرية قوية، ذكية، ومختصرة.\n- هدفك هو نجاح الماستر وراحته."); request.onerror = () => resolve(""); });
  }

  async updateGlobalRules(rules: string, skipCloud = false) {
      if (!skipCloud && db) setDoc(doc(db, "system", "rules"), { text: rules, updated: Date.now() }).catch(console.error);
      const dbLocal = await this.init();
      return dbLocal.transaction('config', 'readwrite').objectStore('config').put({ key: 'global_rules', value: rules, lastUpdated: Date.now() });
  }

  // --- NEW AGENT METHODS ---
  async getAgentProfile(agentId: string): Promise<AgentProfile | null> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('agents', 'readonly').objectStore('agents').get(agentId);
      
      const localAgent = await new Promise<AgentProfile | null>(resolve => {
           request.onsuccess = () => resolve(request.result || null);
           request.onerror = () => resolve(null);
      });

      // Try Cloud fetch to ensure freshness
      if (db) {
          try {
              const snap = await getDoc(doc(db, "system_agents", agentId));
              if (snap.exists()) {
                  const cloudAgent = snap.data() as AgentProfile;
                  if (!localAgent || cloudAgent.lastUpdated > localAgent.lastUpdated) {
                       await this.saveAgentProfile(cloudAgent, true); // Update local cache
                       return cloudAgent;
                  }
              }
          } catch(e) {}
      }
      return localAgent;
  }

  async saveAgentProfile(agent: AgentProfile, skipCloud = false) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('agents', 'readwrite');
      tx.objectStore('agents').put(agent);
      if (!skipCloud) await this.pushToCloud('system_agents', agent);
      return tx.oncomplete;
  }

  async getAllAgents(): Promise<AgentProfile[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('agents', 'readonly').objectStore('agents').getAll();
      return new Promise(resolve => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });
  }

  // --- COUPON METHODS ---
  async saveCoupon(coupon: DBCoupon) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('coupons', 'readwrite');
      tx.objectStore('coupons').put(coupon);
      await this.pushToCloud('coupons', coupon);
  }

  async getCoupon(code: string): Promise<DBCoupon | null> {
      if (!code) return null;
      const cleanCode = code.toUpperCase().trim();
      if (db) {
          try {
              const snap = await getDoc(doc(db, "system_coupons", cleanCode));
              if (snap.exists()) return snap.data() as DBCoupon;
          } catch(e) {}
      }
      const dbLocal = await this.init();
      return new Promise(resolve => {
          const req = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').get(cleanCode);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
      });
  }

  async getAllCoupons(): Promise<DBCoupon[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').getAll();
      
      const localCoupons = await new Promise<DBCoupon[]>((resolve) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
      });

      if (db) {
          try {
              const snap = await getDocs(collection(db, "system_coupons"));
              const cloudCoupons: DBCoupon[] = [];
              snap.forEach((doc) => cloudCoupons.push(doc.data() as DBCoupon));
              if (cloudCoupons.length > localCoupons.length) return cloudCoupons;
          } catch(e) {}
      }
      return localCoupons;
  }

  async deleteCoupon(code: string) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('coupons', 'readwrite');
      tx.objectStore('coupons').delete(code);
      if (db) await deleteDoc(doc(db, "system_coupons", code));
  }

  async getConfig(key: string): Promise<any> {
      const db = await this.init();
      const request = db.transaction('config', 'readonly').objectStore('config').get(key);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result?.value); request.onerror = () => resolve(null); });
  }
  async setConfig(key: string, value: any) {
      const db = await this.init();
      return db.transaction('config', 'readwrite').objectStore('config').put({ key, value, lastUpdated: Date.now() });
  }
}

export const shadowDB = new ShadowDB();