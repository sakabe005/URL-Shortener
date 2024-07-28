// ポップアップのMakeのボタンが押された場合の処理。今現在のURLを保存して短縮URLを作る

// ポップアップのMakeのボタンが押されたら動く
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('make').addEventListener('click', async function () {
    const currentUrl = await getCurrentURL();
    const shortUrl = document.getElementById('shortUrl1').value;
    await addContent(currentUrl, shortUrl);
    showUrls(currentUrl, shortUrl);
  });
});

// 今現在のURLを確認して保存する。
async function getCurrentURL() {
  let currentUrl = "";
  return await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0]; // 現在のタブを取得
      currentUrl = currentTab.url; // 現在のタブのURLを取得
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
 * A,B列に要素を追加することは前提とする
 * @param {string} firstLineContent A列に追加する文字列
 * @param {string} secondLineContent B列に追加する文字列
 */
async function addContent(firstLineContent, secondLineContent) {
  console.log('Adding row to spreadsheet');
  const token = await getAuthToken();
  console.log('Token:', token);
  const spreadsheetId = await getSpreadSheetId();
  console.log('Spreadsheet ID:', spreadsheetId);
  const range = `${defaultSheetName}!A:B`;  // データを追加する範囲
  const values = [
    [firstLineContent, secondLineContent]
  ];

  const body = {
    values: values
  };
  console.log('Body:', body, 'Range:', range, "value:", values);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  console.log('Response:', response);
  if (!response.ok) {
    const errorDetails = await response.json();
    console.error('Error adding row to spreadsheet:', errorDetails);
    return;
  }

  console.log('Row added to spreadsheet');
}

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

/**
 * Googleアカウントに紐づけられたストレージから、URL ShortenerのスプレッドシートのIDを取得する
 * @returns {Promise<string>}
 */
const getSpreadSheetId = async () => {
  const res = (await chrome.storage.sync.get('spreadsheetId'))['spreadsheetId'];
  if (!res) {
    console.error('Spreadsheet ID is missing.');
    return "";
  }
  return res;
};
