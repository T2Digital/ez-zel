export enum Type {
    TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
    STRING = "STRING",
    NUMBER = "NUMBER",
    INTEGER = "INTEGER",
    BOOLEAN = "BOOLEAN",
    ARRAY = "ARRAY",
    OBJECT = "OBJECT",
    NULL = "NULL",
}

export enum Modality {
    MODALITY_UNSPECIFIED = "MODALITY_UNSPECIFIED",
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    AUDIO = "AUDIO",
    DOCUMENT = "DOCUMENT",
}

export interface Schema {
    type?: Type | string;
    description?: string;
    enum?: string[];
    items?: Schema | Record<string, any>;
    properties?: Record<string, Schema | Record<string, any>>;
    required?: string[];
    nullable?: boolean;
}

export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: Schema | Record<string, any>;
    parametersJsonSchema?: Record<string, any>;
    response?: Schema | Record<string, any>;
}

export interface FunctionCall {
    id?: string;
    name?: string;
    args?: Record<string, any>;
}

export interface GenerateContentResponse {
    text?: string;
    functionCalls?: FunctionCall[];
    candidates?: any[];
}

export interface GenerateContentParameters {
    model: string;
    contents: any;
    config?: any;
}

export interface EmbedContentParameters {
    model: string;
    contents: any;
    config?: any;
}

export interface EmbedContentResponse {
    embeddings?: Array<{ values?: number[] }>;
}

export interface ServerAIProxy {
    models: {
        generateContent: (params: GenerateContentParameters) => Promise<GenerateContentResponse>;
        generateContentStream: (params: GenerateContentParameters) => Promise<AsyncGenerator<GenerateContentResponse, void, unknown>>;
        embedContent: (params: EmbedContentParameters) => Promise<EmbedContentResponse>;
    };
}

let _ai: ServerAIProxy | null = null;

export const getAI = (): ServerAIProxy => {
    if (!_ai) {
        _ai = {
            models: {
                async generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
                    const res = await fetch('/api/gemini/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params),
                    });

                    if (!res.ok) {
                        let errorMessage = `Gemini server error (${res.status})`;
                        try {
                            const errData = await res.json();
                            if (errData?.error) errorMessage = errData.error;
                        } catch {
                            const txt = await res.text().catch(() => '');
                            if (txt) errorMessage = txt;
                        }
                        const err: any = new Error(errorMessage);
                        err.status = res.status;
                        throw err;
                    }

                    const data = await res.json();
                    return {
                        text: data.text ?? '',
                        functionCalls: Array.isArray(data.functionCalls) && data.functionCalls.length > 0 ? data.functionCalls : undefined,
                        candidates: data.candidates ?? [],
                    };
                },

                async generateContentStream(params: GenerateContentParameters): Promise<AsyncGenerator<GenerateContentResponse, void, unknown>> {
                    const res = await fetch('/api/gemini/stream', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params),
                    });

                    if (!res.ok) {
                        let errorMessage = `Gemini stream error (${res.status})`;
                        try {
                            const errData = await res.json();
                            if (errData?.error) errorMessage = errData.error;
                        } catch {
                            const txt = await res.text().catch(() => '');
                            if (txt) errorMessage = txt;
                        }
                        const err: any = new Error(errorMessage);
                        err.status = res.status;
                        throw err;
                    }

                    if (!res.body) {
                        throw new Error('Streaming response body is empty');
                    }

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();

                    async function* streamGenerator(): AsyncGenerator<GenerateContentResponse, void, unknown> {
                        let buffer = '';
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                buffer += decoder.decode(value, { stream: true });

                                const events = buffer.split('\n\n');
                                buffer = events.pop() || '';

                                for (const event of events) {
                                    const lines = event.split('\n');
                                    for (const line of lines) {
                                        const trimmed = line.trim();
                                        if (!trimmed.startsWith('data:')) continue;
                                        const payload = trimmed.slice(5).trim();
                                        if (!payload || payload === '[DONE]') {
                                            if (payload === '[DONE]') return;
                                            continue;
                                        }
                                        const parsed = JSON.parse(payload);
                                        if (parsed.error) {
                                            throw new Error(parsed.error);
                                        }
                                        yield {
                                            text: parsed.text ?? '',
                                            functionCalls: Array.isArray(parsed.functionCalls) && parsed.functionCalls.length > 0 ? parsed.functionCalls : undefined,
                                            candidates: parsed.candidates ?? [],
                                        };
                                    }
                                }
                            }
                        } finally {
                            try {
                                reader.releaseLock();
                            } catch {}
                        }
                    }

                    return streamGenerator();
                },

                async embedContent(params: EmbedContentParameters): Promise<EmbedContentResponse> {
                    const res = await fetch('/api/gemini/embed', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params),
                    });

                    if (!res.ok) {
                        let errorMessage = `Gemini embed error (${res.status})`;
                        try {
                            const errData = await res.json();
                            if (errData?.error) errorMessage = errData.error;
                        } catch {
                            const txt = await res.text().catch(() => '');
                            if (txt) errorMessage = txt;
                        }
                        const err: any = new Error(errorMessage);
                        err.status = res.status;
                        throw err;
                    }

                    const data = await res.json();
                    return {
                        embeddings: data.embeddings ?? [],
                    };
                },
            },
        };
    }
    return _ai;
};
