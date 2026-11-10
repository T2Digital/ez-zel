export const uploadImageToImgBB = async (imageInput: string): Promise<string | null> => {
    try {
        const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY || '';
        if (!apiKey) {
            return imageInput.startsWith('data:image') || imageInput.startsWith('http') ? imageInput : null;
        }
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
