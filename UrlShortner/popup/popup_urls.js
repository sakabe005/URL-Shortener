//Goを押された場合、入力バーの中に入れた数値によって、リンクつけられたURLへ移動
document.addEventListener('DOMContentLoaded', async function () {
    const spreadsheetData = await getSpreadsheets();
    const spreadsheetDiv = document.getElementById("spreadsheets");
    spreadsheetDiv.innerHTML = `${spreadsheetData.map((spreadsheet, i) => (
        `<div class="spreadsheet" data-id="${spreadsheet.spreadsheetId}" style="${i === 0 ? 'border-top: 1px solid #333;' : ''}">
            <div class="spreadsheet-container">
           <img class="spreadsheet-img" src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Google_Sheets_2020_Logo.svg" alt="spreadsheet icon" />
           <div>${spreadsheet.spreadsheetName}</div>
           </div>
           <button class="delete-btn" type="button" style="${i === 0 ? 'display: none;' : ''}">delete</button>
        </div>`
    )).join("")}`;
    document.querySelectorAll('.spreadsheet').forEach(element => {
        element.addEventListener('click', handleClickSpreadsheetRow);
    });
    document.querySelectorAll('.delete-btn').forEach(element => {
        element.addEventListener('click', handleClickDeleteSpreadsheet);
    });
    document.getElementById("add-spreadsheet").addEventListener("click", handleClickAddSpreadsheet);
    document.getElementById("cancel-btn").addEventListener("click", handleClickCancelButton);
    document.getElementById("ok-btn").addEventListener("click", handleSubmitOkButton);
});

const handleClickSpreadsheetRow = (event) => {
    const target = event.target;
    const spreadsheetDiv = target.closest('.spreadsheet');
    if (!spreadsheetDiv) return;

    const spreadsheetId = spreadsheetDiv.getAttribute('data-id');
    chrome.tabs.create({ url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
};

const handleClickAddSpreadsheet = () => {
    const form = document.getElementById("spreadsheet-form");
    const addButton = document.getElementById("add-spreadsheet");
    form.style.display = "block";
    addButton.style.display = "none";
};

const handleClickDeleteSpreadsheet = async (event) => {
    event.stopPropagation()
    const target = event.target;
    const spreadsheetDiv = target.closest('.spreadsheet');
    if (!spreadsheetDiv) return;

    const spreadsheetIdToDelete = spreadsheetDiv.getAttribute('data-id');
    const spreadsheets = await getSpreadsheets();
    const deletedSpreadsheets = spreadsheets.filter((spreadsheet) => spreadsheet.spreadsheetId !== spreadsheetIdToDelete);
    await chrome.storage.sync.set({ spreadsheets: deletedSpreadsheets });
    window.location.reload()
};

const handleClickCancelButton = () => {
    const form = document.getElementById("spreadsheet-form");
    const addButton = document.getElementById("add-spreadsheet");
    form.style.display = "none";
    addButton.style.display = "block";
};

const handleSubmitOkButton = async () => {
    const form = document.getElementById("spreadsheet-form");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    const spreadsheetUrl = document.getElementById("spreadsheetUrl").value;
    const displayName = document.getElementById('displayName').value;

    const spreadsheetId = spreadsheetUrl.split("/")[5];
    const spreadsheets = await getSpreadsheets();
    const addedSpreadsheets = [...spreadsheets, { spreadsheetId, spreadsheetName: displayName }];
    await chrome.storage.sync.set({ spreadsheets: addedSpreadsheets });
    window.location.reload()
    form.reset();
};
