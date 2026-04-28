import CryptoJS from 'crypto-js';

// A constant salt/secret for symmetric encryption. 
// In a real production app, you might want this to be a true E2E key derived from a user password,
// but since users log in via Google/OAuth, we will use their UID + a global secret to isolate encrypted data.
const GLOBAL_SECRET = 'shadow_secure_vault_2026';

const getDerivedKey = (userId: string) => {
    return CryptoJS.SHA256(userId + GLOBAL_SECRET).toString();
};

export const encryptData = (data: string, userId: string): string => {
    if (!data) return data;
    try {
        const key = getDerivedKey(userId);
        return CryptoJS.AES.encrypt(data, key).toString();
    } catch (e) {
        console.error('Encryption failed', e);
        return data; // Fallback
    }
};

export const decryptData = (cipherText: string, userId: string): string => {
    if (!cipherText) return cipherText;
    
    // First try new AES Decryption
    try {
        const key = getDerivedKey(userId);
        const bytes = CryptoJS.AES.decrypt(cipherText, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (originalText) {
            return originalText; 
        }
    } catch (e) {}

    // Fallback: try the old base64 custom decoding
    const GLOBAL_SALT = "SHADOW_CORE_V1";
    try {
        const oldDecrypted = decodeURIComponent(escape(atob(cipherText))).replace(GLOBAL_SALT + userId, '');
        if (oldDecrypted && oldDecrypted !== cipherText && !oldDecrypted.includes("SHADOW_CORE_V1")) {
            return oldDecrypted;
        }
    } catch (e) {}

    return cipherText; // Likely plain text
};
