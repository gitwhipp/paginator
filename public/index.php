<?php
declare(strict_types=1);
define('APP_VERSION', '1.1.04');
define('CSS_VERSION', APP_VERSION);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Paginator</title>
    <link rel="stylesheet" href="assets/css/app.css?v=<?php echo CSS_VERSION; ?>">
</head>

<body>
    <div id="pageHeader" class="page-header">
        🖼️ <strong>Paginator</strong> - Click folder to open
    </div>
    <div class="toolbar">
        <input type="text" id="newFolderName" placeholder="New folder name" inputmode="text" autocomplete="off">
        <button id="createFolderBtn">＋ New Folder</button>
        <label id="uploadImagesLink" class="file-btn">
            <span>⤴︎ Upload Images</span>
            <input id="imageFiles" type="file" multiple>
        </label>
        <span class="status-badge" id="whereStatus">Target: <strong id="whereDir">/</strong></span>
        <div class="right">
            <button id="loginButton">🔐 Login</button>
            <a id="openFileButton" class="is-hidden" target="_blank" rel="noopener noreferrer">↗ Source</a>
            <button id="resizeButton">🔍 Resize: Medium</button>
            <button id="backButton">⬅ Back to folders</button>
        </div>
    </div>
    <div id="sortBar" class="sort-bar">
        <label for="sortSelect">Sort:</label>
        <select id="sortSelect">
            <option value="default">Default</option>
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
            <option value="date">Newest</option>
            <option value="date_old">Oldest</option>
        </select>
        <label id="filterLabel" class="is-hidden" for="filterSelect">Filter:</label>
        <select id="filterSelect" class="is-hidden">
            <option value="all">All</option>
            <option value="hidden">Hidden</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
        </select>
        <label for="imagesOnlyToggle" class="toggle-inline">
            <input type="checkbox" id="imagesOnlyToggle" checked>
            Images only
        </label>
    </div>
    <main>
        <div id="directoryList"></div>
        <div class="pagination-controls" id="topControls">
            <button id="prevBtn">⬅ Prev</button>
            <div id="pageNumbersTop"></div>
            <button id="nextBtn">Next ➡</button>
        </div>
        <div id="imageContainer"></div>
        <div class="pagination-controls" id="bottomControls">
            <button id="prevBtnBottom">⬅ Prev</button>
            <div id="pageNumbersBottom"></div>
            <button id="nextBtnBottom">Next ➡</button>
        </div>
    </main>
    <div id="toast"></div>
    <div id="uploadModal" class="upload-modal">
        <div class="upload-modal-panel">
            <div class="upload-modal-header">
                <strong>Uploads</strong>
                <button id="closeUploadModalButton">✖</button>
            </div>
            <div id="uploadList" class="upload-list"></div>
            <div id="uploadSummary" class="upload-summary"></div>
        </div>
    </div>
    <script src="assets/js/app.js?v=<?php echo APP_VERSION; ?>"></script>
    <div id="loginModal" class="login-modal is-hidden" aria-hidden="true">
        <div class="login-modal-backdrop" id="loginModalBackdrop"></div>
        <div class="login-modal-panel" role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
            <div class="login-modal-header">
                <strong id="loginModalTitle">Admin Login</strong>
                <button id="closeLoginModalButton" type="button">✖</button>
            </div>
            <div class="login-modal-body">
                <label for="loginPasswordInput">Password</label>
                <div class="login-password-row">
                    <input id="loginPasswordInput" type="password" autocomplete="current-password">
                    <button id="toggleLoginPasswordButton" type="button">Show</button>
                </div>
                <div class="login-modal-actions">
                    <button id="submitLoginButton" type="button">Login</button>
                </div>
            </div>
        </div>
    </div>
</body>

</html>