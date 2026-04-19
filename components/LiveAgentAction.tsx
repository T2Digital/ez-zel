import React, { useEffect, useState, useRef } from 'react';
import { Terminal, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';
import { shadowDB, SystemKeys } from '../services/dbService';

interface Props {
    actionType: string;
    args: any;
}

const LiveAgentAction: React.FC<Props> = ({ actionType, args }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'pending' | 'running' | 'success' | 'error'>('pending');
    const hasRun = useRef(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;
        executeAction();
    }, []);

    const executeAction = async () => {
        setStatus('running');
        addLog(`Initializing True Autonomous Mode: [${actionType}]...`);

        try {
            const keys = await shadowDB.getSystemKeys();
            if (!keys) throw new Error("مفاتيح النظام مفقودة (System Keys Missing). قم بإضافتها في صفحة إعدادات الأدمن.");

            if (actionType === 'auto_deployer') {
                await deployToGitHubAndVercel(args, keys);
            } else if (actionType === 'crypto_trader') {
                await executeBinanceTrade(args, keys);
            } else if (actionType === 'social_poster') {
                await postToMeta(args, keys);
            } else {
                throw new Error(`Unknown action type: ${actionType}`);
            }

            setStatus('success');
            addLog(`\n>> [ACTION TERMINATED] Task Completed Successfully.`);
        } catch (error: any) {
            setStatus('error');
            addLog(`\n>> [FATAL ERROR] ${error.message || 'Unknown network error'}`);
            addLog(`>> Operation aborted. Check API keys and network CORS constraints.`);
        }
    };

    // --- META LOGIC ---
    const postToMeta = async (args: any, keys: SystemKeys) => {
        if (!keys.metaToken || !keys.metaPageId) throw new Error("Missing Meta Page ID or Access Token.");
        addLog(`Connecting to Meta Graph API for Page: ${keys.metaPageId}...`);
        
        const url = `https://graph.facebook.com/v19.0/${keys.metaPageId}/feed`;
        const params = new URLSearchParams();
        params.append('message', args.message);
        params.append('access_token', keys.metaToken);
        
        addLog(`Executing POST request to Facebook Feed...`);
        const res = await fetch(url, { 
            method: 'POST', 
            headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
            body: params 
        });
        
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        addLog(`Successfully posted! Post ID: ${data.id}`);
    };

    // --- BINANCE LOGIC ---
    const signBinance = async (qs: string, secret: string) => {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, enc.encode(qs));
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const executeBinanceTrade = async (args: any, keys: SystemKeys) => {
        if (!keys.binanceApiKey) throw new Error("Missing Binance API Key.");
        const { action, symbol, amount, price } = args;
        
        addLog(`Connecting to Binance Node... Action: ${action}, Symbol: ${symbol}`);
        
        if(action === 'check_price') {
             const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
             const data = await res.json();
             addLog(`Current price of ${symbol}: ${data.price}`);
             return;
        }

        if (!keys.binanceSecretKey) throw new Error("Missing Binance Secret Key for trading.");

        const side = action.includes('buy') ? 'BUY' : 'SELL';
        const type = action.includes('limit') ? 'LIMIT' : 'MARKET';
        const timestamp = Date.now();
        let qs = `symbol=${symbol}&side=${side}&type=${type}&timestamp=${timestamp}`;

        if (type === 'LIMIT') qs += `&timeInForce=GTC&price=${price}&quantity=${amount}`;
        else qs += `&quantity=${amount}`;

        addLog(`Generating HMAC SHA256 Signature...`);
        const signature = await signBinance(qs, keys.binanceSecretKey);
        const url = `https://api.binance.com/api/v3/order?${qs}&signature=${signature}`;

        addLog(`Executing Order via API...`);
        const res = await fetch(url, { method: 'POST', headers: { 'X-MBX-APIKEY': keys.binanceApiKey }});
        const data = await res.json();
        if(data.code && data.msg) throw new Error(`Binance Error: ${data.msg}`);
        addLog(`Order Success! Status: ${data.status}, Order ID: ${data.orderId}`);
    };

    // --- GITHUB / VERCEL LOGIC ---
    const deployToGitHubAndVercel = async (args: any, keys: SystemKeys) => {
        if (!keys.githubToken) throw new Error("Missing GitHub Personal Access Token.");
        const { repository_name, files } = args;
        const targetFiles = files || []; // Array of {path, content}
        
        addLog(`Connecting to GitHub API...`);
        const userRes = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${keys.githubToken}` }});
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(`GitHub Auth Failed: ${userData.message}`);
        const owner = userData.login;
        addLog(`Authenticated as GitHub user: ${owner}`);

        addLog(`Creating Repository: ${repository_name}...`);
        const createRepoRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: { Authorization: `Bearer ${keys.githubToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: repository_name, private: true, auto_init: true }) 
        });
        const repoData = await createRepoRes.json();
        if(!createRepoRes.ok && repoData.message !== 'Repository creation failed.') {
            addLog(`Repository status: ${repoData.message || 'Already exists'}`);
        } else {
            addLog(`Repository created successfully.`);
        }

        // Small delay for GitHub propagation
        await new Promise(r => setTimeout(r, 2000));

        if (targetFiles.length > 0) {
            addLog(`Pushing ${targetFiles.length} files to repository...`);
            for (const file of targetFiles) {
                // Better base64 encode supporting arabic/unicode characters
                const contentBase64 = btoa(new TextEncoder().encode(file.content).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                const res = await fetch(`https://api.github.com/repos/${owner}/${repository_name}/contents/${file.path}`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${keys.githubToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Add ${file.path} via Shadow Agent`, content: contentBase64 })
                });
                const data = await res.json();
                if(!res.ok && data.message !== "Invalid request.\n\n\"sha\" wasn't supplied.") {
                    addLog(`File path [${file.path}] response: ${data.message}`);
                } else {
                    addLog(`Successfully pushed: ${file.path}`);
                }
            }
        } else {
            addLog(`No files explicitly provided for push, relying on agent workspace memory...`);
        }

        if (keys.vercelToken) {
            addLog(`Triggering Vercel Hook/Deployment...`);
            if (keys.vercelToken.includes('http')) {
                const hookRes = await fetch(keys.vercelToken, { method: 'POST' });
                addLog(`Vercel Hook signal sent: HTTP ${hookRes.status}`);
            } else {
                addLog(`Note: Add Vercel Deploy Hook URL to system keys, or link GH repo directly in Vercel.`);
            }
        }

        addLog(`Check your GitHub account for the '${repository_name}' repository!`);
    };

    return (
        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 my-2 font-mono shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{actionType}</span>
                <div className="flex-1"></div>
                {status === 'running' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-1 text-[11px] leading-relaxed custom-scrollbar">
                {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-emerald-500/80'}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiveAgentAction;
