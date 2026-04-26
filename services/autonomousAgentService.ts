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
let isWorkerRunning = false;

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
    
    // Fire and forget
    if (!isWorkerRunning) {
        startWorker();
    }
    
    return task.id;
};

export const startWorker = async () => {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    
    while (activeTasks.length > 0) {
        const task = activeTasks.find(t => t.status === 'pending');
        if (!task) {
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        task.status = 'running';
        
        try {
            // Give the AI a specific prompt for background processing
            const bgPrompt = `[AUTONOMOUS_BACKGROUND_TASK]\nUser requested: ${task.prompt}\nPerform deep research or required actions. Provide a final comprehensive summary.`;
            
            // Call Gemini as the user
            const response = await getShadowResponse([], bgPrompt);
            
            task.status = 'completed';
            task.result = response.text;
            
            // You can implement custom push notifications or broadcast channel here
            // to notify the UI about the completion

        } catch (e) {
            console.error("Autonomous task failed:", e);
            task.status = 'failed';
        }
        
        // Remove from active queue after processing
        activeTasks = activeTasks.filter(t => t.id !== task.id);
        await new Promise(r => setTimeout(r, 2000)); // Rate limit
    }
    
    isWorkerRunning = false;
};
