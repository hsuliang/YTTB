/**
 * tab2-blog.js
 * 負責管理第二分頁「部落格文章生成」的所有 UI 互動與 logique。
 */

const SETTINGS_STORAGE_KEYS = {
    BLOG_PERSONA: 'aliang-yttb-setting-blog-persona',
    BLOG_WORD_COUNT: 'aliang-yttb-setting-blog-word-count',
    BLOG_TONE: 'aliang-yttb-setting-blog-tone',
    PROMPT_WIZARD: 'aliang-yttb-setting-prompt-wizard'
};
const BLOG_DRAFT_KEY = 'aliang-yttb-draft-blog';

window.hasBlogDraft = function() {
    return localStorage.getItem(BLOG_DRAFT_KEY) !== null;
}

window.restoreBlogDraft = function() {
    try {
        const draftJSON = localStorage.getItem(BLOG_DRAFT_KEY);
        if (!draftJSON) return;
        const draft = JSON.parse(draftJSON);

        document.getElementById('smart-area').value = draft.sourceContent || '';
        state.optimizedTextForBlog = draft.optimizedContent || '';
        state.blogSourceType = draft.sourceType || 'raw';
        if(window.updateSourceStatusUI) window.updateSourceStatusUI(state.blogSourceType);
        
        document.getElementById('blog-title').value = draft.title || '';
        document.getElementById('blog-yt-id').value = draft.ytId || '';
        document.getElementById('blog-persona').value = draft.persona || '第一人稱視角';
        document.getElementById('blog-word-count').value = draft.wordCount || '約 1200 字';
        document.getElementById('blog-tone').value = draft.tone || '充滿能量與感染力';
        
        state.currentBlogTags = draft.tags || [];
        if(window.renderTags) window.renderTags();
        
        if (draft.ctaPreset) {
             document.getElementById('cta-preset-select').value = draft.ctaPreset;
        }
        document.getElementById('blog-cta').value = draft.ctaContent || '';
        if(window.handleCtaChange) window.handleCtaChange();

        if (draft.versions && draft.versions.length > 0) {
            state.blogArticleVersions = draft.versions;
            state.currentBlogVersionIndex = draft.currentVersionIndex || 0;
            
            renderVersionTabs();
            renderCurrentVersionUI();

            document.getElementById('blog-placeholder').classList.add('hidden');
            document.getElementById('blog-output-container').classList.remove('hidden');
            document.getElementById('generate-blog-variation-btn').disabled = false;
        }

        if(window.updateStepperUI) window.updateStepperUI();
        if(window.updateTabAvailability) window.updateTabAvailability();
        if(window.updateAiButtonStatus) window.updateAiButtonStatus();
        
        showToast('部落格草稿已成功恢復！');
    } catch (e) {
        console.error('無法讀取部落格草稿:', e);
        window.clearBlogDraft();
    }
}

window.clearBlogDraft = function() {
    localStorage.removeItem(BLOG_DRAFT_KEY);
}

function convertHtmlToMarkdown(htmlContent) { 
    if (!htmlContent) return ''; let content = htmlContent; content = content.replace(/<h1>(.*?)<\/h1>/g, '# $1'); content = content.replace(/<h2>(.*?)<\/h2>/g, '## $1'); content = content.replace(/<h3>(.*?)<\/h3>/g, '### $1'); content = content.replace(/<hr>/g, '\n---\n'); content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**'); content = content.replace(/<em>(.*?)<\/em>/g, '*$1*'); content = content.replace(/<li>(.*?)<\/li>/g, '* $1'); content = content.replace(/<a href="(.*?)"[^>]*>(.*?)<\/a>/g, '[$2]($1)'); content = content.replace(/<[^>]*>/g, ''); content = content.replace(/\n{3,}/g, '\n\n'); return content.trim(); 
}

window.updateStepperUI = function() {
    const step1 = document.getElementById('stepper-step-1');
    const step2 = document.getElementById('stepper-step-2');
    const step3 = document.getElementById('stepper-step-3');
    
    [step1, step2, step3].forEach(step => step.classList.remove('active', 'completed'));

    const hasSourceContent = document.getElementById('smart-area').value.trim().length > 0;
    const isOptimized = state.blogSourceType === 'optimized';
    const hasGeneratedBlog = state.blogArticleVersions.length > 0;

    if (hasSourceContent || window.hasBlogDraft()) { step1.classList.add('completed'); } 
    else { step1.classList.add('active'); return; }

    if (isOptimized) { step2.classList.add('completed'); } 
    else { step2.classList.add('active'); }
    
    if (hasGeneratedBlog) {
        step1.classList.add('completed');
        step2.classList.add('completed');
        step3.classList.add('completed');
        document.getElementById('generate-blog-btn').textContent = "重新生成文章";
    } else if (hasSourceContent || window.hasBlogDraft()) {
        step3.classList.add('active');
        document.getElementById('generate-blog-btn').textContent = "生成部落格文章";
    }
};

