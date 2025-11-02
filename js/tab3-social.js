/**
 * tab3-social.js
 * 負責管理第三分頁「社群貼文生成」的所有 UI 互動與邏輯。
 */
const SOCIAL_SETTINGS_STORAGE_KEYS = {
    OBJECTIVE: 'aliang-yttb-setting-social-objective',
    LENGTH: 'aliang-yttb-setting-social-length',
    TONE: 'aliang-yttb-setting-social-tone'
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

        document.getElementById('facebook-post-output').textContent = draft.facebook;
        document.getElementById('instagram-post-output').textContent = draft.instagram;
        document.getElementById('line-post-output').textContent = draft.line;

        document.getElementById('social-placeholder').classList.add('hidden');
        document.getElementById('social-output-container').classList.remove('hidden');
        
        const socialTabBtns = document.querySelectorAll('.social-tab-btn');
        const socialPostOutputs = { facebook: document.getElementById('facebook-post-output'), instagram: document.getElementById('instagram-post-output'), line: document.getElementById('line-post-output') };
        state.activeSocialTab = 'facebook';
        socialTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.socialTab === 'facebook'));
        for (const key in socialPostOutputs) {
            socialPostOutputs[key].classList.toggle('hidden', key !== 'facebook');
        }
        document.getElementById('social-copy-btn').classList.remove('hidden');
        
        if (window.updateTabAvailability) window.updateTabAvailability();
        if (window.updateAiButtonStatus) window.updateAiButtonStatus();

        showToast('草稿已成功恢復！');
    } catch (e) {
        console.error('無法讀取社群貼文草稿:', e);
        window.clearSocialDraft();
    }
}

window.clearSocialDraft = function() {
    localStorage.removeItem(SOCIAL_DRAFT_KEY);
}

