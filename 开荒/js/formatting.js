document.addEventListener('DOMContentLoaded', function() {
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
    const floatCommentBtn = document.getElementById('floatCommentBtn');

    const linkInputPanel = document.getElementById('linkInputPanel');
    const linkInput = document.getElementById('linkInput');
    const linkConfirmBtn = document.getElementById('linkConfirmBtn');
    const linkCancelBtn = document.getElementById('linkCancelBtn');

    const fileInput = document.getElementById('fileInput');

    let currentFontColor = '#333', currentBgColor = '#fff7e6';

    function applyFormat(format) {
        document.execCommand(format, false);
        if (window.editorArea) window.editorArea.focus();
    }

    function applyHeading(level) {
        document.execCommand('formatBlock', false, `<${level}>`);
        headingSelect.value = level;
        if (window.editorArea) window.editorArea.focus();
    }

    function applyColor(color) {
        currentFontColor = color;
        colorPreview.style.color = color;
        document.execCommand('foreColor', false, color);
        if (window.editorArea) window.editorArea.focus();
    }

    function applyBgColor(color) {
        currentBgColor = color;
        document.execCommand('hiliteColor', false, color);
        if (window.editorArea) window.editorArea.focus();
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
        if (e.target.classList.contains('color-option')) {
            const color = e.target.dataset.color;
            currentFontColor = color;
            floatColorPreview.style.color = color;
            applyColor(color);
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

    if (window.editorArea) {
        window.editorArea.addEventListener('mouseup', function() {
            const selection = window.getSelection();
            if (selection.toString().trim()) {
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                floatingToolbar.style.left = (rect.left + rect.width / 2 - floatingToolbar.offsetWidth / 2) + 'px';
                floatingToolbar.style.top = (rect.top - floatingToolbar.offsetHeight - 8) + 'px';
                floatingToolbar.classList.add('active');
            } else {
                floatingToolbar.classList.remove('active');
            }
        });
    }

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

    window.formatting = {
        applyFormat,
        applyHeading,
        applyColor,
        applyBgColor,
        resetColor,
        showLinkPanel,
        hideLinkPanel
    };
});