class DocumentManager {
    constructor() {
        this.docsDirectoryHandle = null;
    }

    async initDirectory() {
        // 纯localStorage方案，不需要文件系统授权
        return true;
    }

    async requestDirectory() {
        // 不需要选择目录
        return true;
    }

    async getDocsList() {
        let docs = [];
        
        // 从localStorage获取文档列表
        const localStorageDocs = localStorage.getItem('docs');
        if (localStorageDocs) {
            try {
                docs = JSON.parse(localStorageDocs);
            } catch (e) {
                console.warn('从localStorage获取文档列表失败:', e);
            }
        }

        docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return docs;
    }

    async readDoc(docId) {
        const localStorageDocs = localStorage.getItem('docs');
        if (localStorageDocs) {
            try {
                const docs = JSON.parse(localStorageDocs);
                return docs.find(d => d.id === docId);
            } catch (e) {
                console.warn('从localStorage读取文档失败:', e);
            }
        }

        return null;
    }

    async saveDoc(doc) {
        try {
            const localStorageDocs = localStorage.getItem('docs');
            let docs = localStorageDocs ? JSON.parse(localStorageDocs) : [];
            const existingIndex = docs.findIndex(d => d.id === doc.id);
            
            if (existingIndex >= 0) {
                docs[existingIndex] = doc;
            } else {
                docs.push(doc);
            }

            docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            localStorage.setItem('docs', JSON.stringify(docs));
            return true;
        } catch (e) {
            console.warn('保存到localStorage失败:', e);
            return false;
        }
    }

    async deleteDoc(docId) {
        try {
            const localStorageDocs = localStorage.getItem('docs');
            if (localStorageDocs) {
                let docs = JSON.parse(localStorageDocs);
                docs = docs.filter(d => d.id !== docId);
                localStorage.setItem('docs', JSON.stringify(docs));
                return true;
            }
        } catch (e) {
            console.warn('从localStorage删除文档失败:', e);
        }
        return false;
    }

    async listDocs() {
        return await this.getDocsList();
    }
    
    // 导入文档（用于导入save文件夹中的文件）
    async importDocFromFile(file) {
        try {
            const content = await file.text();
            const doc = JSON.parse(content);
            await this.saveDoc(doc);
            return doc;
        } catch (e) {
            console.warn('导入文档失败:', e);
            return null;
        }
    }
}

const docManager = new DocumentManager();
window.docManager = docManager;