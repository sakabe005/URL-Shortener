// このスクリプトが他のスクリプトと競合しないようにするため、IIFE（Immediately Invoked Function Expression）を使用
(function() {
  const defaultSheetName = "URLs";

  // Goを押された場合、入力バーの中に入れた数値によって、リンクつけられたURLへ移動
  document.addEventListener('DOMContentLoaded', function () {
    // Goボタンのイベントリスナー
    document.getElementById('go').addEventListener('click', async function () {
      const shortUrl = document.getElementById('shortUrl1').value;
      const range = `${defaultSheetName}!A:B`;  // データを取得する範囲

      const data = await getSpreadsheetData(range);
      if (!data) {
        console.error('No data found in spreadsheet');
        return;
      }

      for (let row of data) {
        if (row[1] === shortUrl) { // B列(short url)を確認
          const originalUrl = row[0]; // 該当のshort urlに対応するoriginal url
          chrome.tabs.update({ url: originalUrl });
          return;
        }
      }
      // なかった場合はURLがないと返す
      alert('No Url');
    });

    // qrCodeCreateボタンのイベントリスナー
    document.getElementById('qrCodeCreate').addEventListener('click', async function () {
      const shortUrl = document.getElementById('shortUrl1').value;
      const range = `${defaultSheetName}!A:B`;  // データを取得する範囲

      const data = await getSpreadsheetData(range);
      if (!data) {
        console.error('No data found in spreadsheet');
        return;
      }

      for (let row of data) {
        if (row[1] === shortUrl) { // B列(short url)を確認
          const originalUrl = row[0]; // 該当のshort urlに対応するoriginal url
          document.getElementById('qrcode').textContent = ''; // QRコードを生成する要素をクリア
          new QRCode(document.getElementById('qrcode'), {
            text: originalUrl,
            width: 128,
            height: 128,
            correctLevel: QRCode.CorrectLevel.H,
            colorDark: "#7e57c2",
            colorLight: "#ffffff",
          });
          return;
        }
      }
      // なかった場合はURLがないと返す
      alert('No Url');
    });
  });

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
})();
