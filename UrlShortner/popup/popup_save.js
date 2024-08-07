// ポップアップのMakeのボタンが押された場合の処理。今現在のURLを保存して短縮URLを作る

// ポップアップのMakeのボタンが押されたら動く
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('make').addEventListener('click', async function () {
    const currentUrl = await getCurrentURL();
    const shortUrl = document.getElementById('shortUrl1').value;

    const token = await getAuthToken()
    const spreadsheets = await getSpreadsheets()

    if (spreadsheets.length === 0) {
      console.error("sync storage is invalid")
    }

    const defaultSheetId = spreadsheets[0].spreadsheetId

    await addContent(defaultSheetId,token,currentUrl, shortUrl);
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
 * A,B列に要素を追加することは前提とする
 * @param {string} spreadsheetId 要素を追加するスプレッドシートのID
 * @param {string} token スプレッドシートAPIを叩くためのtoken
 * @param {string} firstLineContent A列に追加する文字列
 * @param {string} secondLineContent B列に追加する文字列
 */
async function addContent(spreadsheetId, token, firstLineContent, secondLineContent) {
  const range = `${defaultSheetName}!A:B`;  // データを追加する範囲
  const values = [
    [firstLineContent, secondLineContent]
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
}
