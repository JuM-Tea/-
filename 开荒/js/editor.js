const editorArea = document.getElementById('editorArea');
const floatingAddBtn = document.getElementById('floatingAddBtn');

let hideTimer = null;
let currentLineTop = -1;
let lastCursorPosition = null;

window.editorArea = editorArea;
window.setLastCursorPosition = function(pos) {
    lastCursorPosition = pos;
};
window.getLastCursorPosition = function() {
    return lastCursorPosition;
};

function createNewLine(withPlaceholder = false) {
    const div = document.createElement('div');
    div.className = 'empty-line';
    div.contentEditable = 'true';
    if (withPlaceholder) {
        div.setAttribute('data-placeholder', '输入"/"快速插入内容');
    }
    return div;
}

window.createNewLine = createNewLine;

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
                
                if (closestElement.classList.contains('column-cell')) {
                    const containerRect = closestElement.getBoundingClientRect();
                    floatingAddBtn.style.left = (containerRect.left - 32) + 'px';
                } else {
                    floatingAddBtn.style.left = (editorRect.left - 32) + 'px';
                }
                
                floatingAddBtn.dataset.targetId = closestElement.dataset.id || closestElement.id || 'line-' + Date.now();
                if (!closestElement.dataset.id) {
                    closestElement.dataset.id = floatingAddBtn.dataset.targetId;
                }
            }
            
            floatingAddBtn.classList.add('active');
            lastCursorPosition = { left: e.clientX, top: e.clientY };
            window.setLastCursorPosition(lastCursorPosition);
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
        e.preventDefault();
        
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
         !target.closest('.card'))) {
        
        const selection = window.getSelection();
        const range = document.createRange();
        range.collapse(true);
        
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
    if (window.insertMenu) {
        window.insertMenu.showInsertMenuAtCursor();
    }
});

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

window.editor = {
    createNewLine,
    getRangeAtMousePosition,
    lastCursorPosition: () => lastCursorPosition,
    editorArea
};