
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            if (import.meta.env[key]) return import.meta.env[key];
            // Try with VITE_ prefix if not already present
            const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
            // @ts-ignore
            if (import.meta.env[viteKey]) return import.meta.env[viteKey];
        }
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            if (process.env[key]) return process.env[key];
            const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
            // @ts-ignore
            if (process.env[viteKey]) return process.env[viteKey];
        }
    } catch (e) { }
    return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

let client;

if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
    client = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn("Supabase credentials missing. App running in offline/local-only mode.");
    
    const createMockChain = (tableName: string) => {
        const chain: any = {
            select: () => chain,
            eq: () => chain,
            single: () => chain,
            order: () => chain,
            limit: () => chain,
            upsert: async (data: any) => ({ data: null, error: null }),
            insert: async (data: any) => ({ data: null, error: null }),
            update: async (data: any) => ({ data: null, error: null }),
            delete: async () => ({ data: null, error: null }),
            then: (resolve: (val: any) => void) => {
                resolve({ data: null, error: null });
            }
        };
        return chain;
    };

    const mockChannel = {
        on: () => mockChannel,
        subscribe: () => mockChannel,
        unsubscribe: () => mockChannel
    };

    client = {
        from: (table: string) => createMockChain(table),
        channel: (name: string) => mockChannel,
        removeChannel: (channel: any) => {},
    } as any;
}

export const supabase = client;
