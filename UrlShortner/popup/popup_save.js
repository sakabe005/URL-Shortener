// ポップアップのMakeのボタンが押された場合の処理。今現在のURLを保存して短縮URLを作る

// ポップアップのMakeのボタンが押されたら動く
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('make').addEventListener('click', async function () {
    const currentUrl = await getCurrentURL();
    const shortUrl = document.getElementById('shortUrl1').value;

    const token = await getAuthToken()
    const spreadsheets = await getSpreadsheetsInPopUp()

    if (spreadsheets.length === 0) {
      console.error("sync storage is invalid")
    }

    const defaultSheetId = spreadsheets[0].spreadsheetId

    const userName = await getUserName(token);
    await addContent(defaultSheetId, token, currentUrl, shortUrl, userName);
    showUrls(currentUrl, shortUrl);
  });
});

// 今現在のURLを確認して保存する。
async function getCurrentURL() {
  return await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0]; // 現在のタブを取得
      const currentUrl = currentTab.url; // 現在のタブのURLを取得
      resolve(currentUrl);
    });
  });
}

/**
 * 作ったURLと短縮版URL(数字)をユーザーに示す
 * @param {string} originalUrl
 * @param {string} shortUrl
 */
function showUrls(originalUrl, shortUrl) {
  const html = `
    <html>
      <head>
        <style>
          body {
            line-height: 1.6;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .url-container {
            background-color: white;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          p {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #333;
          }
          .url {
            word-break: break-all;
            color: #0066cc;
          }
        </style>
      </head>
      <body>
        <h2>Short URL Created!</h2>
        <div class="url-container">
          <p><span class="label">Original URL :</span> <span class="url">${originalUrl}</span></p>
          <p><span class="label">Short URL :</span> <span class="url">${shortUrl}</span></p>
        </div>
      </body>
    </html>
  `;
  const url = "data:text/html," + encodeURIComponent(html);
  chrome.tabs.create({ url: url });
}

/**
 * 作ったURLの数をchrome用ストレージに保存
 * @param {string} id
 */
function saveUrlNum(id) {
  chrome.storage.sync.set({ "id": id });
}

/**
 * A,B,C列に要素を追加し、必要に応じて新しい列を追加する
 * @param {string} spreadsheetId 要素を追加するスプレッドシートのID
 * @param {string} token スプレッドシートAPIを叩くためのtoken
 * @param {string} originalUrl A列に追加する文字列
 * @param {string} shortUrl B列に追加する文字列
 * @param {string} userName C列に追加する文字列、また新しい列の名前
 */
async function addContent(spreadsheetId, token, originalUrl, shortUrl, userName) {
  const range = `${defaultSheetName}!A:C`;  // データを追加する範囲
  const values = [
    [originalUrl, shortUrl, userName]
  ];

  const body = {
    values: values
  };

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorDetails = await response.json();
    console.error('Error adding row to spreadsheet:', errorDetails);
    return;
  }

  console.log('Row added to spreadsheet');

  // ユーザー名の列が存在しない場合、新しい列を追加
  await addUserColumnIfNotExists(spreadsheetId, token, userName);
}

/**
 * ユーザー名の列が存在しない場合、新しい列を追加する
 * @param {string} spreadsheetId スプレッドシートのID
 * @param {string} token スプレッドシートAPIを叩くためのtoken
 * @param {string} userName 追加する列の名前
 */
async function addUserColumnIfNotExists(spreadsheetId, token, userName) {
  const range = `${defaultSheetName}!1:1`;  // ヘッダー行を取得

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    console.error('Error fetching spreadsheet headers:', errorDetails);
    return;
  }

  const data = await response.json();
  const headers = data.values[0];

  if (!headers.includes(userName)) {
    // ユーザー名の列が存在しない場合、新しい列を追加
    const newColumnLetter = String.fromCharCode(65 + headers.length); // A, B, C, ... の次の文字
    const updateRange = `${defaultSheetName}!${newColumnLetter}1`;

    const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[userName]]
      })
    });

    if (!updateResponse.ok) {
      const errorDetails = await updateResponse.json();
      console.error('Error adding new column:', errorDetails);
    }
  }
}

/**
 * ログインしているユーザーの名前を取得する
 * @param {string} token Google APIを叩くためのtoken
 * @returns {Promise<string>} ユーザー名
 */
async function getUserName(token) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error('Error fetching user info');
    return 'Unknown User';
  }

  const data = await response.json();
  return data.name || 'Unknown User';
}