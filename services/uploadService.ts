export const uploadImageToImgBB = async (imageInput: string): Promise<string | null> => {
    try {
        const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY || '5196307137b00f7236d93026a7f0e698';
        const formData = new FormData();
        
        let uploadData = imageInput;
        if (imageInput.startsWith('data:image')) {
            uploadData = imageInput.split(',')[1];
        }
        
        formData.append('image', uploadData);
        
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data && data.success) {
            return data.data.url; // Returns the direct image URL
        }
        return null;
    } catch (e) {
        console.error("ImgBB upload failed:", e);
        return null;
    }
};

export const uploadToFreeHost = async (blob: Blob, ext: string = 'mp4'): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('file', blob, `file.${ext}`);
        
        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            // tmpfiles returns {"status":"success","data":{"url":"https://tmpfiles.org/12345/file.ext"}}
            // direct URL is usually just replacing org/ with org/dl/
            if (data?.data?.url) {
                 return data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
            }
        }
        return null;
    } catch (e) {
        console.error("tmpfiles upload failed:", e);
        return null; // fallback
    }
};
