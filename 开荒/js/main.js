document.addEventListener('DOMContentLoaded', function() {
    const editorArea = document.getElementById('editorArea');
    const floatingAddBtn = document.getElementById('floatingAddBtn');
    const docTitle = document.getElementById('docTitle');
    const saveStatus = document.getElementById('saveStatus');
    const docList = document.getElementById('docList');
    const newDocBtn = document.getElementById('newDocBtn');
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mainContent = document.getElementById('mainContent');
    const docContainer = document.getElementById('docContainer');
    
    let savedSelection = null;
    let currentDocId = null;
    let saveTimer = null;
    
    const floatingToolbar = document.getElementById('floatingToolbar');
    const floatHeadingSelect = document.getElementById('floatHeadingSelect');
    const floatBoldBtn = document.getElementById('floatBoldBtn');
    const floatItalicBtn = document.getElementById('floatItalicBtn');
    const floatUnderlineBtn = document.getElementById('floatUnderlineBtn');
    const floatStrikethroughBtn = document.getElementById('floatStrikethroughBtn');
    const floatColorApplyBtn = document.getElementById('floatColorApplyBtn');
    const floatColorDropdownBtn = document.getElementById('floatColorDropdownBtn');
    const floatColorPicker = document.getElementById('floatColorPicker');
    const floatColorPreview = document.getElementById('floatColorPreview');
    const floatLinkBtn = document.getElementById('floatLinkBtn');
    const floatListBtn = document.getElementById('floatListBtn');
    const floatNumberedListBtn = document.getElementById('floatNumberedListBtn');
    const floatTaskBtn = document.getElementById('floatTaskBtn');
    const floatImageBtn = document.getElementById('floatImageBtn');
    
    const linkInputPanel = document.getElementById('linkInputPanel');
    const linkInput = document.getElementById('linkInput');
    const linkConfirmBtn = document.getElementById('linkConfirmBtn');
    const linkCancelBtn = document.getElementById('linkCancelBtn');
    
    const fileInput = document.getElementById('fileInput');
    
    const modal = document.getElementById('editModal');
    const btnNameInput = document.getElementById('btnNameInput');
    const btnLinkInput = document.getElementById('btnLinkInput');
    const btnColorPicker = document.getElementById('btnColorPicker');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    const colorMap = {
        '#fa8c16': 'btn-orange', '#1a1a1a': 'btn-black', '#52c41a': 'btn-green',
        '#722ed1': 'btn-purple', '#eb2f96': 'btn-pink', '#f5222d': 'btn-red',
        '#1890ff': 'btn-blue', '#13c2c2': 'btn-cyan', '#69c0ff': 'btn-light-blue',
        '#95de64': 'btn-light-green', '#b37feb': 'btn-light-purple', '#ffadd2': 'btn-light-pink'
    };
    
    const cardColorMap = {
        '#f9f0ff': 'card-purple', '#fff7e6': 'card-orange', '#f6ffed': 'card-green',
        '#fff0f6': 'card-pink', '#e6f7ff': 'card-blue', '#e6fffb': 'card-cyan'
    };
    
    let currentFontColor = '#333', currentBgColor = '#fff7e6';
    let hideTimer = null;
    let currentLineTop = -1;
    let lastCursorPosition = null;
    let lastEditorRange = null;
    let currentBtn = null, currentBtnWrapper = null;
    let isMouseOverAddBtn = false;
    let isLineClicked = false;
    
    // 获取文档列表
    async function getDocs() {
        return await docManager.getDocsList();
    }
    
    // 获取单个文档
    async function getDoc(docId) {
        return await docManager.readDoc(docId);
    }
    
    // 保存文档
    async function saveDoc(doc) {
        const hasAccess = await docManager.initDirectory();
        if (!hasAccess && !localStorage.getItem('docsDirectoryPath')) {
            const selected = await docManager.requestDirectory();
            if (!selected) {
                localStorage.setItem('docsDirectoryPath', 'selected');
            } else {
                localStorage.setItem('docsDirectoryPath', 'selected');
                const selectBtn = document.getElementById('selectFolderBtn');
                if (selectBtn) {
                    selectBtn.style.display = 'none';
                }
            }
        }
        
        return await docManager.saveDoc(doc);
    }
    
    // 删除文档文件
    async function deleteDocFile(docId) {
        const result = await docManager.deleteDoc(docId);
        
        if (!result) {
            const docs = localStorage.getItem('docs');
            if (docs) {
                const docsArray = JSON.parse(docs);
                const filtered = docsArray.filter(d => d.id !== docId);
                localStorage.setItem('docs', JSON.stringify(filtered));
            }
        }
        
        return result;
    }
    
    function compressImageDataUrl(dataUrl, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } catch (e) {
                    resolve(dataUrl);
                }
            };
            img.onerror = function() {
                resolve(dataUrl);
            };
            img.src = dataUrl;
        });
    }

    async function saveCurrentDoc() {
        if (!currentDocId) {
            saveStatus.textContent = '已保存';
            saveStatus.classList.remove('saving');
            return;
        }
        
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = editorArea.innerHTML;
            tempDiv.querySelectorAll('.insert-area').forEach(el => el.remove());
            
            const images = tempDiv.querySelectorAll('img');
            for (const img of images) {
                if (img.src.startsWith('data:image/')) {
                    const compressed = await compressImageDataUrl(img.src);
                    img.src = compressed;
                }
            }
            
            const doc = {
                id: currentDocId,
                title: docTitle.value || '未命名文档',
                content: tempDiv.innerHTML,
                updatedAt: new Date().toISOString()
            };
            
            await saveDoc(doc);
            updateDocList();
            saveStatus.textContent = '已保存';
            saveStatus.classList.remove('saving');
        } catch (e) {
            console.error('保存失败:', e);
            saveStatus.textContent = '保存失败';
            saveStatus.classList.remove('saving');
            setTimeout(() => {
                if (saveStatus.textContent === '保存失败') {
                    saveStatus.textContent = '已保存';
                }
            }, 3000);
        }
    }
    
    function triggerSave() {
        if (!currentDocId) {
            saveStatus.textContent = '已保存';
            saveStatus.classList.remove('saving');
            return;
        }
        
        saveStatus.textContent = '保存中...';
        saveStatus.classList.add('saving');
        
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveCurrentDoc, 500);
    }
    
    async function createNewDoc() {
        const currentContent = editorArea.innerHTML;
        const isEmptyState = currentContent.trim() === '' ||
                            (currentContent.includes('<div class="empty-line"') && 
                             currentContent.includes('contenteditable="true"') &&
                             currentContent.includes('data-placeholder'));
        
        const newDoc = {
            id: Date.now().toString(),
            title: '未命名文档',
            content: isEmptyState ? '<div class="empty-line" contenteditable="true" data-placeholder=\'输入"/"快速插入内容\'></div>' : currentContent,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            await saveDoc(newDoc);
            await loadDoc(newDoc.id);
        } catch (e) {
            console.error('创建文档失败:', e);
        }
    }
    
    async function loadDoc(docId) {
        const doc = await getDoc(docId);
        
        if (doc) {
            currentDocId = docId;
            docTitle.value = doc.title;
            editorArea.innerHTML = doc.content;
            
            updateDocList();
            
            const emptyLines = editorArea.querySelectorAll('.empty-line');
            emptyLines.forEach(el => {
                el.addEventListener('input', function() {
                    if (el.textContent.trim() !== '') {
                        el.removeAttribute('data-placeholder');
                    }
                });
            });
            
            const tables = editorArea.querySelectorAll('.table-container');
            tables.forEach(table => {
                setupTableSelection(table);
                table.querySelectorAll('td').forEach((td, index) => {
                    const tr = td.parentNode;
                    const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(tr);
                    const colIndex = Array.from(tr.querySelectorAll('td')).indexOf(td);
                    td.dataset.row = rowIndex;
                    td.dataset.col = colIndex;
                    
                    td.addEventListener('mouseup', function() {
                        showTableToolbar(table);
                    });
                });
            });
            
            const highlights = editorArea.querySelectorAll('.highlight-block');
            highlights.forEach(highlight => {
                const actions = highlight.querySelector('.highlight-actions');
                
                highlight.addEventListener('mouseenter', function() {
                    if (actions) actions.style.opacity = '1';
                });
                
                highlight.addEventListener('mouseleave', function() {
                    if (actions) actions.style.opacity = '0';
                });
                
                highlight.addEventListener('click', function(e) {
                    if (e.target.closest('.highlight-action-btn')) {
                        return;
                    }
                    
                    const link = highlight.dataset.link;
                    if (link && link.trim()) {
                        window.open(link, '_blank');
                    } else {
                        showHighlightEditPanel(highlight);
                    }
                });
                
                if (actions) {
                    actions.querySelectorAll('.highlight-action-btn').forEach(btn => {
                        btn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            const action = this.dataset.action;
                            if (action === 'edit') {
                                showHighlightEditPanel(highlight);
                            } else if (action === 'add') {
                                const colors = ['#fff7e6', '#fff0f6', '#f6ffed', '#e6fffb', '#e6f7ff', '#f9f0ff'];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                insertHighlightAfter(highlight, randomColor);
                            } else if (action === 'delete') {
                                highlight.remove();
                                triggerSave();
                            }
                        });
                    });
                }
            });
            
            const cards = editorArea.querySelectorAll('.card');
            cards.forEach(card => {
                setupCardEvents(card);
            });
            
            editorArea.focus();
        } else {
            // 文档不存在（可能文件被删除了），从列表中移除
            const docs = await getDocs();
            const filtered = docs.filter(d => d.id !== docId);
            if (currentDocId === docId) {
                if (filtered.length > 0) {
                    loadDoc(filtered[0].id);
                } else {
                    createNewDoc();
                }
            }
            updateDocList();
        }
    }
    
    async function deleteDoc(docId) {
        if (confirm('确定要删除这个文档吗？')) {
            await deleteDocFile(docId);
            
            if (currentDocId === docId) {
                const docs = await getDocs();
                if (docs.length > 0) {
                    loadDoc(docs[0].id);
                } else {
                    editorArea.innerHTML = '<div class="empty-line" contenteditable="true" data-placeholder=\'输入"/"快速插入内容\'></div>';
                    currentDocId = null;
                    docTitle.value = '未命名文档';
                }
            }
            
            updateDocList();
        }
    }
    
    async function updateDocList() {
        const docs = await getDocs();
        
        docList.innerHTML = docs.map(doc => `
            <div class="doc-item ${doc.id === currentDocId ? 'active' : ''}" data-id="${doc.id}">
                <span class="doc-item-title">${doc.title}</span>
                <span class="doc-item-delete" data-id="${doc.id}">删除</span>
            </div>
        `).join('');
    }
    
    function applyFormat(format) {
        if (savedSelection) {
            editorArea.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
            document.execCommand(format, false);
            savedSelection = selection.getRangeAt(0).cloneRange();
        }
        editorArea.focus();
        triggerSave();
    }
    
    function applyHeading(level) {
        if (savedSelection) {
            editorArea.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
            
            if (selection.isCollapsed) {
                if (level) {
                    document.execCommand('formatBlock', false, `<h${level}>`);
                } else {
                    document.execCommand('formatBlock', false, '<div>');
                }
            } else {
                const range = selection.getRangeAt(0);
                if (level) {
                    const heading = document.createElement('h' + level);
                    heading.style.display = 'inline';
                    heading.style.fontSize = `${32 - (level - 1) * 4}px`;
                    heading.style.fontWeight = 'bold';
                    heading.style.color = '#333';
                    
                    const content = range.extractContents();
                    heading.appendChild(content);
                    range.insertNode(heading);
                    
                    selection.removeAllRanges();
                    const newRange = document.createRange();
                    newRange.selectNodeContents(heading);
                    selection.addRange(newRange);
                } else {
                    const span = document.createElement('span');
                    span.style.fontSize = '14px';
                    span.style.fontWeight = 'normal';
                    
                    const content = range.extractContents();
                    span.appendChild(content);
                    range.insertNode(span);
                    
                    selection.removeAllRanges();
                    const newRange = document.createRange();
                    newRange.selectNodeContents(span);
                    selection.addRange(newRange);
                }
            }
            
            savedSelection = selection.getRangeAt(0).cloneRange();
        }
        floatHeadingSelect.value = level;
        editorArea.focus();
        triggerSave();
    }
    
    function applyColor(color) {
        currentFontColor = color;
        floatColorPreview.style.color = color;
        
        if (savedSelection) {
            editorArea.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
            document.execCommand('foreColor', false, color);
            savedSelection = selection.getRangeAt(0).cloneRange();
        }
        editorArea.focus();
        triggerSave();
    }
    
    function applyBgColor(color) {
        currentBgColor = color;
        floatColorPreview.style.backgroundColor = color || 'transparent';
        
        if (savedSelection && !savedSelection.collapsed) {
            editorArea.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
            
            if (color) {
                const span = document.createElement('span');
                span.style.backgroundColor = color;
                
                try {
                    savedSelection.surroundContents(span);
                } catch (e) {
                    const fragment = savedSelection.extractContents();
                    span.appendChild(fragment);
                    savedSelection.insertNode(span);
                }
                
                selection.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                selection.addRange(newRange);
                savedSelection = newRange.cloneRange();
            } else {
                document.execCommand('removeFormat', false);
            }
        }
        editorArea.focus();
        triggerSave();
    }
    
    function hideLinkPanel() {
        linkInputPanel.classList.remove('active');
        linkInput.value = '';
    }
    
    function showLinkPanel() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            linkInputPanel.style.left = (rect.left + rect.width / 2 - 120) + 'px';
            linkInputPanel.style.top = (rect.top + 30) + 'px';
            linkInputPanel.classList.add('active');
            linkInput.focus();
        }
    }
    
    function createNewLine(withPlaceholder = false) {
        const div = document.createElement('div');
        div.className = 'empty-line';
        div.contentEditable = 'true';
        if (withPlaceholder) {
            div.setAttribute('data-placeholder', '输入"/"快速插入内容');
        }
        div.addEventListener('keydown', handleKeydown);
        div.addEventListener('input', function() {
            if (div.textContent.trim() !== '') {
                div.removeAttribute('data-placeholder');
            }
        });
        return div;
    }
    
    function createInsertArea() {
        const area = document.createElement('div');
        area.className = 'insert-area';
        area.contentEditable = 'false';
        return area;
    }
    
    function handleKeydown(e) {
        if (e.key === 'Enter') {
            let container = e.target;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentNode;
            }
            
            const td = container.closest('td');
            if (td) {
                e.stopPropagation();
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const br = document.createElement('br');
                    range.insertNode(br);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                triggerSave();
                return;
            }
            
            const columnCell = container.closest('.column-cell');
            if (columnCell) {
                e.stopPropagation();
                e.preventDefault();
                document.execCommand('insertHTML', false, '<br>');
                triggerSave();
                return;
            }
            
            if (container.closest('li')) {
                e.stopPropagation();
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const li = container.closest('li');
                    const ul = li.parentNode;
                    
                    const newLi = document.createElement('li');
                    newLi.contentEditable = 'true';
                    newLi.appendChild(document.createTextNode(''));
                    
                    const fragment = range.extractContents();
                    newLi.appendChild(fragment);
                    
                    ul.insertBefore(newLi, li.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newLi);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
                triggerSave();
                return;
            }
            
            e.preventDefault();
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let parent = range.commonAncestorContainer;
                if (parent.nodeType === Node.TEXT_NODE) {
                    parent = parent.parentNode;
                }
                
                const line = parent.closest('.empty-line, h1, h2, h3, h4, h5, h6, p');
                
                if (line) {
                    range.collapse(false);
                    const fragment = range.extractContents();
                    
                    line.removeAttribute('data-placeholder');
                    
                    const newLine = createNewLine();
                    newLine.appendChild(fragment);
                    
                    line.parentNode.insertBefore(newLine, line.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newLine);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    newLine.focus();
                }
            }
            
            triggerSave();
        } else if (e.key === 'Backspace') {
            let container = e.target;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentNode;
            }
            
            const td = container.closest('td');
            if (td) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (range.collapsed) {
                        const textContent = td.textContent || '';
                        const rangeStart = range.startOffset;
                        if (rangeStart === 0) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
                triggerSave();
                return;
            }
            
            const columnCell = container.closest('.column-cell');
            if (columnCell) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (range.collapsed) {
                        const textContent = columnCell.textContent || '';
                        const rangeStart = range.startOffset;
                        if (rangeStart === 0 && !textContent.trim()) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
                triggerSave();
                return;
            }
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range.collapsed) {
                    const container = range.commonAncestorContainer;
                    const li = container.closest('li');
                    
                    if (li && li.textContent.trim() === '') {
                        e.preventDefault();
                        const ul = li.parentNode;
                        const prevLi = li.previousElementSibling;
                        const nextLi = li.nextElementSibling;
                        
                        if (prevLi) {
                            li.remove();
                            const newRange = document.createRange();
                            newRange.selectNodeContents(prevLi);
                            newRange.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            prevLi.focus();
                        } else if (!nextLi) {
                            ul.remove();
                        } else {
                            li.remove();
                            const newRange = document.createRange();
                            newRange.selectNodeContents(nextLi);
                            newRange.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            nextLi.focus();
                        }
                        triggerSave();
                        return;
                    }
                    
                    const line = container.closest('.empty-line, h1, h2, h3, h4, h5, h6, p');
                    
                    if (line && line.textContent.trim() === '' && line.previousElementSibling) {
                        e.preventDefault();
                        const prevLine = line.previousElementSibling;
                        line.remove();
                        
                        const newRange = document.createRange();
                        newRange.selectNodeContents(prevLine);
                        newRange.collapse(false);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        prevLine.focus();
                        triggerSave();
                    }
                }
            }
            
            triggerSave();
        }
    }
    
    function insertHeadingAtCursor(level) {
        const range = getRangeAtMousePosition();
        if (range) {
            const heading = document.createElement('h' + level.slice(-1));
            heading.contentEditable = 'true';
            heading.classList.add('heading-line');
            heading.setAttribute('data-placeholder', level.toUpperCase());
            heading.style.minHeight = '24px';
            heading.style.lineHeight = '1.3';
            heading.style.padding = '2px 0';
            
            range.insertNode(heading);
            
            const newLine = createNewLine();
            heading.parentNode.insertBefore(newLine, heading.nextSibling);
            
            const insertArea1 = createInsertArea();
            heading.parentNode.insertBefore(insertArea1, newLine.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(heading);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            heading.focus();
            
            triggerSave();
        }
    }
    
    function insertListAtCursor(type) {
        const range = getRangeAtMousePosition();
        if (range) {
            const list = document.createElement(type);
            list.contentEditable = 'true';
            
            for (let i = 0; i < 3; i++) {
                const li = document.createElement('li');
                li.contentEditable = 'true';
                li.appendChild(document.createTextNode(''));
                list.appendChild(li);
            }
            
            range.insertNode(list);
            
            const newLine = createNewLine();
            list.parentNode.insertBefore(newLine, list.nextSibling);
            
            const insertArea2 = createInsertArea();
            list.parentNode.insertBefore(insertArea2, newLine.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(list.firstChild);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            list.focus();
            
            triggerSave();
        }
    }
    
    function insertTaskAtCursor() {
        const range = getRangeAtMousePosition();
        if (range) {
            const wrapper = document.createElement('div');
            wrapper.className = 'task-checkbox';
            wrapper.innerHTML = '<input type="checkbox"><label contenteditable="true">任务项</label>';
            
            range.insertNode(wrapper);
            
            const newLine = createNewLine();
            wrapper.parentNode.insertBefore(newLine, wrapper.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(wrapper.querySelector('label'));
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            triggerSave();
        }
    }
    
    function insertTextAtCursor() {
        const range = getRangeAtMousePosition();
        if (range) {
            const newLine = createNewLine(true);
            range.insertNode(newLine);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(newLine);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            newLine.focus();
            
            triggerSave();
        }
    }
    
    function insertImageAtCursor() {
        fileInput.click();
    }
    
    function insertTableAtCursor(rows, cols) {
        const range = getRangeAtMousePosition();
        if (range) {
            const table = document.createElement('table');
            table.className = 'table-container';
            
            for (let r = 0; r < rows; r++) {
                const tr = document.createElement('tr');
                for (let c = 0; c < cols; c++) {
                    const td = document.createElement('td');
                    td.contentEditable = 'true';
                    td.dataset.row = r;
                    td.dataset.col = c;
                    
                    td.addEventListener('mouseup', function() {
                        showTableToolbar(table);
                    });
                    
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            
            setupTableSelection(table);
            
            range.insertNode(table);
            
            const newLine = createNewLine();
            table.parentNode.insertBefore(newLine, table.nextSibling);
            
            const insertArea3 = createInsertArea();
            table.parentNode.insertBefore(insertArea3, newLine.nextSibling);
            
            range.collapse(false);
            
            triggerSave();
        }
    }
    
    function setupTableSelection(table) {
        let isSelecting = false;
        let startCell = null;
        
        table.addEventListener('mousedown', function(e) {
            const td = e.target.closest('td');
            if (td) {
                e.preventDefault();
                e.stopPropagation();
                
                isSelecting = true;
                startCell = td;
                
                table.querySelectorAll('td').forEach(cell => {
                    cell.classList.remove('selected');
                });
                
                td.classList.add('selected');
                
                const selection = window.getSelection();
                selection.removeAllRanges();
                
                document.addEventListener('mousemove', onTableMouseMove);
                document.addEventListener('mouseup', onTableMouseUp);
            }
        });
        
        function onTableMouseMove(e) {
            if (!isSelecting || !startCell) return;
            
            const td = e.target.closest('td');
            if (td && td.closest('.table-container') === table) {
                e.preventDefault();
                e.stopPropagation();
                
                const startRow = parseInt(startCell.dataset.row);
                const startCol = parseInt(startCell.dataset.col);
                const endRow = parseInt(td.dataset.row);
                const endCol = parseInt(td.dataset.col);
                
                const minRow = Math.min(startRow, endRow);
                const maxRow = Math.max(startRow, endRow);
                const minCol = Math.min(startCol, endCol);
                const maxCol = Math.max(startCol, endCol);
                
                table.querySelectorAll('td').forEach(cell => {
                    const row = parseInt(cell.dataset.row);
                    const col = parseInt(cell.dataset.col);
                    if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
                        cell.classList.add('selected');
                    } else {
                        cell.classList.remove('selected');
                    }
                });
            }
        }
        
        function onTableMouseUp(e) {
            isSelecting = false;
            startCell = null;
            document.removeEventListener('mousemove', onTableMouseMove);
            document.removeEventListener('mouseup', onTableMouseUp);
            
            const selectedCells = table.querySelectorAll('td.selected');
            if (selectedCells.length > 0) {
                showTableToolbar(table);
            }
        }
    }
    
    function showTableToolbar(table) {
        let toolbar = document.querySelector('.table-toolbar');
        if (toolbar) toolbar.remove();
        
        toolbar = document.createElement('div');
        toolbar.className = 'table-toolbar active';
        toolbar.innerHTML = `
            <button class="table-toolbar-btn" data-action="insert-row" title="插入行">+行</button>
            <button class="table-toolbar-btn" data-action="delete-row" title="删除行">-行</button>
            <button class="table-toolbar-btn" data-action="insert-col" title="插入列">+列</button>
            <button class="table-toolbar-btn" data-action="delete-col" title="删除列">-列</button>
            <div class="table-dropdown-wrapper">
                <button class="table-toolbar-btn dropdown-btn" data-action="edit" title="编辑表格">
                    <span>编辑</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="table-dropdown-panel">
                    <div class="dropdown-item" data-action="merge-cells">合并单元格</div>
                    <div class="dropdown-item" data-action="split-cells">拆分单元格</div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item" data-action="distribute-cols">平分列宽</div>
                    <div class="dropdown-item" data-action="distribute-rows">平分行高</div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item" data-action="delete-table">删除表格</div>
                </div>
            </div>
            <button class="table-toolbar-btn" data-action="bg-color" title="背景颜色">▉</button>
            <div class="table-bg-color-panel">
                <div class="color-item no-color" data-color="" style="background-color: transparent; border: 1px dashed #d9d9d9;"></div>
                <div class="color-item" data-color="#fff7e6" style="background-color: #fff7e6;"></div>
                <div class="color-item" data-color="#fff0f6" style="background-color: #fff0f6;"></div>
                <div class="color-item" data-color="#f6ffed" style="background-color: #f6ffed;"></div>
                <div class="color-item" data-color="#e6fffb" style="background-color: #e6fffb;"></div>
                <div class="color-item" data-color="#e6f7ff" style="background-color: #e6f7ff;"></div>
                <div class="color-item" data-color="#f9f0ff" style="background-color: #f9f0ff;"></div>
                <div class="color-item" data-color="#fffbe6" style="background-color: #fffbe6;"></div>
            </div>
        `;
        
        const rect = table.getBoundingClientRect();
        toolbar.style.left = (rect.left + 10) + 'px';
        toolbar.style.top = (rect.top - 40) + 'px';
        
        document.body.appendChild(toolbar);
        
        toolbar.addEventListener('click', function(e) {
            e.stopPropagation();
            const btn = e.target.closest('.table-toolbar-btn');
            if (btn) {
                const action = btn.dataset.action;
                const selection = window.getSelection();
                
                if (action === 'insert-row') {
                    const cell = selection.anchorNode.closest('td');
                    if (cell) {
                        const row = cell.parentNode;
                        const newRow = row.cloneNode(true);
                        newRow.querySelectorAll('td').forEach(td => {
                            td.textContent = '';
                            td.removeAttribute('rowspan');
                            td.removeAttribute('colspan');
                        });
                        row.parentNode.insertBefore(newRow, row.nextSibling);
                        triggerSave();
                    }
                } else if (action === 'delete-row') {
                    const cell = selection.anchorNode.closest('td');
                    if (cell && table.rows.length > 1) {
                        cell.parentNode.remove();
                        triggerSave();
                    }
                } else if (action === 'insert-col') {
                    const cell = selection.anchorNode.closest('td');
                    if (cell) {
                        const colIndex = Array.from(cell.parentNode.children).indexOf(cell);
                        table.querySelectorAll('tr').forEach(tr => {
                            const newCell = document.createElement('td');
                            newCell.contentEditable = 'true';
                            tr.insertBefore(newCell, tr.children[colIndex + 1]);
                        });
                        triggerSave();
                    }
                } else if (action === 'delete-col') {
                    const cell = selection.anchorNode.closest('td');
                    if (cell && table.rows[0].cells.length > 1) {
                        const colIndex = Array.from(cell.parentNode.children).indexOf(cell);
                        table.querySelectorAll('tr').forEach(tr => {
                            tr.children[colIndex].remove();
                        });
                        triggerSave();
                    }
                } else if (action === 'bg-color') {
                    toolbar.querySelector('.table-bg-color-panel').classList.toggle('active');
                    toolbar.querySelector('.table-dropdown-panel').classList.remove('active');
                } else if (action === 'edit') {
                    toolbar.querySelector('.table-dropdown-panel').classList.toggle('active');
                    toolbar.querySelector('.table-bg-color-panel').classList.remove('active');
                    return;
                }
            }
            
            const dropdownItem = e.target.closest('.dropdown-item');
            if (dropdownItem) {
                const action = dropdownItem.dataset.action;
                const selection = window.getSelection();
                
                if (action === 'merge-cells') {
                    mergeSelectedCells(table, selection);
                } else if (action === 'split-cells') {
                    splitSelectedCells(table, selection);
                } else if (action === 'distribute-cols') {
                    distributeColumnsEvenly(table);
                } else if (action === 'distribute-rows') {
                    distributeRowsEvenly(table);
                } else if (action === 'delete-table') {
                    if (confirm('确定要删除这个表格吗？')) {
                        table.remove();
                        triggerSave();
                    }
                }
                
                toolbar.querySelector('.table-dropdown-panel').classList.remove('active');
            }
            
            const colorItem = e.target.closest('.color-item');
            if (colorItem) {
                const color = colorItem.dataset.color;
                
                const selectedCells = getSelectedCells(table);
                if (selectedCells.length > 0) {
                    selectedCells.forEach(td => {
                        td.style.backgroundColor = color || '';
                    });
                } else {
                    const anchorCell = selection.anchorNode.closest('td');
                    if (anchorCell) {
                        anchorCell.style.backgroundColor = color || '';
                    }
                }
                
                triggerSave();
                toolbar.querySelector('.table-bg-color-panel').classList.remove('active');
            }
        });
        
        setTimeout(() => {
            document.addEventListener('click', function closeToolbar(e) {
                if (!toolbar.contains(e.target)) {
                    toolbar.remove();
                    document.removeEventListener('click', closeToolbar);
                }
            });
        }, 0);
    }
    
    function getSelectedCells(table) {
        const cssSelected = table.querySelectorAll('td.selected');
        if (cssSelected.length > 0) {
            return Array.from(cssSelected);
        }
        
        const selection = window.getSelection();
        const selectedCells = [];
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const startNode = range.startContainer;
            const endNode = range.endContainer;
            
            const startTd = startNode.closest('td');
            const endTd = endNode.closest('td');
            
            if (startTd && endTd) {
                const startRow = startTd.parentNode.rowIndex;
                const endRow = endTd.parentNode.rowIndex;
                const startCol = Array.from(startTd.parentNode.children).indexOf(startTd);
                const endCol = Array.from(endTd.parentNode.children).indexOf(endTd);
                
                const minRow = Math.min(startRow, endRow);
                const maxRow = Math.max(startRow, endRow);
                const minCol = Math.min(startCol, endCol);
                const maxCol = Math.max(startCol, endCol);
                
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        const cell = table.rows[r].cells[c];
                        if (cell) {
                            selectedCells.push(cell);
                        }
                    }
                }
            }
        }
        
        return selectedCells;
    }
    
    function mergeSelectedCells(table, selection) {
        const selectedCells = getSelectedCells(table);
        
        if (selectedCells.length < 2) {
            alert('请先选中至少两个单元格');
            return;
        }
        
        const startRow = selectedCells[0].parentNode.rowIndex;
        const startCol = Array.from(selectedCells[0].parentNode.children).indexOf(selectedCells[0]);
        
        const rows = table.rows;
        let maxRow = startRow;
        let maxCol = startCol;
        
        selectedCells.forEach(cell => {
            const row = cell.parentNode.rowIndex;
            const col = Array.from(cell.parentNode.children).indexOf(cell);
            maxRow = Math.max(maxRow, row);
            maxCol = Math.max(maxCol, col);
        });
        
        const rowspan = maxRow - startRow + 1;
        const colspan = maxCol - startCol + 1;
        
        const firstCell = rows[startRow].cells[startCol];
        
        let content = '';
        selectedCells.forEach(cell => {
            content += cell.textContent + ' ';
        });
        firstCell.textContent = content.trim();
        firstCell.setAttribute('rowspan', rowspan);
        firstCell.setAttribute('colspan', colspan);
        
        for (let r = startRow; r <= maxRow; r++) {
            for (let c = startCol; c <= maxCol; c++) {
                if (r !== startRow || c !== startCol) {
                    const cell = rows[r].cells[c];
                    if (cell && cell !== firstCell) {
                        cell.remove();
                    }
                }
            }
        }
        
        triggerSave();
    }
    
    function splitSelectedCells(table, selection) {
        const cell = selection.anchorNode.closest('td');
        if (!cell) return;
        
        const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;
        const colspan = parseInt(cell.getAttribute('colspan')) || 1;
        
        if (rowspan === 1 && colspan === 1) {
            alert('当前单元格已经是最小单元，无法拆分');
            return;
        }
        
        const content = cell.textContent;
        const row = cell.parentNode;
        const colIndex = Array.from(row.children).indexOf(cell);
        
        cell.removeAttribute('rowspan');
        cell.removeAttribute('colspan');
        
        for (let r = 0; r < rowspan; r++) {
            let currentRow = row;
            if (r > 0) {
                currentRow = table.rows[row.rowIndex + r];
                if (!currentRow) {
                    currentRow = document.createElement('tr');
                    table.appendChild(currentRow);
                }
            }
            
            for (let c = 0; c < colspan; c++) {
                if (r === 0 && c === 0) continue;
                
                const newCell = document.createElement('td');
                newCell.contentEditable = 'true';
                if (r === 0 && c === 0) {
                    newCell.textContent = content;
                }
                
                const insertIndex = colIndex + c;
                if (currentRow.children[insertIndex]) {
                    currentRow.insertBefore(newCell, currentRow.children[insertIndex]);
                } else {
                    currentRow.appendChild(newCell);
                }
            }
        }
        
        triggerSave();
    }
    
    function distributeColumnsEvenly(table) {
        if (table.rows.length === 0) return;
        
        const cols = table.rows[0].cells.length;
        if (cols === 0) return;
        
        const tableWidth = table.offsetWidth;
        const colWidth = (tableWidth - 2) / cols;
        
        table.querySelectorAll('tr').forEach(tr => {
            Array.from(tr.children).forEach(cell => {
                cell.style.width = colWidth + 'px';
            });
        });
        
        triggerSave();
    }
    
    function distributeRowsEvenly(table) {
        if (table.rows.length === 0) return;
        
        const tableHeight = table.offsetHeight;
        const rowHeight = (tableHeight - 2) / table.rows.length;
        
        table.querySelectorAll('tr').forEach(tr => {
            tr.style.height = rowHeight + 'px';
            Array.from(tr.children).forEach(cell => {
                cell.style.height = rowHeight + 'px';
            });
        });
        
        triggerSave();
    }
    
    function insertColumnsAtCursor(count) {
        const range = getRangeAtMousePosition();
        if (range) {
            let container = range.commonAncestorContainer;
            if (container.nodeType === Node.TEXT_NODE) {
                container = container.parentNode;
            }
            
            if (container.closest('.columns-container')) {
                alert('分栏内不能嵌套分栏');
                return;
            }
            
            const columns = document.createElement('div');
            columns.className = 'columns-container columns-' + count;
            columns.style.position = 'relative';
            
            for (let i = 0; i < count; i++) {
                const cell = document.createElement('div');
                cell.className = 'column-cell';
                cell.contentEditable = 'true';
                
                columns.appendChild(cell);
            }
            
            range.insertNode(columns);
            
            const newLine = createNewLine();
            columns.parentNode.insertBefore(newLine, columns.nextSibling);
            
            const insertArea4 = createInsertArea();
            columns.parentNode.insertBefore(insertArea4, newLine.nextSibling);
            
            range.collapse(false);
            
            triggerSave();
        }
    }
    
    function insertHighlightAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const parentHighlight = range.commonAncestorContainer.closest('.highlight-block');
            if (parentHighlight) {
                alert('高亮块内不能嵌套高亮块');
                return;
            }
            
            const highlight = document.createElement('span');
            highlight.className = 'highlight-block';
            highlight.style.backgroundColor = color;
            highlight.contentEditable = 'false';
            highlight.dataset.bgColor = color;
            highlight.style.cursor = 'pointer';
            
            const actions = document.createElement('span');
            actions.className = 'highlight-actions';
            actions.contentEditable = 'false';
            actions.style.cssText = 'position:absolute;top:-28px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity 0.2s;z-index:10;display:flex;gap:4px;';
            actions.innerHTML = `
                <button class="highlight-action-btn" data-action="edit" title="编辑" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M312.765217 634.434783l75.686957 75.686956 94.608696-34.504348-135.791305-134.678261-34.504348 93.495653z" fill="white"></path><path d="M641.113043 0H382.886957A384 384 0 0 0 0 382.886957v258.226086A384 384 0 0 0 382.886957 1024h258.226086A384 384 0 0 0 1024 641.113043V382.886957A384 384 0 0 0 641.113043 0zM504.208696 695.652174L333.913043 755.756522a53.426087 53.426087 0 0 1-67.895652-67.895652l58.991305-164.730435 173.634782-175.86087 34.504348 33.391305-134.678261 134.67826a11.130435 11.130435 0 0 0 0 15.582609 11.130435 11.130435 0 0 0 15.582609 0l134.678261-134.678261 77.913043 77.913044-134.678261 134.678261a11.130435 11.130435 0 0 0 15.582609 15.582608L642.226087 489.73913l33.391304 33.391305zM745.73913 455.234783l-54.53913 53.426087L514.226087 333.913043l53.426087-53.426086a48.973913 48.973913 0 0 1 70.121739 0l111.304348 111.304347a50.086957 50.086957 0 0 1-3.339131 63.443479z" fill="white"></path></svg></button>
                <button class="highlight-action-btn" data-action="add" title="添加新亮块" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M511.977413 0c282.754584 0 511.977413 229.20777 511.977413 511.977413 0 282.754584-229.222828 511.977413-511.977413 511.977413-282.762113 0-511.977413-229.222828-511.977413-511.977413C0 229.215299 229.222828 0 511.977413 0z" fill="#FE9914"></path><path d="M729.379586 548.952723H548.952723v180.426863a31.072512 31.072512 0 0 1-62.122436 0V548.952723H294.575239a31.057453 31.057453 0 0 1 0-62.114907H486.830287V294.575239a31.057453 31.057453 0 0 1 62.122436 0v192.262577h180.426863a31.057453 31.057453 0 0 1 0 62.114907z" fill="#FFFFFF"></path></svg></button>
                <button class="highlight-action-btn" data-action="delete" title="删除" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M587.9296 665.0368m-212.7872 0a212.7872 212.7872 0 1 0 425.5744 0 212.7872 212.7872 0 1 0-425.5744 0Z" fill="#FF8080"></path><path d="M879.6672 331.3664H149.9648a25.6 25.6 0 1 0 0 51.2h55.7056v411.5968c0 60.2112 47.36 109.2608 105.5232 109.2608h402.2272c58.2144 0 105.5744-49.0496 105.5744-109.2608V382.5664h60.672a25.6 25.6 0 0 0 0-51.2zM768 794.1632c0 32-24.3712 58.0608-54.3744 58.0608h-402.432c-29.952 0-54.3232-26.0608-54.3232-58.0608V382.5664H768zM294.144 293.4272A25.6 25.6 0 0 0 327.68 279.3984a177.7152 177.7152 0 0 1 165.0176-111.0016h28.7744a177.664 177.664 0 0 1 165.4272 111.616 25.6 25.6 0 0 0 23.7568 16.0256 25.6 25.6 0 0 0 23.7056-34.9184 228.5568 228.5568 0 0 0-212.8896-143.6672h-28.7744A228.8128 228.8128 0 0 0 280.1152 260.096a25.6 25.6 0 0 0 14.0288 33.3312z" fill="#512C56"></path><path d="M410.6752 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6zM616.6016 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6z" fill="#512C56"></path></svg></button>
            `;
            
            highlight.appendChild(document.createTextNode('添加链接'));
            highlight.appendChild(actions);
            highlight.style.position = 'relative';
            
            highlight.addEventListener('mouseenter', function() {
                actions.style.opacity = '1';
            });
            
            highlight.addEventListener('mouseleave', function() {
                actions.style.opacity = '0';
            });
            
            highlight.addEventListener('click', function(e) {
                if (e.target.closest('.highlight-action-btn')) {
                    return;
                }
                
                const link = highlight.dataset.link;
                if (link && link.trim()) {
                    window.open(link, '_blank');
                } else {
                    showHighlightEditPanel(highlight);
                }
            });
            
            actions.querySelectorAll('.highlight-action-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const action = this.dataset.action;
                    if (action === 'edit') {
                        showHighlightEditPanel(highlight);
                    } else if (action === 'add') {
                        insertHighlightAfter(highlight, color);
                    } else if (action === 'delete') {
                        highlight.remove();
                        triggerSave();
                    }
                });
            });
            
            range.insertNode(highlight);
            
            const newLine = createNewLine();
            highlight.parentNode.insertBefore(newLine, highlight.nextSibling);
            
            const insertArea = createInsertArea();
            highlight.parentNode.insertBefore(insertArea, newLine.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(highlight);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            highlight.focus();
            
            triggerSave();
        }
    }
    
    function insertHighlightAfter(highlight, color) {
        const newHighlight = document.createElement('span');
        newHighlight.className = 'highlight-block';
        newHighlight.style.backgroundColor = color;
        newHighlight.contentEditable = 'false';
        newHighlight.dataset.bgColor = color;
        newHighlight.style.cursor = 'pointer';
        
        const actions = document.createElement('span');
        actions.className = 'highlight-actions';
        actions.contentEditable = 'false';
        actions.style.cssText = 'position:absolute;top:-28px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity 0.2s;z-index:10;display:flex;gap:4px;';
        actions.innerHTML = `
            <button class="highlight-action-btn" data-action="edit" title="编辑" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;">✎</button>
            <button class="highlight-action-btn" data-action="add" title="添加新亮块" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M511.977413 0c282.754584 0 511.977413 229.20777 511.977413 511.977413 0 282.754584-229.222828 511.977413-511.977413 511.977413-282.762113 0-511.977413-229.222828-511.977413-511.977413C0 229.215299 229.222828 0 511.977413 0z" fill="#FE9914"></path><path d="M729.379586 548.952723H548.952723v180.426863a31.072512 31.072512 0 0 1-62.122436 0V548.952723H294.575239a31.057453 31.057453 0 0 1 0-62.114907H486.830287V294.575239a31.057453 31.057453 0 0 1 62.122436 0v192.262577h180.426863a31.057453 31.057453 0 0 1 0 62.114907z" fill="#FFFFFF"></path></svg></button>
            <button class="highlight-action-btn" data-action="delete" title="删除" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M587.9296 665.0368m-212.7872 0a212.7872 212.7872 0 1 0 425.5744 0 212.7872 212.7872 0 1 0-425.5744 0Z" fill="#FF8080"></path><path d="M879.6672 331.3664H149.9648a25.6 25.6 0 1 0 0 51.2h55.7056v411.5968c0 60.2112 47.36 109.2608 105.5232 109.2608h402.2272c58.2144 0 105.5744-49.0496 105.5744-109.2608V382.5664h60.672a25.6 25.6 0 0 0 0-51.2zM768 794.1632c0 32-24.3712 58.0608-54.3744 58.0608h-402.432c-29.952 0-54.3232-26.0608-54.3232-58.0608V382.5664H768zM294.144 293.4272A25.6 25.6 0 0 0 327.68 279.3984a177.7152 177.7152 0 0 1 165.0176-111.0016h28.7744a177.664 177.664 0 0 1 165.4272 111.616 25.6 25.6 0 0 0 23.7568 16.0256 25.6 25.6 0 0 0 23.7056-34.9184 228.5568 228.5568 0 0 0-212.8896-143.6672h-28.7744A228.8128 228.8128 0 0 0 280.1152 260.096a25.6 25.6 0 0 0 14.0288 33.3312z" fill="#512C56"></path><path d="M410.6752 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6zM616.6016 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6z" fill="#512C56"></path></svg></button>
        `;
        
        newHighlight.appendChild(document.createTextNode('添加链接'));
        newHighlight.appendChild(actions);
        newHighlight.style.position = 'relative';
        
        newHighlight.addEventListener('mouseenter', function() {
            actions.style.opacity = '1';
        });
        
        newHighlight.addEventListener('mouseleave', function() {
            actions.style.opacity = '0';
        });
        
        newHighlight.addEventListener('click', function(e) {
            if (e.target.closest('.highlight-action-btn')) {
                return;
            }
            
            const link = newHighlight.dataset.link;
            if (link && link.trim()) {
                window.open(link, '_blank');
            } else {
                showHighlightEditPanel(newHighlight);
            }
        });
        
        actions.querySelectorAll('.highlight-action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                const action = this.dataset.action;
                if (action === 'edit') {
                    showHighlightEditPanel(newHighlight);
                } else if (action === 'add') {
                    insertHighlightAfter(newHighlight, color);
                } else if (action === 'delete') {
                    newHighlight.remove();
                    triggerSave();
                }
            });
        });
        
        const space = document.createTextNode(' ');
        highlight.parentNode.insertBefore(space, highlight.nextSibling);
        highlight.parentNode.insertBefore(newHighlight, space.nextSibling);
        
        const newRange = document.createRange();
        newRange.selectNodeContents(newHighlight);
        newRange.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(newRange);
        
        newHighlight.focus();
        
        triggerSave();
    }
    
    function showHighlightEditPanel(highlight) {
        hideAllInsertMenus();
        
        const textContent = highlight.firstChild ? highlight.firstChild.textContent.trim() : '';
        
        const panel = document.createElement('div');
        panel.className = 'highlight-edit-panel sub-panel active';
        panel.innerHTML = `
            <div class="form-group">
                <label class="form-label">按钮文字</label>
                <input type="text" class="form-input" id="hlTextInput" value="${textContent}">
            </div>
            <div class="form-group">
                <label class="form-label">高亮块颜色</label>
                <div class="color-picker">
                    <div class="color-option" data-color="#fff7e6" style="background-color: #fff7e6;"></div>
                    <div class="color-option" data-color="#fff0f6" style="background-color: #fff0f6;"></div>
                    <div class="color-option" data-color="#f6ffed" style="background-color: #f6ffed;"></div>
                    <div class="color-option" data-color="#e6fffb" style="background-color: #e6fffb;"></div>
                    <div class="color-option" data-color="#e6f7ff" style="background-color: #e6f7ff;"></div>
                    <div class="color-option" data-color="#f9f0ff" style="background-color: #f9f0ff;"></div>
                    <div class="color-option" data-color="#fffbe6" style="background-color: #fffbe6;"></div>
                    <div class="color-option" data-color="#ffccc7" style="background-color: #ffccc7;"></div>
                    <div class="color-option" data-color="#ffe7ba" style="background-color: #ffe7ba;"></div>
                    <div class="color-option" data-color="#d9f7be" style="background-color: #d9f7be;"></div>
                    <div class="color-option" data-color="#bae7ff" style="background-color: #bae7ff;"></div>
                    <div class="color-option" data-color="#efdbff" style="background-color: #efdbff;"></div>
                    <div class="color-option" data-color="#ffd6e7" style="background-color: #ffd6e7;"></div>
                    <div class="color-option" data-color="#fdc3a2" style="background-color: #fdc3a2;"></div>
                    <div class="color-option" data-color="#95de64" style="background-color: #95de64;"></div>
                    <div class="color-option" data-color="#69c0ff" style="background-color: #69c0ff;"></div>
                    <div class="color-option" data-color="#b37feb" style="background-color: #b37feb;"></div>
                    <div class="color-option" data-color="#ffadd2" style="background-color: #ffadd2;"></div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">字体颜色</label>
                <div class="color-picker">
                    <div class="color-option" data-color="#1a1a1a" style="background-color: #1a1a1a;"></div>
                    <div class="color-option" data-color="#333333" style="background-color: #333333;"></div>
                    <div class="color-option" data-color="#595959" style="background-color: #595959;"></div>
                    <div class="color-option" data-color="#8c8c8c" style="background-color: #8c8c8c;"></div>
                    <div class="color-option" data-color="#f5222d" style="background-color: #f5222d;"></div>
                    <div class="color-option" data-color="#fa541c" style="background-color: #fa541c;"></div>
                    <div class="color-option" data-color="#fa8c16" style="background-color: #fa8c16;"></div>
                    <div class="color-option" data-color="#fadb14" style="background-color: #fadb14;"></div>
                    <div class="color-option" data-color="#52c41a" style="background-color: #52c41a;"></div>
                    <div class="color-option" data-color="#1890ff" style="background-color: #1890ff;"></div>
                    <div class="color-option" data-color="#722ed1" style="background-color: #722ed1;"></div>
                    <div class="color-option" data-color="#eb2f96" style="background-color: #eb2f96;"></div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">超链接地址</label>
                <input type="text" class="form-input" id="hlLinkInput" value="${highlight.dataset.link || ''}" placeholder="请输入链接地址">
            </div>
            <div class="modal-actions">
                <button class="btn-cancel" id="hlCancelBtn">取消</button>
                <button class="btn-confirm" id="hlConfirmBtn">确定</button>
            </div>
        `;
        
        panel.style.position = 'fixed';
        panel.style.top = '50%';
        panel.style.left = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.style.zIndex = '3000';
        panel.style.background = 'white';
        panel.style.borderRadius = '12px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '24px';
        panel.style.width = '400px';
        panel.style.maxWidth = '90%';
        document.body.appendChild(panel);
        
        const textInput = panel.querySelector('#hlTextInput');
        const linkInput = panel.querySelector('#hlLinkInput');
        
        panel.querySelectorAll('.color-picker').forEach((picker, idx) => {
            picker.addEventListener('click', function(e) {
                if (e.target.classList.contains('color-option')) {
                    picker.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
                    e.target.classList.add('selected');
                }
            });
        });
        
        panel.querySelector('#hlCancelBtn').addEventListener('click', function() {
            panel.remove();
        });
        
        panel.querySelector('#hlConfirmBtn').addEventListener('click', function() {
            highlight.innerHTML = '';
            highlight.appendChild(document.createTextNode(textInput.value));
            highlight.dataset.link = linkInput.value;
            
            const colorPickers = panel.querySelectorAll('.color-picker');
            const bgColor = colorPickers[0].querySelector('.color-option.selected');
            const fontColor = colorPickers[1].querySelector('.color-option.selected');
            
            if (bgColor) {
                highlight.style.backgroundColor = bgColor.dataset.color;
                highlight.dataset.bgColor = bgColor.dataset.color;
            }
            if (fontColor) {
                highlight.style.color = fontColor.dataset.color;
            }
            
            const actions = document.createElement('span');
            actions.className = 'highlight-actions';
            actions.contentEditable = 'false';
            actions.style.cssText = 'position:absolute;top:-28px;left:50%;transform:translateX(-50%);opacity:0;transition:opacity 0.2s;z-index:10;display:flex;gap:4px;';
            actions.innerHTML = `
                <button class="highlight-action-btn" data-action="edit" title="编辑" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M312.765217 634.434783l75.686957 75.686956 94.608696-34.504348-135.791305-134.678261-34.504348 93.495653z" fill="white"></path><path d="M641.113043 0H382.886957A384 384 0 0 0 0 382.886957v258.226086A384 384 0 0 0 382.886957 1024h258.226086A384 384 0 0 0 1024 641.113043V382.886957A384 384 0 0 0 641.113043 0zM504.208696 695.652174L333.913043 755.756522a53.426087 53.426087 0 0 1-67.895652-67.895652l58.991305-164.730435 173.634782-175.86087 34.504348 33.391305-134.678261 134.67826a11.130435 11.130435 0 0 0 0 15.582609 11.130435 11.130435 0 0 0 15.582609 0l134.678261-134.678261 77.913043 77.913044-134.678261 134.678261a11.130435 11.130435 0 0 0 15.582609 15.582608L642.226087 489.73913l33.391304 33.391305zM745.73913 455.234783l-54.53913 53.426087L514.226087 333.913043l53.426087-53.426086a48.973913 48.973913 0 0 1 70.121739 0l111.304348 111.304347a50.086957 50.086957 0 0 1-3.339131 63.443479z" fill="white"></path></svg></button>
                <button class="highlight-action-btn" data-action="add" title="添加新亮块" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M511.977413 0c282.754584 0 511.977413 229.20777 511.977413 511.977413 0 282.754584-229.222828 511.977413-511.977413 511.977413-282.762113 0-511.977413-229.222828-511.977413-511.977413C0 229.215299 229.222828 0 511.977413 0z" fill="#FE9914"></path><path d="M729.379586 548.952723H548.952723v180.426863a31.072512 31.072512 0 0 1-62.122436 0V548.952723H294.575239a31.057453 31.057453 0 0 1 0-62.114907H486.830287V294.575239a31.057453 31.057453 0 0 1 62.122436 0v192.262577h180.426863a31.057453 31.057453 0 0 1 0 62.114907z" fill="#FFFFFF"></path></svg></button>
                <button class="highlight-action-btn" data-action="delete" title="删除" style="width:20px;height:20px;font-size:10px;background:rgba(0,0,0,0.7);color:white;border:none;border-radius:4px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 1024 1024" style="width:14px;height:14px;"><path d="M587.9296 665.0368m-212.7872 0a212.7872 212.7872 0 1 0 425.5744 0 212.7872 212.7872 0 1 0-425.5744 0Z" fill="#FF8080"></path><path d="M879.6672 331.3664H149.9648a25.6 25.6 0 1 0 0 51.2h55.7056v411.5968c0 60.2112 47.36 109.2608 105.5232 109.2608h402.2272c58.2144 0 105.5744-49.0496 105.5744-109.2608V382.5664h60.672a25.6 25.6 0 0 0 0-51.2zM768 794.1632c0 32-24.3712 58.0608-54.3744 58.0608h-402.432c-29.952 0-54.3232-26.0608-54.3232-58.0608V382.5664H768zM294.144 293.4272A25.6 25.6 0 0 0 327.68 279.3984a177.7152 177.7152 0 0 1 165.0176-111.0016h28.7744a177.664 177.664 0 0 1 165.4272 111.616 25.6 25.6 0 0 0 23.7568 16.0256 25.6 25.6 0 0 0 23.7056-34.9184 228.5568 228.5568 0 0 0-212.8896-143.6672h-28.7744A228.8128 228.8128 0 0 0 280.1152 260.096a25.6 25.6 0 0 0 14.0288 33.3312z" fill="#512C56"></path><path d="M410.6752 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6zM616.6016 750.2336a25.6 25.6 0 0 1-25.6-25.6v-225.28a25.6 25.6 0 0 1 51.2 0v225.28a25.6 25.6 0 0 1-25.6 25.6z" fill="#512C56"></path></svg></button>
            `;
            highlight.appendChild(actions);
            
            highlight.addEventListener('mouseenter', function() {
                actions.style.opacity = '1';
            });
            
            highlight.addEventListener('mouseleave', function() {
                actions.style.opacity = '0';
            });
            
            highlight.addEventListener('click', function(e) {
                if (e.target.classList.contains('highlight-action-btn')) {
                    return;
                }
                
                const link = highlight.dataset.link;
                if (link && link.trim()) {
                    window.open(link, '_blank');
                } else {
                    showHighlightEditPanel(highlight);
                }
            });
            
            panel.remove();
            triggerSave();
        });
        
        setTimeout(() => {
            document.addEventListener('click', function closePanel(e) {
                if (!panel.contains(e.target)) {
                    panel.remove();
                    document.removeEventListener('click', closePanel);
                }
            });
        }, 0);
    }
    
    function insertCardAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const parentCard = range.commonAncestorContainer.closest('.card');
            if (parentCard) {
                alert('卡片内不能嵌套卡片');
                return;
            }
            
            const cardClass = cardColorMap[color] || 'card-orange';
            const card = document.createElement('div');
            card.className = `card ${cardClass}`;
            card.dataset.borderColor = '#d9d9d9';
            card.innerHTML = `
                <div class="card-title" contenteditable="true">卡片标题</div>
                <div class="card-content">
                    <div class="empty-line" contenteditable="true" data-placeholder="点击输入内容或使用左侧加号插入"></div>
                </div>
                <div class="card-actions">
                    <button class="card-action-btn" data-action="edit" title="编辑">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button class="card-action-btn" data-action="delete" title="删除">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            
            range.insertNode(card);
            
            const newLine = createNewLine();
            card.parentNode.insertBefore(newLine, card.nextSibling);
            
            const insertArea5 = createInsertArea();
            card.parentNode.insertBefore(insertArea5, newLine.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(card.querySelector('.card-title'));
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            card.focus();
            
            setupCardEvents(card);
            
            triggerSave();
        }
    }
    
    function insertButtonAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const btnClass = colorMap[color] || 'btn-orange';
            const btnWrapper = document.createElement('span');
            btnWrapper.className = 'inline-btn-wrapper';
            btnWrapper.innerHTML = `<span class="inline-btn ${btnClass}" contenteditable="false">按钮名称</span>`;
            
            range.insertNode(btnWrapper);
            
            triggerSave();
        }
    }
    
    function getRangeAtMousePosition() {
        if (lastEditorRange) {
            try {
                const testRange = document.createRange();
                testRange.selectNodeContents(editorArea);
                if (editorArea.contains(lastEditorRange.commonAncestorContainer)) {
                    return lastEditorRange;
                }
            } catch (e) {}
        }
        if (lastCursorPosition && document.caretRangeFromPoint) {
            return document.caretRangeFromPoint(lastCursorPosition.left, lastCursorPosition.top);
        }
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
        return null;
    }
    
    function showInsertMenuAtCursor() {
        hideAllInsertMenus();
        
        const range = getRangeAtMousePosition();
        if (!range) return;
        
        const btnRect = floatingAddBtn.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'insert-menu';
        menu.innerHTML = `
            <div class="insert-menu-item" data-action="h1"><span class="icon">H1</span>标题 1</div>
            <div class="insert-menu-item" data-action="h2"><span class="icon">H2</span>标题 2</div>
            <div class="insert-menu-item" data-action="h3"><span class="icon">H3</span>标题 3</div>
            <div class="insert-menu-item" data-action="h4"><span class="icon">H4</span>标题 4</div>
            <div class="insert-menu-item" data-action="ul"><span class="icon"><img src="images/无序列表.png" style="width:16px;height:16px;"></span>无序列表</div>
            <div class="insert-menu-item" data-action="ol"><span class="icon"><img src="images/有序列表.png" style="width:16px;height:16px;"></span>有序列表</div>
            <div class="insert-menu-item" data-action="task"><span class="icon"><img src="images/任务.png" style="width:16px;height:16px;"></span>任务列表</div>
            <div class="insert-menu-item" data-action="text"><span class="icon">T</span>正文</div>
            <div class="insert-menu-item" data-action="image"><span class="icon"><img src="images/照片.png" style="width:16px;height:16px;"></span>图片</div>
            <div class="insert-menu-item" data-action="table"><span class="icon"><img src="images/表格.png" style="width:16px;height:16px;"></span>表格</div>
            <div class="insert-menu-item" data-action="columns"><span class="icon"><img src="images/分栏.png" style="width:16px;height:16px;"></span>分栏</div>
            <div class="insert-menu-item" data-action="highlight"><span class="icon"><img src="images/高亮-copy.png" style="width:16px;height:16px;"></span>高亮块</div>
            <div class="insert-menu-item" data-action="card"><span class="icon"><img src="images/色卡.png" style="width:16px;height:16px;"></span>卡片</div>
        `;
        
        menu.style.position = 'fixed';
        menu.style.left = (btnRect.right + 8) + 'px';
        menu.style.top = (btnRect.top) + 'px';
        menu.style.zIndex = '2000';
        
        document.body.appendChild(menu);
        
        const menuRect = menu.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (menuRect.bottom > windowHeight) {
            menu.style.top = (windowHeight - menuRect.height - 16) + 'px';
        }
        
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
            const menuItem = e.target.closest('.insert-menu-item');
            
            if (menuItem) {
                const action = menuItem.dataset.action;
                
                if (action === 'h1' || action === 'h2' || action === 'h3' || action === 'h4') {
                    insertHeadingAtCursor(action);
                } else if (action === 'ul') {
                    insertListAtCursor('ul');
                } else if (action === 'ol') {
                    insertListAtCursor('ol');
                } else if (action === 'task') {
                    insertTaskAtCursor();
                } else if (action === 'text') {
                    insertTextAtCursor();
                } else if (action === 'image') {
                    insertImageAtCursor();
                } else if (action === 'table') {
                    showTableSelectorPanel(menuItem, menu);
                    return;
                } else if (action === 'columns') {
                    showColumnSelectPanel(menuItem, menu);
                    return;
                } else if (action === 'highlight') {
                    insertHighlightAtCursor('#e6f7ff');
                    menu.remove();
                    return;
                } else if (action === 'card') {
                    insertCardAtCursor('#fff0f6');
                    menu.remove();
                    return;
                } else if (action === 'button') {
                    showButtonColorPanel(menuItem, menu);
                    return;
                }
                
                menu.remove();
            }
        });
        
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }
    
    function hideAllInsertMenus() {
        document.querySelectorAll('.insert-menu').forEach(el => el.remove());
        hideAllSubPanels();
    }
    
    function hideAllSubPanels() {
        document.querySelectorAll('.sub-panel').forEach(el => el.remove());
    }
    
    function showTableSelectorPanel(menuItem, menu) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'table-selector-panel sub-panel active';
        panel.innerHTML = `
            <div class="table-selector-title">插入支持富文本的表格</div>
            <div class="table-selector-grid"></div>
        `;
        
        const grid = panel.querySelector('.table-selector-grid');
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const cell = document.createElement('div');
                cell.className = 'table-selector-cell';
                cell.dataset.row = r + 1;
                cell.dataset.col = c + 1;
                grid.appendChild(cell);
            }
        }
        
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
        document.body.appendChild(panel);
        
        let selectedRows = 1, selectedCols = 1;
        const title = panel.querySelector('.table-selector-title');
        
        updateTableSelection();
        
        grid.addEventListener('mouseenter', function(e) {
            const cell = e.target.closest('.table-selector-cell');
            if (cell) {
                selectedRows = parseInt(cell.dataset.row);
                selectedCols = parseInt(cell.dataset.col);
                updateTableSelection();
            }
        });
        
        grid.addEventListener('mousemove', function(e) {
            const cell = e.target.closest('.table-selector-cell');
            if (cell) {
                selectedRows = parseInt(cell.dataset.row);
                selectedCols = parseInt(cell.dataset.col);
                updateTableSelection();
            }
        });
        
        grid.addEventListener('click', function(e) {
            e.stopPropagation();
            const cell = e.target.closest('.table-selector-cell');
            if (cell) {
                insertTableAtCursor(selectedRows, selectedCols);
                hideAllInsertMenus();
            }
        });
        
        function updateTableSelection() {
            grid.querySelectorAll('.table-selector-cell').forEach(cell => {
                const r = parseInt(cell.dataset.row);
                const c = parseInt(cell.dataset.col);
                cell.classList.toggle('selected', r <= selectedRows && c <= selectedCols);
            });
            title.textContent = `插入支持富文本的表格 ${selectedRows}×${selectedCols}`;
        }
        
        setTimeout(() => {
            document.addEventListener('click', function closePanel(e) {
                if (!panel.contains(e.target)) {
                    panel.remove();
                    document.removeEventListener('click', closePanel);
                }
            });
        }, 0);
    }
    
    function showColumnSelectPanel(menuItem, menu) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'column-select-panel sub-panel active';
        panel.innerHTML = `
            <div class="column-select-title">选择栏数</div>
            <div class="column-select-grid">
                <div class="column-bar" data-columns="1"></div>
                <div class="column-bar" data-columns="2"></div>
                <div class="column-bar" data-columns="3"></div>
                <div class="column-bar" data-columns="4"></div>
                <div class="column-bar" data-columns="5"></div>
            </div>
        `;
        
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.zIndex = '2000';
        panel.style.background = 'white';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '16px';
        panel.style.minWidth = '200px';
        
        document.body.appendChild(panel);
        
        const windowHeight = window.innerHeight;
        if (panel.getBoundingClientRect().bottom > windowHeight) {
            panel.style.top = (windowHeight - panel.getBoundingClientRect().height - 16) + 'px';
        }
        
        const bars = panel.querySelectorAll('.column-bar');
        
        bars.forEach(bar => {
            bar.addEventListener('mouseenter', function() {
                const cols = parseInt(this.dataset.columns);
                highlightColumns(cols);
            });
            
            bar.addEventListener('click', function(e) {
                e.stopPropagation();
                const cols = parseInt(this.dataset.columns);
                insertColumnsAtCursor(cols);
                hideAllInsertMenus();
            });
        });
        
        function highlightColumns(cols) {
            bars.forEach((bar, index) => {
                if (index < cols) {
                    bar.style.background = '#1890ff';
                } else {
                    bar.style.background = '#e8e8e8';
                }
            });
        }
        
        highlightColumns(1);
        
        setTimeout(() => {
            document.addEventListener('click', function closePanel(e) {
                if (!panel.contains(e.target)) {
                    panel.remove();
                    document.removeEventListener('click', closePanel);
                }
            });
        }, 0);
    }
    
    function showHighlightColorPanel(menuItem, menu) {
        hideAllSubPanels();
        
        const colors = ['#fff7e6', '#fff0f6', '#f6ffed', '#e6fffb', '#e6f7ff', '#f9f0ff'];
        const panel = document.createElement('div');
        panel.className = 'highlight-color-panel sub-panel active';
        panel.innerHTML = colors.map(color => `<div class="highlight-color-btn" data-color="${color}" style="background-color: ${color};"></div>`).join('');
        
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.zIndex = '2000';
        panel.style.background = 'white';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '12px';
        panel.style.display = 'grid';
        panel.style.gridTemplateColumns = 'repeat(3, 1fr)';
        panel.style.gap = '8px';
        document.body.appendChild(panel);
        
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
            const colorBtn = e.target.closest('.highlight-color-btn');
            if (colorBtn) {
                insertHighlightAtCursor(colorBtn.dataset.color);
                hideAllInsertMenus();
                panel.remove();
            }
        });
        
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !menu.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    function showCardColorPanel(menuItem, menu) {
        hideAllSubPanels();
        
        const colors = ['#f9f0ff', '#fff7e6', '#f6ffed', '#fff0f6', '#e6f7ff', '#e6fffb'];
        const panel = document.createElement('div');
        panel.className = 'card-color-panel sub-panel active';
        panel.innerHTML = colors.map(color => `<div class="highlight-color-btn" data-color="${color}" style="background-color: ${color};"></div>`).join('');
        
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.zIndex = '2000';
        panel.style.background = 'white';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '12px';
        panel.style.display = 'grid';
        panel.style.gridTemplateColumns = 'repeat(3, 1fr)';
        panel.style.gap = '8px';
        document.body.appendChild(panel);
        
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
            const colorBtn = e.target.closest('.highlight-color-btn');
            if (colorBtn) {
                insertCardAtCursor(colorBtn.dataset.color);
                hideAllInsertMenus();
                panel.remove();
            }
        });
        
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !menu.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    function showButtonColorPanel(menuItem, menu) {
        hideAllSubPanels();
        
        const colors = ['#fa8c16', '#1a1a1a', '#52c41a', '#722ed1', '#eb2f96', '#f5222d', '#1890ff', '#13c2c2'];
        const panel = document.createElement('div');
        panel.className = 'button-color-panel sub-panel active';
        panel.innerHTML = colors.map(color => `<div class="highlight-color-btn" data-color="${color}" style="background-color: ${color};"></div>`).join('');
        
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.zIndex = '2000';
        panel.style.background = 'white';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '12px';
        panel.style.display = 'grid';
        panel.style.gridTemplateColumns = 'repeat(4, 1fr)';
        panel.style.gap = '8px';
        document.body.appendChild(panel);
        
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
            const colorBtn = e.target.closest('.highlight-color-btn');
            if (colorBtn) {
                insertButtonAtCursor(colorBtn.dataset.color);
                hideAllInsertMenus();
                panel.remove();
            }
        });
        
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !menu.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    floatBoldBtn.addEventListener('click', () => applyFormat('bold'));
    floatItalicBtn.addEventListener('click', () => applyFormat('italic'));
    floatUnderlineBtn.addEventListener('click', () => applyFormat('underline'));
    floatStrikethroughBtn.addEventListener('click', () => applyFormat('strikeThrough'));
    
    floatHeadingSelect.addEventListener('change', function() {
        applyHeading(this.value);
    });
    
    floatColorDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        floatColorPicker.classList.toggle('active');
    });
    
    floatColorPicker.addEventListener('click', function(e) {
        e.stopPropagation();
        if (e.target.classList.contains('color-item')) {
            const color = e.target.dataset.color;
            if (e.target.classList.contains('font-color')) {
                currentFontColor = color;
                floatColorPreview.style.color = color;
                applyColor(color);
            } else if (e.target.classList.contains('bg-color')) {
                currentBgColor = color;
                floatColorPreview.style.backgroundColor = color || 'transparent';
                applyBgColor(color);
            }
            floatColorPicker.classList.remove('active');
        }
    });
    
    floatColorApplyBtn.addEventListener('click', function() {
        applyColor(currentFontColor);
        floatColorPicker.classList.remove('active');
    });
    
    floatLinkBtn.addEventListener('click', showLinkPanel);
    
    floatListBtn.addEventListener('click', () => insertListAtCursor('ul'));
    floatNumberedListBtn.addEventListener('click', () => insertListAtCursor('ol'));
    floatTaskBtn.addEventListener('click', insertTaskAtCursor);
    floatImageBtn.addEventListener('click', insertImageAtCursor);
    
    linkConfirmBtn.addEventListener('click', function() {
        const url = linkInput.value.trim();
        if (url) {
            if (savedSelection) {
                editorArea.focus();
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedSelection);
                document.execCommand('createLink', false, url);
                savedSelection = selection.getRangeAt(0).cloneRange();
            }
        }
        hideLinkPanel();
        triggerSave();
    });
    
    linkCancelBtn.addEventListener('click', hideLinkPanel);
    
    editorArea.addEventListener('mouseup', function() {
        const selection = window.getSelection();
        if (selection.toString().trim()) {
            savedSelection = selection.getRangeAt(0).cloneRange();
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            floatingToolbar.style.left = (rect.left + rect.width / 2 - floatingToolbar.offsetWidth / 2) + 'px';
            floatingToolbar.style.top = (rect.top - floatingToolbar.offsetHeight - 8) + 'px';
            floatingToolbar.classList.add('active');
        } else {
            floatingToolbar.classList.remove('active');
            savedSelection = null;
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.float-color-wrapper')) {
            floatColorPicker.classList.remove('active');
        }
        if (!e.target.closest('.link-input-panel') && !e.target.closest('#floatLinkBtn')) {
            hideLinkPanel();
        }
    });
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const container = document.createElement('div');
                container.className = 'image-container';
                container.contentEditable = 'false';
                
                const img = document.createElement('img');
                img.src = event.target.result;
                img.draggable = false;
                
                container.appendChild(img);
                
                const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
                handles.forEach(pos => {
                    const handle = document.createElement('div');
                    handle.className = 'image-resize-handle ' + pos;
                    handle.dataset.pos = pos;
                    container.appendChild(handle);
                });
                
                img.onload = function() {
                    const currentMaxWidth = Math.max(100, Math.min(editorArea.getBoundingClientRect().width || 800, 900) - 20);
                    if (img.naturalWidth > currentMaxWidth) {
                        img.style.maxWidth = currentMaxWidth + 'px';
                    }
                };
                
                setupImageContainerEvents(container);
                
                const selection = window.getSelection();
                let range;
                
                if (selection.rangeCount > 0) {
                    const selRange = selection.getRangeAt(0);
                    if (selRange.commonAncestorContainer && 
                        editorArea.contains(selRange.commonAncestorContainer)) {
                        range = selRange;
                    }
                }
                
                if (!range && savedSelection && savedSelection.commonAncestorContainer) {
                    if (editorArea.contains(savedSelection.commonAncestorContainer)) {
                        range = savedSelection;
                    }
                }
                
                if (!range && lastCursorPosition && document.caretRangeFromPoint) {
                    range = document.caretRangeFromPoint(lastCursorPosition.left, lastCursorPosition.top);
                }
                
                if (!range) {
                    range = document.createRange();
                    range.selectNodeContents(editorArea);
                    range.collapse(false);
                }
                
                if (range) {
                    range.insertNode(container);
                    
                    const newLine = document.createElement('div');
                    newLine.className = 'empty-line';
                    newLine.contentEditable = 'true';
                    newLine.addEventListener('keydown', handleKeydown);
                    newLine.addEventListener('input', function() {
                        if (newLine.textContent.trim() !== '') {
                            newLine.removeAttribute('data-placeholder');
                        }
                    });
                    container.parentNode.insertBefore(newLine, container.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newLine);
                    newRange.collapse(true);
                    const newSelection = window.getSelection();
                    newSelection.removeAllRanges();
                    newSelection.addRange(newRange);
                    savedSelection = newRange.cloneRange();
                }
                
                triggerSave();
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
    
    function setupImageContainerEvents(container) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startRatio;
        let currentHandle = null;
        
        container.addEventListener('click', function(e) {
            e.stopPropagation();
            document.querySelectorAll('.image-container.selected').forEach(el => {
                if (el !== container) el.classList.remove('selected');
            });
            container.classList.add('selected');
            
            updateHandlePositions();
        });
        
        const handles = container.querySelectorAll('.image-resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                isResizing = true;
                currentHandle = handle.dataset.pos;
                startX = e.clientX;
                startY = e.clientY;
                
                const img = container.querySelector('img');
                startWidth = img.offsetWidth;
                startHeight = img.offsetHeight;
                startRatio = startWidth / startHeight;
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
        
        function onMouseMove(e) {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;
            
            const editorRect = editorArea.getBoundingClientRect();
            const maxWidth = Math.max(100, editorRect.width - 40);
            const maxHeight = window.innerHeight * 0.8;
            const minWidth = 50;
            const minHeight = 30;
            
            const pos = currentHandle;
            
            if (pos.includes('e')) {
                newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
            }
            if (pos.includes('w')) {
                newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - dx));
            }
            if (pos.includes('s')) {
                newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
            }
            if (pos.includes('n')) {
                newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - dy));
            }
            
            if (pos === 'nw' || pos === 'ne' || pos === 'se' || pos === 'sw') {
                if (newHeight > minHeight) {
                    newWidth = newHeight * startRatio;
                    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
                }
            }
            
            const img = container.querySelector('img');
            img.style.width = newWidth + 'px';
            img.style.height = newHeight + 'px';
            
            updateHandlePositions();
        }
        
        function updateHandlePositions() {
            const img = container.querySelector('img');
            const imgRect = img.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const handles = container.querySelectorAll('.image-resize-handle');
            handles.forEach(handle => {
                const pos = handle.dataset.pos;
                let left, top;
                
                const offsetLeft = (containerRect.width - imgRect.width) / 2;
                const offsetTop = (containerRect.height - imgRect.height) / 2;
                
                const halfHandle = 5;
                
                if (pos.includes('n')) {
                    top = offsetTop - halfHandle;
                } else if (pos.includes('s')) {
                    top = offsetTop + imgRect.height - halfHandle;
                } else {
                    top = offsetTop + imgRect.height / 2 - halfHandle;
                }
                
                if (pos.includes('w')) {
                    left = offsetLeft - halfHandle;
                } else if (pos.includes('e')) {
                    left = offsetLeft + imgRect.width - halfHandle;
                } else {
                    left = offsetLeft + imgRect.width / 2 - halfHandle;
                }
                
                handle.style.left = left + 'px';
                handle.style.top = top + 'px';
            });
        }
        
        function onMouseUp() {
            isResizing = false;
            currentHandle = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            updateHandlePositions();
            triggerSave();
        }
    }
    
    floatingAddBtn.addEventListener('mouseenter', function() {
        document.querySelectorAll('.show-highlight').forEach(el => {
            el.classList.remove('show-highlight');
        });
        
        const btnRect = floatingAddBtn.getBoundingClientRect();
        const btnCenterY = btnRect.top + btnRect.height / 2;
        
        const textLines = editorArea.querySelectorAll('.empty-line, .heading-line');
        
        let closestLine = null;
        let minDistance = Infinity;
        
        textLines.forEach(line => {
            const lineRect = line.getBoundingClientRect();
            if (btnCenterY >= lineRect.top && btnCenterY <= lineRect.bottom) {
                const distance = Math.abs(btnCenterY - (lineRect.top + lineRect.height / 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestLine = line;
                }
            }
        });
        
        if (closestLine) {
            closestLine.classList.add('show-highlight');
        }
        
        isMouseOverAddBtn = true;
    });
    
    floatingAddBtn.addEventListener('mouseleave', function() {
        document.querySelectorAll('.show-highlight').forEach(el => {
            el.classList.remove('show-highlight');
        });
        
        isMouseOverAddBtn = false;
    });
    
    floatingAddBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showInsertMenuAtCursor();
    });
    
    editorArea.addEventListener('keydown', handleKeydown, true);
    
    editorArea.addEventListener('mousemove', function(e) {
        const editorRect = editorArea.getBoundingClientRect();
        
        if (e.clientX >= editorRect.left && e.clientX <= editorRect.right &&
            e.clientY >= editorRect.top && e.clientY <= editorRect.bottom) {
            
            lastCursorPosition = { left: e.clientX, top: e.clientY };
            
            const selection = window.getSelection();
            if (selection.rangeCount === 0) {
                return;
            }
            
            const range = selection.getRangeAt(0);
            if (!editorArea.contains(range.commonAncestorContainer)) {
                return;
            }
            
            updateAddBtnPosition();
        }
    });
    
    function updateAddBtnIcon(element) {
        if (element.classList.contains('empty-line')) {
            if (element.textContent.trim() === '') {
                floatingAddBtn.style.background = "url('images/工具加号.png') center/contain no-repeat";
            } else {
                floatingAddBtn.style.background = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" fill=\"%23666\">T</text></svg>') center/contain no-repeat";
            }
        } else if (element.classList.contains('card')) {
            floatingAddBtn.style.background = "url('images/色卡.png') center/contain no-repeat";
        } else if (element.classList.contains('column-cell')) {
            floatingAddBtn.style.background = "url('images/工具加号.png') center/contain no-repeat";
        } else if (element.classList.contains('columns-container')) {
            floatingAddBtn.style.background = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" fill=\"%23666\">T</text></svg>') center/contain no-repeat";
        } else if (element.classList.contains('highlight-block')) {
            floatingAddBtn.style.background = "url('images/高亮-copy.png') center/contain no-repeat";
        } else if (element.classList.contains('table-container')) {
            floatingAddBtn.style.background = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" fill=\"%23666\">T</text></svg>') center/contain no-repeat";
        } else if (element.classList.contains('heading-line')) {
            floatingAddBtn.style.background = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" fill=\"%23666\">T</text></svg>') center/contain no-repeat";
        }
    }
    
    function updateAddBtnPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) {
            floatingAddBtn.classList.remove('active');
            return;
        }
        
        const range = selection.getRangeAt(0);
        if (!editorArea.contains(range.commonAncestorContainer)) {
            floatingAddBtn.classList.remove('active');
            return;
        }
        
        let targetLine = null;
        let container = range.commonAncestorContainer;
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
        }
        
        targetLine = container.closest('.empty-line, .heading-line, .card, .column-cell, .columns-container, .highlight-block, .table-container');
        
        if (!targetLine) {
            let current = container;
            while (current && current !== editorArea) {
                if (current.classList && (
                    current.classList.contains('empty-line') || 
                    current.classList.contains('heading-line') || 
                    current.classList.contains('card') || 
                    current.classList.contains('columns-container') || 
                    current.classList.contains('highlight-block') || 
                    current.classList.contains('table-container'))) {
                    targetLine = current;
                    break;
                }
                current = current.parentElement;
            }
        }
        
        if (!targetLine) {
            const allLines = editorArea.querySelectorAll('.empty-line, .heading-line, .card, .columns-container, .highlight-block, .table-container');
            
            let cursorY = 0;
            const cursorRects = range.getClientRects();
            if (cursorRects.length > 0) {
                cursorY = cursorRects[0].top + cursorRects[0].height / 2;
            } else {
                const cursorRect = range.getBoundingClientRect();
                cursorY = cursorRect.top + cursorRect.height / 2;
            }
            
            let minDistance = Infinity;
            allLines.forEach(el => {
                const rect = el.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                const distance = Math.abs(cursorY - centerY);
                if (distance < minDistance) {
                    minDistance = distance;
                    targetLine = el;
                }
            });
        }
        
        if (targetLine) {
            const rect = targetLine.getBoundingClientRect();
            const lineTop = rect.top;
            const lineCenterY = lineTop + rect.height / 2;
            const editorRect = editorArea.getBoundingClientRect();
            
            if (lineTop !== currentLineTop) {
                currentLineTop = lineTop;
                const btnTop = lineCenterY - editorRect.top - 12;
                floatingAddBtn.style.top = btnTop + 'px';
            }
            
            const btnLeft = rect.left - editorRect.left - 32;
            floatingAddBtn.style.left = btnLeft + 'px';
            
            floatingAddBtn.classList.add('active');
            updateAddBtnIcon(targetLine);
        }
    }
    
    editorArea.addEventListener('input', function(e) {
        const target = e.target;
        if (target.classList.contains('empty-line')) {
            if (target.textContent.trim() !== '') {
                target.removeAttribute('data-placeholder');
                target.dataset.edited = 'true';
            } else if (!target.dataset.edited) {
                target.setAttribute('data-placeholder', '输入"/"快速插入内容');
            }
        }
        
        setTimeout(updateAddBtnPosition, 0);
        triggerSave();
    });
    
    editorArea.addEventListener('keyup', function(e) {
        setTimeout(updateAddBtnPosition, 0);
    });
    
    editorArea.addEventListener('mouseup', function(e) {
        setTimeout(updateAddBtnPosition, 10);
    });
    
    editorArea.addEventListener('focus', function(e) {
        setTimeout(updateAddBtnPosition, 0);
    }, true);
    
    editorArea.addEventListener('mouseleave', function() {
        if (hideTimer) clearTimeout(hideTimer);
    });
    
    document.addEventListener('selectionchange', function() {
        updateAddBtnPosition();
    });
    
    editorArea.addEventListener('click', function(e) {
        const target = e.target;
        
        isLineClicked = true;
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            lastEditorRange = selection.getRangeAt(0).cloneRange();
        }
        
        if (e.target.closest('.image-container')) {
            const imgContainer = e.target.closest('.image-container');
            if (!e.target.classList.contains('image-resize-handle')) {
                e.stopPropagation();
                document.querySelectorAll('.image-container.selected').forEach(el => {
                    if (el !== imgContainer) el.classList.remove('selected');
                });
                imgContainer.classList.add('selected');
                return;
            }
        } else {
            document.querySelectorAll('.image-container.selected').forEach(el => {
                el.classList.remove('selected');
            });
        }
        
        if (target.classList.contains('insert-area')) {
            e.preventDefault();
            const insertAfter = target.previousElementSibling;
            const newLine = createNewLine();
            target.parentNode.insertBefore(newLine, target);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(newLine);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            newLine.focus();
            
            triggerSave();
            return;
        }
        
        if (target.classList.contains('editor-area') || 
            (!target.classList.contains('empty-line') && 
             !target.classList.contains('heading-line') &&
             !target.classList.contains('column-cell') &&
             !target.classList.contains('inline-btn') &&
             !target.classList.contains('card') &&
             !target.closest('.card') &&
             !target.closest('.table-container') &&
             !target.closest('.highlight-block') &&
             !target.tagName.includes('A') &&
             !target.closest('a') &&
             !target.classList.contains('empty-line') &&
             !target.closest('.empty-line') &&
             !target.closest('.heading-line') &&
             !target.closest('.column-cell'))) {
            
            const selection = window.getSelection();
            const clickY = e.clientY;
            
            const blocks = editorArea.querySelectorAll('.empty-line, .heading-line, .card, .columns-container, .highlight-block, .table-container');
            
            let upperBlock = null;
            let lowerBlock = null;
            let minGap = Infinity;
            
            for (let i = 0; i < blocks.length; i++) {
                for (let j = i + 1; j < blocks.length; j++) {
                    const upper = blocks[i];
                    const lower = blocks[j];
                    const upperRect = upper.getBoundingClientRect();
                    const lowerRect = lower.getBoundingClientRect();
                    
                    if (clickY > upperRect.bottom && clickY < lowerRect.top) {
                        const gap = lowerRect.top - upperRect.bottom;
                        if (gap < minGap && gap < 30) {
                            minGap = gap;
                            upperBlock = upper;
                            lowerBlock = lower;
                        }
                    }
                }
            }
            
            if (upperBlock && lowerBlock) {
                let betweenEl = upperBlock.nextElementSibling;
                let insertArea = null;
                while (betweenEl && betweenEl !== lowerBlock) {
                    if (betweenEl.classList && betweenEl.classList.contains('insert-area')) {
                        insertArea = betweenEl;
                        break;
                    }
                    betweenEl = betweenEl.nextElementSibling;
                }
                
                if (insertArea) {
                    insertArea.click();
                    return;
                }
            }
            
            const elements = editorArea.querySelectorAll('.empty-line, .heading-line, .card, .columns-container, .highlight-block, .table-container');
            
            let insertAfter = null;
            let minDistance = Infinity;
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const distance = Math.abs(e.clientY - (rect.top + rect.height));
                if (distance < minDistance && e.clientY >= rect.top) {
                    minDistance = distance;
                    insertAfter = el;
                }
            });
            
            if (insertAfter) {
                let existingEmptyLine = null;
                let nextSibling = insertAfter.nextSibling;
                
                while (nextSibling) {
                    if (nextSibling.classList && nextSibling.classList.contains('empty-line')) {
                        existingEmptyLine = nextSibling;
                        break;
                    }
                    if (nextSibling.classList && 
                        (nextSibling.classList.contains('card') || 
                         nextSibling.classList.contains('columns-container') || 
                         nextSibling.classList.contains('highlight-block') || 
                         nextSibling.classList.contains('table-container') ||
                         nextSibling.classList.contains('heading-line'))) {
                        break;
                    }
                    nextSibling = nextSibling.nextSibling;
                }
                
                if (existingEmptyLine) {
                    const newRange = document.createRange();
                    newRange.selectNodeContents(existingEmptyLine);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    existingEmptyLine.focus();
                } else {
                    const newLine = createNewLine();
                    insertAfter.parentNode.insertBefore(newLine, insertAfter.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newLine);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    newLine.focus();
                    
                    triggerSave();
                }
            }
        }
    });
    
    docTitle.addEventListener('input', triggerSave);
    
    docList.addEventListener('click', function(e) {
        const item = e.target.closest('.doc-item');
        if (item) {
            const docId = item.dataset.id;
            loadDoc(docId);
        }
        
        const deleteBtn = e.target.closest('.doc-item-delete');
        if (deleteBtn) {
            e.stopPropagation();
            deleteDoc(deleteBtn.dataset.id);
        }
    });
    
    newDocBtn.addEventListener('click', createNewDoc);
    
    importBtn.addEventListener('click', function() {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', async function(e) {
        const files = e.target.files;
        if (files && files.length > 0) {
            for (const file of files) {
                const doc = await docManager.importDocFromFile(file);
                if (doc) {
                    console.log('导入成功:', doc.title);
                }
            }
            updateDocList();
            // 如果没有当前文档，加载第一个导入的文档
            if (!currentDocId) {
                const docs = await getDocs();
                if (docs.length > 0) {
                    loadDoc(docs[0].id);
                }
            }
        }
        e.target.value = '';
    });
    
    async function migrateDocs(oldHandle, newHandle) {
        let migratedCount = 0;
        let failedCount = 0;
        
        try {
            for await (const [name, entry] of oldHandle.entries()) {
                if (entry.kind === 'file' && name.endsWith('.json')) {
                    try {
                        const file = await entry.getFile();
                        const fileHandle = await newHandle.getFileHandle(name, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(await file.arrayBuffer());
                        await writable.close();
                        
                        await oldHandle.removeEntry(name);
                        migratedCount++;
                    } catch (fileError) {
                        console.error(`迁移文件 ${name} 失败:`, fileError);
                        failedCount++;
                    }
                }
            }
            
            if (migratedCount > 0) {
                alert(`成功迁移 ${migratedCount} 个文件` + (failedCount > 0 ? `，${failedCount} 个文件迁移失败` : ''));
            }
        } catch (e) {
            console.error('迁移文件失败:', e);
            alert('迁移失败');
        }
    }
    
    btnColorPicker.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-option')) {
            btnColorPicker.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
    
    cancelBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        currentBtn = null;
        currentBtnWrapper = null;
    });
    
    confirmBtn.addEventListener('click', function() {
        if (currentBtn) {
            currentBtn.textContent = btnNameInput.value;
            currentBtn.dataset.link = btnLinkInput.value;
            
            const colorOption = btnColorPicker.querySelector('.color-option.selected');
            if (colorOption) {
                const color = colorOption.dataset.color;
                const classList = currentBtn.classList;
                Object.values(colorMap).forEach(cls => classList.remove(cls));
                classList.add(colorMap[color]);
            }
            
            triggerSave();
        }
        
        modal.classList.remove('active');
        currentBtn = null;
        currentBtnWrapper = null;
    });
    
    deleteBtn.addEventListener('click', function() {
        if (currentBtnWrapper) {
            currentBtnWrapper.remove();
            triggerSave();
        }
        
        modal.classList.remove('active');
        currentBtn = null;
        currentBtnWrapper = null;
    });
    
    document.addEventListener('click', function(e) {
        const toolbarBtn = e.target.closest('.inline-btn-action');
        if (toolbarBtn) {
            e.stopPropagation();
            const action = toolbarBtn.dataset.action;
            const btnWrapper = toolbarBtn.closest('.inline-btn-wrapper');
            const targetBtn = btnWrapper.querySelector('.inline-btn');
            
            if (action === 'edit') {
                currentBtn = targetBtn;
                currentBtnWrapper = btnWrapper;
                
                btnNameInput.value = targetBtn.textContent;
                btnLinkInput.value = targetBtn.dataset.link || '';
                
                btnColorPicker.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
                Object.entries(colorMap).forEach(([color, cls]) => {
                    if (targetBtn.classList.contains(cls)) {
                        const option = btnColorPicker.querySelector(`.color-option[data-color="${color}"]`);
                        if (option) option.classList.add('selected');
                    }
                });
                
                modal.classList.add('active');
            } else if (action === 'delete') {
                btnWrapper.remove();
                triggerSave();
            }
        }
        
        const cardDeleteBtn = e.target.closest('.card-delete-btn');
        if (cardDeleteBtn) {
            e.stopPropagation();
            cardDeleteBtn.closest('.card').remove();
            triggerSave();
        }
        
        const highlightActionBtn = e.target.closest('.highlight-action-btn');
        if (highlightActionBtn) {
            e.stopPropagation();
            const action = highlightActionBtn.dataset.action;
            const highlight = highlightActionBtn.closest('.highlight-block');
            
            if (action === 'edit') {
                showHighlightEditPanel(highlight);
            } else if (action === 'add') {
                const colors = ['#fff7e6', '#fff0f6', '#f6ffed', '#e6fffb', '#e6f7ff', '#f9f0ff'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                insertHighlightAfter(highlight, randomColor);
            } else if (action === 'delete') {
                highlight.remove();
                triggerSave();
            }
        }
    });
    
    function setupCardEvents(card) {
        const actions = card.querySelector('.card-actions');
        
        card.addEventListener('mouseenter', function() {
            if (actions) actions.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', function() {
            if (actions) actions.style.opacity = '0';
        });
        
        if (actions) {
            actions.querySelectorAll('.card-action-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const action = this.dataset.action;
                    if (action === 'edit') {
                        showCardEditPanel(card);
                    } else if (action === 'delete') {
                        card.remove();
                        triggerSave();
                    }
                });
            });
        }
    }
    
    const borderColors = ['', '#d9d9d9', '#ffccc7', '#ffccc7', '#ffe7ba', '#ffe7ba', '#fff7e6', '#b7eb8f', '#91d5ff', '#d3adf7'];
    const fillColors = ['', '#ffffff', '#fff0f6', '#fff7e6', '#fffbe6', '#f6ffed', '#e6fffb', '#e6f7ff', '#f9f0ff', '#f5f5f5', '#d9d9d9', '#ffccc7', '#ffe7ba', '#fff7e6', '#b7eb8f', '#91d5ff', '#d3adf7'];
    
    function showCardEditPanel(card) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'card-edit-panel sub-panel';
        panel.innerHTML = `
            <div class="form-group">
                <label class="form-label">边框颜色</label>
                <div class="color-picker">
                    ${borderColors.map((color, index) => `
                        <div class="color-option" data-color="${color}" data-type="border" style="background-color: ${color || '#fff'}; border: 1px solid ${color || '#d9d9d9'};"></div>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">填充颜色</label>
                <div class="color-picker">
                    ${fillColors.map((color, index) => `
                        <div class="color-option" data-color="${color}" data-type="fill" style="background-color: ${color || '#fff'};"></div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const cardRect = card.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (cardRect.right + 8) + 'px';
        panel.style.top = cardRect.top + 'px';
        panel.style.zIndex = '2000';
        panel.style.background = 'white';
        panel.style.borderRadius = '8px';
        panel.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        panel.style.padding = '16px';
        panel.style.minWidth = '200px';
        
        document.body.appendChild(panel);
        
        const currentBorderColor = card.dataset.borderColor || '';
        const currentFillColor = card.style.backgroundColor || '';
        
        panel.querySelectorAll('.color-option').forEach(option => {
            const color = option.dataset.color;
            const type = option.dataset.type;
            
            if (type === 'border' && color === currentBorderColor) {
                option.classList.add('selected');
            }
            if (type === 'fill' && color === currentFillColor) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', function() {
                panel.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
                
                if (type === 'border') {
                    card.dataset.borderColor = color;
                    if (color) {
                        card.style.border = `1px solid ${color}`;
                    } else {
                        card.style.border = 'none';
                    }
                } else {
                    card.style.backgroundColor = color || '';
                    Object.values(cardColorMap).forEach(cls => card.classList.remove(cls));
                }
                
                triggerSave();
            });
        });
        
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !card.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        sidebarToggle.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            sidebarToggle.textContent = '›';
        } else {
            sidebarToggle.textContent = '‹';
        }
    });
    
    document.querySelectorAll('.width-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.width-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            docContainer.classList.remove('width-default', 'width-wider', 'width-full');
            docContainer.classList.add('width-' + this.dataset.width);
        });
    });
    
    // 初始化加载文档
    async function initDocs() {
        let docs = await getDocs();
        
        console.log('初始化文档列表:', docs);
        
        if (docs.length > 0) {
            console.log('加载第一个文档:', docs[0].id, docs[0].title);
            loadDoc(docs[0].id);
        } else {
            console.log('没有找到文档，创建新文档');
            createNewDoc();
        }
    }
    
    // 等待 DOM 准备好后执行
    setTimeout(() => {
        initDocs();
    }, 100);
});