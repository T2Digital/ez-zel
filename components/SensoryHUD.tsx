import React, { useEffect, useState } from 'react';
import { Activity, Battery, Wifi, BrainCircuit } from 'lucide-react';
import { getContextData, analyzeEmotionFromText } from '../services/sensorService';

export const SensoryHUD: React.FC<{ lastMessage?: string }> = ({ lastMessage = '' }) => {
    const [battery, setBattery] = useState('جار القياس...');
    const [network, setNetwork] = useState('جار التحليل...');
    const [emotion, setEmotion] = useState('هادئ');

    useEffect(() => {
        const updateContext = async () => {
            const ctx = await getContextData();
            setBattery(ctx.battery);
            setNetwork(ctx.network);
        };
        updateContext();
        const interval = setInterval(updateContext, 10000); // every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (lastMessage) {
            const emo = analyzeEmotionFromText(lastMessage);
            setEmotion(emo.emotion);
        } else {
            setEmotion('في الانتظار 😐');
        }
    }, [lastMessage]);

    return (
        <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-xl mb-4 text-xs font-['Cairo'] text-white/50 justify-between items-center px-4" dir="rtl">
            <div className="flex items-center gap-1.5" title="الشبكة (Context)">
                <Wifi className="w-3.5 h-3.5 text-cyan-500" />
                <span className="truncate max-w-[100px]">{network}</span>
            </div>
            <div className="flex items-center gap-1.5" title="البطارية">
                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                <span>{battery}</span>
            </div>
            <div className="flex items-center gap-1.5" title="تحليل المشاعر (Neural RAG Simulation)">
                <BrainCircuit className="w-3.5 h-3.5 text-fuchsia-500" />
                <span>{emotion}</span>
            </div>
        </div>
    );
};
