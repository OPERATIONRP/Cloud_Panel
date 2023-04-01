"use strict";
class FileManager {

    constructor(options) {
        let defaults = {
            element: document.querySelector('.file-manager'),
            header: null,
            table: null,
            aside: null,
            selectedFiles: [],
            clipboardFiles: [],
            clipboardMethod: null,
            directory: null,
            directoryToken: null,
            contextMenu: null,
            sortBy: null,
            sortOrder: null,
            path: ''
        };
        this.options = Object.assign(defaults, options);
        this.element.innerHTML = this._template();
        this.header = this.element.querySelector('.file-manager-header');
        this.table = this.element.querySelector('.file-manager-table');
        this.aside = this.element.querySelector('.file-manager-directories');
        this.fetchFileList(this.directory, this.directoryToken, this.sortOrder, this.sortBy);
    }

    _template() {
        return `
        <div class="file-manager-header">
            <div class="path">
                <div class="wrapper"></div>
                <span class="loader hidden"></span>
            </div>
            <div class="actions">
                <label for="mobile-toggle"><i class="fa-solid fa-bars fa-xs"></i></label>
                <input id="mobile-toggle" type="checkbox">
                <nav class="wrapper">
                    <a href="#" class="refresh other"><i class="fa-solid fa-arrows-rotate fa-xs"></i>Refresh</a>
                    <a href="#" class="single file" data-action="edit"><i class="fa-solid fa-pen fa-xs"></i>Edit</a>
                    <a href="#" class="single" data-action="rename"><i class="fa-solid fa-pencil fa-xs"></i>Rename</a>
                    <a href="#" class="multiple" data-action="delete"><i class="fa-solid fa-trash fa-xs"></i>Delete</a>
                    <a href="#" class="multiple" data-action="copy"><i class="fa-solid fa-copy fa-xs"></i>Copy</a>
                    <a href="#" class="multiple" data-action="cut"><i class="fa-solid fa-scissors fa-xs"></i>Cut</a>
                    <a href="#" class="multiple" data-action="permissions"><i class="fa-solid fa-lock fa-xs"></i>Permissions</a>
                    <a href="#" class="multiple" data-action="compress"><i class="fa-solid fa-down-left-and-up-right-to-center fa-xs"></i>Compress</a>
                    <a href="#" class="single" data-action="extract"><i class="fa-solid fa-up-right-and-down-left-from-center fa-xs"></i>Extract</a>
                    <a href="#" class="single" data-action="download"><i class="fa-solid fa-download fa-xs"></i>Download</a>
                    <a href="#" class="paste"><i class="fa-solid fa-clipboard fa-xs"></i>Paste</a>
                    <a href="#" class="create-file other"><i class="fa-solid fa-plus fa-xs"></i>File</a>
                    <a href="#" class="create-directory other"><i class="fa-solid fa-plus fa-xs"></i>Directory</a>
                    <a href="#" class="upload last other"><i class="fa-solid fa-upload fa-xs"></i>Upload</a>
                    <form action="" class="search">
                        <input type="text" name="search" placeholder="Search..." title="CTRL + F">
                        <i class="fa-solid fa-magnifying-glass fa-xs"></i>
                    </form>
                </nav>
            </div>
        </div>
        <div class="file-manager-main">
            <aside class="file-manager-directories closed">
                <a href="#" class="open-panel"><i class="fa-regular fa-rectangle-list"></i></a>
                <h2>Folders<a href="#" class="close-panel"><i class="fa-solid fa-xmark fa-sm"></i></a></h2>
            </aside>
            <table class="file-manager-table">
                <thead>
                    <tr>
                        <td><input type="checkbox" class="file-manager-select-all"></td>
                        <td class="table-column${this.sortBy == null || this.sortBy == 'name' ? ' selected-column' : ''}"><a data-name="name" href="#">Name<i class="fa-solid fa-arrow-${this.sortBy == 'name' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                        <td class="table-column${this.sortBy == 'size' ? ' selected-column' : ''}"><a data-name="size" href="#">Size<i class="fa-solid fa-arrow-${this.sortBy == 'size' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                        <td class="table-column${this.sortBy == 'modified' ? ' selected-column' : ''}"><a data-name="modified" href="#">Modified<i class="fa-solid fa-arrow-${this.sortBy == 'modified' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                        <td class="table-column${this.sortBy == 'type' ? ' selected-column' : ''}"><a data-name="type" href="#">Type<i class="fa-solid fa-arrow-${this.sortBy == 'type' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                        <td class="table-column${this.sortBy == 'perms' ? ' selected-column' : ''}"><a data-name="perms" href="#">Perms<i class="fa-solid fa-arrow-${this.sortBy == 'perms' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                        <td class="table-column${this.sortBy == 'owner' ? ' selected-column' : ''}"><a data-name="owner" href="#">Owner<i class="fa-solid fa-arrow-${this.sortBy == 'owner' ? this.sortOrder.replace('ASC', 'up').replace('DESC', 'down') : 'up'}-long fa-xs"></i></a></td>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        `;
    }