function assembleBlogPrompt(options) {
    const { persona, tone, wordCount, tagsString, cta, sourceText, variationModifier } = options;
    const wizardSettings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEYS.PROMPT_WIZARD)) || {};
    let rules = [];
    if (variationModifier) { rules.push(`- 風格變化指令: ${variationModifier}`); }
    if (wizardSettings.structSummary) { rules.push('- 文章開頭：請自動產生一段「前言摘要」。'); } 
    else if (wizardSettings.structPoints) { rules.push('- 文章開頭：請自動條列出 2-5 點「本集重點」。'); }
    rules.push(`- 寫作人稱：${persona}`);
    const toneFinetune = wizardSettings.toneFinetune ? ` (${wizardSettings.toneFinetune})` : '';
    rules.push(`- 寫作語氣：${tone}${toneFinetune}`);
    rules.push(`- 文章字數：${wordCount}`);
    if (tagsString) rules.push(`- 指定標籤：${tagsString}`);
    let h2_style_rule = "每個段落都需要一個簡潔有力的小標題";
    if (wizardSettings.h2Style === 'question') { h2_style_rule = "每個段落都需要一個帶有疑問句、引發好奇的小標題"; } 
    else if (wizardSettings.h2Style === 'emoji') { h2_style_rule = "每個段落都需要一個活潑有趣、可加入 Emoji 的小標題"; }
    rules.push(`- 格式要求：${h2_style_rule}，並用 <h2> 標籤包圍。段落之間必須使用 <hr> 標籤分隔。`);
    if (wizardSettings.elemBold) { rules.push('- 特殊元素：請在內文中適度將重要的關鍵字詞加上 <strong> 粗體標籤，以利 SEO。'); }
    if (wizardSettings.elemTable) { rules.push('- 特殊元素：請在文章結尾、宣傳語句之前，自動生成一個「重點回顧」的 HTML 表格(<table>)，總結文章要點。'); }
    if (wizardSettings.elemQuote) { rules.push('- 特殊元素：請在文章內文中，選擇一句最精彩的「金句」，並用 <blockquote> 標籤將其引用出來。'); }
    rules.push(`- 文章結尾必須包含以下[宣傳語句]：${cta}`);
    rules.push('- 文章前段需自然融入關鍵字但不可過度堆疊。');
    const finalRules = rules.join('\n');
    return `你是一位專業的部落格小編，專門負責將節目逐字稿轉換成格式良好、語氣自然、適合部落格發表的專欄文章。你的身份是[部落格小編]，任務是將節目逐字稿轉換成充滿能量的專欄報導。

你的工作分為兩個部分。請嚴格按照以下格式與分隔標記輸出，不要有任何額外的文字或說明。

[ARTICLE_START]
請仔細閱讀下方提供的[逐字稿]，並根據以下要求撰寫一篇部落格文章。

${finalRules}
[ARTICLE_END]

[SEO_START]
根據你寫好的文章內容，提供以下 SEO 建議：

- SEO 標題: [請在此生成 SEO 標題]
- 搜尋描述: [請在此生成一段約 150 字的搜尋描述]
- 固定網址: [請在此生成小寫英文、單字用-連接的網址]
- 標籤: [請根據文章內容和上方指定的標籤，生成最合適的標籤組合，用半形逗號,隔開]
[SEO_END]

[逐字稿]:
---
${sourceText}
---`;
}

function renderKeywords(keywordsData) {
    const coreList = document.getElementById('seo-keywords-core');
    const longtailList = document.getElementById('seo-keywords-longtail');
    const resultContainer = document.getElementById('keywords-result-container');
    coreList.innerHTML = '';
    longtailList.innerHTML = '';
    if (keywordsData && keywordsData.core_keywords && keywordsData.core_keywords.length > 0) {
        keywordsData.core_keywords.forEach(kw => { const li = document.createElement('li'); li.textContent = kw; coreList.appendChild(li); });
    } else { coreList.innerHTML = '<li>無建議</li>'; }
    if (keywordsData && keywordsData.long_tail_keywords && keywordsData.long_tail_keywords.length > 0) {
        keywordsData.long_tail_keywords.forEach(kw => { const li = document.createElement('li'); li.textContent = kw; longtailList.appendChild(li); });
    } else { longtailList.innerHTML = '<li>無建議</li>'; }
    resultContainer.classList.remove('hidden');
}

function renderInternalLinks(linksData) {
    const resultContainer = document.getElementById('internal-links-result-container');
    resultContainer.innerHTML = '';
    if (!linksData || linksData.length === 0) {
        resultContainer.innerHTML = `<p class="text-sm text-[var(--gray-text)] text-center p-2">找不到合適的內部連結建議。</p>`;
        return;
    }
    linksData.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = 'internal-link-suggestion';
        card.innerHTML = `
            <strong>建議錨點文字：</strong><p>${suggestion.anchor_text}</p>
            <strong class="mt-2">上下文句子：</strong><blockquote>${suggestion.context_sentence}</blockquote>
            <div class="suggestion-target">
                <strong>建議連結至：</strong><p><a href="${suggestion.suggested_link_url}" target="_blank" rel="noopener">${suggestion.suggested_link_title}</a></p>
            </div>`;
        resultContainer.appendChild(card);
    });
}

function renderVersionTabs() {
    const tabsContainer = document.getElementById('blog-versions-tabs-container');
    tabsContainer.innerHTML = '';
    state.blogArticleVersions.forEach((version, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab-btn text-sm py-2 px-4';
        tab.textContent = `版本 ${index + 1}`;
        if (index === state.currentBlogVersionIndex) { tab.classList.add('active'); }
        tab.addEventListener('click', () => switchVersionView(index));
        tabsContainer.appendChild(tab);
    });
}

function switchVersionView(index) {
    state.currentBlogVersionIndex = index;
    renderVersionTabs();
    renderCurrentVersionUI();
}

