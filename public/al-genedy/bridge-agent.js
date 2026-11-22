/**
 * Battah System - ZKTeco / Biometric Local Bridge Agent
 * 
 * Instructions:
 * 1. Install Node.js on a computer in the same network as the Biometric Device.
 * 2. Run: npm init -y
 * 3. Run: npm install node-zklib axios dotenv
 * 4. Create a .env file with your specific settings:
 *    DEVICE_IP=192.168.1.201
 *    DEVICE_PORT=4370
 *    SYSTEM_WEBHOOK_URL=https://your-domain.com/api/biometric-webhook
 * 5. Run this script: node bridge-agent.js
 */

const ZKLib = require('node-zklib');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const DEVICE_IP = process.env.DEVICE_IP || '192.168.1.201';
const DEVICE_PORT = parseInt(process.env.DEVICE_PORT || '4370', 10);
const SYSTEM_WEBHOOK_URL = process.env.SYSTEM_WEBHOOK_URL;

if (!SYSTEM_WEBHOOK_URL) {
    console.error("ERROR: SYSTEM_WEBHOOK_URL is not set in .env file.");
    process.exit(1);
}

let zkInstance = null;
let keepAliveInterval = null;

const initializeDevice = async () => {
    zkInstance = new ZKLib(DEVICE_IP, DEVICE_PORT, 10000, 4000);
    try {
        console.log(`\n[${new Date().toLocaleString()}] Attempting to connect to ZKTeco device at ${DEVICE_IP}:${DEVICE_PORT}...`);
        await zkInstance.createSocket();
        console.log(`[+] Connected successfully to ZKTeco device.`);

        // Listen for realtime attendance logs
        zkInstance.getRealTimeLogs((data) => {
            console.log(`[EVENT] Realtime Log captured: User ${data.userId} at ${data.attTime}`);
            
            const payload = {
                source: "bridge-agent",
                biometricId: data.userId,
                timestamp: data.attTime,
                verifyType: data.verifyType || 1
            };

            axios.post(SYSTEM_WEBHOOK_URL, payload)
                .then(response => {
                    console.log(`  [SUCCESS] Synced to cloud: User ${data.userId} `);
                })
                .catch(error => {
                    console.error(`  [FAILED] Sync to cloud error:`, error.message);
                });
        });

        console.log("[WAITING] Started listening for realtime events... Agent is completely active.");

        // Monitor connection periodically (Ping)
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        
        keepAliveInterval = setInterval(async () => {
             try {
                 await zkInstance.getTime(); // Ping to keep socket alive
             } catch (err) {
                 console.log(`\n[!] Connection lost or device offline. Reconnecting...`);
                 clearInterval(keepAliveInterval);
                 
                 try { zkInstance.disconnect(); } catch(e) {}
                 
                 setTimeout(initializeDevice, 5000);
             }
        }, 15000); // Ping every 15 seconds

    } catch (e) {
        console.error("[-] Error connecting to device:", e.message || e);
        console.log("    Will retry connection in 10 seconds...");
        
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        setTimeout(initializeDevice, 10000);
    }
};

initializeDevice();

// Prevent script from crashing on unhandled errors
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
