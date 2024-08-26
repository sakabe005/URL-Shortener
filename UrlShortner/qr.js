document.addEventListener('DOMContentLoaded', function() {
  // qrCodeCreateボタンのイベントリスナー
  document.getElementById('qrCodeCreate').addEventListener('click', async function () {
    const currentUrl = await getCurrentURL();
    document.getElementById('qrcode').innerHTML = '';
    var qrcode = new QRCode("qrcode", {
      text: currentUrl,
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });

    // URLをクリップボードにコピー
    await navigator.clipboard.writeText(currentUrl);

    // ポップアップ通知を表示
    showNotification('URL copied to clipboard.');
  });
});

// ポップアップ通知を表示する関数
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
  `;
  document.body.appendChild(notification);

  // 3秒後に通知を消す
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
