/**
 * tab2-blog.js
 * 負責管理第二分頁「部落格文章生成」的所有 UI 互動與邏輯。
 */

// --- 元素選擇 (模組級) ---
const optimizeTextForBlogBtn = document.getElementById('optimize-text-for-blog-btn');
const blogSourceStatus = document.getElementById('blog-source-status');
const generateBlogBtn = document.getElementById('generate-blog-btn');
const blogTitleInput = document.getElementById('blog-title');
const blogYtIdInput = document.getElementById('blog-yt-id');
const blogPersonaSelect = document.getElementById('blog-persona');
const blogWordCountSelect = document.getElementById('blog-word-count');
const blogToneSelect = document.getElementById('blog-tone');
const ctaPresetSelect = document.getElementById('cta-preset-select');
const blogCtaTextarea = document.getElementById('blog-cta');
const blogOutputContainer = document.getElementById('blog-output-container');
const blogPlaceholder = document.getElementById('blog-placeholder');
const blogPreview = document.getElementById('blog-preview');
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

// --- 輔助函式 (模組級) ---
function handleCtaChange() {
    const selected = ctaPresetSelect.value;
    saveCtaBtn.classList.toggle('hidden', selected !== 'custom');
    deleteCtaBtn.classList.toggle('hidden', !selected.startsWith('custom_'));

    if (selected.startsWith('custom_')) {
        const customCtas = loadCustomCTAsFromStorage();
        const index = parseInt(selected.split('_')[1], 10);
        blogCtaTextarea.value = customCtas[index]?.content || '';
        blogCtaTextarea.readOnly = true;
    } else if (PRESET_CTAS[selected]) {
        blogCtaTextarea.value = PRESET_CTAS[selected].content;
        blogCtaTextarea.readOnly = true;
    } else {
        blogCtaTextarea.value = '';
        blogCtaTextarea.readOnly = false;
        blogCtaTextarea.placeholder = '可在此自訂 CTA，或選擇上方預設';
    }
}
function loadCustomCTAsFromStorage() { try { const storedCtas = localStorage.getItem(CUSTOM_CTA_STORAGE_KEY); return storedCtas ? JSON.parse(storedCtas) : []; } catch (error) { console.error("無法讀取自訂 CTA:", error); return []; } }
function renderCtaSelect(selectedValue = 'custom') { const customCtas = loadCustomCTAsFromStorage(); let allCtaOptions = { 'custom': '自訂 CTA', ...Object.fromEntries(Object.entries(PRESET_CTAS).map(([key, value]) => [key, value.title])) }; customCtas.forEach((cta, index) => { allCtaOptions[`custom_${index}`] = `[自訂] ${cta.title}`; }); const currentVal = ctaPresetSelect.value; populateSelectWithOptions(ctaPresetSelect, allCtaOptions); ctaPresetSelect.value = allCtaOptions[currentVal] ? currentVal : selectedValue; }
function addTag(tagText) { const trimmedTag = tagText.trim(); if (trimmedTag && !state.currentBlogTags.includes(trimmedTag)) { state.currentBlogTags.push(trimmedTag); renderTags(); } }
function removeTag(tagToRemove) { state.currentBlogTags = state.currentBlogTags.filter(tag => tag !== tagToRemove); renderTags(); }
function renderTags() { tagContainer.querySelectorAll('.tag-pill').forEach(pill => pill.remove()); [...state.currentBlogTags].reverse().forEach(tag => { const pill = document.createElement('span'); pill.className = 'tag-pill'; pill.textContent = tag; const deleteBtn = document.createElement('span'); deleteBtn.className = 'tag-delete-btn'; deleteBtn.innerHTML = '&times;'; deleteBtn.addEventListener('click', () => removeTag(tag)); pill.appendChild(deleteBtn); tagContainer.prepend(pill); }); }
function loadCustomTagsFromStorage() { try { const storedTags = localStorage.getItem(CUSTOM_TAGS_STORAGE_KEY); return storedTags ? JSON.parse(storedTags) : []; } catch (error) { console.error("無法讀取自訂標籤:", error); return []; } }
function renderTagSuggestions() { tagSuggestions.innerHTML = ''; const customTags = loadCustomTagsFromStorage(); const allSuggestions = [...new Set([...PRESET_TAGS, ...customTags])]; allSuggestions.forEach(tag => { const suggestion = document.createElement('span'); suggestion.className = 'tag-suggestion'; suggestion.textContent = tag; suggestion.addEventListener('click', () => { addTag(tag); }); tagSuggestions.appendChild(suggestion); }); }
function confirmUseOptimizedText(text) { state.optimizedTextForBlog = text; state.blogSourceType = 'optimized'; const statusText = '內容來源：已優化的文本'; blogSourceStatus.textContent = statusText; document.getElementById('social-source-status').textContent = statusText; blogSourceStatus.classList.add('text-green-600'); document.getElementById('social-source-status').classList.add('text-green-600'); hideModal(); showModal({ title: '確認', message: '來源已更新為「優化文本」，現在可以生成部落格與社群貼文了。' }); }

