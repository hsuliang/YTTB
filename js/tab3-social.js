/**
 * tab3-social.js
 * 負責管理第三分頁「社群貼文生成」的所有 UI 互動與邏輯。
 */

// --- 元素選擇 (模組級) ---
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
const socialHashtagsInput = document.getElementById('social-hashtags');
const socialCtaTextarea = document.getElementById('social-cta');
const socialSourceStatus = document.getElementById('social-source-status');

// --- 輔助函式 (模組級) ---
function switchSocialTab(platform) {
    state.activeSocialTab = platform;
    socialTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.socialTab === platform));
    for (const key in socialPostOutputs) {
        socialPostOutputs[key].classList.toggle('hidden', key !== platform);
    }
    socialCopyBtn.classList.remove('hidden');
}

// --- 清除函式 ---
function resetTab3() {
    socialSourceStatus.textContent = '內容來源：字幕原始檔';
    socialSourceStatus.classList.remove('text-green-600');
    
    socialPlaceholder.classList.remove('hidden');
    socialOutputContainer.classList.add('hidden');
    socialCopyBtn.classList.add('hidden');
    
    for(const key in socialPostOutputs) {
        socialPostOutputs[key].textContent = '';
    }
    
    socialHashtagsInput.value = '';
    socialCtaTextarea.value = '';
}

// --- 初始化函式 ---
function initializeTab3() {
    // --- 函式定義 ---
    async function proceedGenerateSocialPosts() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' });
            return;
        }
        const sourceText = (state.blogSourceType === 'optimized') ? state.optimizedTextForBlog : document.getElementById('smart-area').value.trim();
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
        if (state.blogSourceType === 'raw' && document.getElementById('smart-area').value.trim()) {
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

    function copySocialPost() {
        const targetElement = socialPostOutputs[state.activeSocialTab];
        if (targetElement && targetElement.textContent) {
            navigator.clipboard.writeText(targetElement.textContent).then(() => {
                socialCopyBtn.textContent = '已複製!';
                setTimeout(() => { socialCopyBtn.textContent = '複製內容'; }, 2000);
            });
        }
    }

    // --- 事件監聽 ---
    goToOptimizeBtn.addEventListener('click', () => window.switchTab('tab2'));
    generateSocialBtn.addEventListener('click', generateSocialPosts);
    socialCopyBtn.addEventListener('click', copySocialPost);
    socialTabBtns.forEach(btn => btn.addEventListener('click', () => switchSocialTab(btn.dataset.socialTab)));

    // --- 初始化 ---
    const socialObjectiveOptions = { '引導觀看 YouTube': '引導觀看 YouTube', '引導閱讀部落格': '引導閱讀部落格', '引發留言互動': '引發留言互動', '分享核心觀點': '分享核心觀點' };
    const socialLengthOptions = { '簡短': '簡短 (一句話)', '中等': '中等 (一段)', '詳細': '詳細 (多段)' };
    const toneOptions = { '充滿能量與感染力': '能量感染力', '專業且具權威性': '專業權威', '口語化且親切': '口語親切', '幽默風趣': '幽默風趣' };
    populateSelectWithOptions(socialObjectiveSelect, socialObjectiveOptions);
    populateSelectWithOptions(socialLengthSelect, socialLengthOptions);
    populateSelectWithOptions(socialToneSelect, toneOptions);
}