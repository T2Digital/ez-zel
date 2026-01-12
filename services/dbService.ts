import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, addDoc, orderBy, deleteDoc, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged, User } from "firebase/auth";

export interface DBMessage {
  id?: number;
  userId: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  voiceData?: string; 
  groundingLinks?: { title?: string; uri?: string }[];
  image?: string; 
  uiCard?: any; 
  synced?: boolean; 
}

export interface UserProfile {
    email: string;
    phone?: string;
    password?: string;
    uid?: string;
    name: string;
    shadowName?: string;
    voicePreference?: 'male' | 'female';
    paymentProof?: string;
    tier: 'lite' | 'guardian' | 'sovereign';
    status: 'active' | 'pending' | 'blocked';
    joinedAt: number;
    referredBy?: string; 
    affiliate?: any; 
    subscriptionCycle?: 'monthly' | 'yearly';
    commissionPaid?: boolean;
    iotActions?: { [key: string]: string; };
    vaultState?: any;
    lastPulseReceived?: number; 
    synced?: boolean;
}

export interface DBFact {
  id?: number;
  userId: string; 
  fact: string;
  timestamp: number;
  synced?: boolean;
}

export interface DBTask {
    id?: number;
    userId: string;
    task: string;
    status: 'pending' | 'completed';
    time: string;
    executionTime?: number;
    notified?: boolean;
}

export interface DBFSItem {
    id?: number;
    userId: string;
    name: string;
    type: 'folder' | 'file' | 'table' | 'calendar' | 'project';
    parentId: number | null;
}

export interface DBFeedback {
    userId: string;
    userName: string;
    message: string;
    timestamp: number;
    isRead: boolean;
}

export interface DBContact {
    userId: string;
    name: string;
    phones: string[];
    emails: string[];
    lastInteraction: number;
    encryptedData: string;
}

export interface AgentProfile {
    id: string; 
    name: string;
    role: string;
    isActive: boolean;
    systemInstruction: string; 
    knowledgeBase: string[]; 
    documents?: { name: string; mimeType: string; data: string; }[];
    lastUpdated: number;
}

const GLOBAL_SALT = "SHADOW_CORE_V1";
const encryptData = (text: string, userId: string): string => btoa(unescape(encodeURIComponent(text + GLOBAL_SALT + userId)));
const decryptData = (cipher: string, userId: string): string => {
    try { return decodeURIComponent(escape(atob(cipher))).replace(GLOBAL_SALT + userId, ''); } catch (e) { return cipher; }
};