    fetchFileList(directory = null, directoryToken = null, sortOrder = null, sortBy = null, callback = null) {
        let url = 'listing.php';
        if (directory || directoryToken || sortOrder || sortBy) {
            url += '?';
            url += directory && directoryToken ? 'directory=' + directory + '&token=' + directoryToken : '';
            url += sortOrder && sortBy ? (directory && directoryToken ? '&' : '') + 'sort_order=' + sortOrder + '&sort_by=' + sortBy : '';
        }
        this.showLoaderIcon();
        fetch(this.path + url, { cache: 'no-store' }).then(response => response.json()).then(obj => {
            if (obj.status == 'success') {
                this.directory = obj.directory;
                this.directoryToken = obj.token;
                if (!obj.isIntialDirectory && !this.header.querySelector('.path .wrapper a[data-directory="' + this.directory + '"]')) {
                    this.header.querySelectorAll('.path .wrapper a').forEach(element => element.classList.remove('selected'));
                    this.header.querySelector('.path .wrapper').insertAdjacentHTML('beforeend', `
                        <span class="sep alt">/</span>
                        <a href="#" class="selected alt" data-directory="${this.directory}" data-token="${this.directoryToken}">${obj.directoryRaw.split('/').filter(n => n !== '').pop()}</a>
                    `);
                } else if (obj.isIntialDirectory) {
                    this.header.querySelector('.path .wrapper').innerHTML = '<a href="#" data-directory="' + this.directory + '" data-token="' + this.token + '"><i class="fa-solid fa-folder"></i></a>';
                } else {
                    this.header.querySelector('.path .wrapper a:last-child').classList.add('selected');
                }
                this.clearTable();
                this.addFilesToTable(obj.data);
                if (callback) callback(obj);
                this._eventHandlers();
            } else {
                this.openErrorModal(obj.data);
            }
            this.hideLoaderIcon();
        });
    }

    fetchDirectoryList() {
        this.showLoaderIcon();
        fetch(this.path + 'directories.php', { cache: 'no-store' }).then(response => response.json()).then(obj => {
            if (obj.status == 'success') {
                if (this.aside.querySelector('ul')) {
                    this.aside.querySelector('ul').remove();
                }
                this.aside.insertAdjacentHTML('beforeend', this.createDirectoryList(obj.data));
                this.aside.querySelectorAll('ul a').forEach(element => element.onclick = event => {
                    event.preventDefault();
                    if (element.parentElement.querySelector('ul').classList.contains('expanded')) {
                        element.parentElement.querySelector('ul').classList.remove('expanded');
                        if (element.querySelector('.angle')) {
                            element.querySelector('.angle').classList.remove('fa-angle-down');
                            element.querySelector('.angle').classList.add('fa-angle-right');
                        }
                    } else {
                        element.parentElement.querySelector('ul').classList.add('expanded');
                        if (element.querySelector('.angle')) {
                            element.querySelector('.angle').classList.remove('fa-angle-right');
                            element.querySelector('.angle').classList.add('fa-angle-down');
                        }
                    }
                    if (!event.target.classList.contains('angle')) {
                        this.fetchFileList(element.dataset.directory, element.dataset.token, this.sortOrder, this.sortBy, () => {
                            this.header.querySelector('.path .wrapper').innerHTML = '<a href="#"><i class="fa-solid fa-folder"></i></a>';
                            let parentElement = element.closest('.directory');
                            let html = '';
                            let i = 0;
                            while (parentElement) {
                                html = `
                                <span class="sep alt">/</span>
                                <a href="#" class="${i == 0 ? 'selected' : ''} alt" data-directory="${parentElement.querySelector('a').dataset.directory}" data-token="${parentElement.querySelector('a').dataset.token}">${parentElement.querySelector('a').innerText}</a>
                                ` + html;
                                i++;
                                parentElement = parentElement.parentElement.closest('.directory');
                            }
                            this.header.querySelector('.path .wrapper').insertAdjacentHTML('beforeend', html);
                        });
                    }
                });
            } else {
                this.openErrorModal(obj.data);
            }
            this.hideLoaderIcon();
        });
    }

    createDirectoryList(data) {
        let html = '<ul>';
        for (let i = 0; i < data.length; i++) {
            html += `
                <li class="directory">
                    <a href="#" data-directory="${data[i].path}" data-token="${data[i].token}"><i class="${data[i].children.length ? 'fa-solid fa-angle-right fa-sm angle' : ''}"></i><i class="fa-regular fa-folder"></i>${data[i].name}</a>
                    ${this.createDirectoryList(data[i].children)}
                </li>
            `;
        }
        html += '</ul>';
        return html;
    }

    showLoaderIcon() {
        this.header.querySelector('.loader').classList.remove('hidden');
    }

    hideLoaderIcon() {
        this.header.querySelector('.loader').classList.add('hidden');
    }

    updateFileInTable(element, data) {
        element.className = `file${data.editable ? ' editable' : ''}${data.size == 'Folder' ? ' dir' : ''}${data.media  ? ' ' + data.media : ''}`;
        element.innerHTML = `
            <td><input type="checkbox" class="file-manager-select"></td>
            <td class="name">${data.icon}<a class="view-file" data-token="${data.token}" data-file="${data.name}" data-encoded-file="${data.encodedname}" href="#">${data.basename}</a></td>
            <td class="size">${data.size}</td>
            <td class="date">${data.modified}</td>
            <td class="type">${data.type}</td>
            <td class="perms">${data.perms}</td>
            <td class="owner">${data.owner}</td>
        `;
    }