// --- 清除函式 ---
function resetTab2() {
    state.blogSourceType = 'raw';
    state.optimizedTextForBlog = '';
    state.blogArticleContent = '';
    
    blogSourceStatus.textContent = '內容來源：字幕原始檔';
    blogSourceStatus.classList.remove('text-green-600');
    
    blogOutputContainer.classList.add('hidden');
    blogPlaceholder.classList.remove('hidden');
    
    blogTitleInput.value = '';
    blogYtIdInput.value = '';
    
    ctaPresetSelect.value = 'custom';
    handleCtaChange();
    
    state.currentBlogTags = [];
    renderTags();
}

// --- 初始化函式 ---
function initializeTab2() {
    // --- 函式定義 ---
    function saveCustomCTA() { const content = blogCtaTextarea.value.trim(); if (!content) { showModal({ title: '錯誤', message: 'CTA 內容不能為空。' }); return; } const title = prompt('請為這個 CTA 命名（例如：我的個人 Blog 宣傳）：'); if (!title || !title.trim()) { return; } const customCtas = loadCustomCTAsFromStorage(); const newCta = { title: title.trim(), content }; customCtas.push(newCta); try { localStorage.setItem(CUSTOM_CTA_STORAGE_KEY, JSON.stringify(customCtas)); showModal({ title: '成功', message: '自訂 CTA 已儲存！' }); const newKey = `custom_${customCtas.length - 1}`; renderCtaSelect(newKey); handleCtaChange(); } catch (error) { console.error("無法儲存自訂 CTA:", error); showModal({ title: '儲存失敗', message: '無法儲存 CTA，可能是儲存空間已滿。' }); } }
    function deleteCustomCTA() { const selectedValue = ctaPresetSelect.value; if (!selectedValue.startsWith('custom_')) return; const customCtas = loadCustomCTAsFromStorage(); const index = parseInt(selectedValue.split('_')[1], 10); const ctaToDelete = customCtas[index]; if (!ctaToDelete) return; if (confirm(`您確定要刪除「${ctaToDelete.title}」這個 CTA 嗎？`)) { customCtas.splice(index, 1); localStorage.setItem(CUSTOM_CTA_STORAGE_KEY, JSON.stringify(customCtas)); showModal({ title: '成功', message: '自訂 CTA 已刪除。' }); renderCtaSelect('custom'); handleCtaChange(); } }
    function saveCustomTagsToStorage() { const customTags = loadCustomTagsFromStorage(); const allTags = new Set([...customTags, ...state.currentBlogTags]); const newCustomTags = [...allTags].filter(tag => !PRESET_TAGS.includes(tag)); try { localStorage.setItem(CUSTOM_TAGS_STORAGE_KEY, JSON.stringify(newCustomTags)); showModal({ title: '成功', message: '自訂標籤庫已更新！' }); renderTagSuggestions(); } catch (error) { console.error("無法儲存自訂標籤:", error); showModal({ title: '儲存失敗', message: '無法儲存標籤，可能是儲存空間已滿。' }); } }
    function initializeTags() { renderTagSuggestions(); tagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput.value); tagInput.value = ''; } }); saveTagsBtn.addEventListener('click', saveCustomTagsToStorage); }
    async function optimizeTextForBlog() { const apiKey = sessionStorage.getItem('geminiApiKey'); if (!apiKey) { showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' }); return; } const content = document.getElementById('smart-area').value.trim(); if (!content) { showModal({ title: '錯誤', message: '請先在「智慧區域」中輸入內容。' }); return; } const prompt = `你是一位專業的文案編輯。請將以下的 SRT 字幕逐字稿，優化成一篇流暢易讀的純文字文章。\n規則：\n1. 加上適當的標點符號與段落，讓文章更通順。\n2. 絕對不可以改寫、改變原文的語意。\n3. 不可新增任何字幕中沒有的資訊或自己的評論。\n4. 修正明顯的錯別字，但保留口語化的風格。\n5. 移除所有時間戳和行號。\n6. 直接輸出優化後的文章，不要有任何前言或結語。\n\n字幕逐字稿如下：\n---\n${content}\n---`; showModal({ title: 'AI 優化中...', showProgressBar: true, taskType: 'optimize' }); try { const result = await callGeminiAPI(apiKey, prompt); showModal({ title: '文本優化完成', message: result, showCopyButton: true, buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確認使用此版本', class: 'btn-primary', callback: () => confirmUseOptimizedText(result) } ] }); } catch (error) { showModal({ title: 'AI 處理失敗', message: `發生錯誤：${error.message}` }); } }
    async function proceedGenerateBlogPost() { const apiKey = sessionStorage.getItem('geminiApiKey'); if (!apiKey) { showModal({ title: '錯誤', message: '請先設定您的 Gemini API Key。' }); return; } const sourceText = (state.blogSourceType === 'optimized') ? state.optimizedTextForBlog : document.getElementById('smart-area').value.trim(); if (!sourceText) { showModal({ title: '錯誤', message: '缺少文章生成的來源內容。' }); return; } const persona = blogPersonaSelect.value; const tone = blogToneSelect.value; const wordCount = blogWordCountSelect.value; const cta = blogCtaTextarea.value; const mainTitle = blogTitleInput.value; const tagsString = state.currentBlogTags.join(', '); const prompt = `你是一位專業的部落格小編，專門負責將節目逐字稿轉換成格式良好、語氣自然、適合部落格發表的專欄文章。你的身份是[部落格小編]，任務是將節目逐字稿轉換成充滿能量的專欄報導。\n\n你的工作分為兩個部分。請嚴格按照以下格式與分隔標記輸出，不要有任何額外的文字或說明。\n\n[ARTICLE_START]\n請仔細閱讀下方提供的[逐字稿]，並根據以下要求撰寫一篇部落格文章。\n\n- 寫作人稱：${persona}\n- 寫作語氣：${tone}\n- 文章字數：${wordCount}\n- 指定標籤：${tagsString}\n- 格式要求：每個段落都需要一個小標題，並用 <h2> 標籤包圍。段落之間必須使用 <hr> 標籤分隔。\n- 文章結尾必須包含以下[宣傳語句]：${cta}\n- 文章前段需自然融入關鍵字但不可過度堆疊。\n[ARTICLE_END]\n\n[SEO_START]\n根據你寫好的文章內容，提供以下 SEO 建議：\n\n- SEO 標題: [請在此生成 SEO 標題]\n- 搜尋描述: [請在此生成一段約 150 字的搜尋描述]\n- 固定網址: [請在此生成小寫英文、單字用-連接的網址]\n- 標籤: [請根據文章內容和上方指定的標籤，生成最合適的標籤組合，用半形逗號,隔開]\n[SEO_END]\n\n[逐字稿]:\n---\n${sourceText}\n---`; showModal({ title: 'AI 生成中...', showProgressBar: true, taskType: 'blog' }); try { const fullResponse = await callGeminiAPI(apiKey, prompt); const articleMatch = fullResponse.match(/\[ARTICLE_START\]([\s\S]*?)\[ARTICLE_END\]/); let tempArticleContent = articleMatch ? articleMatch[1].trim() : "無法解析文章內容。"; const ytId = blogYtIdInput.value.trim(); if (ytId) { const youtubeEmbed = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;"><iframe src="https://www.youtube.com/embed/${ytId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>`; if (tempArticleContent.includes('<hr>')) { tempArticleContent = tempArticleContent.replace('<hr>', `${youtubeEmbed}\n<hr>`); } else { tempArticleContent += `\n${youtubeEmbed}`; } } if(mainTitle) tempArticleContent = `<h1>${mainTitle}</h1>\n` + tempArticleContent; state.blogArticleContent = tempArticleContent; blogPreview.innerHTML = state.blogArticleContent; document.getElementById('html-source-preview').value = state.blogArticleContent; document.getElementById('markdown-source-preview').value = convertHtmlToMarkdown(state.blogArticleContent); const seoMatch = fullResponse.match(/\[SEO_START\]([\s\S]*?)\[SEO_END\]/); if (seoMatch) { const seoText = seoMatch[1].trim(); document.getElementById('seo-title-text').textContent = seoText.match(/SEO 標題: (.*)/)?.[1] || 'N/A'; document.getElementById('seo-description-text').textContent = seoText.match(/搜尋描述: (.*)/)?.[1] || 'N/A'; document.getElementById('seo-permalink-text').textContent = seoText.match(/固定網址: (.*)/)?.[1] || 'N/A'; document.getElementById('seo-tags-text').textContent = seoText.match(/標籤: (.*)/)?.[1] || 'N/A'; } blogPlaceholder.classList.add('hidden'); blogOutputContainer.classList.remove('hidden'); switchBlogView('preview'); hideModal(); } catch (error) { showModal({ title: '文章生成失敗', message: `發生錯誤：${error.message}` }); } }
    function generateBlogPost() { if (state.blogSourceType === 'raw' && document.getElementById('smart-area').value.trim()) { showModal({ title: '提醒', message: '您尚未優化文本，直接生成可能會影響文章品質。確定要繼續嗎？', buttons: [ { text: '取消', class: 'btn-secondary', callback: hideModal }, { text: '確定繼續', class: 'btn-primary', callback: () => { hideModal(); proceedGenerateBlogPost(); } } ] }); } else { proceedGenerateBlogPost(); } }
    function downloadAsHtml() { if(!state.blogArticleContent) return; const content = `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"><title>${document.getElementById('seo-title-text').textContent}</title><style>body{font-family:sans-serif;line-height:1.6;} .youtube-embed{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:1rem 0;} .youtube-embed iframe{position:absolute;top:0;left:0;width:100%;height:100%;}</style></head><body>${state.blogArticleContent}</body></html>`; const blob = new Blob([content], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${document.getElementById('seo-permalink-text').textContent || 'blog-post'}.html`; a.click(); URL.revokeObjectURL(url); }
    function convertHtmlToMarkdown(htmlContent) { if (!htmlContent) return ''; let content = htmlContent; content = content.replace(/<h1>(.*?)<\/h1>/g, '# $1'); content = content.replace(/<h2>(.*?)<\/h2>/g, '## $1'); content = content.replace(/<h3>(.*?)<\/h3>/g, '### $1'); content = content.replace(/<hr>/g, '\n---\n'); content = content.replace(/<strong>(.*?)<\/strong>/g, '**$1**'); content = content.replace(/<em>(.*?)<\/em>/g, '*$1*'); content = content.replace(/<li>(.*?)<\/li>/g, '* $1'); content = content.replace(/<a href="(.*?)"[^>]*>(.*?)<\/a>/g, '[$2]($1)'); content = content.replace(/<[^>]*>/g, ''); content = content.replace(/\n{3,}/g, '\n\n'); return content.trim(); }
    function downloadAsMarkdown() { if(!state.blogArticleContent) return; const content = convertHtmlToMarkdown(state.blogArticleContent); const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${document.getElementById('seo-permalink-text').textContent || 'blog-post'}.md`; a.click(); URL.revokeObjectURL(url); }
    function switchBlogView(viewToShow) { allBlogViewButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.blogView === viewToShow)); document.querySelectorAll('.blog-view-content').forEach(content => content.classList.toggle('hidden', content.id !== `blog-view-${viewToShow}`)); }
    
    // --- 事件監聽 ---
    optimizeTextForBlogBtn.addEventListener('click', optimizeTextForBlog);
    generateBlogBtn.addEventListener('click', generateBlogPost);
    downloadHtmlBtn.addEventListener('click', downloadAsHtml);
    downloadMdBtn.addEventListener('click', downloadAsMarkdown);
    ctaPresetSelect.addEventListener('change', handleCtaChange);
    saveCtaBtn.addEventListener('click', saveCustomCTA); 
    deleteCtaBtn.addEventListener('click', deleteCustomCTA);
    aiStyleToggleBtn.addEventListener('click', () => toggleAccordion(aiStyleToggleBtn, aiStylePanel));
    seoToggleBtn.addEventListener('click', () => toggleAccordion(seoToggleBtn, seoPanel));
    allBlogViewButtons.forEach(button => button.addEventListener('click', () => switchBlogView(button.dataset.blogView)));
    const copyButtonLogic = (btn) => { const targetId = btn.dataset.copyTarget; const targetElement = document.getElementById(targetId); if (targetElement) { const content = targetElement.tagName === 'TEXTAREA' ? targetElement.value : targetElement.textContent; navigator.clipboard.writeText(content).then(() => { const originalIcon = btn.innerHTML; btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`; setTimeout(() => { btn.innerHTML = originalIcon; }, 2000); }); } };
    document.querySelectorAll('.seo-copy-btn').forEach(button => button.addEventListener('click', () => copyButtonLogic(button)));
    document.querySelectorAll('.source-copy-btn').forEach(button => button.addEventListener('click', () => copyButtonLogic(button)));
    
    // --- 初始化 ---
    const personaOptions = {'第一人稱視角': '第一人稱', '第三人稱視角': '第三人稱'};
    const wordCountOptions = {'約 800 字': '約 800 字', '約 1200 字': '約 1200 字', '約 1500 字': '約 1500 字'};
    const toneOptions = {'充滿能量與感染力': '能量感染力', '專業且具權威性': '專業權威', '口語化且親切': '口語親切', '幽默風趣': '幽默風趣'};
    populateSelectWithOptions(blogPersonaSelect, personaOptions);
    populateSelectWithOptions(blogWordCountSelect, wordCountOptions);
    populateSelectWithOptions(blogToneSelect, toneOptions);
    blogWordCountSelect.value = '約 1200 字';
    
    renderCtaSelect();
    initializeTags();
    
    handleCtaChange();
}