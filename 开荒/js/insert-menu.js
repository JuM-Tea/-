const fileInput = document.getElementById('fileInput');

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

window.colorMap = colorMap;
window.cardColorMap = cardColorMap;

function hideAllInsertMenus() {
    document.querySelectorAll('.insert-menu').forEach(el => el.remove());
}

function hideAllSubPanels() {
    document.querySelectorAll('.column-select-panel, .highlight-color-panel, .card-color-panel, .button-color-panel').forEach(el => el.remove());
}

function showInsertMenuAtCursor() {
    const menu = createInsertMenu(null);
    const editorArea = window.editorArea;
    const lastCursorPosition = window.getLastCursorPosition();
    
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
    const lastCursorPosition = window.getLastCursorPosition();
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
        
        const newLine = window.createNewLine();
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
        
        const newLine = window.createNewLine();
        list.parentNode.insertBefore(newLine, list.nextSibling);
        
        range.collapse(false);
        window.editorArea.focus();
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
        
        const newLine = window.createNewLine();
        p.parentNode.insertBefore(newLine, p.nextSibling);
        
        const checkbox = p.querySelector('.task-checkbox');
        checkbox.addEventListener('click', function() {
            this.classList.toggle('checked');
            const text = this.nextElementSibling;
            text.classList.toggle('checked');
        });
        
        range.collapse(false);
        window.editorArea.focus();
    }
}

function insertTextAtCursor() {
    const range = getRangeAtMousePosition();
    if (range) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        range.insertNode(p);
        
        const newLine = window.createNewLine();
        p.parentNode.insertBefore(newLine, p.nextSibling);
        
        range.collapse(false);
        window.editorArea.focus();
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
            window.modal.openModal(btn, wrapper);
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
        
        const newLine = window.createNewLine();
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
            window.modal.openModal(btn, wrapper);
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
        
        const newLine = window.createNewLine();
        columns.parentNode.insertBefore(newLine, columns.nextSibling);
        
        range.collapse(false);
    }
}

function insertTableAtCursor(rows, cols) {
    const range = getRangeAtMousePosition();
    if (range) {
        const p = document.createElement('p');
        let tableHtml = '<table class="table-container">';
        
        for (let r = 0; r < rows; r++) {
            tableHtml += '<tr>';
            for (let c = 0; c < cols; c++) {
                tableHtml += '<td contenteditable="true"></td>';
            }
            tableHtml += '</tr>';
        }
        
        tableHtml += '</table>';
        p.innerHTML = tableHtml;
        range.insertNode(p);
        
        const newLine = window.createNewLine();
        p.parentNode.insertBefore(newLine, p.nextSibling);
        
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
    panel.className = 'table-selector-panel';
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
});

window.insertMenu = {
    showInsertMenuAtCursor,
    hideAllInsertMenus,
    getRangeAtMousePosition,
    createNewLine,
    insertHeadingAtCursor,
    insertListAtCursor,
    insertTaskAtCursor,
    insertTextAtCursor,
    insertImageAtCursor,
    insertHighlightAtCursor,
    insertCardAtCursor,
    insertButtonAtCursor,
    insertColumnsAtCursor,
    insertTableAtCursor
};