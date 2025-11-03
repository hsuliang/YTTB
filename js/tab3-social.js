/**
 * tab3-social.js
 * 負責管理第三分頁「社群貼文生成」的所有 UI 互動與邏輯。
 */
const SOCIAL_SETTINGS_STORAGE_KEYS = {
    OBJECTIVE: 'aliang-yttb-setting-social-objective',
    LENGTH: 'aliang-yttb-setting-social-length',
    TONE: 'aliang-yttb-setting-social-tone',
    PROMPT_WIZARD: 'aliang-yttb-setting-social-wizard'
};
const SOCIAL_DRAFT_KEY = 'aliang-yttb-draft-social';

window.hasSocialDraft = function() {
    return localStorage.getItem(SOCIAL_DRAFT_KEY) !== null;
}

window.restoreSocialDraft = function() {
    try {
        const draftJSON = localStorage.getItem(SOCIAL_DRAFT_KEY);
        if (!draftJSON) return;
        const draft = JSON.parse(draftJSON);

        document.getElementById('smart-area').value = draft.sourceContent || '';
        state.optimizedTextForBlog = draft.optimizedContent || '';
        state.blogSourceType = draft.sourceType || 'raw';
        if(window.updateSourceStatusUI) window.updateSourceStatusUI(state.blogSourceType);
        
        document.getElementById('social-objective').value = draft.objective || '引導觀看 YouTube';
        document.getElementById('social-length').value = draft.length || '中等';
        document.getElementById('social-tone-select').value = draft.tone || '充滿能量與感染力';
        document.getElementById('social-hashtags').value = draft.hashtags || '';
        document.getElementById('social-cta').value = draft.cta || '';

        if(draft.versions && draft.versions.length > 0) {
            state.socialPostVersions = draft.versions;
            state.currentSocialVersionIndex = draft.currentVersionIndex || 0;

            renderSocialVersionTabs();
            renderCurrentSocialVersionUI();

            document.getElementById('social-placeholder').classList.add('hidden');
            document.getElementById('social-output-container').classList.remove('hidden');
            document.getElementById('generate-social-variation-btn').disabled = false;
            document.getElementById('social-copy-btn').classList.remove('hidden');
        }
        
        if (window.updateTabAvailability) window.updateTabAvailability();
        if (window.updateAiButtonStatus) window.updateAiButtonStatus();

        showToast('社群貼文草稿已成功恢復！');
    } catch (e) {
        console.error('無法讀取社群貼文草稿:', e);
        window.clearSocialDraft();
    }
}

window.clearSocialDraft = function() {
    localStorage.removeItem(SOCIAL_DRAFT_KEY);
}

