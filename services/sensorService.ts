export const getContextData = async () => {
    let batteryLevel = 'غير معروف';
    let isCharging = false;
    try {
        if ('getBattery' in navigator) {
            const battery: any = await (navigator as any).getBattery();
            batteryLevel = Math.round(battery.level * 100) + '%';
            isCharging = battery.charging;
        }
    } catch(e) {}

    let networkStatus = 'غير معروف';
    try {
        if ('connection' in navigator) {
            const conn = (navigator as any).connection;
            networkStatus = `${conn.effectiveType || 'online'} (${navigator.onLine ? 'متصل' : 'غير متصل'})`;
        } else {
             networkStatus = navigator.onLine ? 'متصل' : 'غير متصل';
        }
    } catch(e) {}

    let locationStr = 'غير مصرح';

    return {
        battery: `${batteryLevel} ${isCharging ? '(جاري الشحن)' : ''}`,
        network: networkStatus,
        userAgent: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop/Tablet'
    };
};

export const analyzeEmotionFromText = (text: string) => {
    const urgentWords = ['بسرعة', 'الحق', 'عاجل', 'ضروري', 'مصيبة', 'طوارئ', 'سريع', 'انقذني', 'help', 'urgent', 'يلا'];
    const angryWords = ['غبي', 'زفت', 'قرف', 'حيوان', 'عصب', 'متنرفز', 'نيلة', 'حمار', 'ياعم', 'اخلص', 'انجز'];
    const happyWords = ['شكرا', 'حبيبي', 'تسلم', 'عظيم', 'اسطورة', 'رائع', 'ممتاز', 'بطل', 'عاش', 'حلو'];
    
    let emotion = 'هادئ 😐';
    let urgency = 'طبيعي';

    const hasUrgent = urgentWords.some(w => text.includes(w));
    const hasAngry = angryWords.some(w => text.includes(w));
    const hasHappy = happyWords.some(w => text.includes(w));

    if (hasAngry) emotion = 'غاضب أو منفعل 😠';
    else if (hasHappy) emotion = 'سعيد أو راضي 😁';

    if (hasUrgent || text.includes('!!') || text.includes('؟؟')) urgency = 'عالي جداً 🚨 (رد باختصار شديد وتصرف فوراً)';

    return { emotion, urgency };
};
