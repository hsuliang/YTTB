/**
 * ui-components.js
 * 負責管理通用的 UI 元件，如彈出視窗、主題、摺疊面板等。
 */

function applyTheme(themeName) {
    document.body.dataset.theme = themeName;
    localStorage.setItem('selectedTheme', themeName);
    renderThemeSwatches();
}

function renderThemeSwatches() {
    const themeSwatchesContainer = document.querySelector('.theme-swatches-container');
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