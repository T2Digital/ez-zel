import { Capacitor, registerPlugin } from '@capacitor/core';

// This is an interface for a hypothetical native plugin we would build in Java/Kotlin.
export interface AndroidNativePlugin {
    checkAccessibilityPermission(): Promise<{ granted: boolean }>;
    requestAccessibilityPermission(): Promise<void>;
    performClick(options: { x: number, y: number }): Promise<{ success: boolean }>;
    readWhatsAppNotifications(): Promise<{ messages: any[] }>;
    replyToWhatsApp(options: { contact: string, message: string }): Promise<{ success: boolean }>;
}

export const AndroidNative = registerPlugin<AndroidNativePlugin>('AndroidNative');

export class AndroidBridgeService {
    static async isNative() {
        return Capacitor.isNativePlatform();
    }

    static async getWhatsAppMessages() {
        if (Capacitor.isNativePlatform()) {
            try {
                const result = await AndroidNative.readWhatsAppNotifications();
                return result.messages || [];
            } catch (e) {
                console.error("Native Bridge Error:", e);
                return [];
            }
        } else {
            try {
                const resp = await fetch('/api/webhooks/kapso');
                if (resp.ok) {
                    const data = await resp.json();
                    return data.messages || [];
                }
            } catch (e) {}
            return [];
        }
    }

    static async autoClick(x: number, y: number) {
        if (Capacitor.isNativePlatform()) {
            return await AndroidNative.performClick({ x, y });
        } else {
            // Real ADB execution via server endpoint
            try {
                const res = await fetch('/api/agent/android-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'click', x, y })
                });
                return await res.json();
            } catch (e) {
                console.warn("[NATIVE BRIDGE] Backend ADB click failed:", e);
                return { success: false };
            }
        }
    }

    static async replyToWhatsApp(contact: string, message: string) {
        if (Capacitor.isNativePlatform()) {
            return await AndroidNative.replyToWhatsApp({ contact, message });
        } else {
            // Real backend dispatch to WhatsApp agent route
            try {
                const res = await fetch('/api/agent/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: contact, message })
                });
                return await res.json();
            } catch (e) {
                console.warn("[NATIVE BRIDGE] WhatsApp dispatch error:", e);
                return { success: false };
            }
        }
    }

    static async launchApp(packageName: string) {
        try {
            const res = await fetch('/api/agent/android-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'open_app', packageName })
            });
            return await res.json();
        } catch (e) {
            return { success: false };
        }
    }

    static async getDeviceTelemetry() {
        try {
            const res = await fetch('/api/agent/android-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'device_telemetry' })
            });
            return await res.json();
        } catch (e) {
            return { success: false, batteryLevel: 100, charging: false };
        }
    }
}

