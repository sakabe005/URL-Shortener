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

  const spreadsheetId = await getSpreadSheetId();
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
  return data.values;
};