function initializeTab3() {
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
    const socialToneSelect = document.getElementById('social-tone-select');

    function saveSocialSetting(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.error(`無法儲存設定 ${key}:`, e); } }

    function loadSocialSettings() {
        const objective = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.OBJECTIVE);
        if (objective) socialObjectiveSelect.value = objective;
        const length = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.LENGTH);
        if (length) socialLengthSelect.value = length;
        const tone = localStorage.getItem(SOCIAL_SETTINGS_STORAGE_KEYS.TONE);
        if (tone) socialToneSelect.value = tone;
    }

    function saveSocialDraft() {
        const facebookContent = socialPostOutputs.facebook.textContent;
        if (!facebookContent) return;
        const draft = {
            facebook: facebookContent,
            instagram: socialPostOutputs.instagram.textContent,
            line: socialPostOutputs.line.textContent,
            timestamp: new Date().getTime(),
            sourceContent: document.getElementById('smart-area').value,
            optimizedContent: state.optimizedTextForBlog,
            sourceType: state.blogSourceType
        };
        try { localStorage.setItem(SOCIAL_DRAFT_KEY, JSON.stringify(draft)); } 
        catch (e) { console.error('無法儲存社群貼文草稿:', e); }
    }

    function switchSocialTab(platform) {
        state.activeSocialTab = platform;
        socialTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.socialTab === platform));
        for (const key in socialPostOutputs) {
            socialPostOutputs[key].classList.toggle('hidden', key !== platform);
        }
        socialCopyBtn.classList.remove('hidden');
    }

    async function proceedGenerateSocialPosts() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) { showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' }); return; }
        const sourceText = (state.blogSourceType === 'optimized') ? state.optimizedTextForBlog : document.getElementById('smart-area').value.trim();
        if (!sourceText) { showModal({ title: '錯誤', message: '缺少用於生成貼文的來源內容。' }); return; }
        const objective = socialObjectiveSelect.value;
        const length = socialLengthSelect.value;
        const tone = socialToneSelect.value;
        const hashtags = document.getElementById('social-hashtags').value;
        const cta = document.getElementById('social-cta').value;
        const prompt = `你是一位專業的社群小編。請根據以下[逐字稿]和指定的[參數]，為 Facebook、Instagram、Line 這三個平台各生成一篇推廣貼文。請嚴格按照指定的格式與分隔標記輸出，不要有任何額外的文字或說明。\n\n[參數]:\n- 貼文目標: ${objective}\n- 貼文長度: ${length}\n- 寫作語氣: ${tone}\n- 指定Hashtags: ${hashtags}\n- 行動呼籲: ${cta}\n\n[FACEBOOK_POST_START]\n(適合 Facebook 的貼文，可包含 Emoji 和 Hashtags)\n[FACEBOOK_POST_END]\n\n[INSTAGRAM_POST_START]\n(適合 Instagram 的貼文，文案較精簡，並在文末附上 5-10 個相關 Hashtags)\n[INSTAGRAM_POST_END]\n\n[LINE_POST_START]\n(適合 Line 的貼文，語氣更口語化、更親切)\n[LINE_POST_END]\n\n[逐字稿]:\n---\n${sourceText}\n---`;
        showModal({ title: 'AI 生成中...', message: '正在為您撰寫三平台社群貼文...', showProgressBar: true, taskType: 'social' });
        
        const btn = generateSocialBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.classList.add('btn-loading');

        try {
            const fullResponse = await callGeminiAPI(apiKey, prompt);
            const fbMatch = fullResponse.match(/\[FACEBOOK_POST_START\]([\s\S]*?)\[FACEBOOK_POST_END\]/);
            const igMatch = fullResponse.match(/\[INSTAGRAM_POST_START\]([\s\S]*?)\[INSTAGRAM_POST_END\]/);
            const lineMatch = fullResponse.match(/\[LINE_POST_START\]([\s\S]*?)\[LINE_POST_END\]/);
            socialPostOutputs.facebook.textContent = fbMatch ? fbMatch[1].trim() : '無法解析 Facebook 貼文。';
            socialPostOutputs.instagram.textContent = igMatch ? igMatch[1].trim() : '無法解析 Instagram 貼文。';
            socialPostOutputs.line.textContent = lineMatch ? lineMatch[1].trim() : '無法解析 Line 貼文。';

            saveSocialDraft();
            socialPlaceholder.classList.add('hidden');
            socialOutputContainer.classList.remove('hidden');
            switchSocialTab('facebook');
            hideModal();
        } catch (error) {
            if (error.message && error.message.includes('overloaded')) { 
                showModal({ 
                    title: 'AI 正在尖峰時段，請稍候！', 
                    message: '別擔心，這不是您的程式或 API Key 有問題。\n\n這代表 Gemini AI 模型目前正處於全球使用的高峰期，就像一位超級名廚的廚房突然湧入了大量訂單一樣。\n\n建議您稍等一兩分鐘後，再點擊一次「生成」按鈕即可。\n\n感謝您的耐心！',
                    buttons: [
                        { text: '關閉', class: 'btn-secondary', callback: hideModal },
                        { text: '立即重試', class: 'btn-primary', callback: () => {
                            hideModal();
                            proceedGenerateSocialPosts();
                        } }
                    ]
                });
            } else { 
                showModal({ title: '社群貼文生成失敗', message: `發生錯誤：${error.message}` }); 
            }
        } finally {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            btn.textContent = originalText;
        }
    }

    function generateSocialPosts() {
        if (state.blogSourceType === 'raw' && document.getElementById('smart-area').value.trim()) {
            showModal({ title: '提醒', message: '您尚未優化文本，直接生成可能會影響貼文品質。確定要繼續嗎？', buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateSocialPosts(); } } ] });
        } else {
            proceedGenerateSocialPosts();
        }
    }

    function copySocialPost() {
        const targetElement = socialPostOutputs[state.activeSocialTab];
        if (targetElement && targetElement.textContent) { navigator.clipboard.writeText(targetElement.textContent).then(() => { socialCopyBtn.textContent = '已複製!'; setTimeout(() => { socialCopyBtn.textContent = '複製內容'; }, 2000); }); }
    }

    goToOptimizeBtn.addEventListener('click', () => window.switchTab('tab2'));
    generateSocialBtn.addEventListener('click', generateSocialPosts);
    socialCopyBtn.addEventListener('click', copySocialPost);
    socialTabBtns.forEach(btn => btn.addEventListener('click', () => switchSocialTab(btn.dataset.socialTab)));

    socialObjectiveSelect.addEventListener('change', (e) => saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.OBJECTIVE, e.target.value));
    socialLengthSelect.addEventListener('change', (e) => saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.LENGTH, e.target.value));
    socialToneSelect.addEventListener('change', (e) => saveSocialSetting(SOCIAL_SETTINGS_STORAGE_KEYS.TONE, e.target.value));

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