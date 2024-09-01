class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}

/**
 * RFC3339形式の文字列をYYYY/MM/DD HH:mm の形にする
 * @param {string} rfc3339String
 * @returns {string}
 */
const convertRFC3339ToDateTime = (rfc3339String) => {
    const date = new Date(rfc3339String);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const convertShortcutToStorageFormat = (shortcut) => {
    return shortcut
        .replace('Command+', '⌘')
        .replace('Shift+', '⇧')
        .replace('Option+', '⌥')
        .replace('Ctrl+', '⌃')
        .replace(/\+/g, '');
};

const convertShortcutToPresentationFormat = (shortcut) => {
    if (!shortcut) return '';

    return shortcut
        .replace('⌘', 'Command+')
        .replace('⇧', 'Shift+')
        .replace('⌥', 'Option+')
        .replace('⌃', 'Ctrl+')
        .replace(/\+\+/g, '+');
};

document.addEventListener("DOMContentLoaded", async () => {
    const navLi = document.querySelectorAll("nav li");

    navLi.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            // 全てのリンクとその中のimg要素から"active"クラスを削除
            navLi.forEach(l => {
                l.classList.remove("active");
                l.querySelector("img")?.classList.remove("active");
            });

            this.classList.add("active");
            this.querySelector("img")?.classList.add("active");
        });
    });

    const spreadsheetData = await getSpreadsheetDataInSettings();
    const spreadsheetTable = document.getElementById('spreadsheets-body');

    spreadsheetTable.innerHTML = "";
    spreadsheetData.forEach((spreadsheet, i) => {
        const row = document.createElement('tr');
        const sharedTime = spreadsheet.sharedWithMeTime == null ? "my sheet" : convertRFC3339ToDateTime(spreadsheet.sharedWithMeTime);
        row.innerHTML = `
                <td>
                    <div class="spreadsheet-container">
                        <img class="spreadsheet-img" src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Google_Sheets_2020_Logo.svg" alt="spreadsheet icon" />
                        <div class="spreadsheet-name">${spreadsheet.displayName}</div>
                    </div>
                </td>
                <td>
                    <div class="profile">
                        <img class="profile-img" src=${spreadsheet.owners[0].photoLink} alt="profile image" />
                        <span>${spreadsheet.owners[0].displayName}</span>
                    </div>
                </td>
                <td>${sharedTime}</td>
                <td>
                    <div class="action-container">
                        <img class="three-point-reader" src="../assets/icons/three-point-reader.png" alt="action" />
                        <div class="modal">
                            <div>
                                <div class="modal-content">
                                    <img class="icon" src="../assets/icons/edit.png" alt="edit" />
                                    <button class="rename-btn">edit name</button>
                                </div>
                                <div class="modal-content" style="${i === 0 ? 'display:none;' : ''}">
                                    <img class="icon" src="../assets/icons/trash.png" alt="trash" />
                                    <button class="delete-btn">delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            `;
        row.setAttribute('data-id', spreadsheet.id);
        row.classList.add("spreadsheet");
        spreadsheetTable.appendChild(row);
    });

    document.getElementById("spreadsheet-management").addEventListener("click", handleClickSpreadsheetManagement);
    document.getElementById("shortcut-management").addEventListener("click", handleClickShortcutManagement);

    document.querySelectorAll('.spreadsheet').forEach(element => {
        element.addEventListener('click', handleClickSpreadsheetRow);
    });
    document.querySelectorAll('.delete-btn').forEach(element => {
        element.addEventListener('click', handleClickDeleteSpreadsheet);
    });
    document.getElementById("add-spreadsheet").addEventListener("click", handleClickAddSpreadsheet);
    document.getElementById("cancel-btn").addEventListener("click", handleClickCancelButton);
    document.getElementById("ok-btn").addEventListener("click", handleSubmitOkButton);

    document.querySelectorAll('.three-point-reader').forEach(element => {
        element.addEventListener('click', handleClickThreePointReader);
    });

    document.querySelectorAll('.rename-btn').forEach(element => {
        element.addEventListener('click', handleRenameSpreadsheet);
    });

    document.querySelectorAll('.delete-btn').forEach(element => {
        element.addEventListener('click', handleDeleteSpreadsheet);
    });

    handleClickSpreadsheetManagement();
    document.getElementById('save-shortcuts').addEventListener('click', handleSaveShortcuts);
    // クリック以外の場所をクリックしたときにモーダルを閉じる
    document.addEventListener('click', closeAllModals);
});

