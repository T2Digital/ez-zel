
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const getEnvVar = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
        // Fallback for window injection
        // @ts-ignore
        if (typeof window !== 'undefined' && window[key]) {
            // @ts-ignore
            return window[key];
        }
    } catch (e) {
        return '';
    }
    return '';
};

const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID")
};

let app = null;
let db: any = null;
let auth: any = null;

// Robust Initialization: Only init if keys exist, otherwise run in "Shadow Offline Mode"
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("[Shadow Core] Firebase Connected Successfully.");
    } else {
        console.warn("[Shadow Core] Running in Local Mode (No Firebase Config Found). Data will be stored locally.");
    }
} catch (e) {
    console.error("[Shadow Core] Firebase Init Error (Falling back to local):", e);
}

export { db, auth };
