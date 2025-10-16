/**
 * main.js
 * 應用程式主邏輯，負責 DOM 操作、事件監聽與調度。
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 預設資料 ---
    const THEMES = {
        'old-newspaper': '老式報紙',
        'caramel-pudding': '焦糖布丁',
        'muji-style': '無印風格',
        'black-and-white': '純粹黑白',
        'blueberry-pancake': '藍莓鬆餅',
        'lavender-field': '薰衣草田',
        'mint-soda': '薄荷蘇打'
    };
    const PRESET_CTAS = {
        'puchat': {
            title: '噗噗聊聊',
            content: `<h2>喜歡噗噗聊聊嗎？</h2>\n<p>如果你想要了解更多關於教育及<a href="https://bit.ly/PuChatPodcast" target="_blank" rel="noopener">Podcast</a>的內容，歡迎追蹤我們的節目，一起探索教育的無限可能。</p>\n<ul>\n<li><a href="https://bit.ly/PuChatFB">噗噗聊聊粉絲專頁</a></li>\n<li><a href="https://bit.ly/PuChatYT">噗噗聊聊Youtube頻道</a></li>\n<li><a href="https://bit.ly/PuChatPodcast">噗噗聊聊Podcast</a></li>
<li><a href="https://bit.ly/aliangblog">ㄚ亮笑長練功坊Blog</a></li>
</ul>`
        },
        'izakaya': {
            title: '居久屋微醺夜',
            content: `<h2>🎁 喜歡我們的課程嗎？</h2>\n<p>如果你想要學習更多學科教學知識與科技應用，歡迎訂閱謙懿科技Youtube頻道，記得按讚追蹤我們的節目，一起探索教育的無限可能。</p>\n<ul>\n<li>謙懿科技Youtube：<a href="http://www.youtube.com/@morganfang0905" target="_blank">http://www.youtube.com/@morganfang0905</a></li>\n<li>ㄚ亮笑長練功坊Blog：<a href="https://bit.ly/aliangblog" target="_blank">https://bit.ly/aliangblog</a></li>\n</ul>`
        }
    };
    
    // --- AI 提示訊息輪播列表 (新增) ---
    const AI_PROMPT_MESSAGES = {
        chapters: [
            "AI 正在精讀影片內容，定位關鍵時間點...",
            "正在為您的影片**建立強而有力的小標題**...",
            "AI 正在努力思考中... 這可能會需要一點時間 (約 10-30 秒)...",
            "正在與ㄚ亮笑長討論**最佳章節劃分邏輯**...",
            "影片章節結構已完成，正在進行最終格式化...",
            "請保持耐心，AI 正在將您的逐字稿變成導覽地圖！",
        ],
        optimize: [
            "AI 正在仔細傾聽你的逐字稿，**準備修補語句**...",
            "正在為文本加入**更流暢的標點和分段**，保持耐心...",
            "AI 正在努力思考中... **優化深度內容需要較長時間** (約 30-60 秒)...",
            "**語句通順度檢查中**，確保文章口語化且易讀...",
            "正在深度校對錯別字，同時保留您說話的原味...",
            "我們正在請 AI 檢查，**是否有任何句子偷偷跑去放假了**...",
        ],
        blog: [
            "AI 正在將口語轉化為**部落格的專業結構**...",
            "根據您的**人稱與語氣**設定，進行文章重構中...",
            "AI 正在努力思考中... **請保持耐心，內容發想需要較長時間** (約 45-90 秒)...",
            "正在為 SEO 目的**調整段落關鍵字密度**...",
            "文章的結論和 CTA 正在最終定稿，即將完成...",
            "AI 正在為您的文章**建立強而有力的小標題**...",
        ],
        social: [
            "AI 正在為 Facebook, IG, Line **量身打造多種風格文案**...",
            "AI 正在確保**每個平台的語氣都符合目標受眾**...",
            "**最佳化 Hashtags**，讓貼文獲得更多曝光...",
            "正在撰寫**多個行動呼籲版本**，鼓勵粉絲互動...",
            "AI 正在確保您的文案**獲得社群平台的最佳演算法青睞**！",
            "社群貼文的多版本創意發想已進入尾聲...",
        ]
    };
    
    let currentAiTask = null; // 追蹤當前的 AI 任務類型
    let promptInterval = null; // 輪播計時器

    // --- 元素選擇 (通用) ---
    const themeSwatchesContainer = document.querySelector('.theme-swatches-container');
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const apiKeyPanel = document.getElementById('api-key-panel');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');
    const apiKeyCountdown = document.getElementById('api-key-countdown');
    const allTabButtons = document.querySelectorAll('.tab-btn');
    const allTabContents = document.querySelectorAll('.tab-content');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const modalProgressBar = document.getElementById('modal-progress-bar');
    const modalDefaultButtons = document.getElementById('modal-default-buttons');
    const modalCustomButtons = document.getElementById('modal-custom-buttons');
    
    // --- 元素選擇 (選項卡一) ---
    const generateChaptersBtn = document.getElementById('generate-chapters-btn');
    const viewToggleHeader = document.getElementById('view-toggle-header');
    const allViewButtons = document.querySelectorAll('.view-btn');
    const smartAreaContainer = document.getElementById('smart-area-container');
    const smartArea = document.getElementById('smart-area');
    const displayOriginal = document.getElementById('display-original');
    const displayProcessed = document.getElementById('display-processed');
    const fileInput = document.getElementById('file-input');
    const maxCharsSlider = document.getElementById('max-chars-per-line');
    const maxCharsValue = document.getElementById('max-chars-value');
    const mergeShortLinesSlider = document.getElementById('merge-short-lines-threshold');
    const mergeShortLinesValue = document.getElementById('merge-short-lines-value');
    const keepPunctuationCheckbox = document.getElementById('keep-punctuation');
    const fixTimestampsCheckbox = document.getElementById('fix-timestamps');
    const timestampThresholdInput = document.getElementById('timestamp-threshold');
    const processSrtBtn = document.getElementById('process-srt-btn');
    const clearContentBtn = document.getElementById('clear-content-btn');
    const exportSrtBtn = document.getElementById('export-srt-btn');
    const batchReplaceBtn = document.getElementById('batch-replace-btn');

    // --- 元素選擇 (批次取代視窗) ---
    const batchReplaceModal = document.getElementById('batch-replace-modal');
    const closeReplaceModalBtn = document.getElementById('close-replace-modal-btn');
    const addReplaceRuleBtn = document.getElementById('add-replace-rule-btn');
    const replaceOriginalInput = document.getElementById('replace-original-input');
    const replaceReplacementInput = document.getElementById('replace-replacement-input');
    const replaceRulesList = document.getElementById('replace-rules-list');
    const clearAllRulesBtn = document.getElementById('clear-all-rules-btn');

    // --- 元素選擇 (選項卡二) ---
    const tab2Btn = document.getElementById('tab2-btn');
    const optimizeTextForBlogBtn = document.getElementById('optimize-text-for-blog-btn');
    const blogSourceStatus = document.getElementById('blog-source-status');
    const generateBlogBtn = document.getElementById('generate-blog-btn');
    const blogTitleInput = document.getElementById('blog-title');
    const blogYtIdInput = document.getElementById('blog-yt-id');
    const blogPersonaSelect = document.getElementById('blog-persona');
    const blogWordCountSelect = document.getElementById('blog-word-count');
    const blogToneSelect = document.getElementById('blog-tone');
    const ctaPresetSelect = document.getElementById('cta-preset-select');
    const blogCtaTextarea = document.getElementById('blog-cta');
    const blogOutputContainer = document.getElementById('blog-output-container');
    const blogPlaceholder = document.getElementById('blog-placeholder');
    const blogPreview = document.getElementById('blog-preview');
    const seoCopyButtons = document.querySelectorAll('.seo-copy-btn');
    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const downloadMdBtn = document.getElementById('download-md-btn');

    // --- 元素選擇 (選項卡三) ---
    const socialToneSelect = document.getElementById('social-tone-select');
    const generateSocialBtn = document.getElementById('generate-social-btn');
    const socialOutputContainer = document.getElementById('social-output-container');
    const socialPlaceholder = document.getElementById('social-placeholder');
    const socialPostOutputs = {
        facebook: document.getElementById('facebook-post-output'),
        instagram: document.getElementById('instagram-post-output'),
        line: document.getElementById('line-post-output')
    };
    const socialCopyBtn = document.getElementById('social-copy-btn');
    const socialTabBtns = document.querySelectorAll('.social-tab-btn');
    const goToOptimizeBtn = document.getElementById('go-to-optimize-btn');
    const socialObjectiveSelect = document.getElementById('social-objective');
    const socialLengthSelect = document.getElementById('social-length');
    const socialHashtagsInput = document.getElementById('social-hashtags');
    const socialCtaTextarea = document.getElementById('social-cta');
    const socialSourceStatus = document.getElementById('social-source-status');

    // --- 狀態變數 ---
    let originalFileName = ''; 
    let processedSrtResult = ''; 
    let apiKeyCountdownInterval = null;
    let originalContentForPreview = '';
    let optimizedTextForBlog = '';
    let blogArticleContent = '';
    let blogSourceType = 'raw';
    let batchReplaceRules = [];
    let activeSocialTab = 'facebook';

    // --- 函式定義 ---
    
    function applyTheme(themeName) {
        document.body.dataset.theme = themeName;
        localStorage.setItem('selectedTheme', themeName);
        renderThemeSwatches();
    }
    
    function renderThemeSwatches() {
        themeSwatchesContainer.innerHTML = '';
        const currentTheme = localStorage.getItem('selectedTheme') || 'old-newspaper';
        for (const [value, text] of Object.entries(THEMES)) {
            const swatch = document.createElement('div');
            swatch.className = `theme-swatch ${value}`;
            swatch.dataset.themeValue = value;
            swatch.title = text;
            if (value === currentTheme) {
                swatch.classList.add('active');
            }
            swatch.addEventListener('click', () => {
                applyTheme(value);
            });
            themeSwatchesContainer.appendChild(swatch);
        }
    }

    function populateSelectWithOptions(selectElement, options) {
        selectElement.innerHTML = '';
        for (const [value, text] of Object.entries(options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            selectElement.appendChild(option);
        }
    }

    function handleCtaChange() {
        const selected = ctaPresetSelect.value;
        if (selected === 'custom') {
            blogCtaTextarea.value = '';
            blogCtaTextarea.readOnly = false;
            blogCtaTextarea.placeholder = '可在此自訂 CTA，或選擇上方預設';
        } else if (PRESET_CTAS[selected]) {
            blogCtaTextarea.value = PRESET_CTAS[selected].content;
            blogCtaTextarea.readOnly = true;
        }
    }
    
    function openBatchReplaceModal() { 
        batchReplaceModal.classList.remove('hidden'); 
        renderReplaceRules();
    }
    function closeBatchReplaceModal() { 
        batchReplaceModal.classList.add('hidden');
        if (batchReplaceRules.length > 0) {
            processSrtBtn.classList.add('button-flash');
            setTimeout(() => {
                processSrtBtn.classList.remove('button-flash');
            }, 1500);
        }
    }

    function renderReplaceRules() {
        replaceRulesList.innerHTML = '';
        if (batchReplaceRules.length === 0) {
            replaceRulesList.innerHTML = `<p class="p-4 text-center text-[var(--gray-text)]">尚未新增任何取代規則</p>`;
            return;
        }
        batchReplaceRules.forEach((rule, index) => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'rule-item';
            ruleEl.innerHTML = `
                <span class="rule-text font-mono">${rule.original}</span>
                <span>→</span>
                <span class="rule-text font-mono">${rule.replacement}</span>
                <button class="rule-delete-btn" data-index="${index}" title="刪除此規則">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            `;
            replaceRulesList.appendChild(ruleEl);
        });
        updateBatchReplaceButtonStatus();
    }
    
    function updateBatchReplaceButtonStatus() {
        if (batchReplaceRules.length > 0) {
            batchReplaceBtn.textContent = `批次取代 (已設定 ${batchReplaceRules.length} 條)`;
            batchReplaceBtn.classList.add('active');
        } else {
            batchReplaceBtn.textContent = '批次取代';
            batchReplaceBtn.classList.remove('active');
        }
    }

    function addReplaceRule() {
        const original = replaceOriginalInput.value.trim();
        const replacement = replaceReplacementInput.value.trim();
        if (original) {
            batchReplaceRules.push({ original, replacement });
            replaceOriginalInput.value = '';
            replaceReplacementInput.value = '';
            replaceOriginalInput.focus();
            renderReplaceRules();
        }
    }

    function deleteRule(index) {
        batchReplaceRules.splice(index, 1);
        renderReplaceRules();
    }

    function clearAllRules() {
        batchReplaceRules = [];
        renderReplaceRules();
    }

    function setMode(mode) {
        if (mode === 'input') {
            viewToggleHeader.classList.add('hidden');
            smartArea.classList.remove('hidden');
            displayOriginal.classList.add('hidden');
            displayProcessed.classList.add('hidden');
            smartArea.value = '';
            smartArea.placeholder = "請在此貼上 SRT 內容，或將 .srt 檔案拖曳至此處";
        } else if (mode === 'preview') {
            viewToggleHeader.classList.remove('hidden');
            smartArea.classList.add('hidden');
        }
    }
    
    function toggleApiKeyPanel() {
        apiKeyPanel.classList.toggle('open');
        settingsToggleBtn.classList.toggle('open');
    }
    
    // 新增：AI 提示訊息輪播邏輯
    function startPromptRotation(taskType) {
        currentAiTask = taskType;
        let messageIndex = 0;
        const messages = AI_PROMPT_MESSAGES[taskType];
        
        // 確保初始顯示第一條訊息
        modalMessage.textContent = messages[messageIndex];
        
        // 設置計時器，每 4 秒輪播一次
        promptInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            modalMessage.textContent = messages[messageIndex];
        }, 4000);
    }
    
    function stopPromptRotation() {
        if (promptInterval) {
            clearInterval(promptInterval);
            promptInterval = null;
        }
        currentAiTask = null;
    }

    function showModal(options) {
        stopPromptRotation(); // 清除舊的計時器
        
        const { title, message, showCopyButton = false, showProgressBar = false, buttons = [], taskType = null } = options;
        modalTitle.textContent = title;
        modalCopyBtn.classList.toggle('hidden', !showCopyButton);
        modalProgressBar.classList.toggle('hidden', !showProgressBar);
        
        if (showProgressBar) {
            // 如果顯示進度條，則開始訊息輪播
            modalMessage.classList.remove('hidden');
            if (taskType && AI_PROMPT_MESSAGES[taskType]) {
                 startPromptRotation(taskType);
            } else {
                 modalMessage.textContent = "請稍候，AI 正在思考中...";
            }
        } else {
            // 如果不顯示進度條，則顯示靜態訊息
            modalMessage.classList.remove('hidden');
            modalMessage.textContent = message;
        }

        if (buttons.length > 0) {
            modalDefaultButtons.classList.add('hidden');
            modalCustomButtons.classList.remove('hidden');
            modalCustomButtons.innerHTML = '';
            buttons.forEach(btnInfo => {
                const button = document.createElement('button');
                button.textContent = btnInfo.text;
                button.className = `font-bold py-2 px-4 rounded ${btnInfo.class}`;
                button.addEventListener('click', btnInfo.callback);
                modalCustomButtons.appendChild(button);
            });
        } else {
            modalDefaultButtons.classList.remove('hidden');
            modalCustomButtons.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    }

    function hideModal() {
        stopPromptRotation(); // 隱藏時停止輪播
        modal.classList.add('hidden');
    }

    function copyModalContent() {
        const content = modalMessage.textContent;
        navigator.clipboard.writeText(content).then(() => {
            modalCopyBtn.textContent = '已複製！';
            setTimeout(() => {
                modalCopyBtn.textContent = '複製內容';
            }, 2000);
        }).catch(err => {
            console.error('複製失敗: ', err);
            modalCopyBtn.textContent = '複製失敗';
             setTimeout(() => {
                modalCopyBtn.textContent = '複製內容';
            }, 2000);
        });
    }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showModal({ title: '錯誤', message: 'API Key 不能為空。' });
            return;
        }
        
        sessionStorage.setItem('geminiApiKey', apiKey);
        const expiryTime = Date.now() + 2 * 60 * 60 * 1000;
        sessionStorage.setItem('apiKeyExpiry', expiryTime);

        updateApiKeyStatus();
        showModal({ title: '成功', message: 'API Key 已儲存。AI 功能現在已啟用。' });
        if (apiKeyPanel.classList.contains('open')) {
            toggleApiKeyPanel();
        }
    }

    function startApiKeyCountdown() {
        if (apiKeyCountdownInterval) {
            clearInterval(apiKeyCountdownInterval);
        }
        
        const expiryTime = sessionStorage.getItem('apiKeyExpiry');
        if (!expiryTime) {
            apiKeyCountdown.textContent = '';
            return;
        }

        apiKeyCountdownInterval = setInterval(() => {
            const remaining = parseInt(expiryTime, 10) - Date.now();
            if (remaining <= 0) {
                clearInterval(apiKeyCountdownInterval);
                sessionStorage.removeItem('geminiApiKey');
                sessionStorage.removeItem('apiKeyExpiry');
                apiKeyCountdown.textContent = '';
                updateApiKeyStatus();
                showModal({ title: '金鑰已過期', message: '基於安全考量，您的 API Key 已被清除，請重新輸入。' });
                return;
            }

            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remaining / 1000 / 60) % 60);
            const seconds = Math.floor((remaining / 1000) % 60);

            apiKeyCountdown.textContent = `(尚餘 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')})`;
        }, 1000);
    }
    
    function updateApiKeyStatus() {
        const expiry = sessionStorage.getItem('apiKeyExpiry');
        if (expiry && Date.now() > parseInt(expiry, 10)) {
            sessionStorage.removeItem('geminiApiKey');
            sessionStorage.removeItem('apiKeyExpiry');
        }

        const apiKey = sessionStorage.getItem('geminiApiKey');
        const aiButtons = [generateChaptersBtn, optimizeTextForBlogBtn, generateSocialBtn];
        if (apiKey) {
            apiKeyStatus.textContent = '狀態：API Key 已設定，AI 功能已啟用。';
            apiKeyStatus.classList.remove('text-[var(--text-color)]');
            apiKeyStatus.classList.add('text-green-600');
            aiButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = false;
                    if(btn.id === 'generate-social-btn') {
                        btn.className = 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-primary';
                    } else if (btn.id === 'optimize-text-for-blog-btn') {
                        btn.className = 'w-full font-bold py-2 px-4 rounded btn-primary';
                    }
                    else {
                        btn.className = 'font-bold py-2 px-4 rounded btn-primary';
                    }
                }
            });
            startApiKeyCountdown();
        } else {
            apiKeyStatus.textContent = '狀態：尚未設定。AI 功能目前無法使用。';
            apiKeyStatus.classList.add('text-[var(--text-color)]');
            apiKeyStatus.classList.remove('text-green-600');
            aiButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = true;
                    if(btn.id === 'generate-social-btn') {
                        btn.className = 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-disabled';
                    } else {
                        btn.className = 'font-bold py-2 px-4 rounded btn-disabled';
                    }
                }
            });
            if(apiKeyCountdownInterval) clearInterval(apiKeyCountdownInterval);
            apiKeyCountdown.textContent = '';
        }
    }
    
    async function handleAiFeature(type) {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        const content = processedSrtResult.trim() || smartArea.value.trim();
        if (!content) {
            showModal({ title: '錯誤', message: '沒有可用於 AI 處理的字幕內容。' });
            return;
        }
        let prompt;
        if (type === 'chapters') {
            prompt = `你是一個專業的 YouTube 影片剪輯師。請根據以下影片字幕內容，為這部影片生成 YouTube 影片章節。\n規則：\n1. 格式必須是 "時間戳 - 標題" (例如：00:00 - 影片開頭)。\n2. 時間戳必須從 00:00 開始。\n3. 根據影片長度合理分配章節數量，30分鐘內影片最多10個章節，依此類推。\n4. 章節標題需簡潔且能總結該段落的核心內容。\n5. 不要包含前言或結語，直接輸出章節列表。\n\n字幕內容如下：\n---\n${content}\n---`;
            showModal({ title: 'AI 處理中...', showProgressBar: true, taskType: 'chapters' });
            try {
                const result = await callGeminiAPI(apiKey, prompt);
                showModal({ title: 'AI 章節生成 完成', message: result, showCopyButton: true });
            } catch (error) {
                showModal({ title: 'AI 處理失敗', message: `發生錯誤：${error.message}` });
            }
        }
    }

    function confirmUseOptimizedText(text) {
        optimizedTextForBlog = text;
        blogSourceType = 'optimized';
        const statusText = '內容來源：已優化的文本';
        blogSourceStatus.textContent = statusText;
        socialSourceStatus.textContent = statusText;
        blogSourceStatus.classList.add('text-green-600');
        socialSourceStatus.classList.add('text-green-600');
        hideModal();
        showModal({ title: '確認', message: '來源已更新為「優化文本」，現在可以生成部落格與社群貼文了。' });
    }

    async function optimizeTextForBlog() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        const content = smartArea.value.trim();
        if (!content) {
            showModal({ title: '錯誤', message: '請先在「智慧區域」中輸入內容。' });
            return;
        }
        
        const prompt = `你是一位專業的文案編輯。請將以下的 SRT 字幕逐字稿，優化成一篇流暢易讀的純文字文章。\n規則：\n1. 加上適當的標點符號與段落，讓文章更通順。\n2. 絕對不可以改寫、改變原文的語意。\n3. 不可新增任何字幕中沒有的資訊或自己的評論。\n4. 修正明顯的錯別字，但保留口語化的風格。\n5. 移除所有時間戳和行號。\n6. 直接輸出優化後的文章，不要有任何前言或結語。\n\n字幕逐字稿如下：\n---\n${content}\n---`;
        
        showModal({ title: 'AI 優化中...', showProgressBar: true, taskType: 'optimize' });

        try {
            const result = await callGeminiAPI(apiKey, prompt);
            showModal({
                title: '文本優化完成',
                message: result,
                showCopyButton: true,
                buttons: [
                    { text: '取消', class: 'btn-secondary', callback: hideModal },
                    { text: '確認使用此版本', class: 'btn-primary', callback: () => confirmUseOptimizedText(result) }
                ]
            });
        } catch (error) {
            showModal({ title: 'AI 處理失敗', message: `發生錯誤：${error.message}` });
        }
    }
    
    async function proceedGenerateSocialPosts() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        const sourceText = (blogSourceType === 'optimized') ? optimizedTextForBlog : smartArea.value.trim();
        if (!sourceText) {
            showModal({ title: '錯誤', message: '缺少用於生成貼文的來源內容。' });
            return;
        }
        const objective = socialObjectiveSelect.value;
        const length = socialLengthSelect.value;
        const tone = socialToneSelect.value;
        const hashtags = socialHashtagsInput.value;
        const cta = socialCtaTextarea.value;
        
        const prompt = `你是一位專業的社群小編。請根據以下[逐字稿]和指定的[參數]，為 Facebook、Instagram、Line 這三個平台各生成一篇推廣貼文。請嚴格按照指定的格式與分隔標記輸出，不要有任何額外的文字或說明。\n\n[參數]:\n- 貼文目標: ${objective}\n- 貼文長度: ${length}\n- 寫作語氣: ${tone}\n- 指定Hashtags: ${hashtags}\n- 行動呼籲: ${cta}\n\n[FACEBOOK_POST_START]\n(適合 Facebook 的貼文，可包含 Emoji 和 Hashtags)\n[FACEBOOK_POST_END]\n\n[INSTAGRAM_POST_START]\n(適合 Instagram 的貼文，文案較精簡，並在文末附上 5-10 個相關 Hashtags)\n[INSTAGRAM_POST_END]\n\n[LINE_POST_START]\n(適合 Line 的貼文，語氣更口語化、更親切)\n[LINE_POST_END]\n\n[逐字稿]:\n---\n${sourceText}\n---`;

        showModal({ title: 'AI 生成中...', message: '正在為您撰寫三平台社群貼文...', showProgressBar: true, taskType: 'social' });

        try {
            const fullResponse = await callGeminiAPI(apiKey, prompt);
            const fbMatch = fullResponse.match(/\[FACEBOOK_POST_START\]([\s\S]*?)\[FACEBOOK_POST_END\]/);
            const igMatch = fullResponse.match(/\[INSTAGRAM_POST_START\]([\s\S]*?)\[INSTAGRAM_POST_END\]/);
            const lineMatch = fullResponse.match(/\[LINE_POST_START\]([\s\S]*?)\[LINE_POST_END\]/);

            socialPostOutputs.facebook.textContent = fbMatch ? fbMatch[1].trim() : '無法解析 Facebook 貼文。';
            socialPostOutputs.instagram.textContent = igMatch ? igMatch[1].trim() : '無法解析 Instagram 貼文。';
            socialPostOutputs.line.textContent = lineMatch ? lineMatch[1].trim() : '無法解析 Line 貼文。';

            socialPlaceholder.classList.add('hidden');
            socialOutputContainer.classList.remove('hidden');
            switchSocialTab('facebook');
            hideModal();
        } catch (error) {
            showModal({ title: '社群貼文生成失敗', message: `發生錯誤：${error.message}` });
        }
    }

    function generateSocialPosts() {
        if (blogSourceType === 'raw' && smartArea.value.trim()) {
            showModal({
                title: '提醒',
                message: '您尚未優化文本，直接生成可能會影響貼文品質。確定要繼續嗎？',
                buttons: [
                    { text: '取消', class: 'btn-secondary', callback: hideModal },
                    { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateSocialPosts(); } }
                ]
            });
        } else {
            proceedGenerateSocialPosts();
        }
    }

    async function proceedGenerateBlogPost() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        
        const sourceText = (blogSourceType === 'optimized') ? optimizedTextForBlog : smartArea.value.trim();
        if (!sourceText) {
            showModal({ title: '錯誤', message: '缺少文章生成的來源內容。' });
            return;
        }

        const persona = blogPersonaSelect.value;
        const tone = blogToneSelect.value;
        const wordCount = blogWordCountSelect.value;
        const cta = blogCtaTextarea.value;
        const mainTitle = blogTitleInput.value;

        const prompt = `你是一位專業的部落格小編，專門負責將節目逐字稿轉換成格式良好、語氣自然、適合部落格發表的專欄文章。你的身份是[部落格小編]，任務是將節目逐字稿轉換成充滿能量的專欄報導。\n\n你的工作分為兩個部分。請嚴格按照以下格式與分隔標記輸出，不要有任何額外的文字或說明。\n\n[ARTICLE_START]\n請仔細閱讀下方提供的[逐字稿]，並根據以下要求撰寫一篇部落格文章。\n\n- 寫作人稱：${persona}\n- 寫作語氣：${tone}\n- 文章字數：${wordCount}\n- 格式要求：每個段落都需要一個小標題，並用 <h2> 標籤包圍。段落之間必須使用 <hr> 標籤分隔。\n- 文章結尾必須包含以下[宣傳語句]：${cta}\n- 文章前段需自然融入關鍵字但不可過度堆疊。\n[ARTICLE_END]\n\n[SEO_START]\n根據你寫好的文章內容，提供以下 SEO 建議：\n\n- SEO 標題: [請在此生成 SEO 標題]\n- 搜尋描述: [請在此生成一段約 150 字的搜尋描述]\n- 固定網址: [請在此生成小寫英文、單字用-連接的網址]\n- 標籤: [請在此生成用半形逗號,隔開的標籤]\n[SEO_END]\n\n[逐字稿]:\n---\n${sourceText}\n---`;

        showModal({ title: 'AI 生成中...', showProgressBar: true, taskType: 'blog' });

        try {
            const fullResponse = await callGeminiAPI(apiKey, prompt);
            const articleMatch = fullResponse.match(/\[ARTICLE_START\]([\s\S]*?)\[ARTICLE_END\]/);
            let tempArticleContent = articleMatch ? articleMatch[1].trim() : "無法解析文章內容。";
            const ytId = blogYtIdInput.value.trim();
            if (ytId) {
                const youtubeEmbed = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe src="https://www.youtube.com/embed/${ytId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`;
                if (tempArticleContent.includes('<hr>')) {
                    tempArticleContent = tempArticleContent.replace('<hr>', `${youtubeEmbed}\n<hr>`);
                } else {
                    tempArticleContent += `\n${youtubeEmbed}`;
                }
            }
            if(mainTitle) tempArticleContent = `<h1>${mainTitle}</h1>\n` + tempArticleContent;
            blogArticleContent = tempArticleContent;
            blogPreview.innerHTML = blogArticleContent;
            const seoMatch = fullResponse.match(/\[SEO_START\]([\s\S]*?)\[SEO_END\]/);
            if (seoMatch) {
                const seoText = seoMatch[1].trim();
                document.getElementById('seo-title-text').textContent = seoText.match(/SEO 標題: (.*)/)?.[1] || 'N/A';
                document.getElementById('seo-description-text').textContent = seoText.match(/搜尋描述: (.*)/)?.[1] || 'N/A';
                document.getElementById('seo-permalink-text').textContent = seoText.match(/固定網址: (.*)/)?.[1] || 'N/A';
                document.getElementById('seo-tags-text').textContent = seoText.match(/標籤: (.*)/)?.[1] || 'N/A';
            }
            blogPlaceholder.classList.add('hidden');
            blogOutputContainer.classList.remove('hidden');
            hideModal();
        } catch (error) {
            showModal({ title: '文章生成失敗', message: `發生錯誤：${error.message}` });
        }
    }
    
    function generateBlogPost() {
        if (blogSourceType === 'raw' && smartArea.value.trim()) {
            showModal({
                title: '提醒',
                message: '您尚未優化文本，直接生成可能會影響文章品質。確定要繼續嗎？',
                buttons: [
                    { text: '取消', class: 'btn-secondary', callback: hideModal },
                    { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateBlogPost(); } }
                ]
            });
        } else {
            proceedGenerateBlogPost();
        }
    }

    function downloadAsHtml() {
        if(!blogArticleContent) return;
        const content = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>${document.getElementById('seo-title-text').textContent}</title><style>body{font-family:sans-serif;line-height:1.6;} .youtube-embed{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1rem 0;} .youtube-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;}</style></head><body>${blogArticleContent}</body></html>`;
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.getElementById('seo-permalink-text').textContent || 'blog-post'}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function downloadAsMarkdown() {
        if(!blogArticleContent) return;
        let content = blogArticleContent;
        content = content.replace(/<h1>(.*?)<\/h1>/g, '# $1');
        content = content.replace(/<h2>/g, '## ').replace(/<\/h2>/g, '');
        content = content.replace(/<hr>/g, '\n---\n');
        content = content.replace(/<[^>]*>/g, '');
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.getElementById('seo-permalink-text').textContent || 'blog-post'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function formatSrtForDisplay(srtContent, placeholder) {
        if (!srtContent || !srtContent.trim()) {
            return `<span class="text-[var(--gray-text)]">${placeholder}</span>`;
        }
        const blocks = srtContent.trim().split(/\n\s*\n/);
        const formattedBlocks = blocks.map(block => {
            const lines = block.split('\n');
            if (lines.length < 2) return block;
            const index = lines[0];
            const time = lines[1];
            const text = lines.slice(2).join('\n');
            return `${index}\n\n${time}\n\n${text}`;
        });
        return formattedBlocks.join('\n\n\n');
    }
    
    function switchTab(tabId) {
        allTabButtons.forEach(btn => btn.classList.remove('active'));
        allTabContents.forEach(content => content.classList.add('hidden'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
    }

    function switchSocialTab(platform) {
        activeSocialTab = platform;
        socialTabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.socialTab === platform);
        });
        for (const key in socialPostOutputs) {
            socialPostOutputs[key].classList.toggle('hidden', key !== platform);
        }
        socialCopyBtn.classList.remove('hidden');
    }

    function copySocialPost() {
        const targetElement = socialPostOutputs[activeSocialTab];
        if (targetElement && targetElement.textContent) {
            navigator.clipboard.writeText(targetElement.textContent).then(() => {
                const originalText = socialCopyBtn.textContent;
                socialCopyBtn.textContent = '已複製!';
                setTimeout(() => {
                    socialCopyBtn.textContent = '複製內容';
                }, 2000);
            });
        }
    }
    
    function switchView(viewToShow) {
        allViewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.view-btn[data-view="${viewToShow}"]`).classList.add('active');
        if (viewToShow === 'original') {
            displayOriginal.classList.remove('hidden');
            displayProcessed.classList.add('hidden');
        } else {
            displayOriginal.classList.add('hidden');
            displayProcessed.classList.remove('hidden');
        }
    }

    function updateContent(content, fileName = '') {
        smartArea.value = content;
        originalFileName = fileName;
    }

    function handleFile(file) {
        if (!file || (!file.name.endsWith('.srt') && !file.name.endsWith('.txt'))) {
            showModal({ title: '檔案錯誤', message: '請上傳 .srt 或 .txt 格式的檔案。' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileName = file.name.split('.').slice(0, -1).join('.');
            updateContent(e.target.result, fileName);
        };
        reader.readAsText(file);
    }
    
    function clearAllContent() {
        setMode('input');
        originalContentForPreview = '';
        processedSrtResult = '';
        originalFileName = '';
        exportSrtBtn.disabled = true;
        exportSrtBtn.className = 'font-bold py-2 px-4 rounded btn-disabled';
        batchReplaceRules = [];
        updateBatchReplaceButtonStatus();
        
        blogSourceType = 'raw';
        optimizedTextForBlog = '';
        blogArticleContent = '';
        blogSourceStatus.textContent = '內容來源：字幕原始檔';
        socialSourceStatus.textContent = '內容來源：字幕原始檔';
        blogSourceStatus.classList.remove('text-green-600');
        socialSourceStatus.classList.remove('text-green-600');
        blogOutputContainer.classList.add('hidden');
        blogPlaceholder.classList.remove('hidden');
        blogTitleInput.value = '';
        blogYtIdInput.value = '';
        ctaPresetSelect.value = 'custom';
        handleCtaChange();
        
        socialPlaceholder.classList.remove('hidden');
        socialOutputContainer.classList.add('hidden');
        socialCopyBtn.classList.add('hidden');
        for(const key in socialPostOutputs) {
            socialPostOutputs[key].textContent = '';
        }
        socialHashtagsInput.value = '';
        socialCtaTextarea.value = '';

        showModal({ title: '操作成功', message: '所有內容已清除，您可以開始新的任務。' });
    }
    
    function processAndDisplaySrt() {
        const currentSrtContent = smartArea.value.trim();
        if (!currentSrtContent) {
            showModal({ title: '輸入錯誤', message: '沒有可以處理的字幕內容。' });
            return;
        }
        originalContentForPreview = currentSrtContent;
        const options = { 
            maxCharsPerLine: parseInt(maxCharsSlider.value, 10), 
            mergeShortLinesThreshold: parseInt(mergeShortLinesSlider.value, 10),
            keepPunctuation: keepPunctuationCheckbox.checked, 
            fixTimestamps: fixTimestampsCheckbox.checked, 
            timestampThreshold: parseInt(timestampThresholdInput.value, 10), 
            batchReplaceRules: batchReplaceRules 
        };
        
        try {
            const result = processSubtitles(currentSrtContent, options);
            processedSrtResult = result.processedSrt;
            
            setMode('preview');
            displayOriginal.textContent = formatSrtForDisplay(originalContentForPreview, '');
            displayProcessed.textContent = formatSrtForDisplay(processedSrtResult, '');
            switchView('processed');
            
            const reportMsg = `處理完成！\n\n- 批次取代文字: ${result.report.replacementsMade} 處\n- 移除標點符號: ${result.report.punctuationsRemoved} 個\n- 分割長句: ${result.report.linesSplit} 次\n- 合併短句: ${result.report.linesMerged} 次\n- 修復時間間隔: ${result.report.fixedGaps} 處\n- 修復時間重疊: ${result.report.fixedOverlaps} 處`;
            showModal({ title: '字幕處理報告', message: reportMsg });

            exportSrtBtn.disabled = false;
            exportSrtBtn.className = 'font-bold py-2 px-4 rounded btn-success';
        } catch (error) {
            console.error('處理時發生錯誤:', error);
            showModal({ title: '處理失敗', message: `發生未預期的錯誤: ${error.message}` });
        }
    }
    
    function exportSrtFile() {
        if (!processedSrtResult) {
            showModal({ title: '匯出失敗', message: '沒有可供匯出的內容。' });
            return;
        }
        const blob = new Blob([processedSrtResult], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        let fileName = '';
        if (originalFileName) {
            fileName = `${originalFileName}_已處理.srt`;
        } else {
            const date = new Date();
            const yymmdd = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
            fileName = `AliangYTTB_${yymmdd}.srt`;
        }
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function initialize() {
        const personaOptions = {'第一人稱視角': '第一人稱', '第三人稱視角': '第三人稱'};
        const wordCountOptions = {'約 800 字': '約 800 字', '約 1200 字': '約 1200 字', '約 1500 字': '約 1500 字'};
        const toneOptions = {'充滿能量與感染力': '能量感染力', '專業且具權威性': '專業權威', '口語化且親切': '口語親切', '幽默風趣': '幽默風趣'};
        populateSelectWithOptions(blogPersonaSelect, personaOptions);
        populateSelectWithOptions(blogWordCountSelect, wordCountOptions);
        populateSelectWithOptions(blogToneSelect, toneOptions);
        blogWordCountSelect.value = '約 1200 字';

        const ctaOptions = { 'custom': '自訂 CTA', ...Object.fromEntries(Object.entries(PRESET_CTAS).map(([key, value]) => [key, value.title])) };
        populateSelectWithOptions(ctaPresetSelect, ctaOptions);

        const socialObjectiveOptions = {'引導觀看 YouTube': '引導觀看 YouTube', '引導閱讀部落格': '引導閱讀部落格', '引發留言互動': '引發留言互動', '分享核心觀點': '分享核心觀點'};
        const socialLengthOptions = {'簡短': '簡短 (一句話)', '中等': '中等 (一段)', '詳細': '詳細 (多段)'};
        populateSelectWithOptions(socialObjectiveSelect, socialObjectiveOptions);
        populateSelectWithOptions(socialLengthSelect, socialLengthOptions);
        populateSelectWithOptions(socialToneSelect, toneOptions);

        // 新增主題選擇器邏輯
        const savedTheme = localStorage.getItem('selectedTheme') || 'old-newspaper';
        applyTheme(savedTheme);
        renderThemeSwatches();
        
        settingsToggleBtn.addEventListener('click', toggleApiKeyPanel);
        saveApiKeyBtn.addEventListener('click', saveApiKey);
        generateChaptersBtn.addEventListener('click', () => handleAiFeature('chapters'));
        modalCopyBtn.addEventListener('click', copyModalContent);
        allViewButtons.forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
        allTabButtons.forEach(button => button.addEventListener('click', () => !button.disabled && switchTab(button.dataset.tab)));
        modalCloseBtn.addEventListener('click', hideModal);
        
        maxCharsSlider.addEventListener('input', (e) => { maxCharsValue.textContent = e.target.value; });
        mergeShortLinesSlider.addEventListener('input', (e) => { mergeShortLinesValue.textContent = e.target.value; });
        fixTimestampsCheckbox.addEventListener('change', () => {
            timestampThresholdInput.disabled = !fixTimestampsCheckbox.checked;
            timestampThresholdInput.classList.toggle('opacity-50', !fixTimestampsCheckbox.checked);
        });

        smartAreaContainer.addEventListener('dragover', (e) => { e.preventDefault(); smartAreaContainer.classList.add('dragover'); });
        smartAreaContainer.addEventListener('dragleave', (e) => { e.preventDefault(); smartAreaContainer.classList.remove('dragover'); });
        smartAreaContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            smartAreaContainer.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });
        processSrtBtn.addEventListener('click', processAndDisplaySrt);
        clearContentBtn.addEventListener('click', clearAllContent);
        exportSrtBtn.addEventListener('click', exportSrtFile);
        batchReplaceBtn.addEventListener('click', openBatchReplaceModal);
        closeReplaceModalBtn.addEventListener('click', closeBatchReplaceModal);
        addReplaceRuleBtn.addEventListener('click', addReplaceRule);
        clearAllRulesBtn.addEventListener('click', clearAllRules);
        replaceRulesList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.rule-delete-btn');
            if (deleteBtn) {
                deleteRule(parseInt(deleteBtn.dataset.index, 10));
            }
        });
        
        optimizeTextForBlogBtn.addEventListener('click', optimizeTextForBlog);
        generateBlogBtn.addEventListener('click', generateBlogPost);
        downloadHtmlBtn.addEventListener('click', downloadAsHtml);
        downloadMdBtn.addEventListener('click', downloadAsMarkdown);
        ctaPresetSelect.addEventListener('change', handleCtaChange);
        
        goToOptimizeBtn.addEventListener('click', () => switchTab('tab2'));
        generateSocialBtn.addEventListener('click', generateSocialPosts);
        socialCopyBtn.addEventListener('click', copySocialPost);
        socialTabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchSocialTab(btn.dataset.socialTab));
        });

        seoCopyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const targetId = btn.dataset.copyTarget;
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    navigator.clipboard.writeText(targetElement.textContent).then(() => {
                        const originalIcon = btn.innerHTML;
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`;
                        setTimeout(() => {
                            btn.innerHTML = originalIcon;
                        }, 2000);
                    });
                }
            });
        });
        
        updateApiKeyStatus();
        timestampThresholdInput.disabled = !fixTimestampsCheckbox.checked;
        timestampThresholdInput.classList.toggle('opacity-50', !fixTimestampsCheckbox.checked);
    }

    initialize();
});