/**
 * スプレッドシート管理ページのviewを切り替える
 * @param {"form"|"management"} type
 */
const switchManagementPageDisplay = (type) => {
    const form = document.getElementById("spreadsheet-add");
    const management = document.getElementById("spreadsheets");
    form.style.display = type === "form" ? "block" : "none";
    management.style.display = type === "form" ? "none" : "block";
};

const handleClickSpreadsheetManagement = () => {
    document.getElementById("spreadsheet-management").classList.add("active");
    document.getElementById("shortcut-management").classList.remove("active");
    document.getElementById("spreadsheets").style.display = "block";
    document.getElementById("shortcuts").style.display = "none";
};

const handleClickShortcutManagement = () => {
    document.getElementById("spreadsheet-management").classList.remove("active");
    document.getElementById("shortcut-management").classList.add("active");
    document.getElementById("spreadsheets").style.display = "none";
    document.getElementById("shortcuts").style.display = "block";

    chrome.commands.getAll((commands) => {
        commands.forEach((command) => {
            if (command.name === "_execute_action") {
                const popupShortcutInput = document.getElementById('popupShortcut');
                popupShortcutInput.value = convertShortcutToPresentationFormat(command.shortcut);
            }
        });
    });
};

const handleClickSpreadsheetRow = (event) => {
    const target = event.target;
    const spreadsheetDiv = target.closest('.spreadsheet');
    if (!spreadsheetDiv) return;

    const spreadsheetId = spreadsheetDiv.getAttribute('data-id');
    chrome.tabs.create({ url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
};

const handleClickAddSpreadsheet = () => {
    switchManagementPageDisplay("form");
};

const handleClickDeleteSpreadsheet = async (event) => {
    event.stopPropagation();
    const target = event.target;
    const spreadsheetDiv = target.closest('.spreadsheet');
    if (!spreadsheetDiv) return;

    const spreadsheetIdToDelete = spreadsheetDiv.getAttribute('data-id');
    const spreadsheets = await getSpreadsheetsInSettings();
    const deletedSpreadsheets = spreadsheets.filter((spreadsheet) => spreadsheet.id !== spreadsheetIdToDelete);
    await chrome.storage.sync.set({ spreadsheets: deletedSpreadsheets });
    window.location.reload();
};

const handleClickCancelButton = () => {
    switchManagementPageDisplay("management");
};

/**
 * スプレッドシートAPIを叩くためのtokenを取得する
 * @returns {Promise<string>}
 */
const getAuthToken = async () => {
    let token = "";
    await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, function (res) {
            if (chrome.runtime.lastError) {
                console.error("エラー:", chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
                return;
            }
            if (!res) {
                console.error('token is missing.');
                reject('token is missing.');
                return;
            }
            token = res;
            resolve(res);
        });
    });
    return token;
};

