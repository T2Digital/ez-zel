import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface SSEClient {
    id: string;
    res: Response;
}

const sseClients = new Set<SSEClient>();

export function broadcastGatewayEvent(event: string, data: any) {
    const payload = JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString()
    });

    const msg = `event: ${event}\ndata: ${payload}\n\n`;

    sseClients.forEach(client => {
        try {
            client.res.write(msg);
        } catch (e) {
            sseClients.delete(client);
        }
    });
}

function getBookingsFilePath(): string {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
    }
    return path.join(dataDir, 'bookings.json');
}

export function readBookings(): any[] {
    try {
        const filePath = getBookingsFilePath();
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (err: any) {
        console.warn('[Gateway] Error reading bookings.json:', err?.message);
    }
    return [];
}

export function saveBooking(bookingData: any): any {
    const filePath = getBookingsFilePath();
    const bookings = readBookings();

    const bookingId = bookingData.id || bookingData.bookingId || `book_${Date.now()}`;
    const cleanBooking = {
        id: bookingId,
        brandId: bookingData.brandId || 'clean_master',
        customerName: bookingData.customerName || bookingData.name || 'عميل جديد',
        customerPhone: bookingData.customerPhone || bookingData.phone || '',
        service: bookingData.service || bookingData.serviceName || 'خدمة مخصصة',
        price: bookingData.price || `${bookingData.totalPrice || 500} ج.م`,
        depositAmount: bookingData.depositAmount || '',
        remainingAmount: bookingData.remainingAmount || '',
        address: bookingData.address || '',
        status: bookingData.status || 'CONFIRMED',
        source: bookingData.source || 't2_agent_webhook',
        createdAt: bookingData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const existingIndex = bookings.findIndex(b => b.id === bookingId);
    if (existingIndex >= 0) {
        bookings[existingIndex] = { ...bookings[existingIndex], ...cleanBooking };
    } else {
        bookings.unshift(cleanBooking);
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(bookings.slice(0, 200), null, 2), 'utf8');
    } catch (err: any) {
        console.error('[Gateway] Failed to save booking to disk:', err?.message);
    }

    // Broadcast in real-time to all connected dashboards and Jarvis
    broadcastGatewayEvent('BOOKING_CONFIRMED', cleanBooking);
    return cleanBooking;
}

export function setupMicroservicesGateway(app: express.Express) {
    console.log('⚡ [Gateway] Sovereign Microservices API Gateway initializing...');

    // 1. Real-Time Server-Sent Events (SSE) Stream for Dashboard & Jarvis
    app.get('/api/gateway/events', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering for instant delivery
        res.flushHeaders?.();

        const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const client: SSEClient = { id: clientId, res };
        sseClients.add(client);

        // Initial handshake payload
        const initPayload = JSON.stringify({
            event: 'CONNECTED',
            data: {
                message: 'Connected to Sovereign Microservices API Gateway',
                clientId,
                activeBookingsCount: readBookings().length,
                timestamp: new Date().toISOString()
            }
        });
        res.write(`event: CONNECTED\ndata: ${initPayload}\n\n`);

        // Keep-alive heartbeat every 20 seconds
        const heartbeat = setInterval(() => {
            try {
                res.write(`event: PING\ndata: {"time":${Date.now()}}\n\n`);
            } catch {
                clearInterval(heartbeat);
                sseClients.delete(client);
            }
        }, 20000);

        req.on('close', () => {
            clearInterval(heartbeat);
            sseClients.delete(client);
        });
    });

    // 2. Webhook Ingestion Routes (From T2 Agent / WhatsApp / Meta)
    const handleBookingWebhook = async (req: Request, res: Response) => {
        const secret = req.headers['x-t2-secret'] || 
                       req.headers['x-webhook-secret'] || 
                       (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '') ||
                       req.body?.secret_token;

        // Ping / Health check
        if (req.method === 'GET' || req.method === 'HEAD' || req.path.endsWith('/ping')) {
            return res.status(200).json({
                status: 'ONLINE',
                service: 'Ez-Zel Sovereign API Gateway',
                supportedEvents: ['BOOKING_CONFIRMED', 'BOOKING_UPDATED', 'LEAD_CREATED'],
                timestamp: new Date().toISOString()
            });
        }

        try {
            const body = req.body || {};
            const eventType = body.event || body.eventType || 'BOOKING_CONFIRMED';
            const brandId = req.params?.brandId || body.brandId || 'clean_master';
            const bookingPayload = body.data || body.booking || body;

            console.log(`📡 [Gateway Webhook Received]: Event=${eventType} Brand=${brandId} Customer=${bookingPayload.customerName || bookingPayload.name}`);

            const saved = saveBooking({
                ...bookingPayload,
                brandId,
                status: eventType.includes('CONFIRMED') ? 'CONFIRMED' : (bookingPayload.status || 'PENDING')
            });

            return res.status(200).json({
                success: true,
                message: 'Webhook processed and recorded in Sovereign CRM',
                bookingId: saved.id,
                recordedAt: saved.createdAt
            });
        } catch (err: any) {
            console.error('[Gateway Webhook Error]:', err?.message);
            return res.status(500).json({ success: false, error: err?.message });
        }
    };

    app.all('/api/bookings/webhook', handleBookingWebhook);
    app.all('/api/bookings/webhook/ping', handleBookingWebhook);
    app.all('/api/brands/:brandId/bookings/webhook', handleBookingWebhook);
    app.all('/api/gateway/webhooks/bookings', handleBookingWebhook);

    // 3. Microservices Health & Status Fleet Monitor
    app.get('/api/gateway/services/status', async (_req: Request, res: Response) => {
        const t2AgentUrl = process.env.T2_AGENT_URL || 'http://localhost:3000';
        const metaServiceUrl = process.env.META_SERVICE_URL || 'https://graph.facebook.com';

        let t2Status = { online: false, latencyMs: 0, url: t2AgentUrl };
        const tStart = Date.now();
        try {
            const controller = new AbortController();
            const toId = setTimeout(() => controller.abort(), 2000);
            const resp = await fetch(`${t2AgentUrl}/api/health`, { signal: controller.signal });
            clearTimeout(toId);
            t2Status = {
                online: resp.ok,
                latencyMs: Date.now() - tStart,
                url: t2AgentUrl
            };
        } catch {
            t2Status = {
                online: false,
                latencyMs: Date.now() - tStart,
                url: t2AgentUrl
            };
        }

        const stats = {
            gateway: {
                status: 'ONLINE',
                uptimeSeconds: Math.floor(process.uptime()),
                activeStreamSubscribers: sseClients.size
            },
            services: {
                t2Agent: {
                    name: 'T2 Agent (WhatsApp Sales Core)',
                    ...t2Status,
                    role: 'Autonomous Sales & Human Voice Engine'
                },
                metaMachine: {
                    name: 'Meta Content Machine',
                    online: !!process.env.META_ACCESS_TOKEN,
                    url: metaServiceUrl,
                    role: 'Campaigns, Ads & Lead Generation'
                },
                jarvisBrain: {
                    name: 'Jarvis Executive Brain & 3D BattleStation',
                    online: true,
                    role: 'Sovereign Orchestration & Financial Command'
                }
            },
            metrics: {
                totalBookings: readBookings().length,
                totalConfirmedRevenueEgp: readBookings()
                    .filter(b => b.status === 'CONFIRMED')
                    .reduce((sum, b) => {
                        const num = parseInt(String(b.price || '').replace(/[^\d]/g, ''), 10);
                        return sum + (isNaN(num) ? 0 : num);
                    }, 0)
            },
            timestamp: new Date().toISOString()
        };

        res.json(stats);
    });

    // 4. Retrieve Recent Bookings for Dashboard
    app.get('/api/gateway/bookings/recent', (_req: Request, res: Response) => {
        const bookings = readBookings();
        res.json({
            success: true,
            count: bookings.length,
            bookings: bookings.slice(0, 50)
        });
    });

    // 5. Remote Microservice Dispatcher (Send command to T2 Agent without source coupling)
    app.post('/api/gateway/t2-agent/dispatch', async (req: Request, res: Response) => {
        const t2AgentUrl = process.env.T2_AGENT_URL || 'http://localhost:3000';
        const { endpoint, method = 'POST', payload } = req.body;

        try {
            const resp = await fetch(`${t2AgentUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Origin': 'Ez-Zel-Sovereign-Hub'
                },
                body: payload ? JSON.stringify(payload) : undefined
            });
            const data = await resp.json().catch(() => ({}));
            res.status(resp.status).json(data);
        } catch (err: any) {
            res.status(502).json({
                error: `Failed to communicate with T2 Agent microservice at ${t2AgentUrl}`,
                message: err?.message
            });
        }
    });

    console.log('✅ [Gateway] Sovereign Microservices API Gateway ready.');
}
