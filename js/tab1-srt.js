/**
 * tab1-srt.js
 * 負責管理第一分頁「字幕整理與優化」的所有 UI 互動與邏輯。
 */

// --- 輔助函式 (移至頂層) ---
function setMode(mode) {
    const smartArea = document.getElementById('smart-area');
    const displayOriginal = document.getElementById('display-original');
    const displayProcessed = document.getElementById('display-processed');
    const viewToggleHeader = document.getElementById('view-toggle-header');
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

function updateBatchReplaceButtonStatus() {
    const batchReplaceBtn = document.getElementById('batch-replace-btn');
    if (state.batchReplaceRules.length > 0) {
        batchReplaceBtn.textContent = `批次取代 (已設定 ${state.batchReplaceRules.length} 條)`;
        batchReplaceBtn.classList.add('active');
    } else {
        batchReplaceBtn.textContent = '批次取代';
        batchReplaceBtn.classList.remove('active');
    }
}

// --- 清除函式 ---
function resetTab1() {
    setMode('input'); 
    
    state.originalContentForPreview = '';
    state.processedSrtResult = '';
    state.originalFileName = '';
    
    const exportSrtBtn = document.getElementById('export-srt-btn');
    exportSrtBtn.disabled = true;
    exportSrtBtn.className = 'font-bold py-2 px-4 rounded btn-disabled';
    
    state.batchReplaceRules = [];
    updateBatchReplaceButtonStatus();
}

// --- 初始化函式 ---
function initializeTab1() {
    // --- 元素選擇 ---
    const generateChaptersBtn = document.getElementById('generate-chapters-btn');
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
    const exportSrtBtn = document.getElementById('export-srt-btn');
    const batchReplaceBtn = document.getElementById('batch-replace-btn');
    const batchReplaceModal = document.getElementById('batch-replace-modal');
    const closeReplaceModalBtn = document.getElementById('close-replace-modal-btn');
    const addReplaceRuleBtn = document.getElementById('add-replace-rule-btn');
    const replaceOriginalInput = document.getElementById('replace-original-input');
    const replaceReplacementInput = document.getElementById('replace-replacement-input');
    const replaceRulesList = document.getElementById('replace-rules-list');
    const clearAllRulesBtn = document.getElementById('clear-all-rules-btn');

    // --- 函式定義 ---

    async function handleAiFeature(type) {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        const content = state.processedSrtResult.trim() || smartArea.value.trim();
        if (!content) {
            showModal({ title: '錯誤', message: '沒有可用於 AI 處理的字幕內容。' });
            return;
        }
        if (type === 'chapters') {
            const prompt = `你是一個專業的 YouTube 影片剪輯師。請根據以下影片字幕內容，為這部影片生成 YouTube 影片章節。\n規則：\n1. 格式必須是 "時間戳 - 標題" (例如：00:00 - 影片開頭)。\n2. 時間戳必須從 00:00 開始。\n3. 根據影片長度合理分配章節數量，30分鐘內影片最多10個章節，依此類推。\n4. 章節標題需簡潔且能總結該段落的核心內容。\n5. 不要包含前言或結語，直接輸出章節列表。\n\n字幕內容如下：\n---\n${content}\n---`;
            showModal({ title: 'AI 處理中...', showProgressBar: true, taskType: 'chapters' });
            try {
                const result = await callGeminiAPI(apiKey, prompt);
                showModal({ title: 'AI 章節生成 完成', message: result, showCopyButton: true });
            } catch (error) {
                showModal({ title: 'AI 處理失敗', message: `發生錯誤：${error.message}` });
            }
        }
    }

    function openBatchReplaceModal() { batchReplaceModal.classList.remove('hidden'); renderReplaceRules(); }
    function closeBatchReplaceModal() { if (state.batchReplaceRules.length > 0) { processSrtBtn.classList.add('button-flash'); setTimeout(() => { processSrtBtn.classList.remove('button-flash'); }, 1500); } batchReplaceModal.classList.add('hidden'); }
    
    function renderReplaceRules() {
        replaceRulesList.innerHTML = '';
        if (state.batchReplaceRules.length === 0) {
            replaceRulesList.innerHTML = `<p class="p-4 text-center text-[var(--gray-text)]">尚未新增任何取代規則</p>`;
            return;
        }
        state.batchReplaceRules.forEach((rule, index) => {
            const ruleEl = document.createElement('div');
            ruleEl.className = 'rule-item';
            ruleEl.innerHTML = ` <span class="rule-text font-mono">${rule.original}</span> <span>→</span> <span class="rule-text font-mono">${rule.replacement}</span> <button class="rule-delete-btn" data-index="${index}" title="刪除此規則"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> </button> `;
            replaceRulesList.appendChild(ruleEl);
        });
        updateBatchReplaceButtonStatus();
    }

    function addReplaceRule() {
        const original = replaceOriginalInput.value.trim();
        const replacement = replaceReplacementInput.value.trim();
        if (original) {
            state.batchReplaceRules.push({ original, replacement });
            replaceOriginalInput.value = '';
            replaceReplacementInput.value = '';
            replaceOriginalInput.focus();
            renderReplaceRules();
        }
    }

    function deleteRule(index) {
        state.batchReplaceRules.splice(index, 1);
        renderReplaceRules();
    }

    function clearAllRules() {
        state.batchReplaceRules = [];
        renderReplaceRules();
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
        state.originalFileName = fileName;
    }

    function handleFile(file) {
        if (!file || (!file.name.endsWith('.srt') && !file.name.endsWith('.txt'))) {
            showModal({ title: '檔案錯誤', message: '請上傳 .srt 或 .txt 格式的檔案。' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            updateContent(e.target.result, file.name.split('.').slice(0, -1).join('.'));
        };
        reader.readAsText(file);
    }

    function formatSrtForDisplay(srtContent, placeholder) {
        if (!srtContent || !srtContent.trim()) {
            return `<span class="text-[var(--gray-text)]">${placeholder}</span>`;
        }
        const blocks = srtContent.trim().split(/\n\s*\n/);
        return blocks.map(block => {
            const lines = block.split('\n');
            if (lines.length < 2) return block;
            return `${lines[0]}\n\n${lines[1]}\n\n${lines.slice(2).join('\n')}`;
        }).join('\n\n\n');
    }

    function processAndDisplaySrt() {
        const currentSrtContent = smartArea.value.trim();
        if (!currentSrtContent) {
            showModal({ title: '輸入錯誤', message: '沒有可以處理的字幕內容。' });
            return;
        }
        state.originalContentForPreview = currentSrtContent;
        const options = {
            maxCharsPerLine: parseInt(maxCharsSlider.value, 10),
            mergeShortLinesThreshold: parseInt(mergeShortLinesSlider.value, 10),
            keepPunctuation: keepPunctuationCheckbox.checked,
            fixTimestamps: fixTimestampsCheckbox.checked,
            timestampThreshold: parseInt(timestampThresholdInput.value, 10),
            batchReplaceRules: state.batchReplaceRules
        };
        try {
            const result = processSubtitles(currentSrtContent, options);
            state.processedSrtResult = result.processedSrt;
            setMode('preview');
            displayOriginal.textContent = formatSrtForDisplay(state.originalContentForPreview, '');
            displayProcessed.textContent = formatSrtForDisplay(state.processedSrtResult, '');
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
        if (!state.processedSrtResult) {
            showModal({ title: '匯出失敗', message: '沒有可供匯出的內容。' });
            return;
        }
        const blob = new Blob([state.processedSrtResult], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        let fileName = state.originalFileName ? `${state.originalFileName}_已處理.srt` : `AliangYTTB_${new Date().toISOString().slice(2, 10).replace(/-/g, "")}.srt`;
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- 事件監聽 ---
    generateChaptersBtn.addEventListener('click', () => handleAiFeature('chapters'));
    allViewButtons.forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
    maxCharsSlider.addEventListener('input', (e) => { maxCharsValue.textContent = e.target.value; });
    mergeShortLinesSlider.addEventListener('input', (e) => { mergeShortLinesValue.textContent = e.target.value; });
    fixTimestampsCheckbox.addEventListener('change', () => {
        timestampThresholdInput.disabled = !fixTimestampsCheckbox.checked;
        timestampThresholdInput.classList.toggle('opacity-50', !fixTimestampsCheckbox.checked);
    });
    smartAreaContainer.addEventListener('dragover', (e) => { e.preventDefault(); smartAreaContainer.classList.add('dragover'); });
    smartAreaContainer.addEventListener('dragleave', (e) => { e.preventDefault(); smartAreaContainer.classList.remove('dragover'); });
    smartAreaContainer.addEventListener('drop', (e) => { e.preventDefault(); smartAreaContainer.classList.remove('dragover'); if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });
    processSrtBtn.addEventListener('click', processAndDisplaySrt);
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

    // --- 初始化 ---
    timestampThresholdInput.disabled = !fixTimestampsCheckbox.checked;
    timestampThresholdInput.classList.toggle('opacity-50', !fixTimestampsCheckbox.checked);
}