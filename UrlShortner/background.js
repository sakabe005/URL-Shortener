// 右クリック→URLを短縮でリンク先のURLを保存する機能です。

// 短縮URL. すでに保存された短縮URLの数も兼ねる
let id = 0;
// short URLとURLを関連付けるためのMap
const urlMap = new Map();


// メニューに項目を追加
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "UrlShortener",
    title: "URLを短縮",
    contexts: ["link"],
  });
});

// 項目が押されたら起動する関数
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "UrlShortener") {
    const originalUrl = info.linkUrl;
    chrome.storage.local.get("id", function (value) {
      id = value.id || 0;
      id++;
      const shortUrl = id.toString();
      urlMap.set(shortUrl, originalUrl);
      saveUrl(originalUrl, shortUrl);
      saveUrlNum(id);
      showUrls(originalUrl, shortUrl);
    });
  }
});

// short URLを作ってURLと関連付けるMapを作る（数字を足すだけ)
function createShortUrl(url) {
  id++;
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