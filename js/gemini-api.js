/**
 * gemini-api.js
 * 專門負責與 Google Gemini API 進行通訊。
 */

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

/**
 * 向 Gemini API 發送請求
 * @param {string} apiKey - 使用者提供的 API Key
 * @param {string} prompt - 要發送給模型的提示
 * @returns {Promise<string>} - 返回 AI 生成的純文字回應
 */
async function callGeminiAPI(apiKey, prompt) {
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
    };

    try {
        const response = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `HTTP 錯誤！狀態：${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("無效的 API 回應結構:", data);
            throw new Error("從 API 收到了無效的回應格式。");
        }

    } catch (error) {
        console.error("呼叫 Gemini API 時出錯:", error);
        throw error;
    }
}