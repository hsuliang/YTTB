/**
 * tab4-edm.js
 * 負責管理第四分頁「電子報內容生成」的所有 UI 互動與邏輯。
 */

function initializeTab4() {
    // --- 元素選擇 ---
    const generateEdmBtn = document.getElementById('generate-edm-btn');
    const generateEdmVariationBtn = document.getElementById('generate-edm-variation-btn');
    const edmAudienceSelect = document.getElementById('edm-audience');
    const edmStyleSelect = document.getElementById('edm-style');
    const edmPreview = document.getElementById('edm-preview');
    const copyEdmHtmlBtn = document.getElementById('copy-edm-html-btn');
    const edmPlaceholder = document.getElementById('edm-placeholder');
    const edmOutputContainer = document.getElementById('edm-output-container');
    const edmVersionsTabsContainer = document.getElementById('edm-versions-tabs-container');

    // --- 選項資料 ---
    const audienceOptions = {
        'new-subscribers': '新訂閱者',
        'loyal-fans': '老粉絲 / 忠實讀者',
        'potential-customers': '潛在客戶',
        'general-audience': '一般大眾'
    };
    const styleOptions = {
        'knowledge-sharing': '知識分享',
        'promotional-offer': '促銷優惠',
        'story-telling': '故事敘述',
        'quick-update': '快速更新'
    };

    // --- UI 更新函式 ---
    function renderEdmVersionTabs() {
        edmVersionsTabsContainer.innerHTML = '';
        state.edmVersions.forEach((version, index) => {
            const tab = document.createElement('button');
            tab.className = 'tab-btn text-sm py-2 px-4';
            tab.textContent = `版本 ${index + 1}`;
            if (index === state.currentEdmVersionIndex) {
                tab.classList.add('active');
            }
            tab.addEventListener('click', () => switchEdmVersionView(index));
            edmVersionsTabsContainer.appendChild(tab);
        });
    }
    
    function renderCurrentEdmVersionUI() {
        if (state.edmVersions.length === 0) {
            edmOutputContainer.classList.add('hidden');
            edmPlaceholder.classList.remove('hidden');
            generateEdmVariationBtn.disabled = true;
            copyEdmHtmlBtn.classList.add('hidden');
            return;
        }
        
        const currentVersion = state.edmVersions[state.currentEdmVersionIndex];
        if (!currentVersion) return;

        edmPlaceholder.classList.add('hidden');
        edmOutputContainer.classList.remove('hidden');
        edmPreview.innerHTML = currentVersion.htmlContent;
        copyEdmHtmlBtn.classList.remove('hidden');
        generateEdmVariationBtn.disabled = false;
    }

    function switchEdmVersionView(index) {
        state.currentEdmVersionIndex = index;
        renderEdmVersionTabs();
        renderCurrentEdmVersionUI();
    }

    // --- 核心邏輯 ---
    function assembleEdmPrompt(variationModifier = '', shouldOverride = false) { // Changed signature
        const audience = edmAudienceSelect.options[edmAudienceSelect.selectedIndex].text;
        let style = edmStyleSelect.options[edmStyleSelect.selectedIndex].text;
        
        if (variationModifier && shouldOverride) {
            style = '自訂風格 (請依據下方風格指令執行)';
        }
        
        let sourceContent = '';
        // Removed `let variationModifier = '';` as it's now an argument.
        const hasGeneratedBlog = state.blogArticleVersions && state.blogArticleVersions.length > 0;
        const hasOptimizedText = state.optimizedTextForBlog && state.optimizedTextForBlog.trim().length > 0;

        if (hasGeneratedBlog) {
            sourceContent = state.blogArticleVersions[state.currentBlogVersionIndex].htmlContent;
        } else if (hasOptimizedText) {
            sourceContent = `<p>${state.optimizedTextForBlog.replace(/\n/g, '</p><p>')}</p>`;
        } else {
             sourceContent = document.getElementById('smart-area').value;
        }

        if(!sourceContent) {
            showModal({ title: '缺少內容來源', message: '無法找到可用於生成電子報的內容。請先在分頁 1 輸入內容。' });
            return null;
        }

        // Removed the if (isVariation) random modifier block.
        // The variationModifier is now directly passed as an argument.
        
        const prompt = `你是一位專業的 Email 行銷專家與文案寫手。請根據下方提供的 [原始文章]，為 [${audience}] 這個目標群體，撰寫一封風格為 [${style}] 的電子報。
        ${variationModifier ? `\n重要風格指令：${variationModifier}\n` : ''} // Updated conditional based on modifier presence
        請嚴格遵循以下規則：
        1.  **輸出格式**: 必須是乾淨、結構良好的 HTML 格式。
        2.  **主旨 (Subject)**: 在內容的最開始，必須包含一行用 \`<h3>\` 標籤包圍的電子報主旨。例如：<h3>🚀 本週必學的 AI 新技巧！</h3>
        3.  **開頭**: 要有一個吸引人的開頭，親切地問候讀者。
        4.  **內容精簡**: 將 [原始文章] 的核心內容提煉成 2-3 個最重要的觀點或亮點，可以使用條列式清單 (\`<ul><li>...</li></ul>\`) 讓內容更易讀。
        5.  **行動呼籲 (CTA)**: 在結尾處，必須設計一個強而有力的行動呼籲按鈕。請使用 HTML 的 \`<a>\` 標籤來製作這個按鈕，並給它一些基本的內聯 CSS 樣式，使其看起來像一個真實的按鈕（例如：有背景色、圓角、置中等）。CTA 的目標是引導讀者觀看原始影片或閱讀完整文章。
        6.  **個人化**: 在適當的地方（如開頭的問候），可以使用 \`[讀者姓名]\` 這樣的預留位置，方便使用者匯入到他們的電子報系統中。
        7.  **不要包含**：不要在你的回覆中包含 "\`\`\`html" 或任何程式碼區塊的標記，直接輸出純粹的 HTML 內容。

        [原始文章]:
        ---
        ${sourceContent.replace(/<[^>]+>/g, ' ')} 
        ---`;
        return prompt;
    }

    async function handleGenerateEdm(variationModifier = '', shouldOverride = false) { // Changed signature
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            if (window.showApiKeyModal) window.showApiKeyModal();
            return;
        }
        
        const isVariation = variationModifier !== ''; // Derived from variationModifier

        const prompt = assembleEdmPrompt(variationModifier, shouldOverride); // Passed modifier directly
        if (!prompt) return;

        showModal({ title: 'AI 電子報生成中...', showProgressBar: true, taskType: 'edm' });
        const btn = isVariation ? generateEdmVariationBtn : generateEdmBtn; // isVariation is now correct
        btn.disabled = true;
        btn.classList.add('btn-loading');

        try {
            const result = await callGeminiAPI(apiKey, prompt);
            const newVersion = { htmlContent: result };

            if (isVariation) {
                state.edmVersions.push(newVersion);
                state.currentEdmVersionIndex = state.edmVersions.length - 1;
            } else {
                state.edmVersions = [newVersion];
                state.currentEdmVersionIndex = 0;
            }
            
            renderEdmVersionTabs();
            renderCurrentEdmVersionUI();

            hideModal();
            showToast(`電子報 ${isVariation ? '新版本' : ''} 已生成！`, { type: 'success' });

        } catch (error) {
            console.error("電子報生成失敗:", error);
            if (error.message && error.message.includes('overloaded')) {
                showModal({
                    title: 'AI 正在尖峰時段，請稍候！',
                    message: '目前模型負載過高，您可以稍後再試。',
                    buttons: [
                        { text: '關閉', class: 'btn-secondary', callback: hideModal },
                        { text: '立即重試', class: 'btn-primary', callback: () => { hideModal(); handleGenerateEdm(isVariation); } }
                    ]
                });
            } else {
                showModal({ title: '電子報生成失敗', message: `發生錯誤：${error.message}` });
            }
            if (!isVariation) {
                 renderCurrentEdmVersionUI();
            }
        } finally {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
        }
    }

    function copyEdmHtml() {
        if (state.edmVersions.length === 0) return;
        const currentContent = state.edmVersions[state.currentEdmVersionIndex].htmlContent;
        navigator.clipboard.writeText(currentContent).then(() => {
            showToast('HTML 原始碼已複製！');
            copyEdmHtmlBtn.textContent = '已複製!';
            setTimeout(() => { copyEdmHtmlBtn.textContent = '複製 HTML'; }, 2000);
        });
    }

    // --- 事件監聽 ---
    generateEdmBtn.addEventListener('click', () => handleGenerateEdm(false));
    generateEdmVariationBtn.addEventListener('click', () => {
        VariationHub.open('edm', (modifier, shouldOverride) => {
            handleGenerateEdm(modifier, shouldOverride);
        });
    });
    copyEdmHtmlBtn.addEventListener('click', copyEdmHtml);

    // --- 初始化 ---
    populateSelectWithOptions(edmAudienceSelect, audienceOptions);
    populateSelectWithOptions(edmStyleSelect, styleOptions);
    renderCurrentEdmVersionUI();
}