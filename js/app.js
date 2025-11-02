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

    window.updateAiButtonStatus = function() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        const hasSourceContent = document.getElementById('smart-area').value.trim().length > 0;
        
        const tab1AiButtons = [document.getElementById('generate-chapters-btn'), document.getElementById('generate-summary-btn')];
        const isTab1AiEnabled = apiKey && hasSourceContent;
        tab1AiButtons.forEach(btn => {
            if (btn) {
                btn.disabled = !isTab1AiEnabled;
                btn.className = isTab1AiEnabled ? 'font-bold py-2 px-4 rounded btn-primary' : 'font-bold py-2 px-4 rounded btn-disabled';
            }
        });

        const tab2AiButton = document.getElementById('optimize-text-for-blog-btn');
        const tab3AiButton = document.getElementById('generate-social-btn');
        const hasAnyContent = hasSourceContent || (window.hasBlogDraft && window.hasBlogDraft()) || (window.hasSocialDraft && window.hasSocialDraft());
        const isOtherAiEnabled = apiKey && hasAnyContent;

        if (tab2AiButton) {
            tab2AiButton.disabled = !isOtherAiEnabled;
            tab2AiButton.className = isOtherAiEnabled ? 'w-full font-bold py-2 px-4 rounded btn-primary' : 'w-full font-bold py-2 px-4 rounded btn-disabled';
        }
        if (tab3AiButton) {
            tab3AiButton.disabled = !isOtherAiEnabled;
            tab3AiButton.className = isOtherAiEnabled ? 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-primary' : 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-disabled';
        }
    }
    
    // ### 新增：建立統一的來源狀態更新函式 ###
    window.updateSourceStatusUI = function(sourceType) {
        const blogSourceStatus = document.getElementById('blog-source-status');
        const socialSourceStatus = document.getElementById('social-source-status');
        
        const optimizedText = '<span class="">✔️ </span>內容來源：已優化的文本';
        const rawText = '<span class="hidden">✔️ </span>內容來源：字幕原始檔';

        if (sourceType === 'optimized') {
            if (blogSourceStatus) {
                blogSourceStatus.innerHTML = optimizedText;
                blogSourceStatus.classList.add('text-green-600');
            }
            if (socialSourceStatus) {
                socialSourceStatus.innerHTML = optimizedText;
                socialSourceStatus.classList.add('text-green-600');
            }
        } else {
            if (blogSourceStatus) {
                blogSourceStatus.innerHTML = rawText;
                blogSourceStatus.classList.remove('text-green-600');
            }
            if (socialSourceStatus) {
                socialSourceStatus.innerHTML = rawText;
                socialSourceStatus.classList.remove('text-green-600');
            }
        }
    }

    function toggleAppearancePanel() { appearancePanel.classList.toggle('hidden'); }
    function showApiKeyModal() { apiKeyModal.classList.remove('hidden'); }
    function hideApiKeyModal() { apiKeyModal.classList.add('hidden'); }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) { showToast('API Key 不能為空。', 'error'); return; }
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
        const hasSourceContent = document.getElementById('smart-area').value.trim().length > 0;
        const hasTab2Draft = window.hasBlogDraft && window.hasBlogDraft();
        const hasTab3Draft = window.hasSocialDraft && window.hasSocialDraft();

        const tab2Btn = document.getElementById('tab2-btn');
        const tab3Btn = document.getElementById('tab3-btn');
        const tab2Dot = document.getElementById('tab2-dot');
        const tab3Dot = document.getElementById('tab3-dot');

        if (hasSourceContent || hasTab2Draft) {
            tab2Btn.disabled = false;
            tab2Dot.classList.toggle('hidden', !hasTab2Draft);
        } else {
            tab2Btn.disabled = true;
            tab2Dot.classList.add('hidden');
        }

        if (hasSourceContent || hasTab3Draft) {
            tab3Btn.disabled = false;
            tab3Dot.classList.toggle('hidden', !hasTab3Draft);
        } else {
            tab3Btn.disabled = true;
            tab3Dot.classList.add('hidden');
        }
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
    }
    
    function initialize() {
        initializeTab1();
        initializeTab2();
        initializeTab3();

        window.updateTabAvailability();
        window.updateAiButtonStatus();

        appearanceBtn.addEventListener('click', toggleAppearancePanel);
        apiKeyBtn.addEventListener('click', showApiKeyModal);
        closeApiKeyModalBtn.addEventListener('click', hideApiKeyModal);
        saveApiKeyBtn.addEventListener('click', saveApiKey);

        document.addEventListener('click', (event) => {
            if (!appearancePanel.classList.contains('hidden') && !appearancePanel.contains(event.target) && !appearanceBtn.contains(event.target)) {
                toggleAppearancePanel();
            }
        });

        allTabButtons.forEach(button => button.addEventListener('click', () => !button.disabled && window.switchTab(button.dataset.tab)));
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
        
        updateApiKeyStatus();
    }

    initialize();
});