class ShadowDB {
  private dbName = 'ShadowCore_V21'; 
  private version = 15;

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        const stores = ['history', 'tasks', 'memory', 'profiles', 'fs', 'contacts', 'feedback', 'config', 'agents', 'coupons'];
        stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: s === 'profiles' ? 'email' : (s === 'config' ? 'key' : (s === 'agents' || s === 'coupons' ? 'code' : 'id')), autoIncrement: true });
            if (s !== 'profiles' && s !== 'config' && s !== 'agents' && s !== 'coupons' && !store.indexNames.contains('userId')) store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e);
    });
  }

  async saveMessage(msg: DBMessage, skipCloud = false): Promise<number> {
    const dbLocal = await this.init();
    const tx = dbLocal.transaction('history', 'readwrite');
    const secureMsg = { ...msg, text: encryptData(msg.text, msg.userId), synced: !skipCloud };
    const request = tx.objectStore('history').add(secureMsg);
    if (!skipCloud && msg.userId !== 'GUEST' && db) {
        this.pushToCloud('history', { ...msg, text: secureMsg.text }, 'history', msg.userId);
    }
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result as number); });
  }

  async getHistory(userId: string): Promise<DBMessage[]> {
    const dbLocal = await this.init();
    const tx = dbLocal.transaction('history', 'readonly');
    const index = tx.objectStore('history').index('userId');
    const request = index.getAll(userId);
    return new Promise((resolve) => { 
        request.onsuccess = () => {
            const raw = request.result || [];
            resolve(raw.map((m: any) => ({ ...m, text: decryptData(m.text, userId) })));
        }; 
    });
  }

  async migrateGuestData(newUserId: string) {
      const guestHistory = await this.getHistory('GUEST');
      const guestMemory = await this.getMemory('GUEST');
      
      for (const msg of guestHistory) {
          await this.saveMessage({ ...msg, userId: newUserId });
      }
      for (const fact of guestMemory) {
          await this.saveFact({ ...fact, userId: newUserId });
      }
  }

  async saveProfile(profile: UserProfile, skipCloud = false) {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile);
      if (!skipCloud && profile.email !== 'GUEST' && db) {
          await setDoc(doc(db, "users", profile.email.toLowerCase()), profile, { merge: true });
      }
      return tx.oncomplete;
  }

  async getProfile(email: string): Promise<UserProfile | undefined> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('profiles', 'readonly').objectStore('profiles').get(email.toLowerCase());
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result); });
  }

  async registerUser(email: string, password: string, name: string, isAffiliate: boolean, referralCode?: string): Promise<UserProfile> {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: UserProfile = {
          email: email.toLowerCase(),
          uid: userCredential.user.uid,
          name, 
          shadowName: 'الظل',
          tier: isAffiliate ? 'lite' : 'sovereign',
          status: isAffiliate ? 'active' : 'pending',
          joinedAt: Date.now(),
          referredBy: referralCode,
          affiliate: isAffiliate ? { isMarketer: true, referralCode: (name.substring(0,3) + Math.floor(1000 + Math.random() * 9000)).toUpperCase(), totalEarnings: 0, referralsCount: 0 } : undefined
      };
      await this.migrateGuestData(email.toLowerCase());
      await this.saveProfile(newUser);
      return newUser;
  }

  async loginUser(email: string, password: string): Promise<UserProfile> {
      await signInWithEmailAndPassword(auth, email, password);
      let profile = await this.getProfile(email);
      if (!profile && db) {
          const snap = await getDoc(doc(db, "users", email.toLowerCase()));
          if (snap.exists()) {
              profile = snap.data() as UserProfile;
              await this.saveProfile(profile, true);
          }
      }
      if (!profile) throw new Error("Profile not found");
      return profile;
  }

  async resetPassword(email: string) {
      if (auth) await sendPasswordResetEmail(auth, email);
  }

  subscribeToRealtime(email: string, onUpdate: (table: string, payload: any) => void) {
      if (!db || email === 'GUEST') return;
      return onSnapshot(doc(db, "users", email.toLowerCase()), (doc) => {
          if (doc.exists()) onUpdate('profiles', doc.data());
      });
  }

  subscribeToAdminFeed(onProfiles: (p: UserProfile[]) => void, onFeedback: (f: DBFeedback[]) => void) {
      if (!db) return;
      onSnapshot(collection(db, "users"), (snap) => {
          onProfiles(snap.docs.map(d => d.data() as UserProfile));
      });
      onSnapshot(collection(db, "feedback"), (snap) => {
          onFeedback(snap.docs.map(d => d.data() as DBFeedback));
      });
  }

  async pushToCloud(coll: string, data: any, sub?: string, userId?: string) {
      if (!db) return;
      try {
          if (userId && sub) await addDoc(collection(db, `users/${userId}/${sub}`), data);
          else await setDoc(doc(db, coll, data.id?.toString() || Date.now().toString()), data, { merge: true });
      } catch (e) {}
  }

  async saveFact(fact: DBFact) {
    const dbLocal = await this.init();
    const tx = dbLocal.transaction('memory', 'readwrite');
    tx.objectStore('memory').add(fact);
    if (fact.userId !== 'GUEST') this.pushToCloud('memory', fact, 'memory', fact.userId);
  }

  async getMemory(userId: string): Promise<DBFact[]> {
    const dbLocal = await this.init();
    const request = dbLocal.transaction('memory', 'readonly').objectStore('memory').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async getTasks(userId: string): Promise<DBTask[]> {
    const dbLocal = await this.init();
    const request = dbLocal.transaction('tasks', 'readonly').objectStore('tasks').index('userId').getAll(userId);
    return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async updateTaskStatus(id: number, u: Partial<DBTask>) {
      const dbLocal = await this.init();
      const store = dbLocal.transaction('tasks', 'readwrite').objectStore('tasks');
      const task = await new Promise<DBTask>((res) => { store.get(id).onsuccess = (e: any) => res(e.target.result); });
      if (task) store.put({ ...task, ...u });
  }

  async getFSItemsByParent(userId: string, parentId: number | null): Promise<DBFSItem[]> {
      const dbLocal = await this.init();
      const tx = dbLocal.transaction('fs', 'readonly');
      const index = tx.objectStore('fs').index('userId');
      const request = index.getAll(userId);
      return new Promise((resolve) => { 
          request.onsuccess = () => {
              const all = request.result || [];
              resolve(all.filter((i: DBFSItem) => i.parentId === parentId));
          };
      });
  }

  async saveContact(contact: DBContact) {
      const dbLocal = await this.init();
      dbLocal.transaction('contacts', 'readwrite').objectStore('contacts').add(contact);
  }

  async getContacts(userId: string): Promise<DBContact[]> {
      const dbLocal = await this.init();
      const request = dbLocal.transaction('contacts', 'readonly').objectStore('contacts').index('userId').getAll(userId);
      return new Promise((resolve) => { request.onsuccess = () => resolve(request.result || []); });
  }

  async registerReferral(referrerCode: string, amount: number) {
      const profiles = await this.getAllProfiles();
      const referrer = profiles.find(p => p.affiliate?.referralCode === referrerCode);
      if (referrer) {
          referrer.affiliate.totalEarnings += amount;
          referrer.affiliate.referralsCount += 1;
          referrer.affiliate.payoutHistory = referrer.affiliate.payoutHistory || [];
          await this.saveProfile(referrer);
      }
  }

  async getAllProfiles(): Promise<UserProfile[]> {
      const dbLocal = await this.init();
      return new Promise((resolve) => { dbLocal.transaction('profiles', 'readonly').objectStore('profiles').getAll().onsuccess = (e: any) => resolve(e.target.result || []); });
  }

  async getAllFeedback(): Promise<DBFeedback[]> {
      const dbLocal = await this.init();
      return new Promise((resolve) => { dbLocal.transaction('feedback', 'readonly').objectStore('feedback').getAll().onsuccess = (e: any) => resolve(e.target.result || []); });
  }

  async getGlobalRules(): Promise<string> {
      const dbLocal = await this.init();
      return new Promise((resolve) => { dbLocal.transaction('config', 'readonly').objectStore('config').get('global_rules').onsuccess = (e: any) => resolve(e.target.result?.value || "تحدث بالمصرية العامية وبإيجاز."); });
  }

  async updateGlobalRules(rules: string) {
      const dbLocal = await this.init();
      dbLocal.transaction('config', 'readwrite').objectStore('config').put({ key: 'global_rules', value: rules });
  }

  async getAllAgents(): Promise<AgentProfile[]> {
      const dbLocal = await this.init();
      return new Promise((resolve) => { dbLocal.transaction('agents', 'readonly').objectStore('agents').getAll().onsuccess = (e: any) => resolve(e.target.result || []); });
  }

  async getAgentProfile(id: string): Promise<AgentProfile | null> {
      const dbLocal = await this.init();
      return new Promise((resolve) => { dbLocal.transaction('agents', 'readonly').objectStore('agents').get(id).onsuccess = (e: any) => resolve(e.target.result || null); });
  }

  async saveAgentProfile(agent: AgentProfile) {
      const dbLocal = await this.init();
      dbLocal.transaction('agents', 'readwrite').objectStore('agents').put(agent);
  }

  async getGlobalPulse() {
      const dbLocal = await this.init();
      return new Promise<any>((resolve) => { dbLocal.transaction('config', 'readonly').objectStore('config').get('latest_pulse').onsuccess = (e: any) => resolve(e.target.result?.value || null); });
  }

  async setGlobalPulse(text: string) {
      const dbLocal = await this.init();
      dbLocal.transaction('config', 'readwrite').objectStore('config').put({ key: 'latest_pulse', value: { text, timestamp: Date.now() } });
  }

  async updateLastPulseReceived(email: string, timestamp: number) {
      const profile = await this.getProfile(email);
      if (profile) {
          await this.saveProfile({ ...profile, lastPulseReceived: timestamp });
      }
  }

  async getConfig(key: string) {
      const dbLocal = await this.init();
      return new Promise<any>((resolve) => { dbLocal.transaction('config', 'readonly').objectStore('config').get(key).onsuccess = (e: any) => resolve(e.target.result?.value || null); });
  }

  async setConfig(key: string, value: any) {
      const dbLocal = await this.init();
      dbLocal.transaction('config', 'readwrite').objectStore('config').put({ key, value });
  }

  async logout() { if (auth) await signOut(auth); }
  async getSyncStats() { return 100; }
  async saveFeedback(f: any) { 
      const dbLocal = await this.init(); 
      dbLocal.transaction('feedback', 'readwrite').objectStore('feedback').add(f); 
      this.pushToCloud('feedback', f);
  }
  async getCoupon(c: string) { return null; }
}

export const shadowDB = new ShadowDB();