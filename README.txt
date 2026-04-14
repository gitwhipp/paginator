README.txt

Paginator
Author: Brian Paul Whipp
Date: 2026

Overview

Paginator is a self-hosted PHP file browser with media previews. It lets you browse folders, open nested folders, preview common media types, paginate files, sort content, and manage files through a simple admin login.

Note: This version uses a simple PHP session-based admin password for file-management actions. Default password is 'change-me' to change the admin password, update `assets/api/simpleLogin.php`. Upload size limiting is controlled in `assets/js/app.js` through top-level variables, where you can turn the limit on or off and set the maximum upload size.

Current project structure

index.php
assets/
 css/
  app.css
 js/
  app.js
 api/
  checkLogin.php
  simpleLogin.php
  logout.php
  getDirectories.php
  getImages.php
  uploadFiles.php
  createFolder.php
  renameFile.php
  deleteFile.php
  saveFolderOrder.php
  setFolderHidden.php
  setFolderPrivate.php
 config/
  folder_order.json
uploads/

What it does

Public features:

* browse folders and subfolders
* preview images
* preview some video, audio, and PDF files
* paginate files
* sort files and folders
* deep-link with `dir` and `file` URL parameters
* switch image preview sizes

Admin features:

* log in through a simple password modal
* create folders
* upload files
* rename files
* delete files
* mark folders hidden
* mark folders private
* save custom folder order
* see hidden and private folders

Visibility model

Folders can be marked with:

* `.hidden`
* `.private`

Public users do not see those folders. Logged-in admin users can.

Auth model

This version uses simple PHP session-based admin auth.

Relevant files:

* `assets/api/simpleLogin.php`
* `assets/api/checkLogin.php`
* `assets/api/logout.php`

The frontend opens a login modal. The backend sets a PHP session. Admin-only helpers check that session before allowing changes.

This is much better than the earlier client-only password approach, but it is still meant to stay simple.

Main files

`index.php`
Renders the page shell, toolbar, modals, controls, and loads CSS and JS.

`assets/css/app.css`
Contains layout, toolbar, modal, preview, button, pagination, and responsive styles.

`assets/js/app.js`
Contains browsing, rendering, sorting, pagination, login modal behavior, upload flow, rename/delete actions, folder visibility toggles, and folder navigation.

Backend helpers

`assets/api/getDirectories.php`
Returns visible folders from `uploads/`.

`assets/api/getImages.php`
Returns folders and files for the current directory, with pagination.

`assets/api/uploadFiles.php`
Uploads files into the selected folder. Requires admin session.

`assets/api/createFolder.php`
Creates a folder. Requires admin session.

`assets/api/renameFile.php`
Renames a file. Requires admin session.

`assets/api/deleteFile.php`
Deletes a file. Requires admin session.

`assets/api/saveFolderOrder.php`
Saves folder order to `assets/config/folder_order.json`. Requires admin session.

`assets/api/setFolderHidden.php`
Adds or removes `.hidden`. Requires admin session.

`assets/api/setFolderPrivate.php`
Adds or removes `.private`. Requires admin session.

Storage

Browsable files live in:
`uploads/`

Custom folder order is stored in:
`assets/config/folder_order.json`

Supported preview types

Images:

* jpg
* jpeg
* png
* gif
* webp
* svg

Video:

* mp4
* mov
* webm
* m4v

Audio:

* mp3
* wav
* ogg
* m4a

Other:

* pdf

Unsupported file types fall back to a generic file card or direct open link.

Installation

1. Upload the project files.
2. Make sure these exist:

   * `uploads/`
   * `assets/config/folder_order.json`
3. Make sure PHP can write where needed.
4. Set the admin password in:

   * `assets/api/simpleLogin.php`
5. Load `index.php` in the browser.
6. Test:

   * folder browsing
   * nested folder navigation
   * login/logout
   * upload
   * create folder
   * rename
   * delete
   * hidden/private toggles
   * folder order saving

Notes

* This project now uses session-based auth for admin actions.
* Admin-only helpers should not work when logged out.
* Paths are based on `uploads/` for stored files.
* The app is designed to stay simple and easy to modify.

Suggested `.gitignore`

Ignore:

* uploaded user files in `uploads/`
* local environment-only files if you add any later