    addFileToTable(data) {
        if (data.back) {
            this.table.querySelector('tbody').insertAdjacentHTML('beforeend', `
                <tr class="dir back">
                    <td></td>
                    <td colspan="10" class="name"><i class="fa-solid fa-folder"></i><a class="view-file" data-token="${data.token}" data-file="${data.name}" data-encoded-file="${data.encodedname}" href="#">${data.basename}</a></td>
                </tr>
            `);
        } else {
            this.table.querySelector('tbody').insertAdjacentHTML('beforeend', `
                <tr class="file${data.editable ? ' editable' : ''}${data.size == 'Folder' ? ' dir' : ''}${data.media  ? ' ' + data.media : ''}">
                    <td><input type="checkbox" class="file-manager-select"></td>
                    <td class="name">${data.icon}<a class="view-file" data-token="${data.token}" data-file="${data.name}" data-encoded-file="${data.encodedname}" href="#">${data.basename}</a></td>
                    <td class="size">${data.size}</td>
                    <td class="date">${data.modified}</td>
                    <td class="type">${data.type}</td>
                    <td class="perms">${data.perms}</td>
                    <td class="owner">${data.owner}</td>
                </tr>
            `);
        }
        if (this.table.querySelector('tbody .empty')) {
            this.table.querySelector('tbody .empty').remove();
        }
    }

    addFilesToTable(data) {
        for (let i = 0; i < data.length; i++) {
            this.addFileToTable(data[i]);
        }
        if (!this.table.querySelector('tbody .file') && !this.table.querySelector('tbody .empty')) {
            this.table.querySelector('tbody').insertAdjacentHTML('beforeend', `
                <tr class="empty">
                    <td></td>
                    <td colspan="10">This folder is empty.</td>
                </tr>
            `);
        }
    }

    clearTable() {
        this.uncheckAllItems();
        this.table.querySelector('tbody').innerHTML = '';
    }

    uncheckAllItems() { 
        this.table.querySelector('.file-manager-select-all').checked = false;
        this.table.querySelectorAll('.file-manager-select').forEach(element => {
            element.checked = false;
            if (element.onchange) element.onchange();
        });     
        return this.table.querySelectorAll('.file-manager-select').length;
    }

    checkAllItems() {
        this.table.querySelector('.file-manager-select-all').checked = true;
        this.table.querySelectorAll('.file-manager-select').forEach(element => {
            element.checked = true;
            if (element.onchange) element.onchange();
        });  
        return this.table.querySelectorAll('.file-manager-select').length;      
    }

    modal(options) {
        let element;
        if (document.querySelector(options.element)) {
            element = document.querySelector(options.element);
        } else if (options.modalTemplate) {
            document.body.insertAdjacentHTML('beforeend', options.modalTemplate());
            element = document.body.lastElementChild;
        }
        options.element = element;
        options.open = obj => {
            element.style.display = 'flex';
            element.getBoundingClientRect();
            element.classList.add('open');
            if (options.onOpen) options.onOpen(obj);
        };
        options.close = obj => {
            if (options.onClose) {
                let returnCloseValue = options.onClose(obj);
                if (returnCloseValue !== false) {
                    element.style.display = 'none';
                    element.classList.remove('open');
                    element.remove();
                }
            } else {
                element.style.display = 'none';
                element.classList.remove('open');
                element.remove();
            }
        };
        if (options.state == 'close') {
            options.close({ source: element, button: null });
        } else if (options.state == 'open') {
            options.open({ source: element }); 
        }
        element.querySelectorAll('.modal-close').forEach(e => {
            e.onclick = event => {
                event.preventDefault();
                options.close({ source: element, button: e });
            };
        });
        return options;
    }

