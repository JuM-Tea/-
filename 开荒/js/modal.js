let currentBtn = null, currentBtnWrapper = null;

const modal = document.getElementById('editModal');
const btnNameInput = document.getElementById('btnNameInput');
const btnLinkInput = document.getElementById('btnLinkInput');
const btnColorPicker = document.getElementById('btnColorPicker');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');
const deleteBtn = document.getElementById('deleteBtn');

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
    currentBtn.className = `inline-btn ${window.colorMap[newColor] || 'inline-btn-blue'}`;
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

document.addEventListener('click', function(e) {
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

window.modal = {
    openModal,
    closeModal,
    updateBtn,
    deleteCurrentBtn,
    addNewBtn
};