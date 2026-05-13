import { shadowDB } from './dbService';
import { App } from '@capacitor/app';
import { showSafeNotification } from './notificationService';

export const setupBackgroundProcessing = () => {
    console.log("[Background Service] Initializing Capacitor Background Tasks...");

    let backgroundInterval: any = null;

    if (typeof window !== 'undefined') {
        App.addListener('appStateChange', async ({ isActive }) => {
            if (!isActive) {
                console.log("[Shadow OS] App went to background. Engaging background autonomous loop.");
                
                // Capacitor native background emulation
                backgroundInterval = setInterval(async () => {
                    console.log("[Background Task] Running sync and checks...");
                    try {
                        const pendingTasks = await getPendingTasks();
                        if (pendingTasks.length > 0) {
                            showSafeNotification(
                                "تحصين الأفكار - الظل",
                                { body: `جاري العمل على ${pendingTasks.length} مهام في الخلفية.` }
                            );
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }, 1000 * 60 * 15);

            } else {
                console.log("[Shadow OS] App came to foreground. Syncing shadow state.");
                if (backgroundInterval) clearInterval(backgroundInterval);
            }
        });

        // Web Fallback
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("[Shadow OS Web] Hidden. Simulating background.");
            } else {
                console.log("[Shadow OS Web] Visible.");
            }
        });
    }
};

async function getPendingTasks() {
    const email = localStorage.getItem('shadow_last_user') || 'GUEST';
    if (email === 'GUEST') return [];
    
    const tasks = await shadowDB.getTasks(email);
    return tasks.filter(t => t.status === 'pending');
}
