const GeminiAPI = {
    process: async (apiKey, base64Image) => {
        // Usa o modelo correto (Nano Banana 2) focado em imagem e inpainting
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-image:predict?key=${apiKey}`;
        
        const payload = {
            "instances": [
                {
                    "prompt": "Clean any text, dialogue, or onomatopoeia present in this image and reconstruct the background perfectly. Preserve colors and style.",
                    "image": {
                        "bytesBase64Encoded": base64Image
                    }
                }
            ],
            "parameters": {
                "sampleCount": 1,
                "mode": "inpainting"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Erro na API Gemini");
        }

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);
        
        // Retorna a imagem em Base64 gerada
        return data.predictions[0].bytesBase64Encoded;
    }
};