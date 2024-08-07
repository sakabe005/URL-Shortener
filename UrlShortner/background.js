// 右クリック→URLを短縮でリンク先のURLを保存する機能です。
const spreadsheetName = "URL Shortener Links";
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

    const spreadsheets = await getSpreadsheets();

    if (spreadsheets.length === 0) {
      throw new Error("invalid sync storage")
    }

    const defaultSpreadsheetId = spreadsheets[0].spreadsheetId

    const token = await getAuthToken();

    addContent(defaultSpreadsheetId, token, originalUrl, shortUrl);
    showUrls(originalUrl, shortUrl);
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const token = await getAuthToken();

  const spreadsheet = await createSpreadsheet(token, spreadsheetName, defaultSheetName);

  const spreadsheetId = spreadsheet.spreadsheetId;
  // ローカルにスプレッドシート情報を保存
  await chrome.storage.sync.set({ spreadsheets: [{ spreadsheetId, spreadsheetName }] }, () => {
    console.log('saved to sync storage:');
  });

  const defaultSheetId = spreadsheet.sheets[0].properties.sheetId;

  await initSheetSetting(token, spreadsheetId, defaultSheetId);

  await addContent(spreadsheetId, token, "original URL", "short URL");
});

/**
 * Googleアカウントに紐づけられたストレージから、URL Shortenerのスプレッドシートをを取得する
 * @returns {Promise<{spreadsheetId:string,spreadsheetName:string}[]>}
 */
const getSpreadsheets = async () => {
  const res = (await chrome.storage.sync.get('spreadsheets'));
  console.log(res)
  if (!res) {
    console.error('Spreadsheet ID is missing.');
    return "";
  }
  return res.spreadsheets;
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

/**
 * @param {string} token スプレッドシートAPIを叩くためのtoken
 * @param {string} spreadsheetName 作成するスプレッドシートの名前
 * @param {string} defaultSheetName 作成したスプレッドシートの最初のシート名
 * @returns {Promise<Spreadsheet>} https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets?hl=ja#resource:-spreadsheet
 */
const createSpreadsheet = async (token, spreadsheetName, defaultSheetName) => {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: spreadsheetName
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

  return spreadsheet;
};

/**
 * @param {string} token スプレッドシートAPIを叩くためのtoken
 * @param {string} spreadsheetId 作成するスプレッドシートの名前
 * @param {string} sheetId URLを管理するシートのID
 * @returns {} https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/response?hl=ja#response
 */
const initSheetSetting = async (token, spreadsheetId, sheetId) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addProtectedRange: {
            protectedRange: {
              range: {
                sheetId: sheetId,
              },
              description: "Protect Sheet Name",
              warningOnly: true,
            },
          }
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 1,
            },
            properties: {
              pixelSize: 320,
            },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
              endIndex: 2,
            },
            properties: {
              pixelSize: 200,
            },
            fields: 'pixelSize',
          },
        },
      ]
    })
  });

  const res = await response.json();

  return res;
};


/**
 * OmniBoxに入れられたテキストに合致するものをspreadSheetから探し、見つけてsuggestに表示する機能
 * @text string OmniBoxに入れられたテキスト
 * @data string[][] spreadSheetから取得したデータ
 * @for_suggest string[] suggestに出すためのリスト。短縮URLとoriginal URLを格納
 */
chrome.omnibox.onInputChanged.addListener(
  async function (text, suggest) {
    const range = `${defaultSheetName}!A:B`;  // データを取得する範囲

    const data = await getSpreadsheetData(range);
    if (!data) {
      console.error('No data found in spreadsheet');
      return;
    }
    let for_suggest = [];
    for (const row of data) {
      console.log(row)
      if (row[1].includes(text)) {
        for_suggest.push({ content: row[0], description: row[1] + "  |  " + row[0] });
      }
    }

    suggest(for_suggest);
  });

/**
* Ominbox(アドレスバーに入れられた文字列から、オリジナルのURLへ飛ぶ関数)
* @text {string} Omnibox上のテキストデータ
*/
chrome.omnibox.onInputEntered.addListener(
  async function (text) {
    chrome.tabs.update({ url: text });
  });

/**
 * スプレッドシートから、選択範囲のデータを取得する
 * popup_goですでに使われている関数。こちらでも使用
 * @param {string} range 取得する範囲
 * @returns {Promise<string[][]>} 取得したデータ
 */
const getSpreadsheetData = async (range) => {
  const token = await getAuthToken();

  const spreadsheets = await getSpreadsheets();

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
