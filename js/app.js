/**
 * app.js
 * 應用程式主邏輯，負責初始化各模組與處理全域事件。
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 元素選擇 ---
    const appearanceBtn = document.getElementById('appearance-btn');
    const appearancePanel = document.getElementById('appearance-panel');
    const apiKeyBtn = document.getElementById('api-key-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const closeApiKeyModalBtn = document.getElementById('close-api-key-modal-btn');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');
    const apiKeyCountdown = document.getElementById('api-key-countdown');
    const allTabButtons = document.querySelectorAll('.tab-btn');
    const allTabContents = document.querySelectorAll('.tab-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const resetAppBtn = document.getElementById('reset-app-btn');

    // --- 全域函式 ---

    // ########## REFACTORED ##########
    window.updateAiButtonStatus = function() {
        const hasContent = document.getElementById('smart-area').value.trim().length > 0;
        const hasApiKey = !!sessionStorage.getItem('geminiApiKey');
        
        const isAiDisabled = !hasContent || !hasApiKey;
        let tooltip = '';
        if (isAiDisabled) {
            if (!hasContent && !hasApiKey) tooltip = '請先輸入內容並設定 API Key';
            else if (!hasContent) tooltip = '請先貼上字幕內容';
            else tooltip = '請先設定 API Key';
        }

        const updateButtonState = (btn, defaultTitle, isDisabled, customTooltip) => {
            if (btn) {
                btn.disabled = isDisabled;
                btn.title = isDisabled ? (customTooltip || tooltip) : defaultTitle;
                
                let baseClasses = btn.className.split(' ').filter(c => !['btn-primary', 'btn-disabled'].includes(c)).join(' ');
                btn.className = `${baseClasses} ${isDisabled ? 'btn-disabled' : 'btn-primary'}`;
            }
        };

        // Tab 1 AI buttons
        updateButtonState(document.getElementById('generate-summary-btn'), '生成摘要', isAiDisabled);
        updateButtonState(document.getElementById('generate-chapters-btn'), '生成章節', isAiDisabled);
        
        // ########## CRITICAL FIX START ##########
        // 優化文本按鈕的邏輯修正
        const optimizeBtn = document.getElementById('optimize-text-for-blog-btn');
        if(optimizeBtn) {
            optimizeBtn.disabled = isAiDisabled;
            optimizeBtn.title = isAiDisabled ? tooltip : '使用 AI 將逐字稿優化為流暢文章 (建議)';
            if (isAiDisabled) {
                optimizeBtn.classList.remove('btn-primary');
                optimizeBtn.classList.add('btn-disabled');
            } else {
                optimizeBtn.classList.remove('btn-disabled');
                optimizeBtn.classList.add('btn-primary');
            }
        }
        // ########## CRITICAL FIX END ##########

        // Tab 2, 3, 4 Main AI buttons
        updateButtonState(document.getElementById('generate-blog-btn'), '生成部落格文章', isAiDisabled);
        updateButtonState(document.getElementById('generate-social-btn'), '生成社群貼文', isAiDisabled);
        updateButtonState(document.getElementById('generate-edm-btn'), '生成電子報內容', isAiDisabled);

        // 處理 Variation 按鈕的禁用狀態
        const blogVariationBtn = document.getElementById('generate-blog-variation-btn');
        if(blogVariationBtn) blogVariationBtn.disabled = state.blogArticleVersions.length === 0;

        const socialVariationBtn = document.getElementById('generate-social-variation-btn');
        if(socialVariationBtn) socialVariationBtn.disabled = state.socialPostVersions.length === 0;
        
        const edmVariationBtn = document.getElementById('generate-edm-variation-btn');
        if(edmVariationBtn) edmVariationBtn.disabled = state.edmVersions.length === 0;
    }
    
    window.updateSourceStatusUI = function() {
        const hasOptimizedText = state.optimizedTextForBlog && state.optimizedTextForBlog.trim().length > 0;
        const hasGeneratedBlog = state.blogArticleVersions && state.blogArticleVersions.length > 0;
        
        let sourceType = 'raw';
        if (hasGeneratedBlog) sourceType = 'blog';
        else if (hasOptimizedText) sourceType = 'optimized';

        const statusMap = {
            raw: '內容來源：字幕原始檔',
            optimized: '✔️ 內容來源：已優化的文本',
            blog: '🏆 內容來源：已生成的部落格文章 (品質最佳)'
        };

        const buttonMap = {
            raw: { text: '🚀 優化文本以提升品質', action: () => optimizationService.optimizeSourceText() },
            optimized: { text: '📝 前往生成部落格 (可選)', action: () => window.switchTab('tab2') },
        };

        const updateElements = (prefix) => {
            const statusEl = document.getElementById(`${prefix}-source-status`);
            const buttonEl = document.getElementById(`${prefix}-go-to-optimize-btn`);

            if (statusEl) {
                statusEl.innerHTML = statusMap[sourceType];
                statusEl.classList.toggle('text-green-600', sourceType !== 'raw');
            }
            if (buttonEl) {
                if (sourceType === 'blog') {
                    buttonEl.classList.add('hidden');
                } else {
                    buttonEl.textContent = buttonMap[sourceType].text;
                    buttonEl.onclick = buttonMap[sourceType].action;
                    buttonEl.classList.remove('hidden');
                }
            }
        };

        ['blog', 'social', 'edm'].forEach(updateElements);
    }

    function toggleAppearancePanel() { appearancePanel.classList.toggle('hidden'); }
    function showApiKeyModal() { apiKeyModal.classList.remove('hidden'); }
    function hideApiKeyModal() { apiKeyModal.classList.add('hidden'); }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) { showToast('API Key 不能為空。', {type: 'error'}); return; }
        sessionStorage.setItem('geminiApiKey', apiKey);
        const expiryTime = Date.now() + 2 * 60 * 60 * 1000;
        sessionStorage.setItem('apiKeyExpiry', expiryTime);
        updateApiKeyStatus();
        showToast('API Key 已儲存，AI 功能已啟用！');
        hideApiKeyModal();
    }

    function startApiKeyCountdown() {
        if (state.apiKeyCountdownInterval) { clearInterval(state.apiKeyCountdownInterval); }
        const expiryTime = sessionStorage.getItem('apiKeyExpiry');
        if (!expiryTime) { apiKeyCountdown.textContent = ''; return; }
        apiKeyCountdown.textContent = '金鑰有效。';
        state.apiKeyCountdownInterval = setInterval(() => {
            const remaining = parseInt(expiryTime, 10) - Date.now();
            if (remaining <= 0) {
                clearInterval(state.apiKeyCountdownInterval);
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
            apiKeyCountdown.textContent = `金鑰有效，尚餘 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    function updateApiKeyStatus() {
        const expiry = sessionStorage.getItem('apiKeyExpiry');
        if (expiry && Date.now() > parseInt(expiry, 10)) {
            sessionStorage.removeItem('geminiApiKey');
            sessionStorage.removeItem('apiKeyExpiry');
        }
        const apiKey = sessionStorage.getItem('geminiApiKey');

        if (apiKey) {
            apiKeyStatus.textContent = '狀態：已設定';
            apiKeyStatus.classList.remove('text-[var(--text-color)]');
            apiKeyStatus.classList.add('text-green-600');
            startApiKeyCountdown();
        } else {
            apiKeyStatus.textContent = '狀態：尚未設定';
            apiKeyStatus.classList.add('text-[var(--text-color)]');
            apiKeyStatus.classList.remove('text-green-600');
            if (state.apiKeyCountdownInterval) clearInterval(state.apiKeyCountdownInterval);
            apiKeyCountdown.textContent = '';
        }
        window.updateTabAvailability();
        window.updateAiButtonStatus();
    }
    
    window.updateTabAvailability = function() {
        const hasContent = document.getElementById('smart-area').value.trim().length > 0;
        
        const tabs = [
            { btn: document.getElementById('tab2-btn'), dot: document.getElementById('tab2-dot'), defaultTitle: '將字幕稿轉為部落格文章' },
            { btn: document.getElementById('tab3-btn'), dot: document.getElementById('tab3-dot'), defaultTitle: '為多個社群平台生成貼文' },
            { btn: document.getElementById('tab4-btn'), dot: document.getElementById('tab4-dot'), defaultTitle: '將文章內容生成電子報' }
        ];

        tabs.forEach(tab => {
            if (tab.btn) {
                tab.btn.disabled = !hasContent;
                tab.btn.title = hasContent ? tab.defaultTitle : '請先在分頁 1 貼上您的字幕內容';
            }
        });
        
        const hasTab2Draft = window.hasBlogDraft && window.hasBlogDraft();
        document.getElementById('tab2-dot').classList.toggle('hidden', !hasTab2Draft);
        const hasTab3Draft = window.hasSocialDraft && window.hasSocialDraft();
        document.getElementById('tab3-dot').classList.toggle('hidden', !hasTab3Draft);
        
        window.updateSourceStatusUI();
    }


    window.switchTab = (tabId) => {
        allTabButtons.forEach(btn => btn.classList.remove('active'));
        allTabContents.forEach(content => content.classList.add('hidden'));
        
        const clickedButton = document.querySelector(`[data-tab="${tabId}"]`);
        clickedButton.classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');

        const dot = document.getElementById(`${tabId}-dot`);
        if (dot) { dot.classList.add('hidden'); }

        if (tabId === 'tab2' && window.updateStepperUI) { window.updateStepperUI(); }
        window.updateSourceStatusUI();
    }
    
    function initialize() {
        initializeTab1();
        initializeTab2();
        initializeTab3();
        initializeTab4();

        updateApiKeyStatus();

        appearanceBtn.addEventListener('click', toggleAppearancePanel);
        apiKeyBtn.addEventListener('click', showApiKeyModal);
        closeApiKeyModalBtn.addEventListener('click', hideApiKeyModal);
        saveApiKeyBtn.addEventListener('click', saveApiKey);

        document.addEventListener('click', (event) => {
            if (!appearancePanel.classList.contains('hidden') && !appearancePanel.contains(event.target) && !appearanceBtn.contains(event.target)) {
                toggleAppearancePanel();
            }
        });

        allTabButtons.forEach(button => button.addEventListener('click', () => {
            if (!button.disabled) {
                window.switchTab(button.dataset.tab);
            }
        }));
        
        modalCloseBtn.addEventListener('click', hideModal);
        modalCopyBtn.addEventListener('click', copyModalContent);
        
        resetAppBtn.addEventListener('click', () => {
            if (confirm('您確定要重置所有內容嗎？這將會清除所有輸入和已生成的草稿。')) {
                if(window.clearBlogDraft) window.clearBlogDraft();
                if(window.clearSocialDraft) window.clearSocialDraft();
                showToast('頁面已重置！');
                setTimeout(() => { location.reload(); }, 500);
            }
        });
    }

    initialize();
});