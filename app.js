document.addEventListener('DOMContentLoaded', () => {
    
    // --- 元素選取 ---
    const globalLoadingOverlay = document.getElementById('global-loading-overlay');
    const apiKeyButton = document.getElementById('api-key-button');
    const apiKeyModal = document.getElementById('api-key-modal');
    const saveApiKeyButton = document.getElementById('save-api-key');
    const cancelApiKeyButton = document.getElementById('cancel-api-key');
    const apiKeyInput = document.getElementById('api-key-input');
    
    // SRT 輸入相關元素
    const srtFileInput = document.getElementById('srt-file-input');
    const srtTextArea = document.getElementById('srt-text-area');
    const srtInputContainer = document.getElementById('srt-input-container');
    const srtUploadLink = document.getElementById('srt-upload-link');
    
    // 字幕處理/預覽元素
    const subtitleContentWrapper = document.getElementById('subtitle-content-wrapper');
    const subtitlePreviewArea = document.getElementById('subtitle-preview-area');
    const subtitlePreviewContainer = document.getElementById('subtitle-preview-container'); // 預覽區父容器
    
    // 主功能按鈕
    const exportSrtButton = document.getElementById('export-srt-button');
    const processSubtitlesButton = document.getElementById('process-subtitles-button');
    const batchReplaceButton = document.getElementById('batch-replace-button');
    const generateChaptersButton = document.getElementById('generate-chapters-button');
    const clearContentButton = document.getElementById('clear-content-button');

    // 字幕處理設定輸入
    const charLimitInput = document.getElementById('char-limit-input');
    const removePunctuationCheckbox = document.getElementById('remove-punctuation-checkbox');
    const gapThresholdInput = document.getElementById('gap-threshold-input');
    const mergeThresholdInput = document.getElementById('merge-threshold-input');
    
    // Modal 相關
    const replaceModal = document.getElementById('replace-modal');
    const replaceRulesContainer = document.getElementById('replace-rules-container');
    const addRuleButton = document.getElementById('add-rule-button');
    const cancelReplaceButton = document.getElementById('cancel-replace-button'); // 修正 ID
    const applyReplaceButton = document.getElementById('apply-replace-button');
    const chaptersModal = document.getElementById('chapters-modal');
    const chaptersModalOutput = document.getElementById('chapters-modal-output');
    const copyChaptersModalButton = document.getElementById('copy-chapters-modal-button');
    const closeChaptersModalButton = document.getElementById('close-chapters-modal-button');
    
    // 報告 Modal
    const reportModal = document.getElementById('report-modal');
    const reportModalOutput = document.getElementById('report-modal-output');
    const closeReportModalButton = document.getElementById('close-report-modal-button');
    const replaceReportModal = document.getElementById('replace-report-modal');
    const replaceReportModalOutput = document.getElementById('replace-report-modal-output');
    const closeReplaceReportModalButton = document.getElementById('close-replace-report-modal-button');

    // 內容產出元素
    const generateBlogButton = document.getElementById('generate-blog-button');
    const blogTitleInput = document.getElementById('blog-title-input');
    const youtubeIdInput = document.getElementById('youtube-id-input');
    const ctaPresetSelect = document.getElementById('cta-preset-select');
    const customCtaContainer = document.getElementById('custom-cta-container');
    const ctaInput = document.getElementById('cta-input');
    const blogPreviewOutput = document.getElementById('blog-preview-output');
    const downloadHtmlButton = document.getElementById('download-html-button');
    const seoTitleOutput = document.getElementById('seo-title-output');
    const permalinkOutput = document.getElementById('permalink-output');
    const descriptionOutput = document.getElementById('description-output');
    const labelsOutput = document.getElementById('labels-output');
    const copySeoTitleButton = document.getElementById('copy-seo-title-button');
    const copyPermalinkButton = document.getElementById('copy-permalink-button');
    const copyDescriptionButton = document.getElementById('copy-description-button');
    const copyLabelsButton = document.getElementById('copy-labels-button');

    // 主選項卡元素
    const tabSubtitleButton = document.getElementById('tab-subtitle-button');
    const tabBlogButton = document.getElementById('tab-blog-button');
    const subtitleTabContent = document.getElementById('subtitle-tab-content');
    const blogTabContent = document.getElementById('blog-tab-content');


    // --- 全域變數 ---
    const API_KEY_STORAGE_KEY = 'gemini_api_key';
    const EXPIRATION_HOURS = 2;
    let originalSubtitles = []; 
    let processedSubtitles = [];
    const PRESET_CTAS = {
        pupu: `<h2>喜歡噗噗聊聊嗎？</h2><p>如果你想要了解更多關於教育及<a href="https://bit.ly/PuChatPodcast" target="_blank" rel="noopener">Podcast</a>的內容，歡迎追蹤我們的節目，一起探索教育的無限可能。</p><ul><li><a href="https://bit.ly/PuChatFB">噗噗聊聊粉絲專頁</a></li><li><a href="https://bit.ly/PuChatYT">噗噗聊聊Youtube頻道</a></li><li><a href="https://bit.ly/PuChatPodcast">噗噗聊聊Podcast</a></li><li><a href="https://bit.ly/aliangblog">ㄚ亮笑長練功坊Blog</a></li></ul>`,
        izakaya: `<h2>🎁 喜歡我們的課程嗎？</h2><p>如果你想要學習更多學科教學知識與科技應用，歡迎訂閱謙懿科技Youtube頻道，記得按讚追蹤我們的節目，一起探索教育的無限可能。</p><ul><li>謙懿科技Youtube：<a href="http://www.youtube.com/@morganfang0905" target="_blank">http://www.youtube.com/@morganfang0905</a></li><li>ㄚ亮笑長練功坊Blog：<a href="https://bit.ly/aliangblog" target="_blank">https://bit.ly/aliangblog</a></li></ul>`
    };

    // --- 初始化 ---
    initializeCta();
    updateButtonStatus();
    // 預設顯示字幕處理頁籤
    showMainTab('subtitle');
    
    // --- 主選項卡邏輯 ---
    function showMainTab(tabName) {
        const isSubtitle = tabName === 'subtitle';

        // 切換內容區塊
        subtitleTabContent.classList.toggle('hidden', !isSubtitle);
        blogTabContent.classList.toggle('hidden', isSubtitle);

        // 切換按鈕樣式 (Subtitle)
        tabSubtitleButton.classList.toggle('border-indigo-600', isSubtitle);
        tabSubtitleButton.classList.toggle('text-indigo-600', isSubtitle);
        tabSubtitleButton.classList.toggle('border-transparent', !isSubtitle);
        tabSubtitleButton.classList.toggle('text-gray-500', !isSubtitle);
        tabSubtitleButton.classList.toggle('hover:border-indigo-600', !isSubtitle);
        tabSubtitleButton.classList.toggle('hover:text-indigo-600', !isSubtitle);

        // 切換按鈕樣式 (Blog)
        tabBlogButton.classList.toggle('border-indigo-600', !isSubtitle);
        tabBlogButton.classList.toggle('text-indigo-600', !isSubtitle);
        tabBlogButton.classList.toggle('border-transparent', isSubtitle);
        tabBlogButton.classList.toggle('text-gray-500', isSubtitle);
        tabBlogButton.classList.toggle('hover:border-indigo-600', isSubtitle);
        tabBlogButton.classList.toggle('hover:text-indigo-600', isSubtitle);
    }
    
    tabSubtitleButton.addEventListener('click', () => showMainTab('subtitle'));
    tabBlogButton.addEventListener('click', () => showMainTab('blog'));

    // --- API 金鑰管理 ---
    apiKeyButton.addEventListener('click', () => apiKeyModal.classList.remove('hidden'));
    cancelApiKeyButton.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
    saveApiKeyButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('API KEY 欄位不可為空！'); return;
        }
        const expirationTime = new Date().getTime() + EXPIRATION_HOURS * 60 * 60 * 1000;
        sessionStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify({ key: apiKey, expires: expirationTime }));
        alert('API KEY 儲存成功！');
        apiKeyInput.value = '';
        apiKeyModal.classList.add('hidden');
        updateButtonStatus();
    });

    function getApiKey() {
        const keyDataString = sessionStorage.getItem(API_KEY_STORAGE_KEY);
        if (!keyDataString) return null;
        const keyData = JSON.parse(keyDataString);
        if (new Date().getTime() > keyData.expires) {
            sessionStorage.removeItem(API_KEY_STORAGE_KEY);
            alert('API KEY 已過期，請重新設定。');
            return null;
        }
        return keyData.key;
    }

    function updateButtonStatus() {
        if (getApiKey()) {
            apiKeyButton.textContent = 'API KEY 已設定';
            apiKeyButton.classList.add('bg-green-600');
        } else {
            apiKeyButton.textContent = '設定 API KEY';
            apiKeyButton.classList.remove('bg-green-600');
        }
    }

    // --- 載入 SRT 內容邏輯 ---

    // 統一處理 SRT 內容的函式
    function loadSrtContent(srtContent) {
        if (!srtContent || srtContent.trim() === '') {
            return;
        }
        try {
            originalSubtitles = parseSrt(srtContent);
            processedSubtitles = []; 
            
            if (originalSubtitles.length === 0) {
                alert('無法解析 SRT 檔案，請確認格式。');
                return;
            }

            // 成功載入，顯示預覽區並隱藏輸入區
            srtInputContainer.classList.add('hidden');
            subtitleContentWrapper.classList.remove('hidden');

            renderSubtitles(originalSubtitles);
            generateChaptersButton.disabled = false;
            generateBlogButton.disabled = false;
        } catch (error) {
            console.error("解析 SRT 檔案時發生錯誤:", error);
            alert('無法解析 SRT 檔案，請確認格式。');
        }
    }

    // 1. 檔案選擇事件 (由點擊連結觸發)
    srtFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => loadSrtContent(e.target.result);
        reader.readAsText(file);
    });

    // 2. 貼上/輸入事件 (監聽 srtTextArea)
    srtTextArea.addEventListener('input', () => {
        loadSrtContent(srtTextArea.value);
    });

    // 3. 拖曳事件 (監聽 srtTextArea)
    // 防止瀏覽器預設行為 (例如開啟檔案)
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        srtTextArea.addEventListener(eventName, preventDefaults, false);
    });

    // 處理放下檔案的邏輯
    srtTextArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.srt')) {
                const reader = new FileReader();
                reader.onload = (event) => loadSrtContent(event.target.result);
                reader.readAsText(file);
            } else {
                alert('請拖曳 .srt 檔案。');
            }
        }
    }, false);


    // 4. 點擊上傳連結事件
    if (srtUploadLink) {
        srtUploadLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            srtFileInput.click();
        });
    }

    function parseSrt(srtContent) {
        const subtitles = [];
        // 清理 BOM 和可能的非預期字元
        const cleanContent = srtContent.replace(/^\uFEFF/, '').trim(); 
        const blocks = cleanContent.split(/\n\s*\n/);
        for (const block of blocks) {
            const lines = block.split('\n').filter(line => line.trim() !== ''); // 移除空行
            if (lines.length >= 2) {
                const id = lines[0].trim();
                // 檢查 ID 是否為數字，避免解析錯誤的塊
                if (isNaN(parseInt(id))) continue; 
                
                const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
                
                if (timeMatch) {
                    // 將 , 替換成 . 以適應標準 SRT 格式
                    const startTime = timeMatch[1].replace('.', ',');
                    const endTime = timeMatch[2].replace('.', ',');
                    
                    subtitles.push({ 
                        id, 
                        startTime, 
                        endTime, 
                        text: lines.slice(2).join('\n').trim() 
                    });
                }
            }
        }
        return subtitles;
    }

    function renderSubtitles(subtitles) {
        subtitlePreviewArea.innerHTML = '';
        if (subtitles.length === 0) {
            subtitlePreviewArea.innerHTML = '<p class="text-gray-400 text-center mt-4">沒有可顯示的字幕內容。</p>';
            return;
        }
        const content = subtitles.map(sub => `${sub.id}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`).join('\n\n');
        subtitlePreviewArea.textContent = content;
    }
    
    // --- 清除內容邏輯 ---
    if (clearContentButton) {
        clearContentButton.addEventListener('click', () => {
            // 清空變數
            originalSubtitles = [];
            processedSubtitles = [];
        
            // 重置 SRT 輸入區
            srtTextArea.value = '';
            
            // 重置預覽區
            subtitlePreviewArea.textContent = '已載入的字幕將顯示於此...';
            
            // 隱藏預覽區，顯示輸入區
            subtitleContentWrapper.classList.add('hidden');
            srtInputContainer.classList.remove('hidden');

            // 清空內容產出工具的輸入
            blogTitleInput.value = '';
            youtubeIdInput.value = '';
            ctaInput.value = localStorage.getItem('youtubeToolboxCta') || ''; // 重置為儲存的 CTA
            
            // 清空 SEO 輸出區
            blogPreviewOutput.innerHTML = `<p class="text-gray-400">文章成品將預覽於此...</p>`;
            seoTitleOutput.value = '';
            permalinkOutput.value = '';
            descriptionOutput.value = '';
            labelsOutput.value = '';

            // 禁用相關按鈕
            generateChaptersButton.disabled = true;
            generateBlogButton.disabled = true;
            downloadHtmlButton.disabled = true;
            
            console.log('所有字幕內容與暫存資料已清除完畢。');
        });
    }

    // --- 批次取代 Modal 輔助函式 ---
    function addNewReplaceRule(findText = '', replaceText = '') {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'flex items-center space-x-2';
        ruleDiv.innerHTML = `<input type="text" placeholder="尋找文字" value="${findText}" class="find-input w-full p-2 border border-gray-300 rounded-md"><span class="text-gray-500">→</span><input type="text" placeholder="取代為" value="${replaceText}" class="replace-input w-full p-2 border border-gray-300 rounded-md"><button class="delete-rule-button bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg text-sm">🗑️</button>`;
        replaceRulesContainer.appendChild(ruleDiv);
        ruleDiv.querySelector('.delete-rule-button').addEventListener('click', () => {
            ruleDiv.remove();
        });
    }

    // --- 批次取代 Modal 邏輯 ---
    batchReplaceButton.addEventListener('click', () => {
        if (replaceRulesContainer.children.length === 0) {
            addNewReplaceRule();
        }
        replaceModal.classList.remove('hidden');
    });
    cancelReplaceButton.addEventListener('click', () => replaceModal.classList.add('hidden'));
    addRuleButton.addEventListener('click', () => addNewReplaceRule());
    
    closeReplaceReportModalButton.addEventListener('click', () => replaceReportModal.classList.add('hidden')); // 關閉報告按鈕

    applyReplaceButton.addEventListener('click', () => {
        const subsForReplacing = processedSubtitles.length > 0 ? JSON.parse(JSON.stringify(processedSubtitles)) : JSON.parse(JSON.stringify(originalSubtitles));
        if (subsForReplacing.length === 0) {
            alert('請先載入字幕檔再執行取代。');
            return;
        }
        const rules = [];
        const ruleElements = replaceRulesContainer.querySelectorAll('.flex.items-center');
        ruleElements.forEach(el => {
            const find = el.querySelector('.find-input').value;
            const replace = el.querySelector('.replace-input').value;
            if (find) {
                rules.push({ find, replace });
            }
        });
        if (rules.length === 0) {
            alert('沒有設定任何有效的取代規則。');
            return;
        }
        let totalReplacements = 0;
        subsForReplacing.forEach(sub => {
            rules.forEach(rule => {
                const findStr = rule.find;
                // 使用 while 迴圈確保替換所有出現的次數並計數
                let count = 0;
                let currentText = sub.text;
                while(currentText.includes(findStr)) {
                    currentText = currentText.replace(findStr, rule.replace);
                    count++;
                }
                sub.text = currentText;
                totalReplacements += count;
            });
        });
        processedSubtitles = subsForReplacing;
        renderSubtitles(processedSubtitles);
        replaceModal.classList.add('hidden');
        
        // 顯示批次取代報告 Modal
        replaceReportModalOutput.textContent = `共取代了 ${totalReplacements} 處文字。`;
        replaceReportModal.classList.remove('hidden');
    });

    // --- 核心處理邏輯 ---
    processSubtitlesButton.addEventListener('click', () => {
        if (originalSubtitles.length === 0) {
            alert('請先載入一個 SRT 檔案。');
            return;
        }
        
        // 使用 processedSubtitles 作為起點，若沒有則使用 original
        let subsToProcess = processedSubtitles.length > 0 ? JSON.parse(JSON.stringify(processedSubtitles)) : JSON.parse(JSON.stringify(originalSubtitles));
        
        const report = { linesSplit: 0, punctuationRemoved: 0, gapsFixed: 0, leadingPunctuationFixed: 0, shortLinesMerged: 0 };
        
        // 取得設定參數
        const charLimit = parseInt(charLimitInput.value, 10) || 0;
        const gapThreshold = parseInt(gapThresholdInput.value, 10) || 0;
        const mergeThreshold = parseInt(mergeThresholdInput.value, 10) || 0;
        const shouldRemovePunctuation = removePunctuationCheckbox.checked;

        // 1. [執行] 每行字數限制
        if (charLimit > 0) {
            const originalLength = subsToProcess.length;
            subsToProcess = splitSubtitlesByCharLimit(subsToProcess, charLimit);
            report.linesSplit = subsToProcess.length - originalLength;
        }

        // 2. [執行] 修復時間軸間隔
        if (gapThreshold > 0) {
            for (let i = 1; i < subsToProcess.length; i++) {
                const prevSub = subsToProcess[i - 1];
                const currentSub = subsToProcess[i];
                const prevEndTimeMs = timeToMs(prevSub.endTime);
                let currentStartTimeMs = timeToMs(currentSub.startTime);
                const gap = currentStartTimeMs - prevEndTimeMs;
                
                // 檢查是否需要修復 (間隔小於閾值或重疊)
                if (gap <= gapThreshold) {
                    // 將當前行的開始時間設為前一行結束時間 + 1ms (確保不重疊) 或 + 閾值
                    currentStartTimeMs = prevEndTimeMs + 1; 
                    currentSub.startTime = msToTime(currentStartTimeMs);
                    report.gapsFixed++;
                }
            }
        }
        
        // 3. [執行] 合併短行
        if (mergeThreshold > 0) {
            const originalLength = subsToProcess.length;
            subsToProcess = mergeShortSubtitles(subsToProcess, mergeThreshold);
            report.shortLinesMerged = originalLength - subsToProcess.length;
        }
        
        // 4. [執行] 移除標點符號
        if (shouldRemovePunctuation) {
             const punctuationRegex = /[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"“”。，、？！：；]/g;
             subsToProcess.forEach(sub => {
                const originalText = sub.text;
                const newText = originalText.replace(punctuationRegex, "").trim();
                if (originalText !== newText) {
                    report.punctuationRemoved++;
                }
                sub.text = newText;
            });
        }
        
        // 5. [執行] 修復行首標點符號 (僅在不移除標點符號時執行)
        if (!shouldRemovePunctuation) {
            const leadingPunctuation = /^[.,?!;:“”'\])。，、？！：；]/;
            for (let i = 1; i < subsToProcess.length; i++) {
                if (leadingPunctuation.test(subsToProcess[i].text)) {
                    // 將第 i 行開頭的標點符號移到第 i-1 行結尾
                    subsToProcess[i - 1].text += subsToProcess[i].text[0];
                    subsToProcess[i].text = subsToProcess[i].text.substring(1).trim();
                    report.leadingPunctuationFixed++;
                }
            }
        }

        // 整理結果
        processedSubtitles = subsToProcess.map((sub, index) => ({ ...sub, id: String(index + 1) }));
        renderSubtitles(processedSubtitles);

        // 生成報告訊息
        let reportMessage = "字幕處理完成！\n\n--- 處理報告 ---\n";
        if (charLimit > 0) reportMessage += `✒️ 因字數限制，新增了 ${report.linesSplit} 行字幕。\n`;
        if (gapThreshold > 0) reportMessage += `⏱️ 修正了 ${report.gapsFixed} 處時間軸間隔。\n`;
        if (mergeThreshold > 0) reportMessage += `🔗 合併了 ${report.shortLinesMerged} 個過短的字幕行。\n`;
        if (shouldRemovePunctuation) reportMessage += `🗑️ 統計：共處理 ${report.punctuationRemoved} 行字幕的標點符號。\n`;
        if (!shouldRemovePunctuation) reportMessage += `🧐 修正了 ${report.leadingPunctuationFixed} 處行首標點符號。\n`;
        reportMessage += `\n請檢查字幕預覽區的結果。`;

        // 顯示報告 Modal
        reportModalOutput.textContent = reportMessage;
        reportModal.classList.remove('hidden');
    });
    
    // --- Modal 關閉邏輯 ---
    closeReportModalButton.addEventListener('click', () => reportModal.classList.add('hidden'));
    closeReplaceReportModalButton.addEventListener('click', () => replaceReportModal.classList.add('hidden'));
    
    // --- AI 章節生成邏輯 ---
    generateChaptersButton.addEventListener('click', async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert('請先設定您的 Gemini API KEY。');
            apiKeyModal.classList.remove('hidden');
            return;
        }
        const subsToUse = processedSubtitles.length > 0 ? processedSubtitles : originalSubtitles;
        if (subsToUse.length === 0) {
            alert('請先載入字幕檔。');
            return;
        }
        globalLoadingOverlay.classList.remove('hidden');
        try {
            const transcript = subsToUse.map(sub => `[${sub.startTime}] ${sub.text.replace(/\n/g, ' ')}`).join('\n');
            const prompt = `你是一位專業的 YouTube 影片內容分析師。請根據以下帶有時間戳的逐字稿，找出影片中的關鍵主題轉折點，並產生一份 YouTube 影片章節列表。請嚴格遵守以下格式：每一行都是 HH:MM:SS - 章節標題，且第一個章節必須從 00:00:00 開始。請不要包含任何額外的解釋或開頭結語。逐字稿如下：\n\n${transcript}`;
            const result = await callGeminiAPI(prompt, apiKey);
            chaptersModalOutput.textContent = result.trim();
            chaptersModal.classList.remove('hidden');
        } catch (error) {
            alert(`章節生成失敗：\n${error.message}`);
            console.error('章節生成失敗:', error);
        } finally {
            globalLoadingOverlay.classList.add('hidden');
        }
    });

    closeChaptersModalButton.addEventListener('click', () => {
        chaptersModal.classList.add('hidden');
    });

    copyChaptersModalButton.addEventListener('click', () => {
        const textToCopy = chaptersModalOutput.textContent;
        // 為了相容性使用 document.execCommand
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        } catch (err) {
            navigator.clipboard.writeText(textToCopy); // 嘗試使用現代 API 作為後備
        }
        
        const originalText = copyChaptersModalButton.textContent;
        copyChaptersModalButton.textContent = '已複製!';
        setTimeout(() => {
            copyChaptersModalButton.textContent = originalText;
        }, 2000);
    });
    
    // --- AI 部落格文章生成邏輯 ---
    ctaPresetSelect.addEventListener('change', handleCtaSelection);
    ctaInput.addEventListener('input', () => {
        if (ctaPresetSelect.value === 'custom') {
            localStorage.setItem('youtubeToolboxCta', ctaInput.value);
        }
    });

    function initializeCta() {
        ctaPresetSelect.value = 'pupu';
        handleCtaSelection();
    }

    function handleCtaSelection() {
        const selection = ctaPresetSelect.value;
        if (selection === 'custom') {
            customCtaContainer.style.display = 'block';
            ctaInput.value = localStorage.getItem('youtubeToolboxCta') || '';
        } else {
            customCtaContainer.style.display = 'none';
        }
    }

    generateBlogButton.addEventListener('click', async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert('請先設定您的 Gemini API KEY。');
            apiKeyModal.classList.remove('hidden');
            return;
        }
        const subsToUse = processedSubtitles.length > 0 ? processedSubtitles : originalSubtitles;
        if (subsToUse.length === 0) {
            alert('請先載入字幕檔。');
            return;
        }
        const title = blogTitleInput.value.trim();
        const videoId = youtubeIdInput.value.trim();
        if (!title || !videoId) {
            alert('請務必填寫「文章主題」和「YouTube 影片 ID」。');
            return;
        }
        
        let ctaHtml = '';
        const ctaSelection = ctaPresetSelect.value;
        if (ctaSelection === 'custom') {
            ctaHtml = ctaInput.value.trim().replace(/\n/g, '<br>');
        } else {
            ctaHtml = PRESET_CTAS[ctaSelection];
        }

        globalLoadingOverlay.classList.remove('hidden');
        generateBlogButton.disabled = true;
        downloadHtmlButton.disabled = true;

        try {
            const transcript = subsToUse.map(sub => sub.text).join(' ');
            
            // 最新且包含結構化標籤的提示詞
            const systemPrompt = `你是一位專業的部落格小編，負責將節目逐字稿轉換成格式良好、語氣自然、適合部落格發表的專欄文章。它將作為[部落格小編]，專門負責將節目逐字稿轉換成充滿能量的[第一人稱]專欄報導。請務必使用以下結構化標籤包圍輸出：<BLOG_CONTENT>...</BLOG_CONTENT>、<SEO_TITLE>...</SEO_TITLE>、<PERMALINK>...</PERMALINK>、<DESCRIPTION>...</DESCRIPTION>、<LABELS>...</LABELS>。

它的工作分為兩個部分：
第一部分：撰寫 Blog
- 仔細閱讀完整逐字稿後撰文
- 使用第一人稱視角
- 語氣需充滿能量與感染力
- 約 1000 字
- 每個段落要有一個小標題，請用 <h2> 標籤包圍
- 段落之間以 <hr> 清楚劃分
- 結尾加入使用者提供的[宣傳語句]：
${ctaHtml}

第二部分：處理 SEO
- 根據文章內容撰寫 SEO 標題與 permalink（小寫英文，單字用 - 連接）
- 撰寫一段 Search Description
- 加入合適標籤（Labels），標籤請用半形的逗號[,]隔開
- 文章前段需自然融入關鍵字但不可過度堆疊

請根據以下逐字稿和文章主題來撰寫內容：
文章主題: ${title}
逐字稿: ${transcript}`;
            
            const aiResponse = await callGeminiAPI(systemPrompt, apiKey);
            
            // 由於 API 可能會返回純文本而非標準 JSON 結構，我們使用正則表達式來解析內容
            const blogContent = parseContent(aiResponse, 'BLOG_CONTENT');
            const seoTitle = parseContent(aiResponse, 'SEO_TITLE');
            const permalink = parseContent(aiResponse, 'PERMALINK');
            const description = parseContent(aiResponse, 'DESCRIPTION');
            const labels = parseContent(aiResponse, 'LABELS');
            
            // 組裝最終 HTML (CTA 已經包含在 BLOG_CONTENT 內，所以不需額外添加)
            const finalHtml = `<h1>${title}</h1><div class="my-4" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;"><iframe src="https://www.youtube.com/embed/${videoId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>${blogContent}`;
            
            blogPreviewOutput.innerHTML = finalHtml;
            seoTitleOutput.value = seoTitle;
            permalinkOutput.value = permalink;
            descriptionOutput.value = description;
            labelsOutput.value = labels;

            downloadHtmlButton.disabled = false;
        } catch (error) {
            blogPreviewOutput.innerHTML = `<p class="text-red-500">文章生成失敗：${error.message}</p>`;
        } finally {
            globalLoadingOverlay.classList.add('hidden');
            generateBlogButton.disabled = false;
        }
    });

    downloadHtmlButton.addEventListener('click', () => {
        const title = blogTitleInput.value.trim() || 'blog-post';
        const fullHtmlContent = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 20px auto; padding: 0 15px; } h1 { color: #111; } h2 { color: #222; border-bottom: 1px solid #eee; padding-bottom: 5px; } iframe { max-width: 100%; }</style></head><body>${blogPreviewOutput.innerHTML}</body></html>`;
        const blob = new Blob([fullHtmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- 輔助函式 ---
    function parseContent(text, key) {
        // 使用正則表達式解析結構化標籤 <TAG>content</TAG>
        const regex = new RegExp(`<${key}>(.*?)</${key}>`, 's');
        const match = text.match(regex);
        return match ? match[1].trim() : `無法解析 ${key} 內容`; 
    }

    // AI 呼叫，加入指數退避
    async function callGeminiAPI(prompt, apiKey, maxRetries = 5) {
        const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";
        let attempt = 0;
        
        while (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // 1s, 2s, 4s... + jitter
            
            try {
                const response = await fetch(`${API_URL}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 8192,
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 429 || response.status >= 500) {
                         // 429 Too Many Requests or 5xx Server Error -> retry
                        console.warn(`API 請求失敗 (狀態碼: ${response.status})，將在 ${Math.round(delay / 1000)} 秒後重試...`);
                        attempt++;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue; // 進入下一次迴圈重試
                    } else {
                        // 4xx Client Error (e.g., 400 Bad Request) -> do not retry
                        throw new Error(`API 請求失敗: ${errorData.error?.message || response.statusText}`);
                    }
                }
                
                const data = await response.json();
                if (!data.candidates || data.candidates.length === 0) {
                    if (data.promptFeedback && data.promptFeedback.blockReason) {
                        throw new Error(`請求被阻擋，原因：${data.promptFeedback.blockReason}`);
                    }
                    throw new Error('API 回應中未包含有效的候選結果。');
                }
                const text = data.candidates[0]?.content?.parts[0]?.text;
                if (!text) {
                     console.error('API 回應異常:', data);
                    throw new Error('從 API 回應中找不到有效的文字內容。');
                }
                return text; // 成功返回
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw error; // 達到最大重試次數，拋出錯誤
                }
                // 處理網絡錯誤
                attempt++;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error("API 請求重試失敗，請檢查網路連線或 API Key。");
    }

    function mergeShortSubtitles(subtitles, threshold) {
        if (subtitles.length < 2) return subtitles;
        const mergedSubtitles = [];
        let i = 0;
        while (i < subtitles.length) {
            let currentSub = subtitles[i];
            
            // 檢查是否符合合併條件 (長度 <= 閾值 且 不是最後一行)
            if (currentSub.text.trim().length <= threshold && i < subtitles.length - 1) {
                let nextSub = subtitles[i + 1];
                
                // 建立新的合併字幕行
                const newMergedSub = {
                    id: currentSub.id,
                    startTime: currentSub.startTime,
                    endTime: nextSub.endTime,
                    text: (currentSub.text.trim() + " " + nextSub.text.trim()).trim()
                };
                mergedSubtitles.push(newMergedSub);
                i += 2; // 跳過下一行
            } else {
                mergedSubtitles.push(currentSub);
                i += 1;
            }
        }
        return mergedSubtitles;
    }

    function intelligentSplit(text, limit) {
        const lines = [];
        let currentText = text;
        
        while (currentText.length > limit) {
            let splitPos = limit;
            
            // 嘗試在限制範圍內尋找最近的空格或標點作為分割點
            let idealSplitPos = -1;
            for (let j = limit; j >= 0; j--) {
                const char = currentText[j];
                // 優先在中文標點或空格處分割
                if (/\s|[。，、？！：；]/.test(char)) {
                    idealSplitPos = j;
                    break;
                }
            }
            
            if (idealSplitPos > 0) {
                splitPos = idealSplitPos;
                lines.push(currentText.substring(0, splitPos).trim());
                currentText = currentText.substring(splitPos).trim();
            } else {
                // 如果找不到理想分割點，則硬性分割
                lines.push(currentText.substring(0, limit));
                currentText = currentText.substring(limit).trim(); // 硬分割後移除頭部空白
            }
        }
        if (currentText.length > 0) {
            lines.push(currentText);
        }
        return lines;
    }

    function splitSubtitlesByCharLimit(subtitles, limit) {
        let newSubtitles = [];
        subtitles.forEach(sub => {
            const originalText = sub.text.replace(/\n/g, ' ').trim();
            if (originalText.length <= limit) {
                newSubtitles.push(sub);
            } else {
                const chunks = intelligentSplit(originalText, limit);
                const startTimeMs = timeToMs(sub.startTime);
                const endTimeMs = timeToMs(sub.endTime);
                const durationMs = endTimeMs - startTimeMs;
                
                // 如果持續時間過短 (<= 0)，則直接將所有 chunks 放在同一行 (通常不發生)
                if (durationMs <= 0) {
                    sub.text = chunks.join('\n');
                    newSubtitles.push(sub);
                    return;
                }
                
                const charsPerMs = originalText.length / durationMs;
                let currentStartTimeMs = startTimeMs;
                
                chunks.forEach((chunk, index) => {
                    const chunkDurationMs = Math.round(chunk.length / charsPerMs);
                    let newEndTimeMs = currentStartTimeMs + chunkDurationMs;
                    
                    // 確保最後一個 chunk 的結束時間等於原始結束時間
                    if (index === chunks.length - 1) {
                         newEndTimeMs = endTimeMs;
                    } else if (newEndTimeMs > endTimeMs) {
                        // 防止時間超出
                        newEndTimeMs = endTimeMs;
                    }
                    
                    newSubtitles.push({
                        id: '...', // 暫時 ID
                        startTime: msToTime(currentStartTimeMs),
                        endTime: msToTime(newEndTimeMs),
                        text: chunk
                    });
                    
                    // 下一個 chunk 從當前結束時間開始
                    currentStartTimeMs = newEndTimeMs; 
                });
            }
        });
        
        // 重新編號
        return newSubtitles.map((sub, index) => ({ ...sub, id: String(index + 1) }));
    }

    function timeToMs(timeStr) {
        // 確保支援 SRT 常見的時間格式: HH:MM:SS,ms
        const [hms, ms] = timeStr.replace('.', ',').split(',');
        const [h, m, s] = hms.split(':').map(Number);
        return (h * 3600 + m * 60 + s) * 1000 + Number(ms);
    }

    function msToTime(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;
        let milliseconds = ms % 1000;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    }

    // --- 匯出 SRT 檔案邏輯 --
    exportSrtButton.addEventListener('click', () => {
        const subsToExport = processedSubtitles.length > 0 ? processedSubtitles : originalSubtitles;
        
        if (subsToExport.length === 0) {
            alert('沒有可匯出的字幕。');
            return;
        }

        const srtContent = subsToExport.map(sub => {
            return `${sub.id}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`;
        }).join('\n\n');

        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_subtitles_${new Date().getTime()}.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});