function assembleSocialPrompt(options) {
    const { objective, length, tone, hashtags, cta, sourceText, variationModifier } = options;
    const wizardSettings = JSON.parse(localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.PROMPT_WIZARD)) || {};

    let globalRules = [];
    if (variationModifier) { globalRules.push(`- 風格變化指令: ${variationModifier}`); }
    globalRules.push(`- 貼文目標: ${objective}`);
    globalRules.push(`- 貼文長度: ${length}`);
    globalRules.push(`- 寫作語氣: ${tone}`);
    if (hashtags) globalRules.push(`- 指定Hashtags: ${hashtags}`);
    if (cta) globalRules.push(`- 行動呼籲: ${cta}`);
    if (wizardSettings.coreViewpoint) { globalRules.push(`- 核心觀點: 請務必在所有貼文中，特別強調並放大這個核心觀點：「${wizardSettings.coreViewpoint}」`); }
    if (wizardSettings.hook && wizardSettings.hook !== 'auto') {
        const hookMap = { question: '用一個引人深思的問題開始', painpoint: '點出一個讀者的痛點或驚人的數據來開頭', story: '描述一個小故事或情境來開頭' };
        globalRules.push(`- 開頭鉤子: ${hookMap[wizardSettings.hook]}`);
    }
    if (wizardSettings.ctaStrategy && wizardSettings.ctaStrategy !== 'default') {
        const ctaMap = { highlight: '請將行動呼籲(CTA)用分隔線「---」或特殊符號「👇」包圍，使其在文末特別醒目', natural: '請將行動呼籲(CTA)的核心意思，自然地安插在文章中段的某個地方，而不是放在文末' };
        globalRules.push(`- CTA策略: ${ctaMap[wizardSettings.ctaStrategy]}`);
    }

    let fbRules = wizardSettings.fbListify ? ['- 規則: 將較長的段落，自動拆解成條列式(• 或 ‣)，增加易讀性。'] : [];
    if (wizardSettings.fbQuestion) fbRules.push('- 規則: 在文末除了CTA外，再多加一句引導留言的問題。');
    let igRules = wizardSettings.igEmoji ? ['- 規則: 請在每個段落或條列項目前，都加上最符合語意的 Emoji，讓版面更生動。'] : [];
    if (wizardSettings.igHashtags) igRules.push('- 規則: 除了使用者指定的Hashtags，請根據內文，自動額外生成 5-10 個相關的熱門 Hashtags。');
    let lineRules = wizardSettings.lineColloquial ? ['- 規則: 請務必使用更像朋友聊天的口語化詞彙（例如：「話說」、「～啊」、「啦」）。'] : [];
    if (wizardSettings.lineSticker) lineRules.push('- 規則: 在適當的地方，用文字建議適合的貼圖，例如 `(熊大灑花)`、`(兔兔驚訝)`。');

    return `你是一位專業的社群小編。請根據以下[逐字稿]和指定的[參數]，為 Facebook、Instagram、Line 這三個平台各生成一篇推廣貼文。請嚴格按照指定的格式與分隔標記輸出，不要有任何額外的文字或說明。

[通用參數]:
${globalRules.join('\n')}

[FACEBOOK_POST_START]
(適合 Facebook 的貼文，可包含 Emoji 和 Hashtags。${fbRules.length > 0 ? '\n' + fbRules.join('\n') : ''})
[FACEBOOK_POST_END]

[INSTAGRAM_POST_START]
(適合 Instagram 的貼文，文案較精簡，並在文末附上 5-10 個相關 Hashtags。${igRules.length > 0 ? '\n' + igRules.join('\n') : ''})
[INSTAGRAM_POST_END]

[LINE_POST_START]
(適合 Line 的貼文，語氣更口語化、更親切。${lineRules.length > 0 ? '\n' + lineRules.join('\n') : ''})
[LINE_POST_END]

[逐字稿]:
---
${sourceText}
---`;
}

// ### 新增：多版本 UI 管理函式 ###
function renderSocialVersionTabs() {
    const tabsContainer = document.getElementById('social-versions-tabs-container');
    tabsContainer.innerHTML = '';
    state.socialPostVersions.forEach((version, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn text-sm py-2 px-4';
        tab.textContent = `版本 ${index + 1}`;
        if (index === state.currentSocialVersionIndex) {
            tab.classList.add('active');
        }
        tab.addEventListener('click', () => switchSocialVersionView(index));
        tabsContainer.appendChild(tab);
    });
}

function switchSocialVersionView(index) {
    state.currentSocialVersionIndex = index;
    renderSocialVersionTabs();
    renderCurrentSocialVersionUI();
}

function renderCurrentSocialVersionUI() {
    const currentVersion = state.socialPostVersions[state.currentSocialVersionIndex];
    if (!currentVersion) return;
    
    document.getElementById('facebook-post-output').textContent = currentVersion.facebook;
    document.getElementById('instagram-post-output').textContent = currentVersion.instagram;
    document.getElementById('line-post-output').textContent = currentVersion.line;

    // 確保當前平台的顯示是正確的
    switchSocialTab(state.activeSocialTab);
}


