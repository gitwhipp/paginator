let uploadLimitsEnabled = false;
let maxUploadSizeGB = 10;
let maxUploadSizeBytes = maxUploadSizeGB * 1024 * 1024 * 1024;

function toast(msg, ms = 1500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove('is-visible'), ms);
}

async function publicGet(url, token = null) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(url, {
        method: 'GET',
        headers
    });
}

async function authJson(url, method, body, token) {
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body || {})
    });
    return res.json().catch(() => ({}));
}

async function authMultipart(url, formData, token) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    return res.json().catch(() => ({}));
}

document.addEventListener('DOMContentLoaded', async () => {
    const newFolderName = document.getElementById('newFolderName');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const imageFiles = document.getElementById('imageFiles');
    const whereDirEl = document.getElementById('whereDir');
    const backButton = document.getElementById('backButton');
    const directoryList = document.getElementById('directoryList');
    const imageContainer = document.getElementById('imageContainer');
    const topControls = document.getElementById('topControls');
    const bottomControls = document.getElementById('bottomControls');
    const closeUploadModalButton = document.getElementById('closeUploadModalButton');
    const uploadModal = document.getElementById('uploadModal');
    const uploadList = document.getElementById('uploadList');
    const uploadSummary = document.getElementById('uploadSummary');
    const loginButton = document.getElementById('loginButton');
    closeUploadModalButton?.addEventListener('click', closeUploadModal);
    const resizeButton = document.getElementById('resizeButton');
    const openFileButton = document.getElementById('openFileButton');
    
    function openUploadModal() {
        uploadModal.classList.add('is-open');
    }

    function closeUploadModal() {
        uploadModal.classList.remove('is-open');
    }

    function addUploadItem(name, size) {
        const el = document.createElement('div');
        el.textContent = `${name} (${Math.round(size / 1024)} KB) - pending`;
        uploadList.appendChild(el);
        return el;
    }

    const SIZES = ['small', 'medium', 'large'];
    let sizeIndex = parseInt(localStorage.getItem('paginatorSize') || '1');

    function applyImageSize() {
        document.querySelectorAll('#imageContainer img').forEach(img => {
            img.classList.remove('size-small', 'size-medium', 'size-large');
            img.classList.add(`size-${SIZES[sizeIndex]}`);
        });
        resizeButton.textContent = `🔍 Resize: ${SIZES[sizeIndex][0].toUpperCase() + SIZES[sizeIndex].slice(1)}`;
        localStorage.setItem('paginatorSize', sizeIndex);
    }

    resizeButton.onclick = () => {
        sizeIndex = (sizeIndex + 1) % SIZES.length;
        applyImageSize();
    };

    const loginModal = document.getElementById('loginModal');
    const loginModalBackdrop = document.getElementById('loginModalBackdrop');
    const closeLoginModalButton = document.getElementById('closeLoginModalButton');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    const toggleLoginPasswordButton = document.getElementById('toggleLoginPasswordButton');
    const submitLoginButton = document.getElementById('submitLoginButton');

    function openLoginModal() {
        loginModal.classList.remove('is-hidden');
        loginModal.setAttribute('aria-hidden', 'false');
        loginPasswordInput.value = '';
        loginPasswordInput.type = 'password';
        toggleLoginPasswordButton.textContent = 'Show';
        setTimeout(() => loginPasswordInput.focus(), 0);
    }

    function closeLoginModal() {
        loginModal.classList.add('is-hidden');
        loginModal.setAttribute('aria-hidden', 'true');
        loginPasswordInput.value = '';
    }

    closeLoginModalButton?.addEventListener('click', closeLoginModal);
    loginModalBackdrop?.addEventListener('click', closeLoginModal);

    toggleLoginPasswordButton?.addEventListener('click', () => {
        const show = loginPasswordInput.type === 'password';
        loginPasswordInput.type = show ? 'text' : 'password';
        toggleLoginPasswordButton.textContent = show ? 'Hide' : 'Show';
    });

    loginPasswordInput?.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitLoginButton.click();
        }
    });

    const imagesOnlyToggle = document.getElementById('imagesOnlyToggle');
    let currentFiles = [];

    let currentDir = null;
    let token = null;
    let singleFile = null; // when set, we are in single-image mode

    let isLoggedIn = false;

    function updateAuthUI() {
        const showAdmin = isLoggedIn === true;
        newFolderName.classList.toggle('is-hidden', !showAdmin);
        createFolderBtn.classList.toggle('is-hidden', !showAdmin);
        document.getElementById('uploadImagesLink').classList.toggle('is-hidden', !showAdmin);
        document.getElementById('filterSelect').classList.toggle('is-hidden', !showAdmin);
        document.getElementById('filterLabel').classList.toggle('is-hidden', !showAdmin);
        loginButton.textContent = showAdmin ? '🔓 Logout' : '🔐 Login';
    }

    async function checkLoginStatus() {
        const data = await authJson('assets/api/checkLogin.php', 'POST', {}, null);

        if (data && data.status === 'success' && data.isLoggedIn === true) {
            isLoggedIn = true;
            token = 'session-authenticated';
        } else {
            isLoggedIn = false;
            token = null;
        }

        updateAuthUI();
    }

    submitLoginButton?.addEventListener('click', async () => {
        const entered = loginPasswordInput.value;
        if (!entered) return;

        const data = await authJson('assets/api/simpleLogin.php', 'POST', {
            password: entered
        }, null);

        if (data && data.status === 'success') {
            isLoggedIn = true;
            token = 'session-authenticated';
            updateAuthUI();
            closeLoginModal();
            toast('Login successful');
        } else {
            isLoggedIn = false;
            token = null;
            updateAuthUI();
            toast((data && data.message) || 'Wrong password');
        }
    });

    loginButton.addEventListener('click', async () => {
        if (isLoggedIn) {
            if (!window.confirm('Log out?')) return;

            const data = await authJson('assets/api/logout.php', 'POST', {}, null);

            if (data && data.status === 'success') {
                isLoggedIn = false;
                token = null;
                updateAuthUI();
                toast('Logged out');
            } else {
                toast((data && data.message) || 'Logout failed');
            }
            return;
        }

        openLoginModal();
    });

    await checkLoginStatus();

    console.log('[Paginator] ACCESS TOKEN VALUE:', token);
    console.log('[Paginator] ACCESS TOKEN TYPE:', typeof token);

    let currentPage = 0; // ← add
    let cachedDirs = [];
    let totalPages = 1; // ← add
    let perPage = 25; // ← CHANGE THIS NUMBER ANYTIME
    let maxPageSizeMB = 120;
    let maxPageSizeBytes = maxPageSizeMB * 1024 * 1024;

    function getFilteredFiles(files) {
        const imageVideoExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'mov', 'webm', 'm4v'];
        if (!imagesOnlyToggle.checked) return files;
        return (files || []).filter(file => imageVideoExts.includes((file.ext || '').toLowerCase()));
    }

    document.getElementById('sortSelect').onchange = () => {
        if (!currentDir) loadImages();
        else loadImages();
    };

    imagesOnlyToggle.onchange = () => {
        renderCurrentFiles();
    };

    function showStandardUi() {
        document.getElementById('pageHeader').classList.remove('is-hidden');
        document.getElementById('loginButton').classList.remove('is-hidden');
        document.getElementById('resizeButton').classList.remove('is-hidden');
        document.getElementById('sortBar').classList.remove('is-hidden');
        openFileButton.classList.add('is-hidden');
        if (isLoggedIn) {
            document.getElementById('newFolderName').classList.remove('is-hidden');
            document.getElementById('createFolderBtn').classList.remove('is-hidden');
            document.getElementById('uploadImagesLink').classList.remove('is-hidden');
        }
    }

    function updateWhereDir() {
        if (currentDir && singleFile) {
            whereDirEl.textContent = `/${currentDir}/${singleFile}`;
        } else if (currentDir) {
            whereDirEl.textContent = `/${currentDir}`;
        } else {
            whereDirEl.textContent = '/';
        }
    }

    function updateUrl() {
        console.log("updating url...");
        const params = new URLSearchParams();

        if (currentDir) params.set('dir', currentDir);
        if (singleFile) params.set('file', singleFile);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({}, '', newUrl);
    }

    function clearFileFromUrl() {
        const params = new URLSearchParams(window.location.search);
        params.delete('file');

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState({}, '', newUrl);
    }

    function loadFromUrl() {
        const params = new URLSearchParams(window.location.search);

        const dir = params.get('dir');
        const file = params.get('file');

        if (!dir) {
            currentDir = null;
            loadImages();
            return;
        }

        // folder requested
        currentDir = dir;

        // single image requested
        if (file) {
            singleFile = file;

            // load images first so folder exists
            loadImages().then(() => {
                renderSingleImage();
            });
            return;
        }

        // just folder view
        loadImages();
    }

    function scrollPaginatorToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    function applySortAndOrder(dirs) {
        const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const sortMode = document.getElementById('sortSelect').value;

        // FULL OVERRIDE MODES
        if (sortMode === 'date') return dirs.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
        if (sortMode === 'date_old') return dirs.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
        if (sortMode === 'az') return dirs.sort((a, b) => a.name.localeCompare(b.name));
        if (sortMode === 'za') return dirs.sort((a, b) => b.name.localeCompare(a.name));

        // DEFAULT → folder order
        if (window.folderOrder && window.folderOrder.length) {
            const map = {};
            window.folderOrder.forEach((n, i) => map[normalize(n)] = i);

            dirs.sort((a, b) => {
                const ai = map[normalize(a.name)];
                const bi = map[normalize(b.name)];

                if (ai === undefined && bi === undefined) return a.name.localeCompare(b.name);
                if (ai === undefined) return 1;
                if (bi === undefined) return -1;
                return ai - bi;
            });
        }

        return dirs;
    }

    function createDirectoryItem(name, opts = {}) {
        const el = document.createElement('div');
        el.className = 'directory-item';

        const handle = token ? document.createElement('span') : null;
        if (handle) {
            handle.textContent = '≡';
            handle.className = 'directory-drag-handle';
        }

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;

        el.draggable = !!token;

        if (handle) {
            handle.onmousedown = () => {
                el.dataset.dragging = 'true';
            };
        }

        if (token) {
            el.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', name);
                el.classList.add('dragging');
            };

            el.ondragend = () => {
                el.classList.remove('dragging');
                delete el.dataset.dragging;
            };

            el.ondragover = (e) => {
                e.preventDefault();
            };

            el.ondrop = async (e) => {
                e.preventDefault();

                const dragging = document.querySelector('.dragging');
                if (!dragging || dragging === el) return;

                directoryList.insertBefore(dragging, el);

                if (typeof opts.onDropReorder === 'function') {
                    await opts.onDropReorder();
                }
            };
        }

        if (handle) el.appendChild(handle);
        el.appendChild(nameSpan);

        return el;
    }

    function renderDirectories(dirs) {
        directoryList.innerHTML = '';

        dirs.forEach(dir => {
            const el = createDirectoryItem(dir.name, {
                onDropReorder: async () => {
                    const newOrder = Array.from(directoryList.children)
                        .map(x => x.querySelector('span:nth-child(2)').innerText.trim());

                    await authJson('assets/api/saveFolderOrder.php', 'POST', {
                        path: currentDir || '/',
                        order: newOrder
                    }, token);
                }
            });

            el.onclick = () => {
                console.log('[Paginator] folder clicked:', dir.name);
                currentDir = dir.name;
                singleFile = null;
                backButton.classList.remove('is-hidden');
                updateUrl();
                loadImages();
                scrollPaginatorToTop();
            };

            if (token) {
                const controls = document.createElement('span');
                controls.className = 'directory-controls';

                const hiddenBtn = document.createElement('button');
                hiddenBtn.textContent = dir.hidden ? '👁‍🗨' : '👁';
                hiddenBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await authJson('assets/api/setFolderHidden.php', 'POST', {
                        folder: dir.name,
                        value: !dir.hidden
                    }, token);
                    loadDirectories();
                };

                const privateBtn = document.createElement('button');
                privateBtn.textContent = dir.private ? '🔒' : '✅';
                privateBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await authJson('assets/api/setFolderPrivate.php', 'POST', {
                        folder: dir.name,
                        value: !dir.private
                    }, token);
                    loadDirectories();
                };

                controls.appendChild(hiddenBtn);
                controls.appendChild(privateBtn);
                el.appendChild(controls);
            }

            directoryList.appendChild(el);
        });
    }

    async function loadDirectories() {
        showStandardUi();
        updateWhereDir();
        directoryList.classList.remove('is-hidden');
        imageContainer.innerHTML = '';
        backButton.classList.add('is-hidden');
        topControls.classList.add('is-hidden');
        bottomControls.classList.add('is-hidden');

        const res = await publicGet('assets/api/getDirectories.php', token);
        const rawDirs = await res.json().catch(() => []);
        cachedDirs = Array.isArray(rawDirs) ? rawDirs : [];
        let dirs = Array.isArray(cachedDirs) ? [...cachedDirs] : [];

        let order = {};
        try {
            const r = await fetch('assets/config/folder_order.json?v=' + Date.now());
            if (r.ok) {
                order = await r.json();
            } else {
                order = {};
            }
        } catch (e) {
            console.warn('ORDER LOAD FAILED', e);
        }

        const pathKey = '/';
        window.folderOrder = Array.isArray(order[pathKey]) ? order[pathKey] : [];

        if (window.folderOrder.length) {
            const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            const orderMap = {};
            window.folderOrder.forEach((name, i) => {
                orderMap[normalize(name)] = i;
            });

            dirs.sort((a, b) => {
                const ai = orderMap[normalize(a.name)];
                const bi = orderMap[normalize(b.name)];

                const aMissing = ai === undefined;
                const bMissing = bi === undefined;

                if (aMissing && bMissing) return a.name.localeCompare(b.name);
                if (aMissing) return 1;
                if (bMissing) return -1;

                return ai - bi;
            });
        }

        const sortMode = document.getElementById('sortSelect').value;

        if (sortMode === 'az') {
            dirs.sort((a, b) => a.name.localeCompare(b.name));
        }
        if (sortMode === 'za') {
            dirs.sort((a, b) => b.name.localeCompare(a.name));
        }
        if (sortMode === 'date') {
            dirs.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
        }
        if (sortMode === 'date_old') {
            dirs.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
        }

        const mode = document.getElementById('filterSelect').value;
        if (mode === 'hidden') dirs = dirs.filter(d => d.hidden);
        if (mode === 'private') dirs = dirs.filter(d => d.private);
        if (mode === 'public') dirs = dirs.filter(d => !d.hidden && !d.private);

        renderDirectories(dirs);
    }

    function openSingleFile(fileName) {
        singleFile = fileName;
        updateUrl();
        renderSingleImage();
    }

    function renderCurrentFiles() {
        let filteredFiles = getFilteredFiles(currentFiles);
        const sortMode = document.getElementById('sortSelect').value;

        if (sortMode === 'az') {
            filteredFiles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortMode === 'za') {
            filteredFiles.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        } else if (sortMode === 'date') {
            filteredFiles.sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
        } else if (sortMode === 'date_old') {
            filteredFiles.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));
        }

        imageContainer.innerHTML = '';

        if (filteredFiles.length === 0 && directoryList.classList.contains('is-hidden')) {
            imageContainer.innerHTML = '<p class="empty-message">No files</p>';
            applyImageSize();
            return;
        }

        if (filteredFiles.length === 0) {
            applyImageSize();
            return;
        }

        filteredFiles.forEach(file => {
            const wrap = document.createElement('div');
            wrap.className = 'file-card';

            const fileName = file.name;
            const fileUrl = currentDir ?
                `uploads/${currentDir}/${fileName}` :
                `uploads/${fileName}`;

            const ext = (file.ext || '').toLowerCase();
            const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
            const videoExts = ['mp4', 'mov', 'webm', 'm4v'];
            const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];
            const pdfExts = ['pdf'];

                        let previewEl;

            if (imageExts.includes(ext)) {
                previewEl = document.createElement('img');
                previewEl.src = fileUrl;
            } else if (videoExts.includes(ext)) {
                previewEl = document.createElement('video');
                previewEl.src = fileUrl;
                previewEl.controls = true;
                previewEl.className = 'file-preview-video';
            } else if (audioExts.includes(ext)) {
                previewEl = document.createElement('div');
                previewEl.className = 'file-preview-generic file-preview-clickable';
                previewEl.innerHTML = `<div class="file-preview-icon">🎵</div>`;

                const audioEl = document.createElement('audio');
                audioEl.src = fileUrl;
                audioEl.controls = true;
                audioEl.className = 'file-preview-audio';
                previewEl.appendChild(audioEl);
            } else if (pdfExts.includes(ext)) {
                previewEl = document.createElement('div');
                previewEl.className = 'file-preview-generic file-preview-clickable';
                previewEl.innerHTML = `<div class="file-preview-icon">📄</div><div class="file-preview-label">PDF</div>`;
            } else {
                previewEl = document.createElement('div');
                previewEl.className = 'file-preview-generic file-preview-clickable';
                previewEl.innerHTML = `<div class="file-preview-icon">📁</div><div class="file-preview-label">${ext || 'file'}</div>`;
            }

            previewEl.addEventListener('click', () => {
                openSingleFile(fileName);
            });

            wrap.appendChild(previewEl);

            const nameEl = document.createElement('div');
            nameEl.textContent = fileName;
            nameEl.className = token ? 'file-name file-name-editable' : 'file-name';

            if (token) {
                nameEl.onclick = () => {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = fileName;
                    input.className = 'file-rename-input';

                    input.onkeydown = async (e) => {
                        if (e.key !== 'Enter') return;
                        const newName = input.value.trim();
                        if (!newName || newName === fileName) return;

                        await authJson(
                            'assets/api/renameFile.php',
                            'POST', {
                                dir: currentDir || '',
                                oldName: fileName,
                                newName
                            },
                            token
                        );

                        loadImages();
                    };

                    nameEl.replaceWith(input);
                    input.focus();
                };
            }

            wrap.appendChild(nameEl);

            if (token) {
                const delBtn = document.createElement('button');
                delBtn.textContent = '🗑';
                delBtn.className = 'file-delete-button';

                delBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Delete ${fileName}?`)) return;

                    const res = await authJson(
                        'assets/api/deleteFile.php',
                        'POST', {
                            dir: currentDir || '',
                            file: fileName
                        },
                        token
                    );

                    if (res.status === 'success') {
                        loadImages();
                    } else {
                        console.error('[DELETE FILE FAILED]', res);
                        toast('Delete failed');
                    }
                };

                wrap.appendChild(delBtn);
            }

            imageContainer.appendChild(wrap);
        });

        applyImageSize();
    }

    async function loadImages() {
        console.log('[Paginator] loadImages START');
        console.log('[Paginator] currentDir:', currentDir);
        console.log('[Paginator] currentPage:', currentPage);
        showStandardUi();
        updateWhereDir();
        topControls.classList.add('is-hidden');
        bottomControls.classList.add('is-hidden');
        directoryList.classList.add('is-hidden');
        imageContainer.innerHTML = '<p class="loading-message">Loading files...</p>';
        const url = 'assets/api/getImages.php';

        const payload = {
            dir: currentDir || '',
            page: currentPage,
            perPage: perPage,
            maxPageSizeBytes: maxPageSizeBytes,
            sort: document.getElementById('sortSelect').value,
            token: token
        };

        const headers = {
            'Content-Type': 'application/json'
        };

        if (currentDir === 'Private') {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('[Paginator] FETCH URL:', url);
        console.log('[Paginator] FETCH HEADERS:', headers);
        console.log('[Paginator] FETCH PAYLOAD:', payload);

        let res;
        let rawText;

        try {
            res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            rawText = await res.text();
        } catch (e) {
            console.error('[Paginator] FETCH FAILED:', e);
            imageContainer.innerHTML = '<p class="error-message">Network error</p>';
            return;
        }

        console.log('[Paginator] HTTP STATUS:', res.status);
        console.log('[Paginator] RAW RESPONSE:', rawText);

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            console.error('[Paginator] JSON PARSE FAILED');
            imageContainer.innerHTML = '<p class="error-message">Bad JSON</p>';
            return;
        }

        console.log('[Paginator] PARSED RESPONSE:', data);

        if (data.status === 'error' || data.error) {
            console.warn('[Paginator] SERVER ERROR:', data);
            imageContainer.innerHTML =
                `<p class="error-message">${data.message || data.error}</p>`;
            return;
        }

        let orderData = {};
        try {
            const r = await fetch('assets/config/folder_order.json?v=' + Date.now());
            if (r.ok) {
                orderData = await r.json();
            } else {
                orderData = {};
            }
        } catch (e) {
            console.warn('ORDER LOAD FAILED', e);
        }
        const pathKey = currentDir ? '/' + currentDir.replace(/^\/+|\/+$/g, '') : '/';
        window.folderOrder = Array.isArray(orderData[pathKey]) ? orderData[pathKey] : [];

        directoryList.innerHTML = '';

        if (data.folders && data.folders.length) {
            let folders = data.folders.map(folder => ({
                name: folder.name,
                hidden: !!folder.hidden,
                private: !!folder.private
            }));
            folders = applySortAndOrder(folders);

            folders.forEach(folderObj => {
                const folder = folderObj.name;
                const el = createDirectoryItem(folder, {
                    onDropReorder: async () => {
                        const newOrder = Array.from(directoryList.children)
                            .map(x => x.querySelector('span:nth-child(2)').innerText.trim());

                        await authJson('assets/api/saveFolderOrder.php', 'POST', {
                            path: currentDir || '/',
                            order: newOrder
                        }, token);
                    }
                });

                if (token) {
                    const controls = document.createElement('span');
                    controls.className = 'directory-controls';

                    const hiddenBtn = document.createElement('button');
                    hiddenBtn.textContent = folderObj.hidden ? '👁‍🗨' : '👁';
                    hiddenBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await authJson('assets/api/setFolderHidden.php', 'POST', {
                            folder: currentDir ? currentDir + '/' + folder : folder,
                            value: !folderObj.hidden
                        }, token);
                        loadImages();
                    };

                    const privateBtn = document.createElement('button');
                    privateBtn.textContent = folderObj.private ? '🔒' : '✅';
                    privateBtn.onclick = async (e) => {
                        e.stopPropagation();
                        await authJson('assets/api/setFolderPrivate.php', 'POST', {
                            folder: currentDir ? currentDir + '/' + folder : folder,
                            value: !folderObj.private
                        }, token);
                        loadImages();
                    };

                    controls.appendChild(hiddenBtn);
                    controls.appendChild(privateBtn);
                    el.appendChild(controls);
                }

                el.onclick = () => {
                    currentDir = currentDir ? currentDir + '/' + folder : folder;
                    singleFile = null;
                    backButton.classList.remove('is-hidden');
                    updateUrl();
                    loadImages();
                    scrollPaginatorToTop();
                };

                directoryList.appendChild(el);
            });

            directoryList.classList.remove('is-hidden');
        } else {
            directoryList.classList.add('is-hidden');
        }
        console.log('[BACK BUTTON CHECK]', currentDir, backButton);
        if (currentDir) {
            backButton.classList.remove('is-hidden');
        } else {
            backButton.classList.add('is-hidden');
        }
        imageContainer.innerHTML = '';

        currentFiles = data.files || [];
        renderCurrentFiles();
        console.log('[Paginator] loadImages SUCCESS');

        currentPage = data.currentPage ?? currentPage;
        totalPages = data.totalPages ?? 1;

        if (totalPages > 1) {
            topControls.classList.remove('is-hidden');
            bottomControls.classList.remove('is-hidden');
        } else {
            topControls.classList.add('is-hidden');
            bottomControls.classList.add('is-hidden');
        }

        updatePaginationButtons();
        applyImageSize();
    }

    function renderSingleImage() {
        document.getElementById('pageHeader').classList.add('is-hidden');
        document.getElementById('newFolderName').classList.add('is-hidden');
        document.getElementById('createFolderBtn').classList.add('is-hidden');
        document.getElementById('uploadImagesLink').classList.add('is-hidden');
        document.getElementById('loginButton').classList.add('is-hidden');
        document.getElementById('resizeButton').classList.add('is-hidden');
        document.getElementById('sortBar').classList.add('is-hidden');

        updateWhereDir();
        directoryList.classList.add('is-hidden');
        topControls.classList.add('is-hidden');
        bottomControls.classList.add('is-hidden');
        backButton.classList.remove('is-hidden');
        imageContainer.innerHTML = '';

        const fileUrl = currentDir ? `uploads/${currentDir}/${singleFile}` : `uploads/${singleFile}`;
        openFileButton.href = fileUrl;
        openFileButton.classList.remove('is-hidden');
        const ext = (singleFile.split('.').pop() || '').toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const videoExts = ['mp4', 'mov', 'webm', 'm4v'];
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a'];

        let el;

        if (imageExts.includes(ext)) {
            el = document.createElement('img');
            el.src = fileUrl;
            el.className = 'single-preview-image';
        } else if (videoExts.includes(ext)) {
            el = document.createElement('video');
            el.src = fileUrl;
            el.controls = true;
            el.className = 'single-preview-video';
        } else if (audioExts.includes(ext)) {
            el = document.createElement('audio');
            el.src = fileUrl;
            el.controls = true;
            el.className = 'single-preview-audio';
        } else if (ext === 'pdf') {
            el = document.createElement('iframe');
            el.src = fileUrl;
            el.className = 'single-preview-pdf';
        } else {
            el = document.createElement('div');
            el.className = 'single-preview-fallback';
            el.innerHTML = `<p class="single-preview-fallback-text">Preview not available for this file type.</p><a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="single-preview-link">Open / Download ${singleFile}</a>`;
        }

        imageContainer.appendChild(el);
    }

    function updatePaginationButtons() {
        const prevTop = document.getElementById('prevBtn');
        const nextTop = document.getElementById('nextBtn');
        const prevBot = document.getElementById('prevBtnBottom');
        const nextBot = document.getElementById('nextBtnBottom');

        // Always enabled when we wrap; only disable if there's a single page
        const disable = totalPages <= 1;
        [prevTop, nextTop, prevBot, nextBot].forEach(b => b.disabled = disable);

        const containers = [
            document.getElementById('pageNumbersTop'),
            document.getElementById('pageNumbersBottom')
        ];

        containers.forEach(container => {
            container.innerHTML = '';

            for (let i = 0; i < totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i + 1;

                if (i === currentPage) {
                    btn.classList.add('is-active');
                }

                btn.onclick = () => {
                    currentPage = i;
                    loadImages();
                    scrollPaginatorToTop();
                };

                container.appendChild(btn);
            }
        });
    }

    // Wrap-around handlers
    document.getElementById('prevBtn').onclick = () => {
        if (totalPages <= 1) return;
        currentPage = (currentPage > 0) ? currentPage - 1 : (totalPages - 1);
        loadImages();
        scrollPaginatorToTop();
    };
    document.getElementById('nextBtn').onclick = () => {
        if (totalPages <= 1) return;
        currentPage = (currentPage < totalPages - 1) ? currentPage + 1 : 0;
        loadImages();
        scrollPaginatorToTop();
    };
    document.getElementById('prevBtnBottom').onclick = () => {
        if (totalPages <= 1) return;
        currentPage = (currentPage > 0) ? currentPage - 1 : (totalPages - 1);
        loadImages();
        scrollPaginatorToTop();
    };
    document.getElementById('nextBtnBottom').onclick = () => {
        if (totalPages <= 1) return;
        currentPage = (currentPage < totalPages - 1) ? currentPage + 1 : 0;
        loadImages();
        scrollPaginatorToTop();
    };
    document.getElementById('filterSelect').onchange = () => {
        const mode = document.getElementById('filterSelect').value;

let dirs = Array.isArray(cachedDirs) ? [...cachedDirs] : [];

        if (mode === 'hidden') dirs = dirs.filter(d => d.hidden);
        if (mode === 'private') dirs = dirs.filter(d => d.private);
        if (mode === 'public') dirs = dirs.filter(d => !d.hidden && !d.private);

        dirs = applySortAndOrder(dirs);
        renderDirectories(dirs);
    };
    backButton.onclick = () => {
        if (singleFile) {
            singleFile = null;
            updateUrl();
            loadImages();
            scrollPaginatorToTop();
            return;
        }

        if (!currentDir) return;

        const parts = currentDir.split('/');
        parts.pop();

        currentDir = parts.length ? parts.join('/') : null;

        currentPage = 0;
        totalPages = 1;

        updateUrl();

        if (currentDir) {
            loadImages();
            scrollPaginatorToTop();
        } else {
            loadImages();
        }
    };

    // --- Add Folder button ---
    createFolderBtn.addEventListener('click', async () => {
        if (!token) {
            alert('You must be logged in to create folders');
            return;
        }

        const name = (newFolderName.value || '').trim();
        if (!name) {
            toast('Enter a folder name');
            return;
        }
        const data = await authJson('assets/api/createFolder.php', 'POST', {
            folderName: name,
            parent: currentDir || ''
        }, token);
        if (data && data.status === 'success') {
            toast('Folder created');
            newFolderName.value = '';

            // stay in folder, just refresh images
            await loadImages();
        } else {
            toast((data && data.message) || 'Failed to create');
        }
    });

    // --- Upload Images ---
    imageFiles.addEventListener('change', (ev) => {
        if (!token) {
            alert('You must be logged in to upload images');
            imageFiles.value = '';
            return;
        }

        const files = Array.from(ev.target.files || []);
        if (!files.length) return;

        if (uploadLimitsEnabled) {
            let totalBytes = 0;

            for (const file of files) {
                totalBytes += file.size;
            }

            if (totalBytes > maxUploadSizeBytes) {
                alert(`Upload blocked. Total upload size exceeds ${maxUploadSizeGB} GB.`);
                imageFiles.value = '';
                return;
            }
        }

        openUploadModal();
        uploadList.innerHTML = '';

        let total = 0;
        files.forEach(f => {
            total += f.size;
            f._el = addUploadItem(f.name, f.size);
        });

        uploadSummary.textContent = `Total: ${Math.round(total / 1024)} KB`;

        const fd = new FormData();
        fd.append('dir', currentDir || '');
        files.forEach(f => fd.append('files[]', f, f.name));
        fd.append('token', token);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'assets/api/uploadFiles.php');

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                uploadSummary.textContent =
                    `Uploading: ${Math.round(e.loaded / 1024)} / ${Math.round(e.total / 1024)} KB`;
            }
        };

        xhr.onload = () => {
            let res = {};
            try {
                res = JSON.parse(xhr.responseText);
            } catch {}

            files.forEach(f => {
                f._el.textContent = `${f.name} - ${res.status === 'success' ? 'DONE' : 'FAILED'}`;
            });

            loadImages();
        };

        xhr.onerror = () => {
            files.forEach(f => {
                f._el.textContent = `${f.name} - FAILED`;
            });
        };

        xhr.send(fd);
    });

    updateWhereDir();
    loadFromUrl();

});