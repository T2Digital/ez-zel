import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import IORedisMock from 'ioredis-mock';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import twilio from 'twilio';
import { Resend } from 'resend';
import { fal } from '@fal-ai/client';

dotenv.config();

console.log("[WORKER] Booting background microservice...");

// 1. Redis Connection
let connection: any = null;
if (process.env.REDIS_URL) {
    connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
}

// 2. Global State
let API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
let ai: GoogleGenAI;
try {
    ai = new GoogleGenAI({ apiKey: API_KEY.replace(/['"]/g, ''), apiVersion: 'v1beta' });
} catch(e) {
    console.error("[WORKER] Missing or Invalid API KEY:", e);
}

// 4. Tools available to the Shadow
const tools = [
    {
        name: "adk_read_source_code",
        description: "يسمح للظل (أنت) بقراءة أكواده الخاصة ليعرف كيف يعمل، وما هي مميزاته وما بنيته.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "Path to read (e.g. 'server.ts', 'src/App.tsx', 'worker.ts')" } 
            },
            required: ["file_path"]
        }
    },
    {
        name: "adk_list_directory",
        description: "يستعرض قائمة الملفات في مجلد النظام لتعرف ما هي الأكواد المتاحة لك لقراءتها.",
        parameters: {
            type: "OBJECT",
            properties: { 
                dir_path: { type: "STRING", description: "Directory to list (e.g. '.', './src', './services')" } 
            },
            required: ["dir_path"]
        }
    },
    {
        name: "adk_perform_rpa",
        description: "أذرع حقيقية للتصفح الكامل للويب باستخدام Puppeteer Headless. يسمح لك بزيارة أي رابط وقراءة محتواه.",
        parameters: {
            type: "OBJECT",
            properties: { 
                url: { type: "STRING", description: "URL to navigate to" }
            },
            required: ["url"]
        }
    },
    {
        name: "adk_http_request",
        description: "الربط الواقعي بأي خدمة API خارجية عبر شبكة الانترنت.",
        parameters: {
            type: "OBJECT",
            properties: { 
                url: { type: "STRING", description: "API URL" },
                method: { type: "STRING", description: "GET/POST/PUT/DELETE" },
                headers: { type: "STRING", description: "JSON string of headers" },
                body: { type: "STRING", description: "JSON string of body if needed" }
            },
            required: ["url", "method"]
        }
    },
    {
        name: "adk_store_memory",
        description: "كتابة الذاكرة طويلة المدى في قاعدة بيانات التخزين الدائم (State Machine) لعدم الضياع.",
        parameters: {
            type: "OBJECT",
            properties: { 
                key: { type: "STRING" },
                value: { type: "STRING" }
            },
            required: ["key", "value"]
        }
    },
    {
        name: "adk_retrieve_memory",
        description: "استرجاع الذاكرة الدائمة.",
        parameters: {
            type: "OBJECT",
            properties: { 
                key: { type: "STRING" }
            },
            required: ["key"]
        }
    },
    {
        name: "adk_make_phone_call",
        description: "يجري مكالمة هاتفية حقيقية وتوجيه رسالة صوتية (TwiML) عبر Twilio.",
        parameters: {
            type: "OBJECT",
            properties: { 
                to_number: { type: "STRING", description: "رقم الهاتف المستلم بصيغة دولية كمثال +123456789" },
                message: { type: "STRING", description: "الرسالة التي سينطقها الروبوت عند الرد" }
            },
            required: ["to_number", "message"]
        }
    },
    {
        name: "adk_generate_design",
        description: "يستخدم Fal.ai لإنتاج تصميمات وصور احترافية وسريعة جداً بناءً على وصف نصي للـ Prompt.",
        parameters: {
            type: "OBJECT",
            properties: { 
                prompt: { type: "STRING", description: "الوصف الدقيق للصورة المطلوبة" },
                model: { type: "STRING", description: "اختياري: مثال fal-ai/flux/dev أو fal-ai/lora" }
            },
            required: ["prompt"]
        }
    },
    {
        name: "adk_write_source_code",
        description: "تحذير (خطر): يسمح للظل بتعديل أو كتابة وتطوير أكواده وميزاته الخاصة. يجب تمرير الكود البرمجي بالكامل للملف المستهدف وليس جزءاً منه.",
        parameters: {
            type: "OBJECT",
            properties: { 
                file_path: { type: "STRING", description: "Path to write (e.g. 'worker.ts', 'server.ts')" },
                content: { type: "STRING", description: "The complete new source code content" }
            },
            required: ["file_path", "content"]
        }
    },
    {
        name: "adk_send_email",
        description: "يرسل رسالة بريد إلكتروني حقيقية عبر منصة Resend.",
        parameters: {
            type: "OBJECT",
            properties: { 
                to_email: { type: "STRING", description: "البريد الإلكتروني للعميل أو المستلم" },
                subject: { type: "STRING", description: "عنوان الرسالة" },
                html_body: { type: "STRING", description: "محتوى الرسالة بصيغة HTML" }
            },
            required: ["to_email", "subject", "html_body"]
        }
    },
    {
        name: "adk_finish",
        description: "الاستدعاء النهائي عندما تنهي تفكيرك وترسل التقرير النهائي.",
        parameters: {
            type: "OBJECT",
            properties: { result_summary: { type: "STRING" } },
            required: ["result_summary"]
        }
    }
];

// 5. Worker Engine Loop
export async function processAgentTask(job: Job) {
    const { prompt, userId, taskId } = job.data;
    console.log(`[WORKER] Received Task ${taskId}: ${prompt}`);
    
    let isDone = false;
    let finalOutput = "";
    
    let history: any[] = [
        { role: 'user', parts: [{ text: prompt }] }
    ];
    
    let iteration = 0;
    const maxIterations = 30;
    
    while (!isDone && iteration < maxIterations) {
        iteration++;
        await job.updateProgress({ iteration, logs: `Thinking... Iteration ${iteration}` });
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-pro',
                contents: history as any,
                config: {
                    tools: [{ functionDeclarations: tools as any }],
                    systemInstruction: { parts: [{ text: "أنت الظل (Ez-Zel Digital Shadow)، تمتلك قدرات استثنائية للوصول لنظامك وقراءة أكوادك عبر أداة adk_read_source_code. استخدمها لتعرف نفسك وتتعلم. تمتلك أيضاً متصفح خفي (Puppeteer). تم إرسال طلب جديد من المستخدم. قم بالتفكير كخطوات ثم استدع adk_finish بالنهاية." }] },
                    temperature: 0.6
                }
            });

            const call = response.functionCalls?.[0];
            const textResponse = response.text || "";

            if (textResponse) history.push({ role: 'model', parts: [{ text: textResponse }] });

            if (call) {
                 history.push({ role: 'model', parts: [{ functionCall: call }] } as any);
                 let toolResult: any = "Success";
                 
                 if (call.name === 'adk_finish') {
                     isDone = true;
                     finalOutput = (call.args as any).result_summary || "Task completed.";
                 } else if (call.name === 'adk_read_source_code') {
                     const fPath = (call.args as any).file_path;
                     try {
                         const resolved = path.resolve(process.cwd(), fPath);
                         if (fs.existsSync(resolved)) {
                             toolResult = fs.readFileSync(resolved, 'utf-8').slice(0, 5000); // chunk it to avoid overload
                         } else {
                             toolResult = "File not found.";
                         }
                     } catch(e: any) { toolResult = `Error: ${e.message}`; }
                 } else if (call.name === 'adk_list_directory') {
                     const dPath = (call.args as any).dir_path;
                     try {
                         const resolved = path.resolve(process.cwd(), dPath);
                         toolResult = fs.readdirSync(resolved).join(", ");
                     } catch(e: any) { toolResult = `Error: ${e.message}`; }
                 } else if (call.name === 'adk_perform_rpa') {
                     const targetUrl = (call.args as any).url;
                     const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
                     const page = await browser.newPage();
                     try {
                         await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                         const textContent = await page.evaluate(() => document.body.innerText.substring(0, 5000));
                         toolResult = `محتوى الويب لـ ${targetUrl}:\n${textContent}`;
                     } catch(e: any) {
                         toolResult = "RPA Error: " + e.message;
                     } finally {
                         await browser.close();
                     }
                 } else if (call.name === 'adk_http_request') {
                     const { url, method, headers, body } = call.args as any;
                     try {
                         const reqHeaders = headers ? JSON.parse(headers) : undefined;
                         const response = await fetch(url, {
                             method: method,
                             headers: reqHeaders,
                             body: (method !== 'GET' && method !== 'HEAD') ? body : undefined
                         });
                         const respText = await response.text();
                         toolResult = `HTTP ${response.status}\n${respText.substring(0, 3000)}`;
                     } catch(err: any) {
                         toolResult = "HTTP Error: " + err.message;
                     }
                 } else if (call.name === 'adk_store_memory') {
                     const k = (call.args as any).key;
                     const v = (call.args as any).value;
                     try {
                         if (connection) {
                             await connection.set(`adk_mem:${k}`, v);
                             toolResult = `Saved ${k} to Redis memory.`;
                         } else {
                             const memFile = path.resolve(process.cwd(), 'adk_memory.json');
                             let mem = {};
                             if (fs.existsSync(memFile)) mem = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
                             (mem as any)[k] = v;
                             fs.writeFileSync(memFile, JSON.stringify(mem, null, 2));
                             toolResult = `Saved ${k} to persistent local memory (Fallback).`;
                         }
                     } catch(err: any) {
                         toolResult = `Redis Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_write_source_code') {
                     const { file_path, content } = call.args as any;
                     try {
                         const resolved = path.resolve(process.cwd(), file_path);
                         // Prevent escaping workspace (basic safety)
                         if (!resolved.startsWith(process.cwd())) {
                             toolResult = "Error: Cannot write outside of the application directory.";
                         } else {
                             const originalContent = fs.existsSync(resolved) ? fs.readFileSync(resolved, 'utf-8') : null;
                             fs.writeFileSync(resolved, content, 'utf-8');
                             
                             // Try compiling to ensure safety
                             try {
                                 // Execute tsc --noEmit directly
                                 const { execSync } = require('child_process');
                                 execSync('npx tsc --noEmit', { stdio: 'pipe' });
                                 toolResult = `Successfully updated file: ${file_path} and passed TypeScript safety check.\nNote: A server restart might be required for changes.`;
                             } catch (tsError: any) {
                                 // Revert back
                                 if (originalContent !== null) {
                                     fs.writeFileSync(resolved, originalContent, 'utf-8');
                                 } else {
                                     fs.unlinkSync(resolved);
                                 }
                                 toolResult = `Code was NOT saved. TypeScript validation failed:\n${tsError.stdout?.toString() || tsError.message}`;
                             }
                         }
                     } catch(err: any) {
                         toolResult = `Write Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_retrieve_memory') {
                     const k = (call.args as any).key;
                     try {
                         if (connection) {
                             const v = await connection.get(`adk_mem:${k}`);
                             toolResult = v !== null ? v : `Memory key ${k} not found.`;
                         } else {
                             const memFile = path.resolve(process.cwd(), 'adk_memory.json');
                             if (fs.existsSync(memFile)) {
                                 const mem = JSON.parse(fs.readFileSync(memFile, 'utf-8'));
                                 toolResult = mem[k] ? mem[k] : `Memory key ${k} not found.`;
                             } else {
                                 toolResult = "Persistent memory is empty (Fallback).";
                             }
                         }
                     } catch(err: any) {
                         toolResult = `Redis Error: ${err.message}`;
                     }
                 } else if (call.name === 'adk_make_phone_call') {
                     const { to_number, message } = call.args as any;
                     if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
                         toolResult = "Twilio credentials not found in environment variables.";
                     } else {
                         try {
                             const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                             const twiml = `<Response><Say voice="alice" language="ar-SA">${message}</Say></Response>`;
                             const callInstance = await client.calls.create({
                                 twiml: twiml,
                                 to: to_number,
                                 from: process.env.TWILIO_PHONE_NUMBER
                             });
                             toolResult = `Call initiated successfully. SID: ${callInstance.sid}`;
                         } catch (e: any) {
                             toolResult = `Twilio Error: ${e.message}`;
                         }
                     }
                 } else if (call.name === 'adk_send_email') {
                     const { to_email, subject, html_body } = call.args as any;
                     if (!process.env.RESEND_API_KEY) {
                         toolResult = "Resend API KEY not found in environment variables.";
                     } else {
                         try {
                             const resend = new Resend(process.env.RESEND_API_KEY);
                             const { data, error } = await resend.emails.send({
                               from: 'Shadow <onboarding@resend.dev>',
                               to: [to_email],
                               subject: subject,
                               html: html_body,
                             });
                             if (error) { toolResult = `Resend Error: ${error.message}`; }
                             else { toolResult = `Email sent successfully. ID: ${data?.id}`; }
                         } catch(e: any) {
                             toolResult = `Resend Exception: ${e.message}`;
                         }
                     }
                 } else if (call.name === 'adk_generate_design') {
                     const { prompt, model } = call.args as any;
                     if (!process.env.FAL_KEY) {
                          toolResult = "FAL_KEY not found in environment variables.";
                     } else {
                          try {
                              const result = await fal.subscribe(model || "fal-ai/flux/dev", {
                                  input: {
                                      prompt: prompt,
                                      image_size: "landscape_4_3"
                                  },
                                  logs: true,
                              });
                              // Check if images is an array
                              const images = (result.data as any)?.images;
                              if (images && images.length > 0) {
                                  toolResult = `Image generated successfully: ${images[0].url}`;
                              } else {
                                  toolResult = `Failed to extract image URL from response: ${JSON.stringify(result.data)}`;
                              }
                          } catch(e: any) {
                              toolResult = `Fal AI Error: ${e.message}`;
                          }
                     }
                 } else {
                     toolResult = "Tool not implemented.";
                 }
                 
                 history.push({ role: 'function', parts: [{ functionResponse: { name: call.name, response: { result: toolResult } } }] } as any);
            } else if (!call && textResponse) {
                // He just answered text
                isDone = true;
                finalOutput = textResponse;
            } else {
                isDone = true;
                finalOutput = "Error: empty response";
            }
        } catch(err: any) {
            console.error("[WORKER] Model error:", err);
            finalOutput = `Error executing task: ${err.message}`;
            isDone = true;
        }
    }
    
    // Save output back to job result so that the observer can pick it up.
    return { result: finalOutput, taskId };
}

// 6. BullMQ Worker instantiation
if (process.env.REDIS_URL) {
    const worker = new Worker('autonomous-agents-queue', processAgentTask, { connection });

    worker.on('completed', job => {
      console.log(`[WORKER] Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[WORKER] Job ${job?.id} failed with ${err.message}`);
    });

    console.log("[WORKER] Worker Service is active and securely listening for queue jobs.");
} else {
    console.log("[WORKER] Running without REDIS_URL. Real BullMQ Worker is disabled.");
}
