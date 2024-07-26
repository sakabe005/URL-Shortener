// 右クリック→URLを短縮でリンク先のURLを保存する機能です。
const spreadSheetName = "URL Shortener Links";
const defaultSheetName = "URLs";


// メニューに項目を追加
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "UrlShortener",
    title: "URLを短縮",
    contexts: ["link"],
  });
});

// 項目が押されたら起動する関数
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "UrlShortener") {
    const originalUrl = info.linkUrl;
    // メニューから短縮する際は連番
    // メニューから短縮する際もポップアップで入力でいいのでは？(いつき)
    let id = 0;
    const res = (await chrome.storage.sync.get('id'))['id'];
    if (res) {
      id = res;
    }
    id++;
    saveUrlNum(id);
    const shortUrl = id.toString();
    addContent(originalUrl, shortUrl);
    showUrls(originalUrl, shortUrl);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const spreadsheetId = await createSpreadsheet(spreadSheetName, defaultSheetName);
  // ローカルにスプレッドシート情報を保存
  await chrome.storage.sync.set({ spreadsheetId }, () => {
    console.log('Spreadsheet ID saved to sync storage');
  });

  await addContent("original URL", "short URL");
});

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

/**
 * 作ったURLと短縮版URL(数字)をユーザーに示す
 * @param {string} originalUrl
 * @param {string} shortUrl
 */
function showUrls(originalUrl, shortUrl) {
  const html = `
    <p>Original URL: ${originalUrl}</p>
    <p>Short URL: ${shortUrl}</p>
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
  const token = await getAuthToken();

  const spreadsheetId = await getSpreadSheetId();


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

/**
 * @param {string} spreadSheetName 作成するスプレッドシートの名前
 * @param {string} defaultSheetName 作成したスプレッドシートの最初のシート名
 * @returns {Promise<string>} 作成したスプレッドシートのID
 */
const createSpreadsheet = async (spreadSheetName, defaultSheetName) => {
  const token = await getAuthToken();

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: spreadSheetName
      },
      sheets: [
        {
          properties: {
            title: defaultSheetName
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const errorDetails = await response.json();
    console.error('Error creating spreadsheet:', errorDetails);
    return;
  }

  const spreadsheet = await response.json();
  console.log('Spreadsheet created:', spreadsheet);

  return spreadsheet.spreadsheetId;
};
