/**
 * tab5-carousel.js
 * 負責管理第五分頁「社群輪播圖提示詞」的所有 UI 互動與邏輯（簡化版）。
 */

function initializeTab5() {
    // --- 元素選擇 ---
    const generateCarouselBtn = document.getElementById('generate-carousel-btn');
    const generateCarouselVariationBtn = document.getElementById('generate-carousel-variation-btn');
    const carouselStyleSelect = document.getElementById('carousel-style');
    const carouselPlaceholder = document.getElementById('carousel-placeholder');
    const carouselOutputContainer = document.getElementById('carousel-output-container');
    const carouselVersionsTabsContainer = document.getElementById('carousel-versions-tabs-container');
    const copyAllCarouselPromptsBtn = document.getElementById('copy-all-carousel-prompts-btn');
    
    const carouselRolesContainer = document.getElementById('carousel-roles-container');
    const carouselAddRoleBtn = document.getElementById('carousel-add-role-btn');
    const carouselPromptTextarea = document.getElementById('carousel-prompt-textarea');
    
    const carouselCustomStyleContainer = document.getElementById('carousel-custom-style-container');
    const carouselCustomStyleTextarea = document.getElementById('carousel-custom-style');

    // 控制自訂風格輸入框的顯示與隱藏
    function toggleCustomStyleVisibility() {
        if (carouselStyleSelect && carouselCustomStyleContainer) {
            if (carouselStyleSelect.value === 'custom') {
                carouselCustomStyleContainer.classList.remove('hidden');
            } else {
                carouselCustomStyleContainer.classList.add('hidden');
            }
        }
    }

    // --- 狀態變數 ---
    // 預設提供三個空欄位供使用者輸入，均為選填
    let roles = ["", "", ""];

    // --- 角色動態 UI 渲染與處理 ---
    function renderRoles() {
        carouselRolesContainer.innerHTML = '';
        roles.forEach((role, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center gap-2 w-full';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = role;
            input.placeholder = `請填寫上傳圖片的角色名稱`;
            input.className = 'flex-grow rounded p-2 text-sm';
            input.addEventListener('input', (e) => {
                roles[index] = e.target.value;
            });
            
            wrapper.appendChild(input);
            
            // 在文字框後面加上「選填」字樣
            const optionalLabel = document.createElement('span');
            optionalLabel.className = 'text-xs text-[var(--gray-text)] whitespace-nowrap opacity-80';
            optionalLabel.textContent = '選填';
            wrapper.appendChild(optionalLabel);
            
            if (roles.length > 1) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'p-2 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0 transition-colors duration-200';
                deleteBtn.title = '刪除此角色';
                deleteBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                `;
                deleteBtn.addEventListener('click', () => {
                    roles.splice(index, 1);
                    renderRoles();
                });
                wrapper.appendChild(deleteBtn);
            }
            
            carouselRolesContainer.appendChild(wrapper);
        });
        
        // 最多限制 4 個角色
        if (roles.length >= 4) {
            carouselAddRoleBtn.classList.add('hidden');
        } else {
            carouselAddRoleBtn.classList.remove('hidden');
        }
    }

    function addRole() {
        if (roles.length < 4) {
            roles.push('');
            renderRoles();
        }
    }

    // --- UI 切換與預覽渲染 ---
    function renderCarouselVersionTabs() {
        carouselVersionsTabsContainer.innerHTML = '';
        state.carouselVersions.forEach((version, index) => {
            const tab = document.createElement('button');
            tab.className = 'tab-btn text-sm py-2 px-4';
            tab.textContent = `版本 ${index + 1}`;
            if (index === state.currentCarouselVersionIndex) {
                tab.classList.add('active');
            }
            tab.addEventListener('click', () => switchCarouselVersionView(index));
            carouselVersionsTabsContainer.appendChild(tab);
        });
    }

    function getCarouselBlocks(text) {
        const blocks = [];
        const markerPattern = /(?:^|\n)\[?\s*第\s*([1234一二三四])\s*張\s*(?:圖片)?(?:提示詞)?\s*\]?/gi;
        
        const matches = [];
        let match;
        while ((match = markerPattern.exec(text)) !== null) {
            matches.push({
                num: match[1],
                index: match.index,
                rawMarker: match[0]
            });
        }
        
        matches.sort((a, b) => a.index - b.index);
        
        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];
            const start = current.index;
            const end = next ? next.index : text.length;
            
            let blockText = text.substring(start, end).trim();
            
            // 擷取純繪圖提示詞部分（移除 [第 X 張] 與後續的圖上文字大標題等）
            let promptOnly = blockText.replace(/(?:^|\n)\[?\s*第\s*[1-4一二三四]\s*張\s*(?:圖片)?(?:提示詞)?\s*\]?\s*/gi, '').trim();
            const indexText = promptOnly.search(/(?:圖上文字|圖上疊加|大標題|版面文案)/);
            if (indexText !== -1) {
                promptOnly = promptOnly.substring(0, indexText).trim();
            }

            // 強效防分割圖英文語法追加
            const antiSplitKeywords = "single complete image, no split screen, no collage, no grid, no panels, no comic strip";
            if (!promptOnly.toLowerCase().includes("no split screen") && !promptOnly.toLowerCase().includes("no collage")) {
                promptOnly = promptOnly.replace(/[.。，,\s]+$/, '') + ` , ${antiSplitKeywords}.`;
            }
            
            blocks.push({
                label: `第 ${current.num} 張`,
                content: blockText,
                promptOnly: promptOnly
            });
        }
        return blocks;
    }

    function renderCurrentCarouselVersionUI() {
        if (!state.carouselVersions || state.carouselVersions.length === 0) {
            carouselOutputContainer.classList.add('hidden');
            carouselPlaceholder.classList.remove('hidden');
            generateCarouselVariationBtn.disabled = true;
            copyAllCarouselPromptsBtn.classList.add('hidden');
            return;
        }

        const currentVersion = state.carouselVersions[state.currentCarouselVersionIndex];
        if (!currentVersion) return;

        carouselPlaceholder.classList.add('hidden');
        carouselOutputContainer.classList.remove('hidden');
        generateCarouselVariationBtn.disabled = false;
        copyAllCarouselPromptsBtn.classList.remove('hidden');
        
        // 將 AI 產出文字一次性填入右側的大文字框
        carouselPromptTextarea.value = currentVersion.textContent;

        // 渲染單張提示詞複製按鈕
        const copyContainer = document.getElementById('carousel-individual-copy-container');
        if (copyContainer) {
            copyContainer.innerHTML = '';
            const blocks = getCarouselBlocks(currentVersion.textContent);
            
            blocks.forEach((block, index) => {
                if (block && block.promptOnly) {
                    const btn = document.createElement('button');
                    btn.className = 'font-semibold py-1 px-3 rounded btn-secondary text-xs transition-all duration-200 flex items-center gap-1';
                    btn.innerHTML = `📋 複製第 ${index + 1} 張`;
                    btn.title = `複製此張的繪圖提示詞（適用於 ChatGPT / Nana Banana）`;
                    btn.addEventListener('click', () => {
                        navigator.clipboard.writeText(block.promptOnly).then(() => {
                            showToast(`第 ${index + 1} 張繪圖提示詞已複製！`);
                            const originalHTML = btn.innerHTML;
                            btn.innerHTML = `✅ 已複製第 ${index + 1} 張!`;
                            btn.classList.add('btn-success-temporary');
                            setTimeout(() => {
                                btn.innerHTML = originalHTML;
                                btn.classList.remove('btn-success-temporary');
                            }, 2000);
                        });
                    });
                    copyContainer.appendChild(btn);
                }
            });
        }
    }

    function switchCarouselVersionView(index) {
        state.currentCarouselVersionIndex = index;
        renderCarouselVersionTabs();
        renderCurrentCarouselVersionUI();
    }

    // --- 提示詞組裝 ---
    function assembleCarouselPrompt(variationModifier = '', shouldOverride = false) {
        // 1. 取得來源內容
        let sourceContent = '';
        const hasGeneratedBlog = state.blogArticleVersions && state.blogArticleVersions.length > 0;
        const hasOptimizedText = state.optimizedTextForBlog && state.optimizedTextForBlog.trim().length > 0;

        if (hasGeneratedBlog) {
            sourceContent = state.blogArticleVersions[state.currentBlogVersionIndex].htmlContent;
        } else if (hasOptimizedText) {
            sourceContent = `<p>${state.optimizedTextForBlog.replace(/\n/g, '</p><p>')}</p>`;
        } else {
            sourceContent = document.getElementById('smart-area').value;
        }

        if(!sourceContent) {
            showModal({ title: '缺少內容來源', message: '無法找到可用於生成輪播圖的內容。請先在分頁 1 輸入內容。' });
            return null;
        }

        // 清除 HTML 標籤
        sourceContent = sourceContent.replace(/<[^>]+>/g, ' ');

        // 2. 收集有效角色
        const validRoles = roles.map(r => r.trim()).filter(r => r !== '');

        // 3. 取得 Logo 圖示開關狀態
        const includeLogoCheckbox = document.getElementById('carousel-include-logo');
        const includeLogo = includeLogoCheckbox ? includeLogoCheckbox.checked : true;

        // 3. 確定風格與角色風格描述
        const styleValue = carouselStyleSelect ? carouselStyleSelect.value : 'warm-cute-chibi';
        let characterStyleDescription = "符合該風格設定的插畫人物";
        if (styleValue === 'warm-cute-chibi') {
            characterStyleDescription = "頭大身體小的 Q 版人物";
        } else if (styleValue === 'modern-minimalist-flat') {
            characterStyleDescription = "簡約幾何線條的扁平插畫人物";
        } else if (styleValue === 'realistic-watercolor') {
            characterStyleDescription = "水彩裝飾質感的插畫人物";
        } else if (styleValue === 'custom') {
            characterStyleDescription = "符合自訂風格設定的插畫人物";
        }

        const customStyleText = carouselCustomStyleTextarea ? carouselCustomStyleTextarea.value.trim() : '';

        let exampleVisualTone = "要溫暖、可愛、教育感、社群輪播風，帶有「居久屋微醺夜」下班後邊喝邊學的輕鬆微醺氛圍。";
        let exampleCharacterStyle = "頭大身體小的 Q 版人物";
        let exampleLayoutDesc = "場景設定在溫暖燈光的微醺夜教學酒館，背景有黑板、投影幕、筆電、簡報畫面與設定齒輪圖示。畫面中心要像一張社群輪播封面，有清楚留白，不要太擁擠。";
        let exampleEndingDesc = "整體情緒要像ㄚ亮笑長正在開場介紹今晚主題，Alice 拿著小編筆記本，茶米老師站在旁邊準備示範工具，畫面有微醺夜酒館的溫暖光區與教育科技感。";

        if (styleValue === 'modern-minimalist-flat') {
            exampleVisualTone = "要現代、簡潔的扁平插畫，乾淨簡約，帶有現代科技感與社群輪播風的風格。";
            exampleCharacterStyle = "簡約幾何線條的扁平插畫人物";
            exampleLayoutDesc = "背景為簡潔乾淨的幾何色塊與科技線條，畫面上方有簡潔的設定齒輪圖案，版面具備高度的現代平面設計感，畫面中心有大面積的清楚留白，不要擁擠。";
            exampleEndingDesc = "整體氛圍呈現專業、科技與俐落感，透過簡約的線條與明亮的冷暖色調對比，傳達出輕鬆掌握科技工具的自信情緒。";
        } else if (styleValue === 'realistic-watercolor') {
            exampleVisualTone = "為細緻手繪水彩風格，溫暖手感，帶有溫馨自然與社群輪播風的質感。";
            exampleCharacterStyle = "水彩裝飾質感的插畫人物";
            exampleLayoutDesc = "背景有水彩暈染的漸層與溫馨光斑，融合書架、綠意植物與精緻的手感文具。畫面整體通透、高雅，中央留白充足，確保文字清晰易讀。";
            exampleEndingDesc = "整體畫面充滿手繪的溫暖層次與藝術氣息，帶有午後陽光般的悠閒與文藝質感。";
        } else if (styleValue === 'custom') {
            exampleVisualTone = `符合自訂風格「${customStyleText}」的視覺調性。`;
            exampleCharacterStyle = "符合自訂風格設定的插畫人物";
            exampleLayoutDesc = "背景與構圖應完美契合自訂風格描述，畫面中心必須保持充足留白以容納文字。";
            exampleEndingDesc = "整體情緒與氛圍應完全呼應自訂風格的設定。";
        }

        let styleDescription = "";
        if (variationModifier && shouldOverride) {
            styleDescription = `由你決定風格，但必須依據此風格調整指令：${variationModifier}`;
        } else {
            if (styleValue === 'custom') {
                if (!customStyleText) {
                    showModal({ title: '請輸入自訂風格提示詞', message: '您選擇了「自訂風格」，請在自訂風格提示詞輸入框中填寫風格描述。' });
                    return null;
                }
                styleDescription = `風格為自訂風格：${customStyleText}`;
            } else {
                const styleMap = {
                    'transcript-context-style': '風格由你決定：請依據 [原始文章] (逐字稿) 的主題情境與內涵，為這套輪播圖量身打造一個最合適的繪圖風格（例如：教育趣味主題可用溫慢Q版教育風，專業論述或科技主題可用現代極簡扁平插畫風，情感故事或文學主題可用寫實手繪水彩風等），並在第一張圖片提示詞開頭說明該風格的特點。請確保 4 張圖片提示詞在該風格下保持高度一致的視覺感與配色調性。',
                    'warm-cute-chibi': '風格為溫慢、可愛、教育感、社群輪播風，人物為頭大身體小的 Q 版角色。整體溫慢可愛，色彩和諧',
                    'modern-minimalist-flat': '風格為現代極簡插畫風、向量扁平插畫、乾淨簡約、社群輪播風，人物為簡約幾何線條風格',
                    'realistic-watercolor': '風格為寫實手繪風格、手繪水彩感、細緻溫慢質感、社群輪播風，人物為水彩裝飾質感風格',
                    'auto': '風格由你決定，風格要表現在提示詞中，應適應內容的主題（例如：教育趣味可用溫慢Q版教育風，專業科技可用極簡扁平插畫風），請在每張提示詞開頭說明該風格描述'
                };
                styleDescription = styleMap[styleValue] || styleMap['warm-cute-chibi'];
            }
            
            if (variationModifier) {
                styleDescription += `，並在此基礎上追加風格修飾：${variationModifier}`;
            }
        }

        // 動態組裝角色對應說明與 System Prompt 限制
        let roleLimitInstruction = '';
        let logoIndex = 1;
        let logoInstruction = '';
        let roleMappingPromptHint = '';

        if (validRoles.length > 0) {
            const roleLines = [];
            const mappingLines = [];
            validRoles.forEach((role, idx) => {
                roleLines.push(`- ${role}（在繪圖提示詞中必須指代為 image${idx + 1}）`);
                
                let roleLine = '';
                if (role.includes("亮") || role.includes("笑長")) {
                    roleLine = `固定主持人 ${role}：image${idx + 1}`;
                } else if (role.toLowerCase().includes("alice") || role.includes("小編")) {
                    roleLine = `固定小編 ${role}：image${idx + 1}`;
                } else {
                    roleLine = `本集來賓：${role}：image${idx + 1}
請參考 image${idx + 1} 海報中的來賓照片，將來賓設計成 ${characterStyleDescription}。`;
                }
                mappingLines.push(roleLine);
            });
            logoIndex = validRoles.length + 1;
            roleLimitInstruction = `**角色設定與限制**：
在繪圖提示詞中只能出現以下您所填寫的角色人物，絕對不可擅自加入其他未設定的角色。在繪圖提示詞中提及這些人物時，必須使用對應的 image 變數進行指代：
${roleLines.join('
')}`;
            roleMappingPromptHint = mappingLines.join('
');
        } else {
            roleLimitInstruction = `**角色設定與限制**：
本集並未設定任何角色。因此，繪圖提示詞中「絕對不要出現任何主持或來賓」等角色人物，專注於場景、手部物件、教室、環境或抽象概念之視覺描述。`;
            logoIndex = 1;
        }

        if (includeLogo) {
            logoInstruction = `
- 浮水印/Logo 規則：每張圖的提示詞中，必須在文末加入「右上角必須直接放上 image${logoIndex} 的logo圖示，保留原始比例、原始樣貌與原始文字，不可重繪、不可變形、不可改色、不可裁切。」這段固定規則。`;
        } else {
            logoInstruction = `
- 浮水印/Logo 規則：本集設定不加入Logo 圖示，提示詞中絕對不可出現任何關於 logo、浮水印或商標相關的描述。`;
        }

        // 3.5 取得輪播圖說明文字字數設定
        const captionLengthSelect = document.getElementById('carousel-caption-length');
        const captionLengthVal = captionLengthSelect ? captionLengthSelect.value : 'medium';
        let captionLengthLimit = '3 個條列項目總字數在大約 100 字以內（適度描述，結構清晰，每項目約 30 字）';
        if (captionLengthVal === 'short') {
            captionLengthLimit = '3 個條列項目總字數在大約 50 字以內（極簡短，適合快速滑讀，每項目約 15 字）';
        } else if (captionLengthVal === 'long') {
            captionLengthLimit = '3 個條列項目總字數在大約 150 字以內（詳盡描述，內容豐富，每項目約 50 字）';
        }

        // 4. 建構 System Prompt
        const prompt = `你是一位專業的社群視覺設計師與 AI 繪圖提示詞專家。請根據下方提供的 [原始文章]，為社群平台設計 4 張連續的「社群輪播圖 (Carousel) 提示詞」與版面文案。

在設計提示詞之前，你必須先根據 [原始文章] 整理一份「社群輪播圖規劃表」（Markdown 表格格式）。表格欄位與結構必須為：
| 頁數 | 大標題 | 副標題 | 主要內容 | 視覺建議 | CTA | 圖片主標題 | 圖片輔助短句 | 圖片關鍵詞 |

請注意：
- 規劃表中的「圖片主標題」、「圖片輔助短句」、「圖片關鍵詞」與「CTA」將做為每一頁提示詞中的文字與設定基礎，並必須出現在最終的提示詞中。
- 圖片關鍵詞需使用 3 個詞彙，以「｜」分隔，如「設定｜版本｜開啟」。

請為這 4 張圖片各生成一組「AI 繪圖提示詞 (Prompt)」與「圖上疊加文字」，嚴格遵守以下要求：

1. **適用繪圖工具與提示詞優化**：
   - 本提示詞主要用於 ChatGPT (DALL-E 3) 或是 Nana Banana 繪圖工具，請以流暢、細緻的「繁體中文描述」撰寫繪圖提示詞（不要使用 Midjourney 的參數如 --ar, --no 等）。
   - 為了確保角色一致性，必須完整保留角色變數與其括號內的原名，例如「image2 (小壁虎)」或「image1 (ㄚ亮笑長)」，絕對不要將其名稱自行翻譯或變更（如將小壁虎翻譯成 gecko）。
   - 為了防止這些工具生成「四宮格、二格、拼貼、分割畫面或組圖」，每張圖的提示詞中，必須明確加入防分割限制詞：「這是一張單一且完整的圖片，絕對不要使用分割畫面、拼貼格、多圖組合或漫畫方格的形式 (single complete image, no split screen, no collage, no grid, no panels, no comic strip)」。

2. **圖片規格與風格**：
   - 比例為 1:1 正方形。
   - 繪圖風格：\${styleDescription}。
   - 人物畫風與限制：人物畫風（包括固定主持人、小編與來賓）需與所選的圖片風格高度融合。人物在畫面中需完整入鏡，不可裁切臉、身體、手或腳。
     * 若為「頭大身體小的 Q 版人物」風格，所有人物皆須以此畫風呈現，背景應為溫馨、具備生活感的教學微醺夜酒館。
     * 若為「簡約幾何線條的扁平插畫人物」風格，所有人物皆須以此畫風呈現，背景也應改為簡潔平面幾何色塊、科技線條與大量排版留白設計。
     * 若為「水彩裝飾質感的插畫人物」風格，所有人物與背景皆須呈現水彩暈染與手繪紋理，背景包含綠色植物、暖光圈與文藝感擺設。
   - 避免侵權：不可出現 any 版權動漫或影視角色（例如迪士尼、宮崎駿等）。

3. **角色與 Logo 指代限制**：
   - \${roleLimitInstruction}\${logoInstruction}

4. **版面文案（圖上文字與標籤）設計**：
   - 圖片中文字與標籤必須是繁體中文 (Traditional Chinese)。
   - 提示詞中必須明確指定要呈現在圖片上的文字、關鍵詞與 CTA。請使用以下固定的標籤名稱，不要使用「大標題：」或「圖上文字：」，以免觸發解析器截斷：
     * 「主標題最大最醒目：[大標題內容]」
     * 「輔助短句：[副標題內容]」
     * 「關鍵詞：[關鍵詞1｜關鍵詞2｜關鍵詞3]」
     * 「CTA：[該頁的行動呼籲文字]」
   - 字數限制規範：\${captionLengthLimit}。

5. **輸出格式**：
   - 在輸出的最前方，必須先輸出這行固定的開頭文字：「生成以下 4 張圖片，務必分開生成，一次只生一張，共 4 張」，換行後輸出規劃表，再開始輸出各張圖片提示詞。
   - 請**一次性**輸出完整的 4 張圖片提示詞，依序排版。
   - **不要**使用 any Markdown 程式碼區塊標記 (如 \`\`\`html 或 \`\`\`)。
   - 在每張圖片的開頭（例如：第 1 張圖片），必須精確輸出以下的角色與變數對應表：
\${roleMappingPromptHint ? roleMappingPromptHint : '（本集無角色設定，此處省略角色與變數對應）'}
   - 輸出格式請嚴格符合以下範例（表格與提示詞欄位中的變數請依據實際內容進行調整）：

生成以下 4 張圖片，務必分開生成，一次只生一張，共 4 張

| 頁數 | 大標題 | 副標題 | 主要內容 | 視覺建議 | CTA | 圖片主標題 | 圖片輔助短句 | 圖片關鍵詞 |
| ----- | -------------------- | ------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------ | ------------- | -------------- | -------- |
| 第 1 頁 | 這才是 Canva AI 的正確打開方式 | 不是你不會用，用戶可能一開始就沒開對 | 這集茶米老師帶大家從「入口、版本、權限、額度」開始，把 Canva AI 的使用盲點一次拆開。 | ㄚ亮笑長、Alice、茶米老師站在微醺夜教學吧台前... | 看完這集，先檢查你的 Canva AI 有沒有真的開起來 | Canva AI 開對了嗎 | 先弄懂入口與設定再開始創作 | 設定｜版本｜開啟 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

第 1 張圖片

固定主持人 ㄚ亮笑長：image1
固定小編 Alice：image2
本集來賓：沃克資訊 黃信溢老師／茶米老師：image3
請參考 image3 海報中的來賓照片，將來賓設計成 \${exampleCharacterStyle}。

提示詞：
請生成一張 1:1 正方形社群輪播封面圖，主題為《Canva AI 開對了嗎》。整體畫面\${exampleVisualTone}請將 image1 的固定主持人 ㄚ亮笑長、image2 的固定小編 Alice、image3 海報中的本集來賓黃信溢老師／茶米老師，設計成 \${exampleCharacterStyle}，三人都要完整入鏡，不可裁切到臉、身體、手或腳。
\${exampleLayoutDesc}圖片中文字請使用繁體中文，文字少量、清楚、易讀，避免小字與雜亂背景文字。
主標題最大最醒目：Canva AI 開對了嗎
輔助短句：先弄懂入口與設定再開始創作
關鍵詞：設定｜版本｜開啟
CTA：看完這集，先檢查你的 Canva AI 有沒有真的開起來
\${exampleEndingDesc}這是一張單一且完整的圖片，絕對不要使用分割畫面、拼貼格、多圖組合或漫畫方格的形式 (single complete image, no split screen, no collage, no grid, no panels, no comic strip)。

第 2 張圖片
... (以此類推)

[原始文章]:
---
\${sourceContent}
---`;

        return prompt;

    // --- API 呼叫與生成邏輯 ---
    async function handleGenerateCarousel(variationModifier = '', shouldOverride = false) {
        const apiKey = window.getBalancedApiKey ? window.getBalancedApiKey() : sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            if (window.showApiKeyModal) window.showApiKeyModal();
            return;
        }

        const isVariation = variationModifier !== '';
        const prompt = assembleCarouselPrompt(variationModifier, shouldOverride);
        if (!prompt) return;

        showModal({ title: 'AI 社群輪播圖提示詞生成中...', showProgressBar: true, taskType: 'carousel' });
        const btn = isVariation ? generateCarouselVariationBtn : generateCarouselBtn;
        btn.disabled = true;
        btn.classList.add('btn-loading');

        try {
            const result = await callGeminiAPI(apiKey, prompt);
            
            // 確保生成文字最前方有固定的開頭
            let finalResult = result.trim();
            const prefix = "生成以下 4 張圖片，務必分開生成，一次只生一張，共 4 張";
            if (!finalResult.startsWith(prefix)) {
                finalResult = prefix + "\n\n" + finalResult;
            }

            const newVersion = {
                textContent: finalResult
            };

            if (isVariation) {
                state.carouselVersions.push(newVersion);
                state.currentCarouselVersionIndex = state.carouselVersions.length - 1;
            } else {
                state.carouselVersions = [newVersion];
                state.currentCarouselVersionIndex = 0;
            }

            renderCarouselVersionTabs();
            renderCurrentCarouselVersionUI();

            hideModal();
            showToast(`社群輪播圖提示詞 ${isVariation ? '新版本' : ''} 已生成！`, { type: 'success' });

        } catch (error) {
            console.error("社群輪播圖提示詞生成失敗:", error);
            if (error.message && error.message.includes('overloaded')) {
                showModal({
                    title: 'AI 正在尖峰時段，請稍候！',
                    message: '目前模型負載過高，您可以稍後再試。',
                    buttons: [
                        { text: '關閉', class: 'btn-secondary', callback: hideModal },
                        { text: '立即重試', class: 'btn-primary', callback: () => { hideModal(); handleGenerateCarousel(variationModifier, shouldOverride); } }
                    ]
                });
            } else {
                showModal({ title: '生成失敗', message: `發生錯誤：${error.message}` });
            }
            if (!isVariation) {
                renderCurrentCarouselVersionUI();
            }
        } finally {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
        }
    }

    // --- 複製功能 ---
    function copyAllCarouselPrompts() {
        if (!state.carouselVersions || state.carouselVersions.length === 0) return;
        const currentVersion = state.carouselVersions[state.currentCarouselVersionIndex];
        if (!currentVersion) return;

        navigator.clipboard.writeText(currentVersion.textContent).then(() => {
            showToast('全部提示詞內容已複製！');
            copyAllCarouselPromptsBtn.textContent = '已複製!';
            setTimeout(() => { copyAllCarouselPromptsBtn.textContent = '複製全部提示詞'; }, 2000);
        });
    }

    // --- 事件與初始化綁定 ---
    generateCarouselBtn.addEventListener('click', () => handleGenerateCarousel('', false));
    
    generateCarouselVariationBtn.addEventListener('click', () => {
        VariationHub.open('carousel', (modifier, shouldOverride) => {
            handleGenerateCarousel(modifier, shouldOverride);
        });
    });
    
    carouselAddRoleBtn.addEventListener('click', addRole);
    copyAllCarouselPromptsBtn.addEventListener('click', copyAllCarouselPrompts);

    // 初始化角色輸入框與顯示狀態
    renderRoles();
    renderCurrentCarouselVersionUI();

    // 監聽風格切換事件與初始化顯示狀態
    if (carouselStyleSelect) {
        carouselStyleSelect.addEventListener('change', toggleCustomStyleVisibility);
    }
    toggleCustomStyleVisibility();
}
