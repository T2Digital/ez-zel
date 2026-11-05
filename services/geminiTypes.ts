export enum Type {
    TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
    STRING = "STRING",
    NUMBER = "NUMBER",
    INTEGER = "INTEGER",
    BOOLEAN = "BOOLEAN",
    ARRAY = "ARRAY",
    OBJECT = "OBJECT",
    NULL = "NULL"
}

export enum Modality {
    MODALITY_UNSPECIFIED = "MODALITY_UNSPECIFIED",
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO"
}

export interface Schema {
    type?: Type | string;
    format?: string;
    description?: string;
    nullable?: boolean;
    enum?: string[];
    items?: Schema;
    properties?: Record<string, Schema>;
    required?: string[];
}

export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: Schema;
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

export interface EmbedContentResponse {
    embeddings?: { values?: number[] }[];
}