    openErrorModal(text) {
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Error<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <p class="mar-3">${Array.isArray(text) ? text.join('<br>') : text}</p>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Close</a>
                        </div>
                    </div>
                </div>
                `;
            }
        });
    }

    openUploadModal() {
        let self = this;
        return this.modal({
            state: 'open',
            uploadForm: null,
            filesInput: null,
            modalTemplate: function () {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Upload File(s)<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form class="file-manager-upload-form" action="upload.php?directory=${self.directory}&token=${self.directoryToken}" method="post" enctype="multipart/form-data">
                                <label for="files"><i class="fa-solid fa-folder-open fa-2x"></i>Select file(s) ...</label>
                                <input id="files" type="file" name="files[]" multiple>
                                <div class="progress"></div>
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Upload</a>
                            <a href="#" class="btn red modal-close mar-right-1 cancel">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onOpen: function (event) {
                this.uploadForm = event.source.querySelector('form');
                this.filesInput = this.uploadForm.querySelector('#files');
                this.filesInput.onchange = () => {
                    this.uploadForm.querySelector('label').innerHTML = '';
                    for (let i = 0; i < this.filesInput.files.length; i++) {
                        this.uploadForm.querySelector('label').innerHTML += '<span><i class="fa-solid fa-file"></i>' + this.filesInput.files[i].name + '</span>';
                    }
                }
            },
            onClose: function (event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    if (this.filesInput.files.length) {
                        let formData = new FormData(this.uploadForm)
                        let req = new XMLHttpRequest;
                        req.open('POST', this.uploadForm.action);
                        req.upload.addEventListener('progress', ev => {
                            event.button.classList.add('disabled');
                            event.button.innerHTML = 'Uploading... (' + (ev.loaded / ev.total * 100).toFixed(2) + '%)';
                            this.uploadForm.querySelector('.progress').style.background = 'linear-gradient(to right, #25b350, #25b350 ' + Math.round(ev.loaded / ev.total * 100) + '%, #e6e8ec ' + Math.round(ev.loaded / ev.total * 100) + '%)';
                        });
                        req.onreadystatechange = () => {
                            if (req.readyState == 4 && req.status == 200) { 
                                let obj = JSON.parse(req.responseText);
                                if (obj.status == 'error') {
                                    this.uploadForm.querySelector('.msg').innerHTML = obj.data.join('<br>');
                                } else {
                                    this.uploadForm.querySelector('.msg').innerHTML = 'Upload Complete!';
                                    event.source.querySelector('.cancel').innerHTML = 'Close';
                                    self.addFilesToTable(obj.data);
                                    self._eventHandlers();
                                }
                            }
                        };
                        req.send(formData);
                    } else {
                        this.uploadForm.querySelector('.msg').innerHTML = 'Please select a file!';
                    }
                    return false;
                }
            }
        });
    }

    openCreateModal(type = 'file') {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function () {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Create ${type == 'file' ? 'File' : 'Directory'}<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form>
                                <label for="filename">${type == 'file' ? 'File' : 'Directory'} Name</label>
                                <input id="filename" name="filename" type="text" placeholder="${type == 'file' ? 'File' : 'Directory'} Name">
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Save</a>
                            <a href="#" class="btn red modal-close mar-right-1">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onClose: function (event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    fetch(self.path + 'create.php?type=' + type + '&directory=' + self.directory + '&token=' + self.directoryToken, { 
                        method: 'POST', 
                        body: new FormData(event.source.querySelector('form')), 
                        cache: 'no-store' 
                    }).then(response => response.json()).then(obj => {
                        if (obj.status == 'error') {
                            event.source.querySelector('.msg').innerHTML = obj.data.join('<br>');
                        } else {
                            self.addFileToTable(obj.data);
                            self._eventHandlers();
                            this.close();
                        }
                    });
                    return false;
                }
            }
        });
    }

    fetchViewFile(element) {
        this.showLoaderIcon();    
        let tr = element.closest('tr');
        let url = 'view-file.php?file=' + element.dataset.encodedFile + '&token=' + element.dataset.token;
        if (tr.classList.contains('image')) {
            const img = new Image();
            img.onload = () => {
                this.hideLoaderIcon();
                this.openViewFileModal('image', element, img, 'large');
            };
            img.src = url;
        } else if (tr.classList.contains('video')) {
            this.hideLoaderIcon();
            this.openViewFileModal('video', element, url, 'large');
        } else if (tr.classList.contains('audio')) {
            this.hideLoaderIcon();
            this.openViewFileModal('audio', element, url);
        }
    }

    openViewFileModal(type, element, data, size = '') {
        let content = '';
        let meta = '';
        if (type == 'image') {
            content = '<img src="' + data.src + '" alt="' + element.dataset.file + '" style="max-width:100%;max-height:100%;object-fit:contain;">';
            meta = '<i>|</i> ' + data.width + 'x' + data.height;
        } else if (type == 'video') {
            content = '<video src="' + data + '" width="852" height="480" controls autoplay style="max-width:100%;max-height:100%;object-fit:contain;"></video>';
        } else if (type == 'audio') {
            content = '<audio src="' + data + '" controls autoplay style="max-width:100%;max-height:100%;object-fit:contain;"></audio>';
        }
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal ${size}">
                    <div class="content">
                        <h3 class="heading">
                            <span class="title">
                                ${element.innerText}
                                <span>${element.dataset.file.split('.').pop().toUpperCase()} ${meta} <i>|</i> ${element.closest('tr').querySelector('.size').innerHTML}</span>
                            </span>
                            <span class="modal-close">&times;</span>
                        </h3>
                        <div class="body pad-3" style="display:flex;justify-content:center;">${content}</div>
                        <div class="footer pad-5">
                            <a href="download-file.php?file=${element.dataset.encodedFile}&token=${element.dataset.token}" class="btn mar-right-1">Download</a>
                            <a href="#" class="btn red modal-close mar-right-1">Close</a>
                        </div>
                    </div>
                </div>
                `;
            }
        });
    }

    fetchEditFile(element) {
        this.showLoaderIcon();                    
        fetch(this.path + 'edit-file.php?file=' + element.dataset.encodedFile + '&token=' + element.dataset.token, { cache: 'no-store' }).then(response => response.json()).then(obj => {
            this.hideLoaderIcon();
            if (obj.status == 'error') {
                this.openErrorModal(obj.data);
            } else {
                this.openEditFileModal(element, obj.data);
            }
        }); 
    }

    openEditFileModal(element, data) {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal large">
                    <div class="content">
                        <h3 class="heading">Edit File<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form action="" class="file-manager-editor" method="post">
                                <textarea name="content" placeholder="Enter your content..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">${data}</textarea>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Save</a>
                            <a href="#" class="btn red modal-close mar-right-1">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onOpen: function(event) {
                let content = event.source.querySelector('form textarea');
                content.onkeydown = event => {
                    if (event.keyCode === 9) {
                        let start = content.selectionStart, end = content.selectionEnd, target = event.target, value = target.value;
                        target.value = value.substring(0, start) + "\t" + value.substring(end);
                        content.selectionStart = content.selectionEnd = start + 1;
                        event.preventDefault();
                    }
                };
            },
            onClose: function(event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    fetch(self.path + 'edit-file.php?file=' + element.dataset.encodedFile + '&token=' + element.dataset.token, { 
                        method: 'POST', 
                        body: new FormData(event.source.querySelector('form')), 
                        cache: 'no-store' 
                    }).then(response => response.json()).then(obj => {
                        if (obj.status == 'error') {
                            self.openErrorModal(obj.data);
                        } else if (obj.data) {
                            self.updateFileInTable(element.closest('tr'), obj.data);
                            self.uncheckAllItems();
                            self._eventHandlers();
                        }
                    });
                }
            }
        });
    }

    openRenameModal(element) {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Rename File<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form>
                                <label for="filename">File Name</label>
                                <input id="filename" name="filename" type="text" value="${element.innerHTML}" placeholder="File Name">
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Save</a>
                            <a href="#" class="btn red modal-close mar-right-1">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onClose: function(event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    fetch(self.path + 'rename.php?file=' + element.dataset.encodedFile + '&token=' + element.dataset.token, { 
                        method: 'POST', 
                        body: new FormData(event.source.querySelector('form')), 
                        cache: 'no-store' 
                    }).then(response => response.json()).then(obj => {
                        if (obj.status == 'error') {
                            event.source.querySelector('.msg').innerHTML = obj.data.join('<br>');
                        } else {
                            self.updateFileInTable(element.closest('tr'), obj.data);
                            self.uncheckAllItems();
                            self._eventHandlers();
                            this.close();
                        }
                    });
                    return false;
                }
            }
        }); 
    }

    openPermissionsModal() {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Change Permissions<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form>
                                <table class="permissions">
                                    <thead>
                                        <tr>
                                            <td>Mode</td>
                                            <td>User</td>
                                            <td>Group</td>
                                            <td>World</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Read</td>
                                            <td><input class="a read" type="checkbox" data-value="4"></td>
                                            <td><input class="b read" type="checkbox" data-value="4"></td>
                                            <td><input class="c read" type="checkbox" data-value="4"></td>
                                        </tr>
                                        <tr>
                                            <td>Write</td>
                                            <td><input class="a write" type="checkbox" data-value="2"></td>
                                            <td><input class="b write" type="checkbox" data-value="2"></td>
                                            <td><input class="c write" type="checkbox" data-value="2"></td>
                                        </tr>
                                        <tr>
                                            <td>Execute</td>
                                            <td><input class="a execute" type="checkbox" data-value="1"></td>
                                            <td><input class="b execute" type="checkbox" data-value="1"></td>
                                            <td><input class="c execute" type="checkbox" data-value="1"></td>
                                        </tr>
                                        <tr>
                                            <td>Permission</td>
                                            <td><input class="p-a" data-mode="read" type="number" name="p1" value="0"></td>
                                            <td><input class="p-b" data-mode="write" type="number" name="p2" value="0"></td>
                                            <td><input class="p-c" data-mode="execute" type="number" name="p3" value="0"></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <label for="recursive" style="padding-top:15px">
                                    <input id="recursive" type="checkbox"> Recursive
                                </label>
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Save</a>
                            <a href="#" class="btn red modal-close mar-right-1">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onOpen: function(event) {
                ['a', 'b', 'c'].forEach((i, index) => {
                    event.source.querySelectorAll('.permissions .' + i).forEach(element => element.onchange = () => {
                        let n = 0;
                        event.source.querySelectorAll('.permissions .' + i + ':checked').forEach(element => n += parseInt(element.dataset.value));
                        event.source.querySelector('.permissions .p-' + i).value = n;
                    });
                    event.source.querySelector('.permissions .p-' + i).onkeyup = event.source.querySelector('.permissions .p-' + i).onchange = () => {
                        event.source.querySelectorAll('.' + i).forEach(element => element.checked = false);
                        let v = parseInt(event.source.querySelector('.p-' + i).value);
                        if (v == 1 || v == 3 || v == 5 || v == 7) {
                            event.source.querySelector('.permissions .' + i + '.execute').checked = true;
                        }
                        if (v == 2 || v == 3 || v == 6 || v == 7) {
                            event.source.querySelector('.permissions .' + i + '.write').checked = true;
                        }
                        if (v == 4 || v == 5 || v == 6 || v == 7) {
                            event.source.querySelector('.permissions .' + i + '.read').checked = true;
                        }
                    };
                    if (self.selectedFiles.length) {
                        event.source.querySelector('.permissions .p-' + i).value = self.selectedFiles[0].querySelector('.perms').innerText[index+1];
                        event.source.querySelector('.permissions .p-' + i).onchange();
                    }
                });
            },
            onClose: function(event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    let permission = event.source.querySelector('.permissions .p-a').value.toString() + event.source.querySelector('.permissions .p-b').value.toString() + event.source.querySelector('.permissions .p-c').value.toString();
                    let recursive = event.source.querySelector('#recursive').checked ? 1 : 0;
                    self.showLoaderIcon();
                    fetch(self.path + 'permission.php?permission=' + permission + '&recursive=' + recursive, { 
                        method: 'POST', 
                        body: JSON.stringify(self.clipboardFiles), 
                        cache: 'no-store',
                        headers: { 'Content-Type': 'application/json' }
                    }).then(response => response.json()).then(obj => {
                        if (obj.status == 'error') {
                            event.source.querySelector('.msg').innerHTML = obj.data.join('<br>');
                        } else {
                            self.selectedFiles.forEach(element => element.querySelector('.perms').innerText = '0' + permission);
                            this.close();
                        }
                        self.hideLoaderIcon();
                    });
                    return false;
                }
            }
        }); 
    }

    openCompressModal() {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Compress<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form>
                                <label for="filename">File Name</label>
                                <div class="group">
                                    <input id="filename" name="filename" type="text" placeholder="File Name">
                                    <select id="type">
                                        <option value="zip">.zip</option>
                                        <option value="tar">.tar</option>
                                        <option value="gz">.tar.gz</option>
                                        <option value="bz2">.tar.bz2</option>
                                    </select>
                                </div>
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Save</a>
                            <a href="#" class="btn red modal-close mar-right-1">Cancel</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onClose: function(event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    self.fetchCompress(self.clipboardFiles, event.source.querySelector('#filename').value, event.source.querySelector('#type').value, obj => {
                        if (obj.status == 'error') {
                            event.source.querySelector('.msg').innerHTML = obj.data.join('<br>');
                        } else {
                            self.addFileToTable(obj.data);
                            self._eventHandlers();
                            this.close();
                        }
                    });
                    return false;
                }
            }
        }); 
    }

    fetchCompress(items, filename, type, callback = null) {
        fetch(this.path + 'compress.php?directory=' + this.directory + '&token=' + this.directoryToken + '&type=' + type, { 
            method: 'POST', 
            body: JSON.stringify({ filename: filename, items: items }), 
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(obj => {
            if (callback) {
                callback(obj)
            } else if (obj.status == 'error') {
                this.openErrorModal(obj.data);
            }
        });
    }

    openExtractModal(element) {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function() {
                return `
                <div class="modal">
                    <div class="content">
                        <h3 class="heading">Extract<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <p class="pad-3">Are you sure you want to extract <strong>${element.innerHTML}</strong>? If any files conflict, they'll be overwritten.</p>
                            <div class="msg"></div>
                        </div>
                        <div class="footer pad-5">
                            <a href="#" class="btn modal-close save mar-right-1">Yes</a>
                            <a href="#" class="btn red modal-close mar-right-1">No</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onClose: function(event) {
                if (event && event.button && event.button.classList.contains('save')) {
                    self.fetchExtract(element.dataset.encodedFile, element.dataset.token, obj => {
                        if (obj.status == 'error') {
                            event.source.querySelector('.msg').innerHTML = obj.data.join('<br>');
                            self.hideLoaderIcon();
                        } else {
                            self.fetchFileList(self.directory, self.directoryToken, self.sortOrder, self.sortBy);
                            this.close();
                        }
                    });
                    return false;
                }
            }
        }); 
    }

    fetchExtract(filename, token, callback = null) {
        this.showLoaderIcon();
        fetch(this.path + 'extract.php?file=' + filename + '&token=' + token, { 
            cache: 'no-store'
        }).then(response => response.json()).then(obj => {
            if (callback) {
                callback(obj)
            } else if (obj.status == 'error') {
                this.openErrorModal(obj.data);
                this.hideLoaderIcon();
            }
        });
    }

    fetchPaste() {
        fetch(this.path + 'paste.php?directory=' + this.directory + '&token=' + this.directoryToken + '&method=' + this.clipboardMethod, { 
            method: 'POST', 
            body: JSON.stringify(this.clipboardFiles), 
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(obj => {
            if (obj.status == 'error') {
                this.openErrorModal(obj.data);
            } else {
                this.clipboardFiles = [];
                this.clipboardMethod = null;
                this.header.querySelector('.paste').style.display = 'none';
                this.addFilesToTable(obj.data);
                this._eventHandlers();
            }
        });
    }

    deleteSelectedFiles() {
        this.showLoaderIcon();
        fetch(this.path + 'delete.php', { 
            method: 'POST', 
            body: JSON.stringify(this.clipboardFiles), 
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(obj => {
            if (obj.status == 'error') {
                this.openErrorModal(obj.data);
            } else {
                this.table.querySelectorAll('.selected').forEach(element => element.remove());
                this.uncheckAllItems();
            }
            this.hideLoaderIcon();
        });
    }

    downloadFile(basename, encodedFile, token) {
        let link = document.createElement('a');
        link.setAttribute('download', basename);
        link.href = 'download-file.php?file=' + encodedFile + '&token=' + token;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    _eventHandlers() {
        this.table.querySelector('.file-manager-select-all').onclick = () => {
            if (this.table.querySelector('.file-manager-select-all').checked) {
                this.checkAllItems();
            } else {
                this.uncheckAllItems();
            }
        };
        this.table.querySelectorAll('.file-manager-select').forEach(element => element.onchange = () => {
            if (element.checked) {
                element.parentElement.parentElement.classList.add('selected');
            } else {
                element.parentElement.parentElement.classList.remove('selected');
            }
            this.header.querySelectorAll('.actions a.single, .actions a.multiple').forEach(element => element.style.display = 'none');
            this.selectedFiles = this.table.querySelectorAll('.selected');
            if (!this.selectedFiles.length) {
                this.header.querySelectorAll('.actions a.other').forEach(element => element.style.display = 'inline-flex');
            }
            if (this.selectedFiles.length == 1) {
                let selectedFile = this.selectedFiles[0].querySelector('.view-file');
                this.header.querySelectorAll('.actions a.single').forEach(actionElement => {
                    actionElement.onclick = event => {
                        event.preventDefault();
                        if (actionElement.dataset.action == 'edit') {
                            selectedFile.click();
                        } else if (actionElement.dataset.action == 'rename') {
                            this.openRenameModal(selectedFile);
                        } else if (actionElement.dataset.action == 'extract') {
                            this.openExtractModal(selectedFile);
                        } else if (actionElement.dataset.action == 'download') {
                            this.downloadFile(selectedFile.dataset.basename, selectedFile.dataset.encodedFile, selectedFile.dataset.token);
                        }
                    };
                    if (actionElement.dataset.action == 'edit' && this.selectedFiles[0].closest('.file').classList.contains('editable')) {
                        actionElement.style.display = 'inline-flex';
                    } else if (actionElement.dataset.action == 'rename') {
                        actionElement.style.display = 'inline-flex';
                    } else if (actionElement.dataset.action == 'download' && !this.selectedFiles[0].closest('.file').classList.contains('dir')) {
                        actionElement.style.display = 'inline-flex';
                    } else if (actionElement.dataset.action == 'extract' && (selectedFile.innerHTML.toLowerCase().includes('.zip') || selectedFile.innerHTML.toLowerCase().includes('.tar') || selectedFile.innerHTML.toLowerCase().includes('.phar'))) {
                        actionElement.style.display = 'inline-flex';
                    }
                });
            } 
            if (this.selectedFiles.length) {
                this.header.querySelectorAll('.actions a.other').forEach(element => element.style.display = 'none');
                this.header.querySelectorAll('.actions a.multiple').forEach(actionElement => {
                    actionElement.onclick = event => {
                        event.preventDefault();
                        this.clipboardFiles = [...this.selectedFiles].map(item => { 
                            return { file: item.querySelector('.view-file').dataset.file, token: item.querySelector('.view-file').dataset.token };
                        });
                        if (actionElement.dataset.action == 'copy') {
                            this.clipboardMethod = 'copy';
                            this.header.querySelector('.paste').style.display = 'inline-flex';
                        } else if (actionElement.dataset.action == 'cut') {
                            this.clipboardMethod = 'cut';
                            this.header.querySelector('.paste').style.display = 'inline-flex';
                        } else {
                            this.header.querySelector('.paste').style.display = 'none';
                        }
                        if (actionElement.dataset.action == 'delete' && confirm('Are you sure you want to delete the selected file(s) and/or folder(s)?')) {
                            this.deleteSelectedFiles();
                        }
                        if (actionElement.dataset.action == 'compress') {
                            this.openCompressModal();
                        }
                        if (actionElement.dataset.action == 'permissions') {
                            this.openPermissionsModal();
                        }
                    };
                    if (actionElement.dataset.action == 'copy' && !this.selectedFiles[0].closest('.file').classList.contains('dir')) {
                        actionElement.style.display = 'inline-flex';
                    } else if (actionElement.dataset.action == 'cut' || actionElement.dataset.action == 'delete' || actionElement.dataset.action == 'compress' || actionElement.dataset.action == 'permissions') {
                        actionElement.style.display = 'inline-flex';
                    }
                });
            }
        });
        this.table.querySelectorAll('.file').forEach(element => {
            element.ondblclick = () => element.querySelector('.file-manager-select').click();
            element.oncontextmenu = event => {
                event.preventDefault();
                if (!element.querySelector('.file-manager-select').checked) {
                    element.querySelector('.file-manager-select').click();
                }
                if (!this.contextMenu) {
                    this.contextMenu = document.createElement('div');
                    this.contextMenu.className = 'file-manager-context-menu';
                    document.body.appendChild(this.contextMenu);
                }
                this.contextMenu.innerHTML = '';
                this.header.querySelectorAll('.actions .wrapper > a').forEach(element => {
                    if (!element.classList.contains('paste')) {
                        let clone = element.cloneNode(true);
                        this.contextMenu.appendChild(clone);
                        clone.onclick = event => {
                            event.preventDefault();
                            element.click();
                        };
                    }
                });
                this.contextMenu.style.display = 'flex';
                this.contextMenu.style.top = event.pageY + 'px';
                this.contextMenu.style.left = event.pageX + 'px';
            };
        });
        window.addEventListener('click', event => {
            if (this.contextMenu && !event.target.closest('.file-manager-context-menu')) {
                this.contextMenu.style.display = 'none';
            }
        });
        window.addEventListener('keydown', event => {
            if ((event.key == 'F' || event.key == 'f') && event.ctrlKey) {
                event.preventDefault();
                this.header.querySelector('.search input').focus();
            }
        });
        this.header.querySelector('.search input').onkeyup = () => {
            this.table.querySelectorAll('table tbody tr.file').forEach(element => {
                element.style.display = !element.querySelector('.view-file').innerHTML.includes(this.header.querySelector('.search input').value) ? 'none' : 'table-row';
            });
        };
        this.table.querySelectorAll('.view-file').forEach(element => {
            element.onclick = event => {
                event.preventDefault();
                let file = element.closest('tr');
                if (file && file.classList.contains('editable')) {
                    this.fetchEditFile(element);
                } else if (file && file.classList.contains('dir')) {
                    if (file.classList.contains('back')) {
                        this.header.querySelector('.path .wrapper a:last-child').remove();
                        this.header.querySelector('.path .wrapper span:last-child').remove();
                    }
                    this.directory = element.dataset.encodedFile;
                    this.directoryToken = element.dataset.token;
                    this.fetchFileList(element.dataset.encodedFile, element.dataset.token);
                } else if (file && (file.classList.contains('image') || file.classList.contains('audio') || file.classList.contains('video'))) {
                    this.fetchViewFile(element);
                } else {
                    this.downloadFile(element.dataset.basename, element.dataset.encodedFile, element.dataset.token);
                }
            };
        });
        this.header.querySelector('.upload').onclick = event => {
            event.preventDefault();
            this.openUploadModal();
        };
        this.header.querySelector('.create-file').onclick = event => {
            event.preventDefault();
            this.openCreateModal('file');
        };
        this.header.querySelector('.create-directory').onclick = event => {
            event.preventDefault();
            this.openCreateModal('directory');
        };
        this.table.querySelectorAll('thead .table-column a').forEach(element => element.onclick = event => {
            event.preventDefault();
            this.table.querySelectorAll('thead .table-column').forEach(el => el.classList.remove('selected-column'));
            this.sortBy = element.dataset.name;
            this.sortOrder = this.sortOrder == 'DESC' ? 'ASC' : 'DESC';
            element.parentElement.classList.add('selected-column');
            element.querySelector('i').classList.remove('fa-arrow-up-long', 'fa-arrow-down-long');
            element.querySelector('i').classList.add(`fa-arrow-${this.sortOrder.replace('ASC', 'up').replace('DESC', 'down')}-long`);
            this.fetchFileList(this.directory, this.directoryToken, this.sortOrder, this.sortBy);
        });
        this.header.querySelector('.paste').onclick = event => {
            event.preventDefault();
            if (this.clipboardFiles.length > 0 && this.clipboardMethod != null) {
                this.fetchPaste();
            }
        };
        this.header.querySelector('.refresh').onclick = event => {
            event.preventDefault();
            this.fetchDirectoryList();
            this.fetchFileList(this.directory, this.directoryToken, this.sortOrder, this.sortBy);
        };
        this.header.querySelectorAll('.path .wrapper a').forEach((element, i) => element.onclick = event => {
            event.preventDefault();
            for (let v = this.header.querySelectorAll('.path .wrapper a').length-1; v > i; v--) {
                this.header.querySelectorAll('.path .wrapper a')[v].remove();
                this.header.querySelectorAll('.path .wrapper span')[v-1].remove();
            }
            this.fetchFileList(element.dataset.directory, element.dataset.token, this.sortOrder, this.sortBy);
        });
        this.aside.querySelector('.open-panel').onclick = event => {
            event.preventDefault();
            if (!this.aside.querySelector('ul')) {
                this.fetchDirectoryList();
            }
            this.aside.classList.add('open');
            this.aside.classList.remove('closed');
            this.table.style.marginLeft = this.aside.getBoundingClientRect().width + 'px';
        };
        this.aside.querySelector('.close-panel').onclick = event => {
            event.preventDefault();
            this.aside.classList.add('closed');
            this.aside.classList.remove('open');
            this.table.style.marginLeft = this.aside.getBoundingClientRect().width + 'px';
        };
    }

    get element() {
        return this.options.element;
    }

    set element(value) {
        this.options.element = value;
    }

    get header() {
        return this.options.header;
    }

    set header(value) {
        this.options.header = value;
    }

    get table() {
        return this.options.table;
    }

    set table(value) {
        this.options.table = value;
    }

    get aside() {
        return this.options.aside;
    }

    set aside(value) {
        this.options.aside = value;
    }

    get selectedFiles() {
        return this.options.selectedFiles;
    }

    set selectedFiles(value) {
        this.options.selectedFiles = value;
    }

    get clipboardFiles() {
        return this.options.clipboardFiles;
    }

    set clipboardFiles(value) {
        this.options.clipboardFiles = value;
    }

    get clipboardMethod() {
        return this.options.clipboardMethod;
    }

    set clipboardMethod(value) {
        this.options.clipboardMethod = value;
    }

    get path() {
        return this.options.path;
    }

    set path(value) {
        this.options.path = value;
    }

    get directory() {
        return this.options.directory;
    }

    set directory(value) {
        this.options.directory = value;
    }

    get directoryToken() {
        return this.options.directoryToken;
    }

    set directoryToken(value) {
        this.options.directoryToken = value;
    }

    get sortBy() {
        return this.options.sortBy;
    }

    set sortBy(value) {
        this.options.sortBy = value;
    }

    get sortOrder() {
        return this.options.sortOrder;
    }

    set sortOrder(value) {
        this.options.sortOrder = value;
    }

    get contextMenu() {
        return this.options.contextMenu;
    }

    set contextMenu(value) {
        this.options.contextMenu = value;
    }

}