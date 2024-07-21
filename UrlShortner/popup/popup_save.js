// ポップアップのMakeのボタンが押された場合の処理。今現在のURLを保存して短縮URLを作る

// ポップアップのMakeのボタンが押されたら動く
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('make').addEventListener('click', async function () {
    const currentUrl = await getCurrentURL();
    const shortUrl = document.getElementById('shortUrl1').value;
    addContent(currentUrl, shortUrl);
    saveUrlNum(shortUrl);
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
