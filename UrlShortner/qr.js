// "入力欄に短縮URLを入力しているときにQRボタンを押すと、元のURLのQRコードが作成される"
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('qrCode').addEventListener('click', function() {
    const shortUrl = document.getElementById('shortUrl1').value;
    chrome.storage.local.get([shortUrl], function(result) {
      if (result[shortUrl]) {
        original_URL = result[shortUrl];
        document.getElementById('qrcode').textContent = '';
        var qrcode = new QRCode(document.getElementById('qrcode'), {
          text: original_URL,
          width: 128,
          height: 128,
          correctLevel : QRCode.CorrectLevel.H,
          colorDark : "#AE56E3",
          colorLight : "#ffffff",
        });
      } else {
        // なかった場合はURLがないと返す
        alert('No Url');
      }
    });
  });
});
