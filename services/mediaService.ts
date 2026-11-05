export const generateImageNative = async (prompt: string): Promise<string> => {
    try {
        const res = await fetch('/api/gemini/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data?.imageUrl) {
                return data.imageUrl;
            }
        } else {
            const errData = await res.json().catch(() => ({}));
            console.warn("Server Gemini image generation returned error, falling back:", errData?.error || res.status);
        }
    } catch (finalError) {
        console.error("Gemini image generation failed, falling back to pollinations:", finalError);
    }

    // Final fallback
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
};

export const startVideoGenerationNative = async (prompt: string): Promise<any> => {
    const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.error || `Video generation failed (${res.status})`);
    }
    return data;
};
