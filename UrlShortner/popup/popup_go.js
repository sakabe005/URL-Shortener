// ポップアップにおいて、短縮URLを用いた移動用の関数

const defaultSheetName = "URLs";

//Goを押された場合、入力バーの中に入れた数値によって、リンクつけられたURLへ移動
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('go').addEventListener('click', handleGoClick);
});

async function handleGoClick() {
  const shortUrl = document.getElementById('shortUrl1').value;
  const range = `${defaultSheetName}!A:B`;  // データを取得する範囲

  const data = await getSpreadsheetData(range);
  if (!data) {
    console.error('No data found in spreadsheet');
    return;
  }

  const matchingUrls = data.filter(row => row[1] === shortUrl);

  if (matchingUrls.length === 0) {
    alert('No URL found');
  } else if (matchingUrls.length === 1) {
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
    urlElement.addEventListener('click', () => {
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
    const values =data.values

    if (!Array.isArray(values)) {
      console.error(data)
      throw new Error("invalid response")
    }
    res.push(...values);
  };

  await Promise.all(spreadsheets.map(async(spreadsheet) => fetchSpreadsheet(spreadsheet.spreadsheetId)));

  return res
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
