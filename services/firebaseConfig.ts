import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfigData from '../firebase-applet-config.json';

let app = null;
let db: any = null;
let auth: any = null;

// Robust Initialization
try {
    if (firebaseConfigData.apiKey && firebaseConfigData.apiKey.length > 5) {
        app = initializeApp(firebaseConfigData);
        
        // Initialize Firestore with settings to avoid "Offline" issues
        db = getFirestore(app, firebaseConfigData.firestoreDatabaseId);

        auth = getAuth(app);
        console.log("[Shadow Core] Firebase Connected Successfully.");
    } else {
        console.warn("[Shadow Core] Running in Local Mode (No Firebase Config Found). Data will be stored locally.");
    }
} catch (e) {
    console.error("[Shadow Core] Firebase Init Error (Falling back to local):", e);
}

export { db, auth };