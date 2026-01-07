
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars regardless of build environment (Vite vs others)
const getEnvVar = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) { }
    return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('REACT_APP_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('REACT_APP_SUPABASE_ANON_KEY');

let client;

if (supabaseUrl && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn("Supabase credentials missing. App running in offline/local-only mode.");
    // Mock client to prevent crashes when calling database functions
    client = {
        from: (table: string) => ({
            select: async () => ({ data: [], error: null }),
            upsert: async (data: any) => {
                // Silent logging for dev purposes
                return { data: null, error: null };
            },
            insert: async (data: any) => ({ data: null, error: null }),
            update: async (data: any) => ({ data: null, error: null }),
            delete: async () => ({ data: null, error: null }),
        })
    } as any;
}

export const supabase = client;
