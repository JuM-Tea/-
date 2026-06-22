document.addEventListener('DOMContentLoaded', function() {
    const editorArea = document.getElementById('editorArea');
    const floatingAddBtn = document.getElementById('floatingAddBtn');
    
    let savedSelection = null;
    
    const headingSelect = document.getElementById('headingSelect');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    const strikethroughBtn = document.getElementById('strikethroughBtn');
    
    const colorApplyBtn = document.getElementById('colorApplyBtn');
    const colorDropdownBtn = document.getElementById('colorDropdownBtn');
    const colorPicker = document.getElementById('colorPicker');
    const colorPreview = document.getElementById('colorPreview');
    const resetColorBtn = document.getElementById('resetColorBtn');
    
    const floatingToolbar = document.getElementById('floatingToolbar');
    const floatBoldBtn = document.getElementById('floatBoldBtn');
    const floatItalicBtn = document.getElementById('floatItalicBtn');
    const floatUnderlineBtn = document.getElementById('floatUnderlineBtn');
    const floatColorApplyBtn = document.getElementById('floatColorApplyBtn');
    const floatColorDropdownBtn = document.getElementById('floatColorDropdownBtn');
    const floatColorPicker = document.getElementById('floatColorPicker');
    const floatColorPreview = document.getElementById('floatColorPreview');
    const floatLinkBtn = document.getElementById('floatLinkBtn');
    
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
        '#fa8c16': 'inline-btn-orange', '#1a1a1a': 'inline-btn-black', '#52c41a': 'inline-btn-green',
        '#722ed1': 'inline-btn-purple', '#eb2f96': 'inline-btn-pink', '#f5222d': 'inline-btn-red',
        '#1890ff': 'inline-btn-blue', '#13c2c2': 'inline-btn-cyan', '#69c0ff': 'inline-btn-light-blue',
        '#95de64': 'inline-btn-light-green', '#b37feb': 'inline-btn-light-purple', '#ffadd2': 'inline-btn-light-pink'
    };
    
    const cardColorMap = {
        '#f9f0ff': 'card-purple', '#fff7e6': 'card-orange', '#f6ffed': 'card-green',
        '#fff0f6': 'card-pink', '#e6f7ff': 'card-blue', '#e6fffb': 'card-cyan'
    };
    
    let currentFontColor = '#333', currentBgColor = '#fff7e6';
    let hideTimer = null;
    let currentLineTop = -1;
    let lastCursorPosition = null;
    let currentBtn = null, currentBtnWrapper = null;
    
    function applyFormat(format) {
        document.execCommand(format, false);
        editorArea.focus();
    }
    
    function applyHeading(level) {
        document.execCommand('formatBlock', false, `<${level}>`);
        headingSelect.value = level;
        editorArea.focus();
    }
    
    function applyColor(color) {
        currentFontColor = color;
        colorPreview.style.color = color;
        
        if (savedSelection) {
            editorArea.focus();
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedSelection);
            document.execCommand('foreColor', false, color);
            savedSelection = selection.getRangeAt(0).cloneRange();
        }
        editorArea.focus();
    }
    
    function applyBgColor(color) {
        currentBgColor = color;
        
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
    }
    
    function resetColor() {
        applyColor('#333');
        colorPreview.style.color = '#333';
    }
    
    boldBtn.addEventListener('click', () => applyFormat('bold'));
    italicBtn.addEventListener('click', () => applyFormat('italic'));
    underlineBtn.addEventListener('click', () => applyFormat('underline'));
    strikethroughBtn.addEventListener('click', () => applyFormat('strikeThrough'));
    
    headingSelect.addEventListener('change', function() {
        applyHeading(this.value);
    });
    
    colorDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        colorPicker.classList.toggle('active');
    });
    
    colorPicker.addEventListener('click', function(e) {
        if (e.target.classList.contains('color-option')) {
            const color = e.target.dataset.color;
            applyColor(color);
            colorPicker.classList.remove('active');
        }
    });
    
    colorApplyBtn.addEventListener('click', function() {
        applyColor(currentFontColor);
        colorPicker.classList.remove('active');
    });
    
    resetColorBtn.addEventListener('click', function() {
        resetColor();
        colorPicker.classList.remove('active');
    });
    
    floatBoldBtn.addEventListener('click', () => applyFormat('bold'));
    floatItalicBtn.addEventListener('click', () => applyFormat('italic'));
    floatUnderlineBtn.addEventListener('click', () => applyFormat('underline'));
    
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
    
    function showLinkPanel() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            linkInputPanel.style.left = rect.left + 'px';
            linkInputPanel.style.top = rect.bottom + 8 + 'px';
            linkInputPanel.classList.add('active');
            linkInput.focus();
        }
    }
    
    function hideLinkPanel() {
        linkInputPanel.classList.remove('active');
        linkInput.value = '';
    }
    
    floatLinkBtn.addEventListener('click', showLinkPanel);
    
    linkConfirmBtn.addEventListener('click', function() {
        const url = linkInput.value.trim();
        if (url) {
            document.execCommand('createLink', false, url);
        }
        hideLinkPanel();
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
        if (!e.target.closest('.color-btn-wrapper')) {
            colorPicker.classList.remove('active');
        }
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
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                document.execCommand('insertHTML', false, img.outerHTML);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
    
    function openModal(btn, wrapper) {
        currentBtn = btn; currentBtnWrapper = wrapper;
        btnNameInput.value = btn.textContent.trim();
        btnLinkInput.value = btn.dataset.href && btn.dataset.href !== '#' ? btn.dataset.href : '';
        const currentColor = btn.dataset.color || '#1890ff';
        document.querySelectorAll('#btnColorPicker .color-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === currentColor);
        });
        modal.classList.add('active'); btnNameInput.focus();
    }
    
    function closeModal() { modal.classList.remove('active'); currentBtn = null; currentBtnWrapper = null; }
    
    function updateBtn() {
        if (!currentBtn) return;
        const newName = btnNameInput.value.trim();
        const newLink = btnLinkInput.value.trim();
        const newColor = document.querySelector('#btnColorPicker .color-option.selected')?.dataset.color || '#1890ff';
        if (newName) currentBtn.textContent = newName;
        if (newLink) { currentBtn.dataset.href = newLink; }
        currentBtn.dataset.color = newColor;
        currentBtn.className = `inline-btn ${colorMap[newColor] || 'inline-btn-blue'}`;
        closeModal();
    }
    
    function deleteCurrentBtn() { if (currentBtnWrapper) currentBtnWrapper.remove(); closeModal(); }
    
    function addNewBtn(afterWrapper) {
        const btnRow = afterWrapper.parentElement;
        const newWrapper = document.createElement('span');
        newWrapper.className = 'inline-btn-wrapper';
        const newBtn = document.createElement('span');
        newBtn.className = 'inline-btn inline-btn-blue';
        newBtn.dataset.color = '#1890ff';
        newBtn.dataset.href = '#';
        newBtn.contentEditable = 'false';
        newBtn.textContent = '新按钮';
        const toolbar = document.createElement('span');
        toolbar.className = 'inline-btn-toolbar';
        toolbar.innerHTML = '<span class="inline-toolbar-btn" data-action="edit">✏️</span><span class="inline-toolbar-btn" data-action="add">➕</span><span class="inline-toolbar-btn" data-action="delete">🗑</span>';
        newWrapper.appendChild(newBtn);
        newWrapper.appendChild(toolbar);
        btnRow.insertBefore(newWrapper, afterWrapper.nextSibling);
        setTimeout(() => openModal(newBtn, newWrapper), 100);
    }
    
    btnColorPicker.addEventListener('click', e => {
        if (e.target.classList.contains('color-option')) {
            document.querySelectorAll('#btnColorPicker .color-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    });
    
    cancelBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', updateBtn);
    deleteBtn.addEventListener('click', deleteCurrentBtn);
    
    function createNewLine(withPlaceholder = false) {
        const div = document.createElement('div');
        div.className = 'empty-line';
        div.contentEditable = 'true';
        if (withPlaceholder) {
            div.setAttribute('data-placeholder', '输入"/"快速插入内容');
        }
        return div;
    }
    
    editorArea.addEventListener('mousemove', function(e) {
        const editorRect = editorArea.getBoundingClientRect();
        
        if (e.clientX >= editorRect.left && e.clientX <= editorRect.right &&
            e.clientY >= editorRect.top && e.clientY <= editorRect.bottom) {
            
            const elements = editorArea.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, div.empty-line, div.card-container, div.columns-container, div.column-cell');
            
            let closestElement = null;
            let minDistance = Infinity;
            
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const distance = Math.abs(e.clientY - rect.top);
                if (distance < minDistance && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    minDistance = distance;
                    closestElement = el;
                }
            });
            
            if (closestElement) {
                const rect = closestElement.getBoundingClientRect();
                const newLineTop = rect.top - editorRect.top;
                
                if (newLineTop !== currentLineTop) {
                    currentLineTop = newLineTop;
                    floatingAddBtn.style.top = currentLineTop + 'px';
                    floatingAddBtn.dataset.targetId = closestElement.dataset.id || closestElement.id || 'line-' + Date.now();
                    if (!closestElement.dataset.id) {
                        closestElement.dataset.id = floatingAddBtn.dataset.targetId;
                    }
                }
                
                floatingAddBtn.classList.add('active');
                lastCursorPosition = { left: e.clientX, top: e.clientY };
            } else {
                floatingAddBtn.classList.remove('active');
            }
            
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
        }
    });
    
    floatingAddBtn.addEventListener('mouseenter', function() {
        const targetId = this.dataset.targetId;
        const target = document.querySelector('[data-id="' + targetId + '"]');
        if (target) {
            target.classList.add('show-highlight');
        }
    });
    
    floatingAddBtn.addEventListener('mouseleave', function() {
        document.querySelectorAll('.empty-line.show-highlight').forEach(el => {
            el.classList.remove('show-highlight');
        });
    });
    
    editorArea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let container = range.commonAncestorContainer;
                
                if (container.nodeType === Node.TEXT_NODE) {
                    container = container.parentNode;
                }
                
                if (container.closest('.table-container')) {
                    return;
                }
                
                e.preventDefault();
                
                const line = container.closest('.empty-line, .heading-line');
                
                if (line) {
                    const content = line.textContent;
                    const cursorPos = range.startOffset;
                    
                    line.textContent = content.substring(0, cursorPos);
                    line.removeAttribute('data-placeholder');
                    
                    const newLine = createNewLine();
                    const remaining = content.substring(cursorPos);
                    if (remaining) {
                        newLine.textContent = remaining;
                    }
                    
                    line.parentNode.insertBefore(newLine, line.nextSibling);
                    
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newLine);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    newLine.focus();
                }
            }
        } else if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let container = range.commonAncestorContainer;
                
                if (container.nodeType === Node.TEXT_NODE) {
                    container = container.parentNode;
                }
                
                const line = container.closest('.empty-line, .heading-line');
                
                if (line) {
                    const content = line.textContent;
                    const cursorPos = range.startOffset;
                    
                    if (cursorPos === 0 && content.length === 0) {
                        e.preventDefault();
                        
                        const prevSibling = line.previousElementSibling;
                        if (prevSibling) {
                            line.parentNode.removeChild(line);
                            
                            const newRange = document.createRange();
                            newRange.selectNodeContents(prevSibling);
                            newRange.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(newRange);
                            
                            prevSibling.focus();
                            
                            const editorRect = editorArea.getBoundingClientRect();
                            const prevRect = prevSibling.getBoundingClientRect();
                            currentLineTop = prevRect.top - editorRect.top;
                            floatingAddBtn.style.top = currentLineTop + 'px';
                            floatingAddBtn.dataset.targetId = prevSibling.dataset.id;
                        }
                    }
                }
            }
        }
    });
    
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
    });
    
    editorArea.addEventListener('mouseleave', function() {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(function() {
            floatingAddBtn.classList.remove('active');
            currentLineTop = -1;
        }, 300);
    });
    
    editorArea.addEventListener('click', function(e) {
        const target = e.target;
        
        if (target.classList.contains('editor-area') || 
            (!target.classList.contains('empty-line') && 
             !target.classList.contains('heading-line') &&
             !target.classList.contains('column-cell') &&
             !target.classList.contains('inline-btn') &&
             !target.classList.contains('card') &&
             !target.closest('.card') &&
             !target.closest('.table-container'))) {
            
            const selection = window.getSelection();
            
            const editorRect = editorArea.getBoundingClientRect();
            const elements = editorArea.querySelectorAll('.empty-line, .heading-line, .card-container, .columns-container');
            
            let insertAfter = null;
            elements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    insertAfter = el;
                }
            });
            
            if (insertAfter) {
                const newLine = createNewLine();
                insertAfter.parentNode.insertBefore(newLine, insertAfter.nextSibling);
                
                const newRange = document.createRange();
                newRange.selectNodeContents(newLine);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                
                newLine.focus();
                e.stopPropagation();
            }
        }
    });
    
    floatingAddBtn.addEventListener('mouseenter', function() {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    });
    
    floatingAddBtn.addEventListener('mouseleave', function(e) {
        const editorRect = editorArea.getBoundingClientRect();
        
        if (e.clientX < editorRect.left || e.clientX > editorRect.right ||
            e.clientY < editorRect.top || e.clientY > editorRect.bottom) {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(function() {
                floatingAddBtn.classList.remove('active');
                currentLineTop = -1;
            }, 300);
        }
    });
    
    floatingAddBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showInsertMenuAtCursor();
    });
    
    function hideAllInsertMenus() {
        document.querySelectorAll('.insert-menu').forEach(el => el.remove());
    }
    
    function hideAllSubPanels() {
        document.querySelectorAll('.column-select-panel, .highlight-color-panel, .card-color-panel, .button-color-panel').forEach(el => el.remove());
    }
    
    function showInsertMenuAtCursor() {
        const menu = createInsertMenu(null);
        
        if (lastCursorPosition) {
            menu.style.position = 'fixed';
            menu.style.left = (editorArea.getBoundingClientRect().left) + 'px';
            menu.style.top = (lastCursorPosition.top) + 'px';
            menu.style.margin = '0';
            document.body.appendChild(menu);
        } else {
            document.body.appendChild(menu);
            menu.style.position = 'fixed';
            menu.style.left = (editorArea.getBoundingClientRect().left) + 'px';
            menu.style.top = '100px';
        }
        
        menu.classList.add('active');
    }
    
    function createInsertMenu(trigger) {
        const menu = document.createElement('div');
        menu.className = 'insert-menu';
        menu.innerHTML = `
            <div class="insert-menu-header">基础</div>
            <div class="insert-menu-group">
                <div class="insert-menu-item" data-action="text">
                    <span class="insert-menu-icon">T</span>
                    <span class="insert-menu-text">正文</span>
                </div>
                <div class="insert-menu-item" data-action="h1">
                    <span class="insert-menu-icon">H1</span>
                    <span class="insert-menu-text">一级标题</span>
                </div>
                <div class="insert-menu-item" data-action="h2">
                    <span class="insert-menu-icon">H2</span>
                    <span class="insert-menu-text">二级标题</span>
                </div>
                <div class="insert-menu-item" data-action="h3">
                    <span class="insert-menu-icon">H3</span>
                    <span class="insert-menu-text">三级标题</span>
                </div>
                <div class="insert-menu-item" data-action="h4">
                    <span class="insert-menu-icon">H4</span>
                    <span class="insert-menu-text">四级标题</span>
                </div>
            </div>
            <div class="insert-menu-divider"></div>
            <div class="insert-menu-group">
                <div class="insert-menu-item" data-action="ul">
                    <span class="insert-menu-icon">☰</span>
                    <span class="insert-menu-text">无序列表</span>
                </div>
                <div class="insert-menu-item" data-action="ol">
                    <span class="insert-menu-icon">☱</span>
                    <span class="insert-menu-text">有序列表</span>
                </div>
                <div class="insert-menu-item" data-action="task">
                    <span class="insert-menu-icon">☐</span>
                    <span class="insert-menu-text">任务</span>
                </div>
            </div>
            <div class="insert-menu-divider"></div>
            <div class="insert-menu-header">常用</div>
            <div class="insert-menu-group">
                <div class="insert-menu-item" data-action="text">
                    <span class="insert-menu-icon">📝</span>
                    <span class="insert-menu-text">文字</span>
                </div>
                <div class="insert-menu-item" data-action="image">
                    <span class="insert-menu-icon">🖼️</span>
                    <span class="insert-menu-text">图片</span>
                </div>
                <div class="insert-menu-item" data-action="table">
                    <span class="insert-menu-icon">⊞</span>
                    <span class="insert-menu-text">表格</span>
                </div>
                <div class="insert-menu-item has-submenu" data-action="columns">
                    <span class="insert-menu-icon">|||</span>
                    <span class="insert-menu-text">分栏</span>
                    <span style="color: #999; font-size: 12px;">▶</span>
                </div>
            </div>
            <div class="insert-menu-divider"></div>
            <div class="insert-menu-group">
                <div class="insert-menu-item has-submenu" data-action="highlight">
                    <span class="insert-menu-icon">🎨</span>
                    <span class="insert-menu-text">高亮块</span>
                    <span style="color: #999; font-size: 12px;">▶</span>
                </div>
                <div class="insert-menu-item has-submenu" data-action="card">
                    <span class="insert-menu-icon">📦</span>
                    <span class="insert-menu-text">卡片</span>
                    <span style="color: #999; font-size: 12px;">▶</span>
                </div>
                <div class="insert-menu-item has-submenu" data-action="button">
                    <span class="insert-menu-icon">🔘</span>
                    <span class="insert-menu-text">按钮</span>
                    <span style="color: #999; font-size: 12px;">▶</span>
                </div>
            </div>
        `;
        
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
                    showTableSelectorPanel(menuItem, trigger);
                    return;
                } else if (action === 'columns') {
                    showColumnSelectPanel(menuItem, trigger);
                    return;
                } else if (action === 'highlight') {
                    showHighlightColorPanel(menuItem, trigger);
                    return;
                } else if (action === 'card') {
                    showCardColorPanel(menuItem, trigger);
                    return;
                } else if (action === 'button') {
                    showButtonColorPanel(menuItem, trigger);
                    return;
                }
                
                hideAllInsertMenus();
            }
        });
        
        return menu;
    }
    
    function getRangeAtMousePosition() {
        if (lastCursorPosition && document.caretRangeFromPoint) {
            return document.caretRangeFromPoint(lastCursorPosition.left, lastCursorPosition.top);
        }
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            return selection.getRangeAt(0);
        }
        return null;
    }
    
    function insertHeadingAtCursor(level) {
        const range = getRangeAtMousePosition();
        if (range) {
            const heading = document.createElement(level);
            heading.contentEditable = 'true';
            heading.classList.add('heading-line');
            heading.setAttribute('data-placeholder', level.toUpperCase());
            
            range.insertNode(heading);
            
            const newLine = createNewLine();
            heading.parentNode.insertBefore(newLine, heading.nextSibling);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(heading);
            newRange.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(newRange);
            
            heading.focus();
        }
    }
    
    function insertListAtCursor(type) {
        const range = getRangeAtMousePosition();
        if (range) {
            const list = document.createElement(type);
            const li = document.createElement('li');
            li.innerHTML = '<span contenteditable="true">列表项</span>';
            list.appendChild(li);
            range.insertNode(list);
            
            const newLine = createNewLine();
            list.parentNode.insertBefore(newLine, list.nextSibling);
            
            range.collapse(false);
            editorArea.focus();
        }
    }
    
    function insertTaskAtCursor() {
        const range = getRangeAtMousePosition();
        if (range) {
            const p = document.createElement('p');
            p.innerHTML = `
                <span class="task-item">
                    <span class="task-checkbox"></span>
                    <span class="task-text" contenteditable="true">任务内容</span>
                </span>
            `;
            range.insertNode(p);
            
            const newLine = createNewLine();
            p.parentNode.insertBefore(newLine, p.nextSibling);
            
            const checkbox = p.querySelector('.task-checkbox');
            checkbox.addEventListener('click', function() {
                this.classList.toggle('checked');
                const text = this.nextElementSibling;
                text.classList.toggle('checked');
            });
            
            range.collapse(false);
            editorArea.focus();
        }
    }
    
    function insertTextAtCursor() {
        const range = getRangeAtMousePosition();
        if (range) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            range.insertNode(p);
            
            const newLine = createNewLine();
            p.parentNode.insertBefore(newLine, p.nextSibling);
            
            range.collapse(false);
            editorArea.focus();
        }
    }
    
    function insertImageAtCursor() {
        fileInput.click();
    }
    
    function insertHighlightAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const wrapper = document.createElement('span');
            wrapper.className = 'inline-btn-wrapper';
            
            const btn = document.createElement('span');
            btn.className = `inline-btn ${colorMap[color] || 'inline-btn-blue'}`;
            btn.dataset.color = color;
            btn.dataset.href = '#';
            btn.contentEditable = 'false';
            btn.textContent = '新高亮块';
            
            const toolbar = document.createElement('span');
            toolbar.className = 'inline-btn-toolbar';
            toolbar.innerHTML = '<span class="inline-toolbar-btn" data-action="edit">✏️</span><span class="inline-toolbar-btn" data-action="add">➕</span><span class="inline-toolbar-btn" data-action="delete">🗑</span>';
            
            wrapper.appendChild(btn);
            wrapper.appendChild(toolbar);
            range.insertNode(wrapper);
            range.collapse(false);
            
            setTimeout(() => {
                openModal(btn, wrapper);
            }, 100);
        }
    }
    
    function insertCardAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const newCardContainer = document.createElement('div');
            newCardContainer.className = 'card-container';
            newCardContainer.contentEditable = 'false';
            
            const newGrid = document.createElement('div');
            newGrid.className = 'grid-container columns-2';
            
            const newCard = document.createElement('div');
            newCard.className = `card ${cardColorMap[color] || 'card-purple'}`;
            newCard.innerHTML = `
                <button class="card-delete-btn" title="删除卡片">×</button>
                <div class="card-title" contenteditable="true">新卡片</div>
                <div class="section">
                    <div class="section-title" contenteditable="true">新分组</div>
                    <div class="button-group">
                        <span class="inline-btn-wrapper">
                            <span class="inline-btn inline-btn-blue" data-color="#1890ff" data-href="#" contenteditable="false">新按钮</span>
                            <span class="inline-btn-toolbar">
                                <span class="inline-toolbar-btn" data-action="edit">✏️</span>
                                <span class="inline-toolbar-btn" data-action="add">➕</span>
                                <span class="inline-toolbar-btn" data-action="delete">🗑</span>
                            </span>
                        </span>
                    </div>
                </div>
            `;
            
            newGrid.appendChild(newCard);
            newCardContainer.appendChild(newGrid);
            range.insertNode(newCardContainer);
            
            const newLine = createNewLine();
            newCardContainer.parentNode.insertBefore(newLine, newCardContainer.nextSibling);
            
            range.collapse(false);
        }
    }
    
    function insertButtonAtCursor(color) {
        const range = getRangeAtMousePosition();
        if (range) {
            const wrapper = document.createElement('span');
            wrapper.className = 'inline-btn-wrapper';
            
            const btn = document.createElement('span');
            btn.className = `inline-btn ${colorMap[color] || 'inline-btn-blue'}`;
            btn.dataset.color = color;
            btn.dataset.href = '#';
            btn.contentEditable = 'false';
            btn.textContent = '新按钮';
            
            const toolbar = document.createElement('span');
            toolbar.className = 'inline-btn-toolbar';
            toolbar.innerHTML = '<span class="inline-toolbar-btn" data-action="edit">✏️</span><span class="inline-toolbar-btn" data-action="add">➕</span><span class="inline-toolbar-btn" data-action="delete">🗑</span>';
            
            wrapper.appendChild(btn);
            wrapper.appendChild(toolbar);
            range.insertNode(wrapper);
            range.collapse(false);
            
            setTimeout(() => {
                openModal(btn, wrapper);
            }, 100);
        }
    }
    
    function insertColumnsAtCursor(count) {
        const range = getRangeAtMousePosition();
        if (range) {
            const columns = document.createElement('div');
            columns.className = `columns-container columns-${count}`;
            columns.style.position = 'relative';
            
            for (let i = 0; i < count; i++) {
                const cell = document.createElement('div');
                cell.className = 'column-cell';
                cell.contentEditable = 'true';
                
                cell.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const br = document.createElement('br');
                            range.insertNode(br);
                            range.collapse(false);
                        }
                    }
                });
                
                columns.appendChild(cell);
            }
            
            range.insertNode(columns);
            
            const newLine = createNewLine();
            columns.parentNode.insertBefore(newLine, columns.nextSibling);
            
            range.collapse(false);
        }
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
                    
                    td.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                            const selection = window.getSelection();
                            if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                const br = document.createElement('br');
                                range.insertNode(br);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                        }
                    });
                    
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            
            range.insertNode(table);
            
            const newLine = createNewLine();
            table.parentNode.insertBefore(newLine, table.nextSibling);
            
            range.collapse(false);
        }
    }
    
    function showColumnSelectPanel(menuItem, trigger) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'column-select-panel active';
        panel.innerHTML = `
            <div class="column-select-title">选择栏数</div>
            <div class="column-select-grid">
                <div class="column-select-row" data-columns="2">
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <span class="column-select-count">2</span>
                </div>
                <div class="column-select-row" data-columns="3">
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <span class="column-select-count">3</span>
                </div>
                <div class="column-select-row" data-columns="4">
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <span class="column-select-count">4</span>
                </div>
                <div class="column-select-row" data-columns="5">
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <div class="column-select-bar"></div>
                    <span class="column-select-count">5</span>
                </div>
            </div>
        `;
        
        const menu = menuItem.closest('.insert-menu');
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
        document.body.appendChild(panel);
        
        panel.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = e.target.closest('.column-select-row');
            if (row) {
                const columns = parseInt(row.dataset.columns);
                insertColumnsAtCursor(columns);
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
    
    function showHighlightColorPanel(menuItem, trigger) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'column-select-panel active';
        panel.innerHTML = `
            <div class="column-select-title">选择颜色</div>
            <div class="highlight-block-option" style="padding: 8px;">
                <span class="highlight-color-btn" data-color="#fa8c16" style="background-color: #fa8c16;"></span>
                <span class="highlight-color-btn" data-color="#1a1a1a" style="background-color: #1a1a1a;"></span>
                <span class="highlight-color-btn" data-color="#52c41a" style="background-color: #52c41a;"></span>
                <span class="highlight-color-btn" data-color="#722ed1" style="background-color: #722ed1;"></span>
                <span class="highlight-color-btn" data-color="#eb2f96" style="background-color: #eb2f96;"></span>
                <span class="highlight-color-btn" data-color="#1890ff" style="background-color: #1890ff;"></span>
                <span class="highlight-color-btn" data-color="#f5222d" style="background-color: #f5222d;"></span>
                <span class="highlight-color-btn" data-color="#13c2c2" style="background-color: #13c2c2;"></span>
                <span class="highlight-color-btn" data-color="#69c0ff" style="background-color: #69c0ff;"></span>
                <span class="highlight-color-btn" data-color="#95de64" style="background-color: #95de64;"></span>
                <span class="highlight-color-btn" data-color="#b37feb" style="background-color: #b37feb;"></span>
                <span class="highlight-color-btn" data-color="#ffadd2" style="background-color: #ffadd2;"></span>
            </div>
        `;
        
        const menu = menuItem.closest('.insert-menu');
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
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
    
    function showCardColorPanel(menuItem, trigger) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'column-select-panel active';
        panel.innerHTML = `
            <div class="column-select-title">选择颜色</div>
            <div class="highlight-block-option" style="padding: 8px;">
                <span class="highlight-color-btn" data-color="#f9f0ff" style="background-color: #f9f0ff;"></span>
                <span class="highlight-color-btn" data-color="#fff7e6" style="background-color: #fff7e6;"></span>
                <span class="highlight-color-btn" data-color="#f6ffed" style="background-color: #f6ffed;"></span>
                <span class="highlight-color-btn" data-color="#fff0f6" style="background-color: #fff0f6;"></span>
                <span class="highlight-color-btn" data-color="#e6f7ff" style="background-color: #e6f7ff;"></span>
                <span class="highlight-color-btn" data-color="#e6fffb" style="background-color: #e6fffb;"></span>
            </div>
        `;
        
        const menu = menuItem.closest('.insert-menu');
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
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
    
    function showButtonColorPanel(menuItem, trigger) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'column-select-panel active';
        panel.innerHTML = `
            <div class="column-select-title">选择颜色</div>
            <div class="highlight-block-option" style="padding: 8px;">
                <span class="highlight-color-btn" data-color="#fa8c16" style="background-color: #fa8c16;"></span>
                <span class="highlight-color-btn" data-color="#1a1a1a" style="background-color: #1a1a1a;"></span>
                <span class="highlight-color-btn" data-color="#52c41a" style="background-color: #52c41a;"></span>
                <span class="highlight-color-btn" data-color="#722ed1" style="background-color: #722ed1;"></span>
                <span class="highlight-color-btn" data-color="#eb2f96" style="background-color: #eb2f96;"></span>
                <span class="highlight-color-btn" data-color="#1890ff" style="background-color: #1890ff;"></span>
                <span class="highlight-color-btn" data-color="#f5222d" style="background-color: #f5222d;"></span>
                <span class="highlight-color-btn" data-color="#13c2c2" style="background-color: #13c2c2;"></span>
                <span class="highlight-color-btn" data-color="#69c0ff" style="background-color: #69c0ff;"></span>
                <span class="highlight-color-btn" data-color="#95de64" style="background-color: #95de64;"></span>
                <span class="highlight-color-btn" data-color="#b37feb" style="background-color: #b37feb;"></span>
                <span class="highlight-color-btn" data-color="#ffadd2" style="background-color: #ffadd2;"></span>
            </div>
        `;
        
        const menu = menuItem.closest('.insert-menu');
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
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
    
    function showTableSelectorPanel(menuItem, trigger) {
        hideAllSubPanels();
        
        const panel = document.createElement('div');
        panel.className = 'table-selector-panel active';
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
        
        const menu = menuItem.closest('.insert-menu');
        const menuRect = menu.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.left = (menuRect.right + 8) + 'px';
        panel.style.top = menuRect.top + 'px';
        panel.style.margin = '0';
        panel.style.zIndex = '2000';
        document.body.appendChild(panel);
        
        let selectedRows = 0, selectedCols = 0;
        const title = panel.querySelector('.table-selector-title');
        
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
            const cell = e.target.closest('.table-selector-cell');
            if (cell) {
                insertTableAtCursor(selectedRows, selectedCols);
                hideAllInsertMenus();
                panel.remove();
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
        
        document.addEventListener('click', function closePanel(e) {
            if (!panel.contains(e.target) && !menu.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.insert-trigger') && 
            !e.target.closest('.insert-menu') &&
            !e.target.closest('.table-selector-panel') &&
            !e.target.closest('.column-select-panel')) {
            hideAllInsertMenus();
        }
        
        const toolbarBtn = e.target.closest('.inline-toolbar-btn');
        if (toolbarBtn) {
            e.stopPropagation();
            const action = toolbarBtn.dataset.action;
            const btnWrapper = toolbarBtn.closest('.inline-btn-wrapper');
            const targetBtn = btnWrapper.querySelector('.inline-btn');
            
            if (action === 'edit') {
                openModal(targetBtn, btnWrapper);
            } else if (action === 'add') {
                addNewBtn(btnWrapper);
            } else if (action === 'delete') {
                btnWrapper.remove();
            }
        }
        
        const cardDeleteBtn = e.target.closest('.card-delete-btn');
        if (cardDeleteBtn) {
            e.stopPropagation();
            cardDeleteBtn.closest('.card').remove();
        }
    });
});