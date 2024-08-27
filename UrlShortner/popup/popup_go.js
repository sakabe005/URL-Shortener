// ポップアップにおいて、短縮URLを用いた移動用の関数

const defaultSheetName = "URLs";

//Goを押された場合、入力バーの中に入れた数値によって、リンクつけられたURLへ移動
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('go').addEventListener('click', handleGoClick);
});

async function handleGoClick() {
  const shortUrl = document.getElementById('shortUrl1').value;
  const range = `${defaultSheetName}!A:Z`;  // データを取得する範囲

  const data = await getSpreadsheetData(range);
  if (!data) {
    console.error('No data found in spreadsheet');
    return;
  }

  const matchingUrls = data.filter(row => row[1] === shortUrl);

  if (matchingUrls.length === 0) {
    alert('No URL found');
  } else if (matchingUrls.length === 1) {
    await incrementUserCount(matchingUrls[0]);
    chrome.tabs.update({ url: matchingUrls[0][0] });
  } else {
    showUrlSelection(matchingUrls);
  }
}

function showUrlSelection(urls) {
  const selectionDiv = document.getElementById('urlSelection');
  selectionDiv.innerHTML = '';

  urls.forEach((url, index) => {
    const urlElement = document.createElement('button');
    urlElement.className = 'url-item';
    urlElement.textContent = getDisplayUrl(url[0]);
    urlElement.addEventListener('click', async () => {
      await incrementUserCount(url);
      chrome.tabs.update({ url: url[0] });
    });
    selectionDiv.appendChild(urlElement);
  });

  selectionDiv.style.display = 'block';

  if (selectionDiv.firstChild) {
    selectionDiv.firstChild.focus();
  }
}

function getDisplayUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch (e) {
    return url;
  }
}

/**
 * スプレッドシートから、選択範囲のデータを取得する
 * @param {string} range 取得する範囲
 * @returns {Promise<string[][]>} 取得したデータ
 */
const getSpreadsheetData = async (range) => {
  const token = await getAuthToken();

  const spreadsheets = await getSpreadsheetsInPopUp();

  const res = [];

  const fetchSpreadsheet = async (spreadsheetId) => {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?majorDimension=ROWS`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('Error fetching spreadsheet data:', errorDetails);
      return null;
    }

    const data = await response.json();
    const values = data.values;

    if (!Array.isArray(values)) {
      console.error(data);
      throw new Error("invalid response");
    }
    res.push(...values);
  };

  await Promise.all(spreadsheets.map(async (spreadsheet) => fetchSpreadsheet(spreadsheet.spreadsheetId)));

  return res;
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

/**
 * Googleアカウントに紐づけられたストレージから、URL Shortenerのスプレッドシートをを取得する
 * @returns {Promise<{spreadsheetId:string,spreadsheetName:string}[]>}
 */
const getSpreadsheetsInPopUp = async () => {
  const res = (await chrome.storage.sync.get('spreadsheets'));
  if (!res) {
    console.error('Spreadsheet ID is missing.');
    return "";
  }
  return res.spreadsheets;
};

/**
 * ユーザーごとのカウントを増加させる
 * @param {string[]} row スプレッドシートの行データ
 */
async function incrementUserCount(row) {
  if (!Array.isArray(row) || row.length < 2) {
    console.error('Invalid row data');
    return;
  }

  const token = await getAuthToken();
  const userName = await getUserName(token);
  const spreadsheets = await getSpreadsheetsInPopUp();

  if (!spreadsheets || spreadsheets.length === 0) {
    console.error('No spreadsheets found');
    return;
  }

  const spreadsheetId = spreadsheets[0].spreadsheetId;

  // ヘッダー行を取得
  const headerResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${defaultSheetName}!1:1`, {
    headers: {
      'Authorization': 'Bearer ' + token,
    }
  });
  const headerData = await headerResponse.json();

  if (!headerData.values || !Array.isArray(headerData.values[0])) {
    console.error('Invalid header data');
    return;
  }

  const headers = headerData.values[0];

  // ユーザー名の列のインデックスを見つける
  const userColumnIndex = headers.indexOf(userName);
  if (userColumnIndex === -1) {
    console.error('User column not found');
    return;
  }

  // 現在の行を取得
  const shortUrl = row[1]; // 短縮URLは2番目の要素（インデックス1）にあると仮定
  const allDataResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${defaultSheetName}!A:Z`, {
    headers: {
      'Authorization': 'Bearer ' + token,
    }
  });
  const allData = await allDataResponse.json();

  if (!allData.values || !Array.isArray(allData.values)) {
    console.error('Invalid spreadsheet data');
    return;
  }

  const rowIndex = allData.values.findIndex(row => row[1] === shortUrl);
  if (rowIndex === -1) {
    console.error('Row not found');
    return;
  }

  const currentRow = allData.values[rowIndex];

  // カウントを増加
  const currentCount = parseInt(currentRow[userColumnIndex]) || 0;
  const newCount = currentCount + 1;

  // 更新された行を送信
  const updateRange = `${defaultSheetName}!${String.fromCharCode(65 + userColumnIndex)}${rowIndex + 1}`; // +1 because sheet rows are 1-indexed
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[newCount]]
    })
  });
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
