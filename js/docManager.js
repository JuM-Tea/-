class DocumentManager {
    constructor() {
        this.saveFolderPath = './save/';
    }

    async initDirectory() {
        return true;
    }

    async requestDirectory() {
        return true;
    }

    async getDocsList() {
        let docs = [];
        
        // 先从localStorage获取文档
        const localStorageDocs = localStorage.getItem('docs');
        if (localStorageDocs) {
            try {
                docs = JSON.parse(localStorageDocs);
            } catch (e) {
                console.warn('从localStorage获取文档列表失败:', e);
            }
        }

        // 如果localStorage没有文档，尝试从服务器加载save文件夹中的文档
        if (docs.length === 0) {
            try {
                docs = await this.loadDocsFromServer();
                if (docs.length > 0) {
                    localStorage.setItem('docs', JSON.stringify(docs));
                }
            } catch (e) {
                console.warn('从服务器加载文档失败:', e);
            }
        }

        docs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return docs;
    }

    async loadDocsFromServer() {
        const docs = [];
        
        try {
            const indexResponse = await fetch(this.saveFolderPath + 'index.json');
            if (!indexResponse.ok) {
                return docs;
            }
            
            const fileNames = await indexResponse.json();
            
            for (const fileName of fileNames) {
                if (fileName.endsWith('.json')) {
                    try {
                        const fileResponse = await fetch(this.saveFolderPath + fileName);
                        if (fileResponse.ok) {
                            const content = await fileResponse.text();
                            const docData = JSON.parse(content);
                            docs.push(docData);
                        }
                    } catch (e) {
                        console.warn('加载文档文件失败:', fileName, e);
                    }
                }
            }
        } catch (e) {
            console.warn('加载save目录失败:', e);
        }
        
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