function renderCurrentVersionUI() {
    const currentVersion = state.blogArticleVersions[state.currentBlogVersionIndex];
    if (!currentVersion) return;
    document.getElementById('blog-preview').innerHTML = currentVersion.htmlContent;
    document.getElementById('html-source-preview').value = currentVersion.htmlContent;
    document.getElementById('markdown-source-preview').value = convertHtmlToMarkdown(currentVersion.htmlContent);
    document.getElementById('seo-title-text').textContent = currentVersion.seoData.title;
    document.getElementById('seo-description-text').textContent = currentVersion.seoData.description;
    document.getElementById('seo-permalink-text').textContent = currentVersion.seoData.permalink;
    document.getElementById('seo-tags-text').textContent = currentVersion.seoData.tags;
    if (currentVersion.advancedSeoData.keywords) {
        renderKeywords(currentVersion.advancedSeoData.keywords);
    } else { document.getElementById('keywords-result-container').classList.add('hidden'); }
    if (currentVersion.advancedSeoData.internalLinks) {
        renderInternalLinks(currentVersion.advancedSeoData.internalLinks);
    } else { document.getElementById('internal-links-result-container').innerHTML = ''; }
}


function initializeTab2() {
    const generateBlogBtn = document.getElementById('generate-blog-btn');
    const generateBlogVariationBtn = document.getElementById('generate-blog-variation-btn');
    const blogVersionsTabsContainer = document.getElementById('blog-versions-tabs-container');
    const optimizeTextForBlogBtn = document.getElementById('optimize-text-for-blog-btn');
    const blogTitleInput = document.getElementById('blog-title');
    const blogYtIdInput = document.getElementById('blog-yt-id');
    const blogPersonaSelect = document.getElementById('blog-persona');
    const blogWordCountSelect = document.getElementById('blog-word-count');
    const blogToneSelect = document.getElementById('blog-tone');
    const ctaPresetSelect = document.getElementById('cta-preset-select');
    const blogCtaTextarea = document.getElementById('blog-cta');
    const blogOutputContainer = document.getElementById('blog-output-container');
    const blogPlaceholder = document.getElementById('blog-placeholder');
    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const downloadMdBtn = document.getElementById('download-md-btn');
    const allBlogViewButtons = document.querySelectorAll('.blog-view-btn');
    const saveCtaBtn = document.getElementById('save-cta-btn');
    const deleteCtaBtn = document.getElementById('delete-cta-btn');
    const tagContainer = document.getElementById('tag-container');
    const tagInput = document.getElementById('tag-input');
    const tagSuggestions = document.getElementById('tag-suggestions');
    const saveTagsBtn = document.getElementById('save-tags-btn');
    const aiStyleToggleBtn = document.getElementById('ai-style-toggle-btn');
    const aiStylePanel = document.getElementById('ai-style-panel');
    const seoToggleBtn = document.getElementById('seo-toggle-btn');
    const seoPanel = document.getElementById('seo-panel');
    const advancedSeoToggleBtn = document.getElementById('advanced-seo-toggle-btn');
    const advancedSeoPanel = document.getElementById('advanced-seo-panel');
    const analyzeKeywordsBtn = document.getElementById('analyze-keywords-btn');
    const analyzeInternalLinksBtn = document.getElementById('analyze-internal-links-btn');
    const keywordsLoader = document.getElementById('keywords-loader');
    const keywordsResultContainer = document.getElementById('keywords-result-container');
    const internalLinksLoader = document.getElementById('internal-links-loader');
    const internalLinksResultContainer = document.getElementById('internal-links-result-container');
    const internalLinksSource = document.getElementById('internal-links-source');
    const openPromptWizardBtn = document.getElementById('open-prompt-wizard-btn');
    const promptWizardModal = document.getElementById('prompt-wizard-modal');
    const closePromptWizardBtn = document.getElementById('close-prompt-wizard-btn');
    const savePromptWizardBtn = document.getElementById('save-prompt-wizard-btn');
    const restorePromptDefaultsBtn = document.getElementById('restore-prompt-defaults-btn');
    const wizardStructSummary = document.getElementById('wizard-struct-summary');
    const wizardStructPoints = document.getElementById('wizard-struct-points');
    const wizardStructNone = document.getElementById('wizard-struct-none');
    const wizardToneFinetune = document.getElementById('wizard-tone-finetune');
    const wizardElemBold = document.getElementById('wizard-elem-bold');
    const wizardElemTable = document.getElementById('wizard-elem-table');
    const wizardElemQuote = document.getElementById('wizard-elem-quote');

    function openPromptWizard() {
        loadAndPopulateWizard();
        promptWizardModal.classList.remove('hidden');
    }

    function closePromptWizard() {
        promptWizardModal.classList.add('hidden');
    }

    function savePromptSettings() {
        const settings = {
            structSummary: wizardStructSummary.checked,
            structPoints: wizardStructPoints.checked,
            structNone: wizardStructNone.checked,
            h2Style: document.querySelector('input[name="wizard-h2-style"]:checked').value,
            elemBold: wizardElemBold.checked,
            elemTable: wizardElemTable.checked,
            elemQuote: wizardElemQuote.checked,
            toneFinetune: wizardToneFinetune.value.trim()
        };
        localStorage.setItem(SETTINGS_STORAGE_KEYS.PROMPT_WIZARD, JSON.stringify(settings));
        showToast('AI 寫作風格已儲存！');
        closePromptWizard();
    }
    
    function restoreDefaultSettings() {
        if (confirm('您確定要清除所有自訂風格，並恢復為預設設定嗎？')) {
            localStorage.removeItem(SETTINGS_STORAGE_KEYS.PROMPT_WIZARD);
            loadAndPopulateWizard();
            showToast('已恢復為預設寫作風格。');
        }
    }

    function loadAndPopulateWizard() {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEYS.PROMPT_WIZARD)) || {};
        wizardStructSummary.checked = settings.structSummary || false;
        wizardStructPoints.checked = settings.structPoints || false;
        wizardStructNone.checked = settings.structNone || false;

        document.querySelector(`input[name="wizard-h2-style"][value="${settings.h2Style || 'default'}"]`).checked = true;

        wizardElemBold.checked = settings.elemBold || false;
        wizardElemTable.checked = settings.elemTable || false;
        wizardElemQuote.checked = settings.elemQuote || false;

        wizardToneFinetune.value = settings.toneFinetune || '';
    }

    function handleStructureCheck() {
        if (this.id === 'wizard-struct-none' && this.checked) {
            wizardStructSummary.checked = false;
            wizardStructPoints.checked = false;
        } else if (this.id !== 'wizard-struct-none' && this.checked) {
            wizardStructNone.checked = false;
        }
    }

    function saveSetting(key, value) { try { localStorage.setItem(key, value); } catch (e) { console.error(`無法儲存設定 ${key}:`, e); } }
    
    function loadSettings() {
        const persona = localStorage.getItem(SETTINGS_STORAGE_KEYS.BLOG_PERSONA);
        if (persona) blogPersonaSelect.value = persona;
        blogWordCountSelect.value = localStorage.getItem(SETTINGS_STORAGE_KEYS.BLOG_WORD_COUNT) || '約 1200 字';
        const tone = localStorage.getItem(SETTINGS_STORAGE_KEYS.BLOG_TONE);
        if (tone) blogToneSelect.value = tone;
    }
    
    function saveBlogDraft() {
        const hasContent = document.getElementById('smart-area').value.trim().length > 0;
        if (!hasContent && state.blogArticleVersions.length === 0) return;
        const draft = {
            sourceContent: document.getElementById('smart-area').value,
            optimizedContent: state.optimizedTextForBlog,
            sourceType: state.blogSourceType,
            title: blogTitleInput.value, ytId: blogYtIdInput.value,
            persona: blogPersonaSelect.value, wordCount: blogWordCountSelect.value, tone: blogToneSelect.value,
            tags: state.currentBlogTags, ctaPreset: ctaPresetSelect.value, ctaContent: blogCtaTextarea.value,
            versions: state.blogArticleVersions,
            currentVersionIndex: state.currentBlogVersionIndex,
            timestamp: new Date().getTime(),
        };
        try { localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify(draft)); } 
        catch (e) { console.error('無法儲存部落格草稿:', e); }
    }
    
    window.handleCtaChange = function() {
        const selected = ctaPresetSelect.value;
        saveCtaBtn.classList.toggle('hidden', selected !== 'custom');
        deleteCtaBtn.classList.toggle('hidden', !selected.startsWith('custom_'));
        if (selected.startsWith('custom_')) { const customCtas = loadCustomCTAsFromStorage(); const index = parseInt(selected.split('_')[1], 10); blogCtaTextarea.value = customCtas[index]?.content || ''; blogCtaTextarea.readOnly = true; } 
        else if (PRESET_CTAS[selected]) { blogCtaTextarea.value = PRESET_CTAS[selected].content; blogCtaTextarea.readOnly = true; } 
        else { blogCtaTextarea.value = ''; blogCtaTextarea.readOnly = false; blogCtaTextarea.placeholder = '可在此自訂 CTA，或選擇上方預設'; }
    }
    function loadCustomCTAsFromStorage() { try { const storedCtas = localStorage.getItem(CUSTOM_CTA_STORAGE_KEY); return storedCtas ? JSON.parse(storedCtas) : []; } catch (error) { console.error("無法讀取自訂 CTA:", error); return []; } }
    function renderCtaSelect(selectedValue = 'custom') { const customCtas = loadCustomCTAsFromStorage(); let allCtaOptions = { 'custom': '自訂 CTA', ...Object.fromEntries(Object.entries(PRESET_CTAS).map(([key, value]) => [key, value.title])) }; customCtas.forEach((cta, index) => { allCtaOptions[`custom_${index}`] = `[自訂] ${cta.title}`; }); const currentVal = ctaPresetSelect.value; populateSelectWithOptions(ctaPresetSelect, allCtaOptions); ctaPresetSelect.value = allCtaOptions[currentVal] ? currentVal : selectedValue; }
    function addTag(tagText) { const trimmedTag = tagText.trim(); if (trimmedTag && !state.currentBlogTags.includes(trimmedTag)) { state.currentBlogTags.push(trimmedTag); renderTags(); saveBlogDraft(); } }
    function removeTag(tagToRemove) { state.currentBlogTags = state.currentBlogTags.filter(tag => tag !== tagToRemove); renderTags(); saveBlogDraft(); }
    window.renderTags = function() { tagContainer.querySelectorAll('.tag-pill').forEach(pill => pill.remove()); [...state.currentBlogTags].reverse().forEach(tag => { const pill = document.createElement('span'); pill.className = 'tag-pill'; pill.textContent = tag; const deleteBtn = document.createElement('span'); deleteBtn.className = 'tag-delete-btn'; deleteBtn.innerHTML = '&times;'; deleteBtn.setAttribute('role', 'button'); deleteBtn.setAttribute('tabindex', '0'); deleteBtn.addEventListener('click', () => removeTag(tag)); pill.appendChild(deleteBtn); tagContainer.prepend(pill); }); }
    function loadCustomTagsFromStorage() { try { const storedTags = localStorage.getItem(CUSTOM_TAGS_STORAGE_KEY); return storedTags ? JSON.parse(storedTags) : []; } catch (error) { console.error("無法讀取自訂標籤:", error); return []; } }
    function renderTagSuggestions() { tagSuggestions.innerHTML = ''; const customTags = loadCustomTagsFromStorage(); const allSuggestions = [...new Set([...PRESET_TAGS, ...customTags])]; allSuggestions.forEach(tag => { const suggestion = document.createElement('span'); suggestion.className = 'tag-suggestion'; suggestion.textContent = tag; suggestion.setAttribute('role', 'button'); suggestion.setAttribute('tabindex', '0'); suggestion.addEventListener('click', () => { addTag(tag); }); tagSuggestions.appendChild(suggestion); }); }
    function confirmUseOptimizedText(text) { 
        state.optimizedTextForBlog = text; 
        state.blogSourceType = 'optimized'; 
        if(window.updateSourceStatusUI) window.updateSourceStatusUI('optimized');
        saveBlogDraft();
        hideModal(); 
        showToast('文本已優化，現在可以生成內容了！'); 
        window.updateStepperUI();
    }
    function switchBlogView(viewToShow) { allBlogViewButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.blogView === viewToShow)); document.querySelectorAll('.blog-view-content').forEach(content => content.classList.toggle('hidden', content.id !== `blog-view-${viewToShow}`)); }
    function resetTab2() {
        state.blogSourceType = 'raw'; state.optimizedTextForBlog = ''; state.blogArticleVersions = []; state.currentBlogVersionIndex = 0;
        if(window.updateSourceStatusUI) window.updateSourceStatusUI('raw');
        blogOutputContainer.classList.add('hidden'); blogPlaceholder.classList.remove('hidden');
        blogTitleInput.value = ''; blogYtIdInput.value = '';
        ctaPresetSelect.value = 'custom'; handleCtaChange();
        state.currentBlogTags = []; renderTags();
        window.clearBlogDraft(); window.updateStepperUI();
        renderVersionTabs();
        generateBlogVariationBtn.disabled = true;
    }
    function saveCustomCTA() { const content = blogCtaTextarea.value.trim(); if (!content) { showModal({ title: '錯誤', message: 'CTA 內容不能為空。' }); return; } const title = prompt('請為這個 CTA 命名（例如：我的個人 Blog 宣傳）：'); if (!title || !title.trim()) { return; } const customCtas = loadCustomCTAsFromStorage(); const newCta = { title: title.trim(), content }; customCtas.push(newCta); try { localStorage.setItem(CUSTOM_CTA_STORAGE_KEY, JSON.stringify(customCtas)); showToast('自訂 CTA 已儲存！'); const newKey = `custom_${customCtas.length - 1}`; renderCtaSelect(newKey); handleCtaChange(); } catch (error) { console.error("無法儲存自訂 CTA:", error); showModal({ title: '儲存失敗', message: '無法儲存 CTA，可能是儲存空間已滿。' }); } }
    function deleteCustomCTA() { const selectedValue = ctaPresetSelect.value; if (!selectedValue.startsWith('custom_')) return; const customCtas = loadCustomCTAsFromStorage(); const index = parseInt(selectedValue.split('_')[1], 10); const ctaToDelete = customCtas[index]; if (!ctaToDelete) return; if (confirm(`您確定要刪除「${ctaToDelete.title}」這個 CTA 嗎？`)) { customCtas.splice(index, 1); localStorage.setItem(CUSTOM_CTA_STORAGE_KEY, JSON.stringify(customCtas)); showToast('自訂 CTA 已刪除。'); renderCtaSelect('custom'); handleCtaChange(); } }
    function saveCustomTagsToStorage() { const customTags = loadCustomTagsFromStorage(); const allTags = new Set([...customTags, ...state.currentBlogTags]); const newCustomTags = [...allTags].filter(tag => !PRESET_TAGS.includes(tag)); try { localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(newCustomTags)); showToast('自訂標籤庫已更新！'); renderTagSuggestions(); } catch (error) { console.error("無法儲存自訂標籤:", error); showModal({ title: '儲存失敗', message: '無法儲存標籤，可能是儲存空間已滿。' }); } }
    function initializeTags() { renderTagSuggestions(); tagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput.value); tagInput.value = ''; } }); saveTagsBtn.addEventListener('click', saveCustomTagsToStorage); }
    async function optimizeTextForBlog() { 
        const apiKey = sessionStorage.getItem('geminiApiKey'); 
        if (!apiKey) { if(window.showApiKeyModal) window.showApiKeyModal(); return; } 

        const content = document.getElementById('smart-area').value.trim(); if (!content) { showModal({ title: '錯誤', message: '請先在「智慧區域」中輸入內容。' }); return; } const prompt = `你是一位專業的文案編輯。請將以下的 SRT 字幕逐字稿，優化成一篇流暢易讀的純文字文章。\n規則：\n1. 加上適當的標點符號與段落，讓文章更通順。\n2. 絕對不可以改寫、改變原文的語意。\n3. 不可新增任何字幕中沒有的資訊或自己的評論。\n4. 修正明顯的錯別字，但保留口語化的風格。\n5. 移除所有時間戳和行號。\n6. 直接輸出優化後的文章，不要有任何前言或結語。\n\n字幕逐字稿如下：\n---\n${content}\n---`; showModal({ title: 'AI 優化中...', showProgressBar: true, taskType: 'optimize' }); const btn = optimizeTextForBlogBtn; btn.disabled = true; btn.classList.add('btn-loading'); try { const result = await callGeminiAPI(apiKey, prompt); showModal({ title: '文本優化完成', message: result, showCopyButton: true, buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確認使用此版本', class: 'btn-primary', callback: () => confirmUseOptimizedText(result) } ] }); } catch (error) { if (error.message && error.message.includes('overloaded')) { showModal({ title: 'AI 正在尖峰時段，請稍候！', message: '別擔心...', buttons: [ { text: '關閉', class: 'btn-secondary', callback: hideModal }, { text: '立即重試', class: 'btn-primary', callback: () => { hideModal(); optimizeTextForBlog(); } } ] }); } else { showModal({ title: 'AI 處理失敗', message: `發生錯誤：${error.message}` }); } } finally { btn.disabled = false; btn.classList.remove('btn-loading'); } }
    
    async function analyzeKeywords() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) { if (window.showApiKeyModal) window.showApiKeyModal(); return; }

        const currentVersion = state.blogArticleVersions[state.currentBlogVersionIndex];
        if (!currentVersion) {
            showToast('請先生成部落格文章後再分析關鍵字。', { type: 'error' });
            return;
        }

        const prompt = `你是一位 SEO 專家。請根據以下這篇部落格文章，分析並提取出 5 個核心關鍵字和 5 個長尾關鍵字。請以嚴格的 JSON 格式輸出，不要有任何 markdown 標記，結構如下：\n{ "core_keywords": ["關鍵字1", "關鍵字2", ...], "long_tail_keywords": ["長尾關鍵字1", "長尾關鍵字2", ...] }\n\n文章內容：\n---\n${currentVersion.htmlContent.replace(/<[^>]+>/g, ' ')}\n---`;

        analyzeKeywordsBtn.disabled = true;
        keywordsLoader.classList.remove('hidden');
        keywordsResultContainer.classList.add('hidden');

        try {
            const result = await callGeminiAPI(apiKey, prompt);
            const jsonData = JSON.parse(result);
            currentVersion.advancedSeoData.keywords = jsonData;
            renderKeywords(jsonData);
            saveBlogDraft();
        } catch (error) {
            console.error("關鍵字分析失敗:", error);
            showToast('關鍵字分析失敗，請重試。', { type: 'error' });
            keywordsResultContainer.classList.remove('hidden');
            document.getElementById('seo-keywords-core').innerHTML = '<li>分析失敗</li>';
            document.getElementById('seo-keywords-longtail').innerHTML = '<li>分析失敗</li>';
        } finally {
            analyzeKeywordsBtn.disabled = false;
            keywordsLoader.classList.add('hidden');
        }
    }

    async function analyzeInternalLinks() {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) { if (window.showApiKeyModal) window.showApiKeyModal(); return; }

        const currentVersion = state.blogArticleVersions[state.currentBlogVersionIndex];
        const linksSourceText = internalLinksSource.value.trim();

        if (!currentVersion) {
            showToast('請先生成部落格文章。', { type: 'error' });
            return;
        }
        if (!linksSourceText) {
            showToast('請貼上您的網站文章列表。', { type: 'error' });
            return;
        }

        const prompt = `你是一位網站內容策略師。下方有 [新文章] 和一份 [現有文章列表]。請從 [新文章] 中找出 2-3 個最適合安插內部連結的句子或詞彙，並建議可以連結到 [現有文章列表] 中的哪篇文章。請以嚴格的 JSON 格式輸出，不要有任何 markdown 標記，結構如下：\n[{ "anchor_text": "建議的錨點文字", "context_sentence": "包含錨點文字的完整上下文句子", "suggested_link_url": "從列表中找到對應的完整網址", "suggested_link_title": "從列表中找到對應的文章標題" }]\n\n[新文章]:\n---\n${currentVersion.htmlContent.replace(/<[^>]+>/g, ' ')}\n---\n\n[現有文章列表]:\n---\n${linksSourceText}\n---`;

        analyzeInternalLinksBtn.disabled = true;
        internalLinksLoader.classList.remove('hidden');
        internalLinksResultContainer.innerHTML = '';

        try {
            const result = await callGeminiAPI(apiKey, prompt);
            const jsonData = JSON.parse(result);
            currentVersion.advancedSeoData.internalLinks = jsonData;
            renderInternalLinks(jsonData);
            saveBlogDraft();
        } catch (error) {
            console.error("內部連結分析失敗:", error);
            showToast('內部連結分析失敗，請重試。', { type: 'error' });
            internalLinksResultContainer.innerHTML = `<p class="text-sm text-red-500 text-center p-2">分析失敗，請檢查您的輸入或稍後重試。</p>`;
        } finally {
            analyzeInternalLinksBtn.disabled = false;
            internalLinksLoader.classList.add('hidden');
        }
    }

    async function proceedGenerateBlogPost(isVariation = false) { 
        const apiKey = sessionStorage.getItem('geminiApiKey'); 
        if (!apiKey) { if(window.showApiKeyModal) window.showApiKeyModal(); return; } 
        const sourceText = (state.blogSourceType === 'optimized') ? state.optimizedTextForBlog : document.getElementById('smart-area').value.trim(); 
        if (!sourceText) { showModal({ title: '錯誤', message: '缺少文章生成的來源內容。' }); return; } 
        const mainTitle = blogTitleInput.value.trim();
        let variationModifier = null;
        if(isVariation) {
            const modifiers = ["請用更活潑、更口語化的語氣重寫。", "請用更專業、更具權威性的風格改寫。", "請在文章開頭加入一個引人入勝的故事作為開場。", "請讓文章結構更簡潔，多用條列式說明。"];
            variationModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            showToast(`AI 正在嘗試新風格：${variationModifier.replace('請','').replace('重寫','').replace('。','')}`);
        }
        const promptOptions = { persona: blogPersonaSelect.value, tone: blogToneSelect.value, wordCount: blogWordCountSelect.value, tagsString: state.currentBlogTags.join(', '), cta: blogCtaTextarea.value, sourceText: sourceText, variationModifier: variationModifier };
        const prompt = assembleBlogPrompt(promptOptions);
        showModal({ title: 'AI 生成中...', showProgressBar: true, taskType: 'blog' }); 
        const btn = isVariation ? generateBlogVariationBtn : generateBlogBtn;
        btn.disabled = true; 
        btn.classList.add('btn-loading'); 

        try { 
            let fullResponse = '';
            let isValidResponse = false;
            for (let i = 0; i < 2; i++) {
                fullResponse = await callGeminiAPI(apiKey, prompt);
                if (fullResponse.includes('[ARTICLE_START]') && fullResponse.includes('[SEO_START]')) {
                    isValidResponse = true;
                    break;
                }
                console.warn(`第 ${i+1} 次嘗試，AI 回應格式不完整，正在自動重試...`);
            }
            if (!isValidResponse) {
                throw new Error("AI 回應格式不完整，請稍後再試或生成另一版本。");
            }

            const articleMatch = fullResponse.match(/\[ARTICLE_START\]([\s\S]*?)\[ARTICLE_END\]/); 
            let tempArticleContent = articleMatch ? articleMatch[1].trim() : "無法解析文章內容。"; 
            const ytId = blogYtIdInput.value.trim(); 
            if (ytId) { 
                const youtubeEmbed = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe src="https://www.youtube.com/embed/${ytId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`; 
                if (tempArticleContent.includes('<hr>')) { tempArticleContent = tempArticleContent.replace('<hr>', `${youtubeEmbed}\n<hr>`); } 
                else { tempArticleContent += `\n${youtubeEmbed}`; } 
            } 
            if(mainTitle) tempArticleContent = `<h1>${mainTitle}</h1>\n` + tempArticleContent; 
            
            const seoMatch = fullResponse.match(/\[SEO_START\]([\s\S]*?)\[SEO_END\]/);
            const seoData = {};
            if (seoMatch) {
                const seoText = seoMatch[1].trim(); 
                seoData.title = seoText.match(/SEO 標題: (.*)/)?.[1] || 'N/A';
                seoData.description = seoText.match(/搜尋描述: (.*)/)?.[1] || 'N/A';
                seoData.permalink = seoText.match(/固定網址: (.*)/)?.[1] || 'N/A';
                seoData.tags = seoText.match(/標籤: (.*)/)?.[1] || 'N/A';
            }
            
            const newVersion = { htmlContent: tempArticleContent, seoData: seoData, advancedSeoData: { keywords: null, internalLinks: null } };

            if (isVariation) {
                state.blogArticleVersions.push(newVersion);
                state.currentBlogVersionIndex = state.blogArticleVersions.length - 1;
            } else {
                state.blogArticleVersions = [newVersion];
                state.currentBlogVersionIndex = 0;
            }

            renderVersionTabs();
            renderCurrentVersionUI();
            
            analyzeKeywordsBtn.disabled = false;
            analyzeInternalLinksBtn.disabled = false;
            generateBlogVariationBtn.disabled = false;

            saveBlogDraft(); 
            blogPlaceholder.classList.add('hidden'); 
            blogOutputContainer.classList.remove('hidden'); 
            switchBlogView('preview'); 
            hideModal(); 
            
        } catch (error) { 
            if (error.message && error.message.includes('overloaded')) { 
                showModal({ title: 'AI 正在尖峰時段，請稍候！', message: '別擔心...', buttons: [ { text: '關閉', class: 'btn-secondary', callback: hideModal }, { text: '立即重試', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateBlogPost(isVariation); } } ] }); 
            } else { 
                showModal({ title: '文章生成失敗', message: `發生錯誤：${error.message}` }); 
            } 
        } finally { 
            btn.disabled = false; 
            btn.classList.remove('btn-loading'); 
            window.updateStepperUI(); 
        } 
    }

    function generateBlogPost() { 
        if (state.blogArticleVersions.length > 0 && !confirm("這將會清除所有已生成的版本並重新開始，您確定嗎？")) {
            return;
        }
        if (state.blogSourceType === 'raw' && document.getElementById('smart-area').value.trim()) { 
            showModal({ title: '提醒', message: '您尚未優化文本，直接生成可能會影響文章品質。確定要繼續嗎？', buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateBlogPost(false); } } ] }); 
        } else { 
            proceedGenerateBlogPost(false); 
        } 
    }

    function generateBlogVariation() {
        proceedGenerateBlogPost(true);
    }

    function downloadAsHtml() { 
        const currentVersion = state.blogArticleVersions[state.currentBlogVersionIndex];
        if(!currentVersion) return;
        const content = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>${currentVersion.seoData.title}</title><style>body{font-family:sans-serif;line-height:1.6;} .youtube-embed{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1rem 0;} .youtube-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;}</style></head><body>${currentVersion.htmlContent}</body></html>`; 
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${currentVersion.seoData.permalink || 'blog-post'}.html`; 
        a.click(); 
        URL.revokeObjectURL(url); 
    }
    
    function downloadAsMarkdown() { 
        const currentVersion = state.blogArticleVersions[state.currentBlogVersionIndex];
        if(!currentVersion) return;
        const content = convertHtmlToMarkdown(currentVersion.htmlContent); 
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${currentVersion.seoData.permalink || 'blog-post'}.md`; 
        a.click(); 
        URL.revokeObjectURL(url); 
    }
    
    optimizeTextForBlogBtn.addEventListener('click', optimizeTextForBlog);
    generateBlogBtn.addEventListener('click', generateBlogPost);
    generateBlogVariationBtn.addEventListener('click', generateBlogVariation);
    downloadHtmlBtn.addEventListener('click', downloadAsHtml);
    downloadMdBtn.addEventListener('click', downloadAsMarkdown);
    ctaPresetSelect.addEventListener('change', () => { handleCtaChange(); saveBlogDraft(); });
    saveCtaBtn.addEventListener('click', saveCustomCTA); 
    deleteCtaBtn.addEventListener('click', deleteCustomCTA);
    aiStyleToggleBtn.addEventListener('click', () => toggleAccordion(aiStyleToggleBtn, aiStylePanel));
    seoToggleBtn.addEventListener('click', () => toggleAccordion(seoToggleBtn, seoPanel));
    allBlogViewButtons.forEach(button => button.addEventListener('click', () => switchBlogView(button.dataset.blogView)));
    const copyButtonLogic = (btn) => { const targetId = btn.dataset.copyTarget; const targetElement = document.getElementById(targetId); if (targetElement) { const content = targetElement.tagName === 'TEXTAREA' ? targetElement.value : targetElement.textContent; navigator.clipboard.writeText(content).then(() => { const originalIcon = btn.innerHTML; btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`; setTimeout(() => { btn.innerHTML = originalIcon; }, 2000); }); } };
    document.querySelectorAll('.seo-copy-btn').forEach(button => button.addEventListener('click', () => copyButtonLogic(button)));
    document.querySelectorAll('.source-copy-btn').forEach(button => button.addEventListener('click', () => copyButtonLogic(button)));
    
    blogTitleInput.addEventListener('input', saveBlogDraft);
    blogYtIdInput.addEventListener('input', saveBlogDraft);
    blogPersonaSelect.addEventListener('change', (e) => { saveSetting(SETTINGS_STORAGE_KEYS.BLOG_PERSONA, e.target.value); saveBlogDraft(); });
    blogWordCountSelect.addEventListener('change', (e) => { saveSetting(SETTINGS_STORAGE_KEYS.BLOG_WORD_COUNT, e.target.value); saveBlogDraft(); });
    blogToneSelect.addEventListener('change', (e) => { saveSetting(SETTINGS_STORAGE_KEYS.BLOG_TONE, e.target.value); saveBlogDraft(); });
    blogCtaTextarea.addEventListener('input', saveBlogDraft);
    
    advancedSeoToggleBtn.addEventListener('click', () => toggleAccordion(advancedSeoToggleBtn, advancedSeoPanel));
    analyzeKeywordsBtn.addEventListener('click', analyzeKeywords);
    analyzeInternalLinksBtn.addEventListener('click', analyzeInternalLinks);
    internalLinksSource.addEventListener('input', saveBlogDraft);

    openPromptWizardBtn.addEventListener('click', openPromptWizard);
    closePromptWizardBtn.addEventListener('click', closePromptWizard);
    savePromptWizardBtn.addEventListener('click', savePromptSettings);
    restorePromptDefaultsBtn.addEventListener('click', restoreDefaultSettings);
    wizardStructSummary.addEventListener('change', handleStructureCheck);
    wizardStructPoints.addEventListener('change', handleStructureCheck);
    wizardStructNone.addEventListener('change', handleStructureCheck);

    const personaOptions = {'第一人稱視角': '第一人稱', '第三人稱視角': '第三人稱'};
    const wordCountOptions = {'約 800 字': '約 800 字', '約 1200 字': '約 1200 字', '約 1500 字': '約 1500 字'};
    const toneOptions = {'充滿能量與感染力': '能量感染力', '專業且具權威性': '專業權威', '口語化且親切': '口語親切', '幽默風趣': '幽默風趣'};
    populateSelectWithOptions(blogPersonaSelect, personaOptions);
    populateSelectWithOptions(blogWordCountSelect, wordCountOptions);
    populateSelectWithOptions(blogToneSelect, toneOptions);
    
    renderCtaSelect();
    initializeTags();
    handleCtaChange();
    loadSettings();
    
    if (window.hasBlogDraft()) {
        setTimeout(() => {
            if (confirm('偵測到上次有未儲存的部落格文章草稿，是否要恢復？')) {
                restoreBlogDraft();
            } else {
                window.clearBlogDraft();
                if(window.updateTabAvailability) window.updateTabAvailability();
            }
        }, 100);
    }
    window.updateStepperUI();
}