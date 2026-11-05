import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { registerPlugin } from '@capacitor/core';

export interface ShadowNativePlugin {
  openApp(options: { packageName?: string, action?: string, data?: string }): Promise<{success: boolean, message?: string}>;
  clickNode(options: { text: string }): Promise<{success: boolean, message?: string}>;
  inputText(options: { text: string }): Promise<{success: boolean, message?: string}>;
  scroll(options: { direction: 'UP' | 'DOWN' }): Promise<{success: boolean, message?: string}>;
  globalAction(options: { action: 'BACK' | 'HOME' | 'RECENTS' }): Promise<{success: boolean, message?: string}>;
}

const ShadowNative = registerPlugin<ShadowNativePlugin>('ShadowNative');

let cachedDeviceInfoStr: string | null = null;
let cachedDeviceTimestamp = 0;
let cachedLocationStr = "غير متاح";
let isRefreshingLocation = false;

const refreshLocationInBackground = () => {
    if (isRefreshingLocation) return;
    isRefreshingLocation = true;
    Geolocation.checkPermissions()
        .then(async (perm) => {
            if (perm.location === 'granted') {
                const pos = await Geolocation.getCurrentPosition({ timeout: 2500, maximumAge: 300000 });
                cachedLocationStr = `خط العرض: ${pos.coords.latitude}, خط الطول: ${pos.coords.longitude}`;
            }
        })
        .catch(() => {})
        .finally(() => {
            isRefreshingLocation = false;
        });
};

export const getDeviceContext = async () => {
    const now = Date.now();
    // Trigger non-blocking GPS refresh in background so we never stall user messages
    refreshLocationInBackground();

    if (cachedDeviceInfoStr && now - cachedDeviceTimestamp < 30000) {
        return `${cachedDeviceInfoStr}\n- الموقع الجغرافي: ${cachedLocationStr}`;
    }

    try {
        const fastTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 300));
        const infoBundle = await Promise.race([
            Promise.all([
                Network.getStatus(),
                Device.getBatteryInfo(),
                Device.getInfo()
            ]),
            fastTimeout
        ]);

        if (!infoBundle) {
            return cachedDeviceInfoStr
                ? `${cachedDeviceInfoStr}\n- الموقع الجغرافي: ${cachedLocationStr}`
                : `[حالة الهاتف الحالية]:\n- الاتصال: ${typeof navigator !== 'undefined' && navigator.onLine ? 'متصل' : 'غير متصل'}\n- الموقع الجغرافي: ${cachedLocationStr}`;
        }

        const [networkStatus, batteryInfo, deviceInfo] = infoBundle;
        cachedDeviceInfoStr = `[حالة الهاتف الحالية]:
- بيئة التشغيل: ${deviceInfo.platform}
- نظام التشغيل: ${deviceInfo.operatingSystem} ${deviceInfo.osVersion}
- الموديل: ${deviceInfo.model}
- البطارية: ${Math.round((batteryInfo.batteryLevel || 0) * 100)}% ${batteryInfo.isCharging ? '(جاري الشحن)' : '(لا يشحن)'}
- الاتصال: ${networkStatus.connected ? 'متصل' : 'غير متصل'} (${networkStatus.connectionType})`;
        cachedDeviceTimestamp = now;

        return `${cachedDeviceInfoStr}\n- الموقع الجغرافي: ${cachedLocationStr}`;
    } catch (e) {
        console.error("Error getting device context:", e);
        return "[حالة الهاتف]: غير قادر على الوصول لحساسات الهاتف حالياً.";
    }
};

export const performNativeAction = async (method: keyof ShadowNativePlugin, options: any = {}): Promise<{success: boolean, message: string}> => {
    console.log(`[Bridge] Executing Native Action: ${method}`, options);
    try {
        // @ts-ignore
        const result = await ShadowNative[method](options);
        return { success: true, message: `[Bridge Success]: ${result?.message || 'تم إرسال الأمر للنظام بنجاح'}` };
    } catch (e: any) {
        console.warn(`[Bridge Error] Native plugin not fully compiled yet or unavailable: ${e.message}`);
        // We gracefully fallback so the AI knows we registered the intent, but the APK shell isn't running it yet.
        return { success: false, message: `[Bridge Pending]: أمر "${method}" تم تسجيله في الـ PWA. يحتاج هذا الأمر إلى نسخة الأندرويد المجمعة (APK) بصلاحية Accessibility للعمل فعلياً.` };
    }
}

export const triggerDeviceAction = async (action: string) => {
    try {
        switch (action) {
            case 'vibrate_heavy':
                await Haptics.impact({ style: ImpactStyle.Heavy });
                return "تم تفعيل الاهتزاز القوي.";
            case 'vibrate_success':
                await Haptics.notification({ type: 'SUCCESS' as any });
                return "تم تفعيل اهتزاز النجاح.";
            default:
                return "إجراء غير معروف.";
        }
    } catch (e) {
        return "فشل تنفيذ الإجراء على الهاتف.";
    }
};
