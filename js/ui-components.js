/**
 * ui-components.js
 * 負責管理通用的 UI 元件，如彈出視窗、主題、摺疊面板等。
 */

// 元素選擇 (新增)
const modeToggleBtn = document.getElementById('mode-toggle-btn');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// 函式 (新增)
function applyMode(mode) {
    if (mode === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        // 如果當前是亮色主題，切換到預設的暗色主題
        if (document.body.dataset.theme !== 'dark-knight') {
             applyTheme('dark-knight');
        }
    } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        // 如果當前是暗色主題，切換回預設的亮色主題
        if (document.body.dataset.theme === 'dark-knight') {
            applyTheme(localStorage.getItem('selectedLightTheme') || 'old-newspaper');
        }
    }
    localStorage.setItem('selectedMode', mode);
}

// 函式 (新增)
function toggleMode() {
    const currentMode = localStorage.getItem('selectedMode') || 'light';
    applyMode(currentMode === 'light' ? 'dark' : 'light');
}

// 函式 (修改)
function applyTheme(themeName) {
    document.body.dataset.theme = themeName;

    // 判斷主題是亮色還是暗色，並儲存對應的偏好
    if (themeName === 'dark-knight') {
        localStorage.setItem('selectedMode', 'dark');
        // 暗黑模式下，不需要儲存 selectedTheme，因為它代表的是暗色本身
    } else {
        localStorage.setItem('selectedMode', 'light');
        localStorage.setItem('selectedLightTheme', themeName); // 記住使用者選擇的亮色主題
    }
    
    renderThemeSwatches();
    updateModeIcons();
}

// 函式 (新增)
function updateModeIcons() {
     const currentMode = localStorage.getItem('selectedMode') || 'light';
     if (currentMode === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
     } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
     }
}

// 事件監聽 (新增)
modeToggleBtn.addEventListener('click', toggleMode);


function renderThemeSwatches() {
    const themeSwatchesContainer = document.querySelector('.theme-swatches-container');
    if (!themeSwatchesContainer) return; // Add a guard clause
    themeSwatchesContainer.innerHTML = '';
    
    const currentTheme = document.body.dataset.theme || 'old-newspaper';
    
    // 過濾掉暗黑模式，它由獨立的按鈕控制
    const lightThemes = Object.entries(THEMES).filter(([value]) => value !== 'dark-knight');

    for (const [value, text] of lightThemes) {
        const swatch = document.createElement('div');
        swatch.className = `theme-swatch ${value}`;
        swatch.dataset.themeValue = value;
        swatch.title = text;
        swatch.setAttribute('role', 'button');
        swatch.setAttribute('tabindex', '0');
        if (value === currentTheme) {
            swatch.classList.add('active');
        }
        swatch.addEventListener('click', () => {
            applyTheme(value);
        });
        themeSwatchesContainer.appendChild(swatch);
    }
}

function stopPromptRotation() {
    if (state.promptInterval) {
        clearInterval(state.promptInterval);
        state.promptInterval = null;
    }
    state.currentAiTask = null;
}

function startPromptRotation(taskType) {
    state.currentAiTask = taskType;
    let messageIndex = 0;
    const messages = AI_PROMPT_MESSAGES[taskType];
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = messages[messageIndex];
    state.promptInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        modalMessage.textContent = messages[messageIndex];
    }, 4000);
}

// ### 新增開始 ###
/**
 * 顯示一個自動消失的 Toast 通知。
 * @param {string} message - 要顯示的訊息。
 * @param {string} [type='success'] - 通知的類型 ('success' 或 'error')。
 * @param {number} [duration=3000] - 顯示的持續時間 (毫秒)。
 */
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // 在動畫結束後自動從 DOM 中移除元素
    setTimeout(() => {
        toast.remove();
    }, duration);
}
// ### 新增結束 ###


function showModal(options) {
    stopPromptRotation();
    const { title, message, showCopyButton = false, showProgressBar = false, buttons = [], taskType = null } = options;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    const modalProgressBar = document.getElementById('modal-progress-bar');
    const modalDefaultButtons = document.getElementById('modal-default-buttons');
    const modalCustomButtons = document.getElementById('modal-custom-buttons');

    modalTitle.textContent = title;
    modalCopyBtn.classList.toggle('hidden', !showCopyButton);
    modalProgressBar.classList.toggle('hidden', !showProgressBar);
    
    if (showProgressBar) {
        modalMessage.classList.remove('hidden');
        if (taskType && AI_PROMPT_MESSAGES[taskType]) {
            startPromptRotation(taskType);
        } else {
            modalMessage.textContent = "請稍候，AI 正在思考中...";
        }
    } else {
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
    stopPromptRotation();
    document.getElementById('modal').classList.add('hidden');
}

function copyModalContent() {
    const modalMessage = document.getElementById('modal-message');
    const modalCopyBtn = document.getElementById('modal-copy-btn');
    navigator.clipboard.writeText(modalMessage.textContent).then(() => {
        modalCopyBtn.textContent = '已複製！';
        setTimeout(() => { modalCopyBtn.textContent = '複製內容'; }, 2000);
    }).catch(err => {
        console.error('複製失敗: ', err);
        modalCopyBtn.textContent = '複製失敗';
        setTimeout(() => { modalCopyBtn.textContent = '複製內容'; }, 2000);
    });
}

function toggleAccordion(btn, panel) {
    btn.classList.toggle('open');
    panel.classList.toggle('open');
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

// 頁面載入時，立即檢查並套用儲存的模式
document.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('selectedMode') || 'light';
    const savedTheme = savedMode === 'dark' 
        ? 'dark-knight' 
        : (localStorage.getItem('selectedLightTheme') || 'old-newspaper');
    
    applyTheme(savedTheme);
});