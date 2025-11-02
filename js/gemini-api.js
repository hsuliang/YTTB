/**
 * gemini-api.js
 * 封裝所有與 Google Gemini API 互動的邏輯。
 * 包含自動重試與指數退避策略。
 */

/**
 * 呼叫 Gemini API 並獲取回應。
 * @param {string} apiKey - 您的 Gemini API Key。
 * @param {string} prompt - 要發送給模型的提示詞。
 * @returns {Promise<string>} AI 生成的文本內容。
 * @throws {Error} 如果 API 請求最終失敗，則拋出錯誤。
 */
async function callGeminiAPI(apiKey, prompt) {
    // ### 修改開始 ###
    // 根據您的指定，更新 API 呼叫網址為 gemini-2.5-flash 模型
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    // ### 修改結束 ###
    
    // --- 自動重試與指數退避策略 ---
    const MAX_RETRIES = 3;    // 最多重試 3 次
    let delay = 2000;         // 初始等待 2 秒

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                try {
                    const errorBody = await response.json();
                    if (errorBody.error && errorBody.error.message) {
                        error.message = errorBody.error.message;
                    }
                } catch (e) {
                    // 忽略 non-json 錯誤
                }
                throw error;
            }

            const data = await response.json();
            
            // 檢查 API 回應結構是否符合預期
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                console.log(`Gemini API call successful on attempt ${attempt}.`);
                return data.candidates[0].content.parts[0].text;
            } else {
                // 如果回應結構不符，可能是因為模型被安全設定阻擋
                console.error("API response structure is unexpected. It might be blocked due to safety settings.", data);
                throw new Error("模型未返回有效內容，可能已被安全設定阻擋。");
            }

        } catch (error) {
            console.error(`Gemini API call attempt ${attempt} failed:`, error.message);
            
            const isRetriable = 
                error.status === 503 ||
                error.status === 429 ||
                error.status === 500 ||
                (error.message && error.message.toLowerCase().includes('overloaded'));

            if (isRetriable) {
                if (attempt === MAX_RETRIES) {
                    console.error("Max retries reached. Failing permanently.");
                    throw error; 
                }
                console.warn(`Attempt ${attempt} failed with a retriable error. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                console.error("Non-retriable error encountered. Failing immediately.");
                throw error; 
            }
        }
    }
}