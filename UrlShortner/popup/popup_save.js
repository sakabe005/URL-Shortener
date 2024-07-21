// ポップアップのMakeのボタンが押された場合の処理。今現在のURLを保存して短縮URLを作る

// 短縮URL. すでに保存された短縮URLの数も兼ねる
let id = 0;
// short URLとURLを関連付けるためのMap
const urlMap = new Map();
// 今のサイトのURL
let currentUrl = "";

// ポップアップのMakeのボタンが押されたら動く
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('make').addEventListener('click', function() {
      chrome.storage.local.get("id", function (value) {
        id = value.id || 0;
        id++;
        checkURL();        
      });
    });
  });

 
// 今現在のURLを確認して保存する。
function checkURL() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var currentTab = tabs[0]; // 現在のタブを取得
      currentUrl = currentTab.url; // 現在のタブのURLを取得
      const originalUrl = currentUrl;
      const shortUrl = createShortUrl(originalUrl);
      saveUrl(originalUrl, shortUrl);
      saveUrlNum(id);
      showUrls(originalUrl, shortUrl);
    });
   
}

// 以下はbackgroundの関数と全く同じなので、省略可能化もしれません

// short URLを作ってURLと関連付けるMapを作る（数字を足すだけ)
function createShortUrl(url) {
  const shortUrl = id.toString();
  urlMap.set(shortUrl, url);
  
  return shortUrl;
}

// 作ったURLと関連付けたURLをセットでchrome用ストレージに保存
function saveUrl(originalUrl, shortUrl) {
  chrome.storage.local.set({[shortUrl]: originalUrl});
}

// 作ったURLの数をchrome用ストレージに保存
function saveUrlNum(id) {
  chrome.storage.local.set({"id": id});
}
  
// 作ったURLと短縮版URL(数字)をユーザーに示す
function showUrls(originalUrl, shortUrl) {
  const html = `
    <p>Original URL: ${originalUrl}</p>
    <p>Short URL: ${shortUrl}</p>
    `;
  const url = "data:text/html," + encodeURIComponent(html);
  chrome.tabs.create({url: url});
}