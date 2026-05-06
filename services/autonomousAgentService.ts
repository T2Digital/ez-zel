import { getShadowResponse } from "./geminiService";
import { DBMessage, shadowDB, DBTask } from "./dbService";
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppStore } from "./store";

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
    
    // Save task to DB
    const bgTask: DBTask = {
        userId,
        task: prompt,
        time: new Date().toISOString(),
        category: 'autonomous',
        status: 'pending',
        type: 'autonomous'
    };
    const dbTaskId = await shadowDB.saveTask(bgTask);
    
    activeTasks[taskId] = true;
    useAppStore.getState().setRunningTasks(getActiveTasksCount());
    window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
    
    // Start async without awaiting
    (async () => {
        try {
            await new Promise(r => setTimeout(r, 4000)); // Simulating initial delay

            // Update to running
            bgTask.status = 'completed'; // Setting up to complete later but we skip 'running' in DB to save writes
            
            // Run getShadowResponse in background (hidden from primary chat)
            const response = await getShadowResponse([], prompt + " (أنت الآن تعمل كعميل مستقل في الخلفية Autonomous Agent. أنجز المهمة المطلوبة منك باستفاضة ولخص النتائج. لا تسأل المستخدم، فقط قم بالتنفيذ النهائي ولخصه.)", { activePersona: 'researcher' }, undefined);
            
            // Insert the message to DB as a received message!
            const msg: DBMessage = {
                userId,
                role: 'model',
                text: `**[مهمة الذكاء الاصطناعي المستقلة]**\n\nالمهمة: ${prompt}\n\nالنتائج:\n${response.text}`,
                timestamp: Date.now(),
                isAutonomousResult: true
            };
            await shadowDB.saveMessage(msg);
            
            // Mark task as done
            bgTask.status = 'done';
            await shadowDB.saveTask({...bgTask, id: Number(dbTaskId)});
            
            // Dispatch custom event to notify UI
            window.dispatchEvent(new CustomEvent('autonomous_message_received'));
            
            // Notify User
            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "انتهت المهمة الالية",
                            body: "الظل أكمل المهمة ويمكنك رؤية النتائج الآن.",
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
                new Notification("الظل | Ez-Zel", { body: "تم إنجاز المهمة الالية بنجاح!" });
            }

        } catch (e) {
            console.error("Autonomous task failed:", e);
            bgTask.status = 'pending'; // mark failed?
        } finally {
            delete activeTasks[taskId];
            useAppStore.getState().setRunningTasks(getActiveTasksCount());
            window.dispatchEvent(new CustomEvent('autonomous_status_changed'));
        }
    })();
    
    return taskId;
};

export const initWorker = () => {
    if (typeof Notification !== 'undefined') {
        Notification.requestPermission();
    }
};


