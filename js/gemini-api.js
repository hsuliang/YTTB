/**
 * gemini-api.js
 * 封裝所有與 Google Gemini API 互動的邏輯。
 * 使用官方 @google/generative-ai SDK。
 */

/**
 * 【使用官方 SDK 版本】
 * 呼叫 Gemini API 並獲取回應。
 * SDK 會自動處理重試與指數退避。
 *
 * @param {string} apiKey - 您的 Gemini API Key。
 * @param {string} prompt - 要發送給模型的提示詞。
 * @param {boolean} forceJson - 是否強制使用 JSON 輸出模式。
 * @returns {Promise<string>} AI 生成的文本內容。
 * @throws {Error} 如果 API 請求最終失敗，則拋出錯誤。
 */
async function callGeminiAPI(apiKey, prompt, forceJson = false) {
    
    if (!window.GoogleGenerativeAI) {
        throw new Error("Google AI SDK 尚未載入。");
    }

    try {
        const genAI = new window.GoogleGenerativeAI(apiKey);

        const generationConfig = {
            responseMimeType: forceJson ? "application/json" : "text/plain",
        };
        
        const systemInstruction = {
            role: "system",
            parts: [{ text: "請注意：你必須且只能使用「繁體中文（台灣）」進行回覆，絕對不可以使用簡體中文。"}]
        };

        // ########## UPDATED: USE ALIAS VERSION ##########
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: generationConfig,
            systemInstruction: systemInstruction,
        });

        console.log("Calling Gemini SDK with model: gemini-1.5-flash-latest");
        const result = await model.generateContent(prompt);
        const response = result.response;

        if (response.promptFeedback && response.promptFeedback.blockReason) {
             throw new Error(`請求因安全設定而被阻擋，原因：${response.promptFeedback.blockReason}`);
        }
        
        if (!response.candidates || response.candidates[0].finishReason === 'SAFETY') {
             throw new Error("內容因違反安全政策而被 Google AI 阻擋。請檢查您的原始字幕內容是否包含敏感詞彙。");
        }

        return response.text();

    } catch (error) {
        console.error("Gemini SDK 呼叫失敗:", error);
        throw new Error(translateError(error.message));
    }
}

function translateError(message) {
    if (!message) return "【系統錯誤】未知錯誤";
    
    // 503 / High Demand / Overloaded
    if (message.includes("503") || message.includes("high demand") || message.includes("overloaded") || message.includes("Service Unavailable")) {
        return "【AI 伺服器繁忙 (overloaded)】Gemini API 目前負載過高或正處於全球尖峰時段。這通常是暫時的，請稍候一兩分鐘後重試。";
    }
    
    // 429 / Rate Limit / Quota Exceeded
    if (message.includes("429") || message.includes("Quota exceeded") || message.includes("exhausted") || message.includes("rate limit")) {
        return "【用量已達上限】您的 Gemini API 金鑰已超過每分鐘呼叫次數限制（Rate Limit）或免費額度已用盡。請稍候一分鐘再試，或更換其他金鑰。";
    }
    
    // 400 / 403 / Invalid API Key
    if (message.includes("API key not valid") || message.includes("not valid") || message.includes("invalid") || message.includes("400") || message.includes("403")) {
        return "【無效的金鑰】您輸入的 Gemini API Key 格式不正確或已被停用，請至 Google AI Studio 重新確認並貼上正確的金鑰。";
    }
    
    // Safety
    if (message.includes("SAFETY") || message.includes("blockReason")) {
        return "【內容安全阻擋】由於輸入內容可能包含敏感詞彙，已被 Google AI 的安全過濾機制阻擋。";
    }
    
    // Default
    return `【系統錯誤】${message}`;
}