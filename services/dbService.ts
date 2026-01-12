import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc, orderBy, deleteDoc } from "firebase/firestore";
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
  uiCard?: any; 
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
  private version = 13;
  private unsubscribeListeners: Function[] = [];
  private adminUnsubscribe: Function | null = null;

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
        const stores = ['history', 'tasks', 'memory', 'profiles', 'fs', 'contacts', 'feedback', 'config', 'agents', 'coupons'];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: s === 'profiles' ? 'email' : (s === 'config' ? 'key' : (s === 'agents' || s === 'coupons' ? 'code' : 'id')), autoIncrement: s === 'feedback' || s === 'history' || s === 'tasks' || s === 'memory' });
            if (s !== 'profiles' && s !== 'config' && s !== 'agents' && s !== 'coupons' && !store.indexNames.contains('userId')) store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  // --- AUTHENTICATION (Firebase) ---
  async registerUser(email: string, password: string, name: string, isAffiliate: boolean, referralCode?: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      const newUser: UserProfile = {
          email: email.toLowerCase(),
          phone: email.toLowerCase(),
          uid,
          name, 
          shadowName: isAffiliate ? 'Marketer' : 'الظل',
          voicePreference: 'male',
          tier: isAffiliate ? 'lite' : 'sovereign',
          status: isAffiliate ? 'active' : 'pending',
          joinedAt: Date.now(),
          referredBy: referralCode,
          affiliate: isAffiliate ? { isMarketer: true, referralCode: (name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(), totalEarnings: 0, referralsCount: 0, payoutHistory: [] } : undefined,
          subscriptionCycle: isAffiliate ? undefined : 'monthly',
      };
      await this.saveProfile(newUser);
      return newUser;
  }

  async loginUser(email: string, password: string): Promise<UserProfile> {
      if (!auth) throw new Error("Firebase Auth not initialized");
      
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // 2. Try to get Profile
      const cleanEmail = email.toLowerCase();
      let profile = await this.getProfile(cleanEmail);

      // 3. AUTO-HEAL: If Auth passed but Profile missing, create it immediately.
      // This fixes the "Profile not found" error for manually created or migrated users.
      if (!profile) {
          console.warn("[Shadow Core] Profile missing for authenticated user. Auto-healing...");
          const namePart = email.split('@')[0];
          // Check if it looks like an admin email
          const isAdmin = cleanEmail.includes('tito') || cleanEmail.includes('admin');
          
          profile = {
              email: cleanEmail,
              phone: cleanEmail, // Backward compat
              uid: uid,
              name: isAdmin ? 'تيتو (الماستر)' : namePart,
              shadowName: isAdmin ? 'الماستر' : 'الظل',
              tier: isAdmin ? 'sovereign' : 'lite',
              status: 'active',
              joinedAt: Date.now(),
              affiliate: isAdmin ? {
                  isMarketer: true,
                  referralCode: 'TITO_BOSS',
                  totalEarnings: 0,
                  referralsCount: 0,
                  payoutHistory: []
              } : undefined
          };
          await this.saveProfile(profile);
      }

      if (!profile) throw new Error("Profile creation failed");
      return profile;
  }

  async resetPassword(email: string) {
      if (!auth) throw new Error("Firebase Auth not initialized");
      await sendPasswordResetEmail(auth, email);
  }

  async logout() {
      if (auth) await signOut(auth);
  }

  // --- FIREBASE SYNC ---
  subscribeToRealtime(email: string, onUpdate: (table: string, payload: any) => void) {
      if (!db || email === 'GUEST') return;
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
          });
          this.unsubscribeListeners.push(profileUnsub);
          const historyQuery = query(collection(db, `users/${email}/history`), where('timestamp', '>', Date.now() - 10000));
          const historyUnsub = onSnapshot(historyQuery, (snapshot) => {
              snapshot.docChanges().forEach((change) => {
                  if (change.type === "added") {
                      onUpdate('history', change.doc.data());
                  }
              });
          });
          this.unsubscribeListeners.push(historyUnsub);
      } catch (e) { console.warn("[Firebase] Realtime sync failed.", e); }
  }

  subscribeToAdminFeed(onProfilesUpdate: (profiles: UserProfile[]) => void, onFeedbackUpdate: (feedbacks: DBFeedback[]) => void) {
      if (!db) return;
      if (this.adminUnsubscribe) this.adminUnsubscribe();
      try {
          const q = query(collection(db, "users"));
          const unsubProfiles = onSnapshot(q, (snapshot) => {
              const profiles: UserProfile[] = [];
              snapshot.forEach((doc) => profiles.push({ ...doc.data(), email: doc.id } as UserProfile));
              onProfilesUpdate(profiles);
          });
          const qFeed = query(collection(db, "feedback"), orderBy("timestamp", "desc"));
          const unsubFeedback = onSnapshot(qFeed, (snapshot) => {
             const items: DBFeedback[] = [];
             snapshot.forEach(doc => items.push(doc.data() as DBFeedback));
             onFeedbackUpdate(items);
          });
          this.adminUnsubscribe = () => { unsubProfiles(); unsubFeedback(); };
      } catch (e) { console.error("[Admin] Sync Error:", e); }
  }

  async pushToCloud(collectionName: string, rawData: any, subCollection?: string, userId?: string) {
      if (!db) return; 
      const data = sanitizeForFirestore(rawData);
      try {
          if (collectionName === 'profiles') {
              await setDoc(doc(db, "users", data.email), data, { merge: true });
          } else if (collectionName === 'coupons') {
              await setDoc(doc(db, "system_coupons", data.code), data, { merge: true });
          } else if (userId && subCollection) {
              const docId = data.id ? data.id.toString() : data.timestamp ? data.timestamp.toString() : undefined;
              if (docId) await setDoc(doc(db, `users/${userId}/${subCollection}`, docId), data, { merge: true });
              else await addDoc(collection(db, `users/${userId}/${subCollection}`), data);
          } else if (collectionName === 'system_agents') {
             await setDoc(doc(db, "system_agents", data.id), data, { merge: true });
          } else if (collectionName === 'feedback') {
             await addDoc(collection(db, "feedback"), data);
          }
      } catch (e: any) { console.warn(`[Cloud Sync Warning] ${collectionName}:`, e.message); }
  }

  // --- CRUD OPERATIONS ---
  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const db = await this.init();
    const tx = db.transaction('history', 'readwrite');
    const secureMsg = { ...msg, text: encryptData(msg.text, msg.userId), synced: true };
    const request = tx.objectStore('history').add(secureMsg);
    if (!skipCloud && msg.userId !== 'GUEST') this.pushToCloud('history', { ...msg, text: secureMsg.text }, 'history', msg.userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
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

  async saveTask(task: DBTask, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('tasks', 'readwrite');
    if (!skipCloud && task.userId !== 'GUEST') this.pushToCloud('tasks', task, 'tasks', task.userId);
    return tx.objectStore('tasks').put({ ...task, synced: true }); 
  }

  async updateTaskStatus(id: number, updates: Partial<DBTask>) {
      const db = await this.init();
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const task: DBTask = await new Promise((resolve) => { store.get(id).onsuccess = (e: any) => resolve(e.target.result); });
      if (task) {
          const updated = { ...task, ...updates };
          store.put(updated);
          if (task.userId !== 'GUEST') this.pushToCloud('tasks', updated, 'tasks', task.userId);
      }
  }

  async saveFact(fact: DBFact, skipCloud = false) {
    const db = await this.init();
    const tx = db.transaction('memory', 'readwrite');
    if (!skipCloud && fact.userId !== 'GUEST') this.pushToCloud('memory', fact, 'memory', fact.userId);
    return tx.objectStore('memory').add({ ...fact, synced: true });
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const db = await this.init();
    const tx = db.transaction('memory', 'readonly');
    const request = tx.objectStore('memory').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
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

      // If local profile missing but we have network, try fetch from cloud NOW (await it)
      if (!localProfile && db && cleanEmail !== 'guest') {
         try {
             const docSnap = await getDoc(doc(db, "users", cleanEmail));
             if (docSnap.exists()) {
                 const cloudData = docSnap.data() as UserProfile;
                 localProfile = { ...cloudData, email: cleanEmail };
                 await this.saveProfile(localProfile, true); // Cache locally
             }
         } catch(e) { console.warn("Could not fetch profile from cloud:", e); }
      } else if (localProfile && db && cleanEmail !== 'guest') {
         // Background sync if we already have local data
         getDoc(doc(db, "users", cleanEmail)).then((docSnap) => {
            if (docSnap.exists()) {
                const cloudData = docSnap.data() as UserProfile;
                if (JSON.stringify(cloudData) !== JSON.stringify(localProfile)) {
                     this.saveProfile({ ...localProfile, ...cloudData, synced: true }, true);
                }
            }
         }).catch(() => {});
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
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); request.onerror = () => resolve([]); });
  }

  async getHistory(userId: string): Promise<DBMessage[]> {
    const db = await this.init();
    const tx = db.transaction('history', 'readonly');
    const request = tx.objectStore('history').index('userId').getAll(userId);
    return new Promise((resolve) => { 
        request.onsuccess = () => {
            const raw = request.result || [];
            // Parse uiCard if it exists in the message (no encryption for uiCard structure)
            resolve(raw.map((m: DBMessage) => ({ ...m, text: decryptData(m.text, userId) })));
        }; 
    });
  }

  async setGlobalPulse(text: string) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('config', 'readwrite');
      const pulseData = { text, timestamp: Date.now() };
      if (db) setDoc(doc(db, "system", "pulse"), pulseData).catch(console.error);
      return tx.objectStore('config').put({ key: 'latest_pulse', value: pulseData, lastUpdated: Date.now() });
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

  // FS & Other modules remain largely the same structure
  async getFSItemsByParent(userId: string, parentId: number | null): Promise<DBFSItem[]> {
      const db = await this.init();
      const request = db.transaction('fs', 'readonly').objectStore('fs').index('userId').getAll(userId);
      return new Promise((resolve) => { request.onsuccess = () => { const all = request.result as DBFSItem[]; resolve(all.filter(i => i.parentId === parentId)); }; request.onerror = () => resolve([]); });
  }
  async createFSItem(item: DBFSItem): Promise<number> {
      const db = await this.init();
      const request = db.transaction('fs', 'readwrite').objectStore('fs').add({ ...item, synced: false });
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
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
          profile.affiliate.payoutHistory.push({ date: Date.now(), amount: amount, status: 'paid' });
          profile.affiliate.totalEarnings = Math.max(0, profile.affiliate.totalEarnings - amount);
          await this.saveProfile(profile);
      }
  }

  async saveContact(contact: DBContact) {
      const db = await this.init();
      if (contact.userId !== 'GUEST') this.pushToCloud('contacts', contact, 'contacts', contact.userId);
      return db.transaction('contacts', 'readwrite').objectStore('contacts').add({ ...contact, synced: true });
  }
  async getContacts(userId?: string): Promise<DBContact[]> {
      const db = await this.init();
      const tx = db.transaction('contacts', 'readonly');
      const request = userId ? tx.objectStore('contacts').index('userId').getAll(userId) : tx.objectStore('contacts').getAll();
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async saveFeedback(feedback: DBFeedback) {
      const localDB = await this.init();
      const request = localDB.transaction('feedback', 'readwrite').objectStore('feedback').add(feedback);
      this.pushToCloud('feedback', feedback);
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

  async updateGlobalRules(rules: string) {
      if (db) setDoc(doc(db, "system", "rules"), { text: rules, updated: Date.now() }).catch(console.error);
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
      
      // Try Cloud First for latest validity
      if (db) {
          try {
              const snap = await getDoc(doc(db, "system_coupons", cleanCode));
              if (snap.exists()) return snap.data() as DBCoupon;
          } catch(e) {}
      }

      // Fallback Local
      const dbLocal = await this.init();
      return new Promise(resolve => {
          const req = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').get(cleanCode);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
      });
  }

  async getAllCoupons(): Promise<DBCoupon[]> {
      const dbLocal = await this.init();
      return new Promise(resolve => {
          const req = dbLocal.transaction('coupons', 'readonly').objectStore('coupons').getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
      });
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