function initializeTab3() {
    const generateSocialBtn = document.getElementById('generate-social-btn');
    const generateSocialVariationBtn = document.getElementById('generate-social-variation-btn');
    const socialVersionsTabsContainer = document.getElementById('social-versions-tabs-container');
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
    const socialToneSelect = document.getElementById('social-tone-select');
    const socialHashtagsInput = document.getElementById('social-hashtags');
    const socialCtaTextarea = document.getElementById('social-cta');
    const openSocialWizardBtn = document.getElementById('open-social-wizard-btn');
    const socialWizardModal = document.getElementById('social-prompt-wizard-modal');
    const closeSocialWizardBtn = document.getElementById('close-social-wizard-btn');
    const saveSocialWizardBtn = document.getElementById('save-social-wizard-btn');
    const restoreSocialWizardDefaultsBtn = document.getElementById('restore-social-wizard-defaults-btn');
    const wizardCoreViewpoint = document.getElementById('social-wizard-core-viewpoint');
    const wizardFbListify = document.getElementById('social-wizard-fb-listify');
    const wizardFbQuestion = document.getElementById('social-wizard-fb-question');
    const wizardIgEmoji = document.getElementById('social-wizard-ig-emoji');
    const wizardIgHashtags = document.getElementById('social-wizard-ig-hashtags');
    const wizardLineColloquial = document.getElementById('social-wizard-line-colloquial');
    const wizardLineSticker = document.getElementById('social-wizard-line-sticker');

    function openSocialWizard() { loadAndPopulateSocialWizard(); socialWizardModal.classList.remove('hidden'); }
    function closeSocialWizard() { socialWizardModal.classList.add('hidden'); }

    function saveSocialWizardSettings() {
        const settings = {
            coreViewpoint: wizardCoreViewpoint.value.trim(),
            hook: document.querySelector('input[name="social-wizard-hook"]:checked').value,
            fbListify: wizardFbListify.checked, fbQuestion: wizardFbQuestion.checked,
            igEmoji: wizardIgEmoji.checked, igHashtags: wizardIgHashtags.checked,
            lineColloquial: wizardLineColloquial.checked, lineSticker: wizardLineSticker.checked,
            ctaStrategy: document.querySelector('input[name="social-wizard-cta"]:checked').value
        };
        localStorage.setItem(SOCIAL_SETTINGS_STORAGE_KEYS.PROMPT_WIZARD, JSON.stringify(settings));
        showToast('AI 社群風格已儲存！');
        closeSocialWizard();
    }

    function restoreSocialWizardDefaults() {
        if (confirm('您確定要清除所有社群風格設定，並恢復為預設嗎？')) {
            localStorage.removeItem(SOCIAL_SETTINGS_STORAGE_KEYS.PROMPT_WIZARD);
            loadAndPopulateSocialWizard();
            showToast('已恢復為預設社群風格。');
        }
    }

    function loadAndPopulateSocialWizard() {
        const settings = JSON.parse(localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.PROMPT_WIZARD)) || {};
        wizardCoreViewpoint.value = settings.coreViewpoint || '';
        document.querySelector(`input[name="social-wizard-hook"][value="${settings.hook || 'auto'}"]`).checked = true;
        wizardFbListify.checked = settings.fbListify || false;
        wizardFbQuestion.checked = settings.fbQuestion || false;
        wizardIgEmoji.checked = settings.igEmoji || false;
        wizardIgHashtags.checked = settings.igHashtags || false;
        wizardLineColloquial.checked = settings.lineColloquial || false;
        wizardLineSticker.checked = settings.lineSticker || false;
        document.querySelector(`input[name="social-wizard-cta"][value="${settings.ctaStrategy || 'default'}"]`).checked = true;
    }

    function saveSocialSetting(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.error(`無法儲存設定 ${key}:`, e); } }

    function loadSocialSettings() {
        socialObjectiveSelect.value = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.OBJECTIVE) || '引導觀看 YouTube';
        socialLengthSelect.value = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.LENGTH) || '中等';
        socialToneSelect.value = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.TONE) || '充滿能量與感染力';
    }
    
    function saveSocialDraft() {
        const hasContent = document.getElementById('smart-area').value.trim().length > 0;
        if (!hasContent && state.socialPostVersions.length === 0) return;

        const draft = {
            sourceContent: document.getElementById('smart-area').value,
            optimizedContent: state.optimizedTextForBlog,
            sourceType: state.blogSourceType,
            objective: socialObjectiveSelect.value, length: socialLengthSelect.value, tone: socialToneSelect.value,
            hashtags: socialHashtagsInput.value, cta: socialCtaTextarea.value,
            versions: state.socialPostVersions,
            currentVersionIndex: state.currentSocialVersionIndex,
            timestamp: new Date().getTime(),
        };
        try { localStorage.setItem(SOCIAL_DRAFT_KEY, JSON.stringify(draft)); } 
        catch (e) { console.error('無法儲存社群貼文草稿:', e); }
    }

    window.switchSocialTab = function(platform) {
        state.activeSocialTab = platform;
        socialTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.socialTab === platform));
        for (const key in socialPostOutputs) {
            socialPostOutputs[key].classList.toggle('hidden', key !== platform);
        }
        if (state.socialPostVersions.length > 0) {
            socialCopyBtn.classList.remove('hidden');
        }
    }

    async function proceedGenerateSocialPosts(isVariation = false) {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) { if(window.showApiKeyModal) window.showApiKeyModal(); return; } 

        const sourceText = (state.blogSourceType === 'optimized') ? state.optimizedTextForBlog : document.getElementById('smart-area').value.trim();
        if (!sourceText) { showModal({ title: '錯誤', message: '缺少用於生成貼文的來源內容。' }); return; }
        
        let variationModifier = null;
        if(isVariation) {
            const modifiers = ["請使用更多 Emoji。", "請讓語氣更專業、精簡。", "請用一個引人好奇的問題作為開頭。", "請多用條列式說明。"];
            variationModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            showToast(`AI 正在嘗試新風格：${variationModifier.replace('請','').replace('。','')}`);
        }

        const promptOptions = {
            objective: socialObjectiveSelect.value, length: socialLengthSelect.value, tone: socialToneSelect.value,
            hashtags: socialHashtagsInput.value, cta: socialCtaTextarea.value, sourceText: sourceText, variationModifier: variationModifier,
        };
        const prompt = assembleSocialPrompt(promptOptions);
        
        showModal({ title: 'AI 生成中...', message: '正在為您撰寫三平台社群貼文...', showProgressBar: true, taskType: 'social' });
        
        const btn = isVariation ? generateSocialVariationBtn : generateSocialBtn;
        btn.disabled = true;
        btn.classList.add('btn-loading');

        try {
            let fullResponse = '';
            let isValidResponse = false;
            for (let i = 0; i < 2; i++) { // 最多重試1次
                fullResponse = await callGeminiAPI(apiKey, prompt);
                if (fullResponse.includes('[FACEBOOK_POST_START]') && fullResponse.includes('[INSTAGRAM_POST_START]') && fullResponse.includes('[LINE_POST_START]')) {
                    isValidResponse = true;
                    break;
                }
                console.warn(`第 ${i+1} 次嘗試，社群貼文回應格式不完整，正在自動重試...`);
            }
            if (!isValidResponse) {
                throw new Error("AI 回應格式不完整，請稍後再試或生成另一版本。");
            }

            const fbMatch = fullResponse.match(/\[FACEBOOK_POST_START\]([\s\S]*?)\[FACEBOOK_POST_END\]/);
            const igMatch = fullResponse.match(/\[INSTAGRAM_POST_START\]([\s\S]*?)\[INSTAGRAM_POST_END\]/);
            const lineMatch = fullResponse.match(/\[LINE_POST_START\]([\s\S]*?)\[LINE_POST_END\]/);
            
            const newVersion = {
                facebook: fbMatch ? fbMatch[1].trim() : '無法解析 Facebook 貼文。',
                instagram: igMatch ? igMatch[1].trim() : '無法解析 Instagram 貼文。',
                line: lineMatch ? lineMatch[1].trim() : '無法解析 Line 貼文。'
            };

            if (isVariation) {
                state.socialPostVersions.push(newVersion);
                state.currentSocialVersionIndex = state.socialPostVersions.length - 1;
            } else {
                state.socialPostVersions = [newVersion];
                state.currentSocialVersionIndex = 0;
            }
            
            renderSocialVersionTabs();
            renderCurrentSocialVersionUI();

            generateSocialVariationBtn.disabled = false;
            saveSocialDraft();
            socialPlaceholder.classList.add('hidden');
            socialOutputContainer.classList.remove('hidden');
            switchSocialTab('facebook');
            hideModal();
        } catch (error) {
            if (error.message && error.message.includes('overloaded')) { 
                showModal({ 
                    title: 'AI 正在尖峰時段，請稍候！', message: '別擔心...',
                    buttons: [ { text: '關閉', class: 'btn-secondary', callback: hideModal }, { text: '立即重試', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateSocialPosts(isVariation); } } ]
                });
            } else { 
                showModal({ title: '社群貼文生成失敗', message: `發生錯誤：${error.message}` }); 
            }
        } finally {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
        }
    }

    function generateSocialPosts() {
        if (state.socialPostVersions.length > 0 && !confirm("這將會清除所有已生成的版本並重新開始，您確定嗎？")) {
            return;
        }
        if (state.blogSourceType === 'raw' && document.getElementById('smart-area').value.trim()) {
            showModal({ title: '提醒', message: '您尚未優化文本...', buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateSocialPosts(false); } } ] });
        } else {
            proceedGenerateSocialPosts(false);
        }
    }

    function generateSocialVariation() {
        proceedGenerateSocialPosts(true);
    }

    function copySocialPost() {
        const currentVersion = state.socialPostVersions[state.currentSocialVersionIndex];
        if (!currentVersion) return;
        const targetContent = currentVersion[state.activeSocialTab];
        if (targetContent) { navigator.clipboard.writeText(targetContent).then(() => { showToast('已複製到剪貼簿！'); socialCopyBtn.textContent = '已複製!'; setTimeout(() => { socialCopyBtn.textContent = '複製內容'; }, 2000); }); }
    }

    openSocialWizardBtn.addEventListener('click', openSocialWizard);
    closeSocialWizardBtn.addEventListener('click', closeSocialWizard);
    saveSocialWizardBtn.addEventListener('click', saveSocialWizardSettings);
    restoreSocialWizardDefaultsBtn.addEventListener('click', restoreSocialWizardDefaults);

    goToOptimizeBtn.addEventListener('click', () => window.switchTab('tab2'));
    generateSocialBtn.addEventListener('click', generateSocialPosts);
    generateSocialVariationBtn.addEventListener('click', generateSocialVariation);
    socialCopyBtn.addEventListener('click', copySocialPost);
    socialTabBtns.forEach(btn => btn.addEventListener('click', () => switchSocialTab(btn.dataset.socialTab)));

    socialObjectiveSelect.addEventListener('change', (e) => { saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.OBJECTIVE, e.target.value); saveSocialDraft(); });
    socialLengthSelect.addEventListener('change', (e) => { saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.LENGTH, e.target.value); saveSocialDraft(); });
    socialToneSelect.addEventListener('change', (e) => { saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.TONE, e.target.value); saveSocialDraft(); });
    socialHashtagsInput.addEventListener('input', saveSocialDraft);
    socialCtaTextarea.addEventListener('input', saveSocialDraft);

    const socialObjectiveOptions = { '引導觀看 YouTube': '引導觀看 YouTube', '引導閱讀部落格': '引導閱讀部落格', '引發留言互動': '引發留言互動', '分享核心觀點': '分享核心觀點' };
    const socialLengthOptions = { '簡短': '簡短 (一句話)', '中等': '中等 (一段)', '詳細': '詳細 (多段)' };
    const toneOptions = { '充滿能量與感染力': '能量感染力', '專業且具權威性': '專業權威', '口語化且親切': '口語親切', '幽默風趣': '幽默風趣' };
    populateSelectWithOptions(socialObjectiveSelect, socialObjectiveOptions);
    populateSelectWithOptions(socialLengthSelect, socialLengthOptions);
    populateSelectWithOptions(socialToneSelect, toneOptions);
    
    loadSocialSettings();

    if (window.hasSocialDraft()) {
        setTimeout(() => {
            if (confirm('偵測到上次有未儲存的社群貼文草稿，是否要恢復？')) {
                restoreSocialDraft();
            } else {
                window.clearSocialDraft();
                if(window.updateTabAvailability) window.updateTabAvailability();
            }
        }, 100);
    }
}