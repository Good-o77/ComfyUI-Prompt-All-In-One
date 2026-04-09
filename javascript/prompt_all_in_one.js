import { app } from "/scripts/app.js";
 
app.registerExtension({
    name: "ComfyUI.PromptAllInOne",
    async setup() {
        // ================= 样式注入 =================
        const style = document.createElement("style");
        style.innerHTML = `
            /* 悬停翻译气泡样式 */
            .aio-tooltip { position: relative; }
            .aio-tooltip:hover::after {
                content: attr(data-tooltip);
                position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
                background: #1e1e1e; color: #fff; padding: 4px 8px; border-radius: 4px;
                font-size: 11px; white-space: nowrap; z-index: 99999; pointer-events: none;
                border: 1px solid #555; box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                margin-bottom: 5px;
            }
            /* 分类折叠样式 */
            .aio-cat-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 5px 0; color: var(--input-text); font-weight: bold; border-bottom: 1px solid var(--border-color); margin-top: 10px; }
            .aio-cat-header:hover { color: var(--drag-text); }
            .aio-cat-arrow { transition: transform 0.2s; display: inline-block; margin-right: 5px; font-size: 10px; }
            .aio-cat-arrow.collapsed { transform: rotate(-90deg); }
            .aio-add-tag-btn { background: transparent; border: 1px solid var(--border-color); color: var(--input-text); border-radius: 3px; cursor: pointer; font-size: 12px; line-height: 12px; padding: 2px 6px; }
            .aio-add-tag-btn:hover { background: var(--comfy-input-bg); color: var(--drag-text); }
            .aio-tag-body { display: flex; flex-wrap: wrap; gap: 5px; padding-top: 8px; }
        `;
        document.head.appendChild(style);
 
        // ================= 面板 DOM =================
        const panel = document.createElement("div");
        panel.id = "prompt-aio-panel";
        Object.assign(panel.style, {
            position: "fixed", right: "0px", top: "50px", width: "320px", height: "calc(100% - 50px)",
            backgroundColor: "var(--comfy-menu-bg)", borderLeft: "2px solid var(--border-color)",
            zIndex: 9999, overflowY: "auto", padding: "15px", display: "none", boxSizing: "border-box",
            boxShadow: "-5px 0 15px rgba(0,0,0,0.5)"
        });
        document.body.appendChild(panel);
 
        const toggleBtn = document.createElement("button");
        toggleBtn.innerText = "📝 提示词工作台";
        Object.assign(toggleBtn.style, {
            position: "fixed", right: "20px", top: "10px", zIndex: 9999, cursor: "pointer",
            padding: "8px 15px", borderRadius: "5px", border: "none",
            backgroundColor: "var(--comfy-input-bg)", color: "var(--input-text)", fontWeight: "bold"
        });
        toggleBtn.onclick = () => {
            const isVisible = panel.style.display === "block";
            panel.style.display = isVisible ? "none" : "block";
            if (!isVisible) {
                loadTranslations();
                loadTags();
                updateVisualTags();
            }
        };
        document.body.appendChild(toggleBtn);
 
        // --- 在线翻译区 ---
        const transDiv = document.createElement("div");
        transDiv.style.marginBottom = "20px";
        transDiv.innerHTML = `
            <h3 style="margin:0 0 10px 0;color:var(--input-text);">🌐 在线翻译输入</h3>
            <div style="display:flex;gap:5px;">
                <input type="text" id="aio-trans-input" style="flex:1;padding:6px;color:var(--input-text);background:var(--comfy-input-bg);border:1px solid var(--border-color);border-radius:4px;" placeholder="输入中文，回车翻译">
                <button id="aio-trans-btn" style="padding:6px 12px;cursor:pointer;border-radius:4px;border:none;background:var(--comfy-input-bg);color:var(--input-text);">翻译追加</button>
            </div>
            <div id="aio-trans-result" style="margin-top:8px;color:var(--drag-text);font-size:12px;"></div>
        `;
        panel.appendChild(transDiv);
 
        // 在线翻译逻辑
        const transBtn = document.getElementById("aio-trans-btn");
        const transInput = document.getElementById("aio-trans-input");
        const transResult = document.getElementById("aio-trans-result");
 
        const doTranslate = async () => {
            const text = transInput.value;
            if (!text) return;
            transResult.innerText = "⏳ 翻译中...";
            try {
                const resp = await fetch(`/prompt-all-in-one/translate?text=${encodeURIComponent(text)}`);
                const data = await resp.json();
                if (data.translated) {
                    appendToSelectedNode(data.translated);
                    transResult.innerText = `✅ 已追加: ${data.translated}`;
                    transInput.value = "";
                } else {
                    transResult.innerText = "❌ 翻译失败";
                }
            } catch (e) {
                transResult.innerText = "❌ 网络错误";
            }
        };
        transBtn.onclick = doTranslate;
        transInput.onkeydown = (e) => { if (e.key === "Enter") doTranslate(); };
 
        // --- 词库区 ---
        const tagsDiv = document.createElement("div");
        tagsDiv.innerHTML = `<h3 style="margin:0 0 10px 0;color:var(--input-text);">📚 提示词分类库</h3><div id="aio-tags-container"></div>`;
        panel.appendChild(tagsDiv);
 
        // --- 当前节点可视化 ---
        const visualDiv = document.createElement("div");
        visualDiv.innerHTML = `
            <h3 style="margin:20px 0 10px 0;color:var(--input-text);">👁️ 当前节点提示词 <span style="font-size:10px;cursor:pointer;color:var(--drag-text);" id="aio-refresh-visual">🔄刷新</span></h3>
            <div id="aio-visual-container" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        `;
        panel.appendChild(visualDiv);
        document.getElementById("aio-refresh-visual").onclick = () => updateVisualTags();
 
        // ================= 数据与逻辑 =================
        let translationDict = {};
 
        // 加载本地翻译字典
        async function loadTranslations() {
            if (Object.keys(translationDict).length > 0) return;
            try {
                const resp = await fetch("/prompt-all-in-one/get_translations");
                translationDict = await resp.json();
            } catch (e) {
                console.error("加载翻译字典失败", e);
            }
        }
 
        // 获取本地翻译
        function getTranslation(word) {
            const key = word.toLowerCase().trim();
            return translationDict[key] || "";
        }
 
        // 创建带 Tooltip 的标签
        function createTagElement(text, isVisualTag = false) {
            const btn = document.createElement("button");
            btn.innerText = text;
            const translation = getTranslation(text);
            
            let baseStyle = "font-size:11px;padding:3px 8px;cursor:pointer;background:var(--comfy-input-bg);color:var(--input-text);border:1px solid var(--border-color);border-radius:4px;";
            if (translation) {
                baseStyle += "position:relative;";
                btn.className = "aio-tooltip";
                btn.setAttribute("data-tooltip", translation);
            }
            if (isVisualTag) {
                baseStyle += "background:var(--border-color);border-radius:12px;display:flex;align-items:center;gap:5px;";
            }
            btn.style.cssText = baseStyle;
            return btn;
        }
 
        // 加载并渲染分类词库
        async function loadTags() {
            const container = document.getElementById("aio-tags-container");
            if (container.innerHTML !== "") return;
            container.innerHTML = "加载中...";
            try {
                const resp = await fetch("/prompt-all-in-one/get_tags");
                const tags = await resp.json();
                container.innerHTML = "";
 
                for (const [category, words] of Object.entries(tags)) {
                    const header = document.createElement("div");
                    header.className = "aio-cat-header";
                    
                    const titleWrapper = document.createElement("div");
                    titleWrapper.innerHTML = `<span class="aio-cat-arrow">▼</span> 📁 ${category}`;
                    header.appendChild(titleWrapper);
 
                    const addBtn = document.createElement("button");
                    addBtn.className = "aio-add-tag-btn";
                    addBtn.innerText = "+ 添加";
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        const newWord = prompt(`请在 [${category}] 分类下输入新的英文提示词:`);
                        if (newWord && newWord.trim()) {
                            addTagToCategory(category, newWord.trim(), body);
                        }
                    };
                    header.appendChild(addBtn);
 
                    const body = document.createElement("div");
                    body.className = "aio-tag-body";
                    
                    words.forEach(word => {
                        const tagBtn = createTagElement(word);
                        tagBtn.onclick = () => appendToSelectedNode(word);
                        body.appendChild(tagBtn);
                    });
 
                    titleWrapper.onclick = () => {
                        const arrow = header.querySelector(".aio-cat-arrow");
                        const isCollapsed = body.style.display === "none";
                        body.style.display = isCollapsed ? "flex" : "none";
                        arrow.className = isCollapsed ? "aio-cat-arrow" : "aio-cat-arrow collapsed";
                    };
 
                    container.appendChild(header);
                    container.appendChild(body);
                }
            } catch (e) {
                container.innerHTML = "❌ 加载失败";
            }
        }
 
        // 动态添加标签
        async function addTagToCategory(category, word, container) {
            try {
                const resp = await fetch("/prompt-all-in-one/add_tag", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ category, word })
                });
                const data = await resp.json();
                if (data.success) {
                    const tagBtn = createTagElement(word);
                    tagBtn.onclick = () => appendToSelectedNode(word);
                    container.appendChild(tagBtn);
                } else {
                    alert("添加失败: " + (data.error || "词汇可能已存在"));
                }
            } catch (e) {
                alert("网络错误");
            }
        }
 
        // 向选中的节点追加文本
        function appendToSelectedNode(text) {
            const nodes = app.canvas.selected_nodes;
            const nodeId = Object.keys(nodes)[0];
            if (!nodeId) { alert("请先在画布上选中一个节点！"); return; }
            const node = nodes[nodeId];
            const textWidget = node.widgets?.find(w => w.name === "text" || w.type === "customtext" || w.type === "string");
            if (!textWidget) { alert("该节点没有文本输入框！"); return; }
 
            let currentText = textWidget.value || "";
            if (currentText.trim() !== "" && !currentText.trim().endsWith(",")) { currentText += ", "; }
            currentText += text;
            
            textWidget.value = currentText;
            if (textWidget.inputEl) {
                textWidget.inputEl.value = currentText;
                textWidget.inputEl.dispatchEvent(new Event('input'));
            }
            app.graph.setDirtyCanvas(true);
            updateVisualTags();
        }
 
        // 更新可视化标签
        function updateVisualTags() {
            const container = document.getElementById("aio-visual-container");
            if (!container) return;
            container.innerHTML = "<span style='color:var(--input-text);font-size:11px;'>选中节点后点击刷新</span>";
            
            const nodes = app.canvas.selected_nodes;
            const nodeId = Object.keys(nodes)[0];
            if (!nodeId) return;
            
            const node = nodes[nodeId];
            const textWidget = node.widgets?.find(w => w.name === "text" || w.type === "customtext" || w.type === "string");
            
            if (textWidget && textWidget.value) {
                container.innerHTML = "";
                const words = textWidget.value.split(",").map(w => w.trim()).filter(w => w);
                words.forEach(word => {
                    const tag = createTagElement(word, true);
                    
                    const delBtn = document.createElement("span");
                    delBtn.innerText = "×";
                    delBtn.style.cssText = "cursor:pointer;color:#ff4444;font-weight:bold;margin-left:2px;";
                    delBtn.onclick = () => {
                        let currentWords = textWidget.value.split(",").map(w => w.trim()).filter(w => w);
                        currentWords = currentWords.filter(w => w !== word);
                        const newText = currentWords.join(", ");
                        
                        textWidget.value = newText;
                        if (textWidget.inputEl) {
                            textWidget.inputEl.value = newText;
                            textWidget.inputEl.dispatchEvent(new Event('input'));
                        }
                        app.graph.setDirtyCanvas(true);
                        updateVisualTags();
                    };
                    tag.appendChild(delBtn);
                    container.appendChild(tag);
                });
            }
        }
    }
});