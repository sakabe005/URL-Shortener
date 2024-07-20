// ポップアップにおいて、短縮URLを用いた移動用の関数
//Goを押された場合、入力バーの中に入れた数値によって、リンクつけられたURLへ移動
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('go').addEventListener('click', function() {
    const shortUrl = document.getElementById('shortUrl1').value;
    chrome.storage.local.get([shortUrl], function(result) {
      if (result[shortUrl]) {
        chrome.tabs.update({url: result[shortUrl]});
      } else {
        // なかった場合はURLがないと返す
        alert('No Url');
      }
    });
  });
});

