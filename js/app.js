/**
 * app.js
 * 應用程式主邏輯，負責初始化各模組與處理全域事件。
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 元素選擇 (僅限全域) ---
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const apiKeyPanel = document.getElementById('api-key-panel');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');
    const apiKeyCountdown = document.getElementById('api-key-countdown');
    const allTabButtons = document.querySelectorAll('.tab-btn');
    const allTabContents = document.querySelectorAll('.tab-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const clearContentBtn = document.getElementById('clear-content-btn');

    // --- 全域函式 ---

    function toggleApiKeyPanel() {
        apiKeyPanel.classList.toggle('open');
        settingsToggleBtn.classList.toggle('open');
    }

    function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showModal({ title: '錯誤', message: 'API Key 不能為空。' });
            return;
        }
        sessionStorage.setItem('geminiApiKey', apiKey);
        const expiryTime = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
        sessionStorage.setItem('apiKeyExpiry', expiryTime);
        updateApiKeyStatus();
        showModal({ title: '成功', message: 'API Key 已儲存。AI 功能現在已啟用。' });
        if (apiKeyPanel.classList.contains('open')) {
            toggleApiKeyPanel();
        }
    }

    function startApiKeyCountdown() {
        if (state.apiKeyCountdownInterval) {
            clearInterval(state.apiKeyCountdownInterval);
        }
        const expiryTime = sessionStorage.getItem('apiKeyExpiry');
        if (!expiryTime) {
            apiKeyCountdown.textContent = '';
            return;
        }
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
        const aiButtons = [
            document.getElementById('generate-chapters-btn'),
            document.getElementById('optimize-text-for-blog-btn'),
            document.getElementById('generate-social-btn')
        ];
        if (apiKey) {
            apiKeyStatus.textContent = '狀態：API Key 已設定，AI 功能已啟用。';
            apiKeyStatus.classList.remove('text-[var(--text-color)]');
            apiKeyStatus.classList.add('text-green-600');
            aiButtons.forEach(btn => {
                if (btn) {
                    btn.disabled = false;
                    if (btn.id === 'generate-social-btn') {
                        btn.className = 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-primary';
                    } else if (btn.id === 'optimize-text-for-blog-btn') {
                        btn.className = 'w-full font-bold py-2 px-4 rounded btn-primary';
                    } else {
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
                    if (btn.id === 'generate-social-btn') {
                        btn.className = 'w-full font-bold py-3 px-6 rounded-lg text-lg btn-disabled';
                    } else {
                        btn.className = 'font-bold py-2 px-4 rounded btn-disabled';
                    }
                }
            });
            if (state.apiKeyCountdownInterval) clearInterval(state.apiKeyCountdownInterval);
            apiKeyCountdown.textContent = '';
        }
    }

    // Make switchTab a global function accessible by other modules
    window.switchTab = (tabId) => {
        allTabButtons.forEach(btn => btn.classList.remove('active'));
        allTabContents.forEach(content => content.classList.add('hidden'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.remove('hidden');
    }

    function clearAllContent() {
        resetTab1();
        resetTab2();
        resetTab3();
        showModal({ title: '操作成功', message: '所有內容已清除，您可以開始新的任務。' });
    }

    // --- 初始化函式 ---
    function initialize() {
        
        initializeTab1();
        initializeTab2();
        initializeTab3();

        const savedTheme = localStorage.getItem('selectedTheme') || 'old-newspaper';
        applyTheme(savedTheme);
        
        // --- 全域事件監聽 ---
        settingsToggleBtn.addEventListener('click', toggleApiKeyPanel);
        saveApiKeyBtn.addEventListener('click', saveApiKey);
        allTabButtons.forEach(button => button.addEventListener('click', () => !button.disabled && window.switchTab(button.dataset.tab)));
        modalCloseBtn.addEventListener('click', hideModal);
        modalCopyBtn.addEventListener('click', copyModalContent);
        clearContentBtn.addEventListener('click', clearAllContent);
        
        // --- 最終初始化 ---
        updateApiKeyStatus();
    }

    initialize();
});