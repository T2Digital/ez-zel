import { getShadowResponse } from "./geminiService";

export interface AutonomousTask {
    id: string;
    userId: string;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: string;
    createdAt: number;
    updatedAt: number;
}

// In-memory poll array (Simulates background queue)
let activeTasks: AutonomousTask[] = [];
let backgroundWorker: Worker | null = null;

export const submitAutonomousTask = async (userId: string, prompt: string): Promise<string> => {
    const task: AutonomousTask = {
        id: `auto_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId,
        prompt,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    activeTasks.push(task);
    
    if (!backgroundWorker) {
        initWorker();
    }
    
    backgroundWorker?.postMessage({
        type: 'START_TASK',
        taskId: task.id,
        prompt: task.prompt,
        userId: task.userId
    });
    
    return task.id;
};

export const initWorker = () => {
    if (backgroundWorker) return;
    
    backgroundWorker = new Worker('/autonomous-worker.js');
    
    backgroundWorker.onmessage = (e) => {
        const { type, taskId, status, result, progress, log, error } = e.data;
        const task = activeTasks.find(t => t.id === taskId);
        if (!task) return;

        if (type === 'STATUS') {
            task.status = status;
        } else if (type === 'PROGRESS') {
            console.log(`[Worker ${taskId}]: ${progress}% - ${log}`);
        } else if (type === 'COMPLETE') {
            task.status = 'completed';
            task.result = result;
            console.log("Autonomous task completed via Worker:", result);
            // Optionally, handle triggering notification or saving to DB here.
        } else if (type === 'ERROR') {
            task.status = 'failed';
            console.error("Autonomous worker error:", error);
        }
    };
};