const handleSubmitOkButton = async () => {
    // エラーメッセージ初期化
    const errorMessageElement = document.getElementById("error-message");
    errorMessageElement.innerText = "";

    // バリデーション
    const form = document.getElementById("spreadsheet-form");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const spreadsheetUrl = document.getElementById("spreadsheetUrl").value;
    const displayName = document.getElementById('displayName').value;

    // エラーハンドリング系やfetchは切り出したいが、一旦TODO
    const spreadsheetId = spreadsheetUrl.split("/")[5]; // https://docs.google.com/spreadsheets/d/{id}/～ の形式
    const spreadsheets = await getSpreadsheetsInSettings();
    for (let i = 0; i < spreadsheets.length; i++) {
        if (spreadsheets[i].spreadsheetId === spreadsheetId) {
            errorMessageElement.innerText = "This spreadsheet is already registered.";
            return;
        }
    }

    const token = await getAuthToken();

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=name`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok && response.status === 404) {
        errorMessageElement.innerText = "You do not have access to this spreadsheet.";
        return;
    }

    const addedSpreadsheets = [...spreadsheets, { spreadsheetId, spreadsheetName: displayName }];
    await chrome.storage.sync.set({ spreadsheets: addedSpreadsheets });
    window.location.reload();
    form.reset();
};

const closeAllModals = () => {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = "none";
    });
};

const handleClickThreePointReader = (event) => {
    event.stopPropagation();
    closeAllModals();
    const modal = event.target.nextElementSibling;
    modal.style.display = modal.style.display === "block" ? "none" : "block";
};


const handleRenameSpreadsheet = async (event) => {
    event.stopPropagation();
    const row = event.target.closest('tr');
    const spreadsheetId = row.getAttribute('data-id');
    const newName = prompt("Please enter a new name ：");
    if (newName) {
        const spreadsheets = await getSpreadsheetsInSettings();
        const updatedSpreadsheets = spreadsheets.map(sheet =>
            sheet.spreadsheetId === spreadsheetId ? { ...sheet, spreadsheetName: newName } : sheet
        );
        await chrome.storage.sync.set({ spreadsheets: updatedSpreadsheets });
        window.location.reload();
    }
};

const handleDeleteSpreadsheet = async (event) => {
    event.stopPropagation();
    const row = event.target.closest('tr');
    const spreadsheetId = row.getAttribute('data-id');
    if (confirm("Are you sure you want to delete this?")) {
        const spreadsheets = await getSpreadsheetsInSettings();
        const updatedSpreadsheets = spreadsheets.filter(sheet => sheet.spreadsheetId !== spreadsheetId);
        await chrome.storage.sync.set({ spreadsheets: updatedSpreadsheets });
        window.location.reload();
    }
};

const handleSaveShortcuts = () => {
    const newShortcut = document.getElementById('popupShortcut').value;
    const storageFormatShortcut = convertShortcutToStorageFormat(newShortcut);

    chrome.commands.update({
        name: "_execute_action",
        shortcut: storageFormatShortcut
    }, () => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            alert('Error updating shortcut. Please try a different combination.');
        } else {
            alert('Shortcut updated successfully!');
        }
    });
};

/**
 * Googleアカウントに紐づけられたストレージから、URL Shortenerのスプレッドシートをを取得する
 * @returns {Promise<{spreadsheetId:string,spreadsheetName:string}[]>}
 */
const getSpreadsheetsInSettings = async () => {
    const res = (await chrome.storage.sync.get('spreadsheets'));
    if (!res) {
        console.error('Spreadsheet ID is missing.');
        return "";
    }
    return res.spreadsheets;
};

const getFileData = async (fileId, token) => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,owners,sharedWithMeTime`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorDetails = await response.json();
        console.error('Error fetching file data:', errorDetails);
        if (response.status === 404) {
            console.log("aaaaaaaaaaaaaaaaaaaaa");
            throw new NotFoundError(`not found file: ${fileId}`);
        }
    }

    const data = await response.json();
    return data;
};


/**
 * @typedef {Object} User
 * @property {string} displayName - ユーザーの表示名
 * @property {string} kind - 固定値 "drive#user"
 * @property {boolean} me - 現在のユーザーが共有者であるかどうか
 * @property {string} permissionId - ユーザーの権限ID
 * @property {string} emailAddress - ユーザーのメールアドレス
 * @property {string} photoLink - プロフィール写真へのリンク
 * @see https://developers.google.com/drive/api/reference/rest/v3/User?hl=ja
 */

/**
 * @returns {Promise<{id:string,name:string,displayName:string, owners:User[],sharedWithMeTime:string|null }[]>}
 */
const getSpreadsheetDataInSettings = async () => {
    const spreadsheets = await getSpreadsheetsInSettings();
    const token = await getAuthToken();

    const res = new Array(spreadsheets.length);
    const fetchSpreadsheetData = async (spreadsheetId, displayName, index) => {
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=name,owners,sharedWithMeTime`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Error fetching file data:', errorDetails);
            return null;
        }

        const data = await response.json();

        // 順番を追加した順番(spreadsheetsの順番)に揃える
        res[index] = {
            id: spreadsheetId,
            name: data.name,
            displayName,
            owners: data.owners,
            sharedWithMeTime: data.sharedWithMeTime
        };
    };

    await Promise.all(spreadsheets.map(async (spreadsheet, index) => fetchSpreadsheetData(spreadsheet.spreadsheetId, spreadsheet.spreadsheetName, index)));

    return res;
};
