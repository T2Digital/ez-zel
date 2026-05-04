import { getShadowResponse } from "./geminiService";
import { DBMessage, shadowDB } from "./dbService";
import { LocalNotifications } from '@capacitor/local-notifications';

export interface AutonomousTask {
    id: string;
    userId: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    createdAt: number;
    updatedAt: number;
}

const activeTasks: Record<string, boolean> = {};

export const getActiveTasksCount = () => Object.keys(activeTasks).length;

export const submitAutonomousTask = async (userId: string, prompt: string): Promise<string> => {
    const taskId = `auto_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log(`[AGENT NODE] Dispatching background task ${taskId}...`);
    
    // Simulate initial delay to feel like a real background task
    activeTasks[taskId] = true;
    window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
    
    // Start async without awaiting
    (async () => {
        try {
            await new Promise(r => setTimeout(r, 6000)); // Simulating initial delay

            // Run getShadowResponse in background (hidden from primary chat)
            const response = await getShadowResponse([], prompt + " (أنت الآن تعمل كعميل مستقل في الخلفية Autonomous Agent. أنجز المهمة المطلوبة منك باستفاضة ولخص النتائج. لا تسأل المستخدم، فقط قم بالتنفيذ النهائي ولخصه.)", { activePersona: 'researcher' }, undefined);
            
            // Insert the message to DB as a received message!
            const msg: DBMessage = {
                userId,
                role: 'model',
                text: `**[مهمة مستقلة مكتملة]**\n\nالمهمة: ${prompt}\n\nالنتائج:\n${response.text}`,
                timestamp: Date.now(),
                isAutonomousResult: true
            };
            await shadowDB.saveMessage(msg);
            
            // Dispatch custom event to notify UI
            window.dispatchEvent(new CustomEvent('autonomous_message_received'));

            
            // Notify User
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "انتهت المهمة المستقلة",
                            body: "الظل أكمل مهمة البحث ويمكنك رؤية النتائج الآن.",
                            id: new Date().getTime(),
                            schedule: { at: new Date(Date.now() + 1000) },
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            } catch(e) {
                // Fallback to web audio
                const audio = new Audio('/src/assets/ringtone.mp3');
                audio.play().catch(() => {});
            }
            
            // Web browser notification API fallback
            if (Notification.permission === 'granted') {
                new Notification("الظل | Ez-Zel", { body: "تم إنجاز المهمة المستقلة بنجاح!" });
            }

        } catch (e) {
            console.error("Autonomous task failed:", e);
        } finally {
            delete activeTasks[taskId];
            window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
        }
    })();
    
    return taskId;
};

export const initWorker = () => {
    // Optional: Request Notification permission
    if (typeof Notification !== 'undefined') {
        Notification.requestPermission();
    }
};

