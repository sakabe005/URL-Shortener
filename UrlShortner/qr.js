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

    setTimeout(async () => {
      const qrCodeElement = document.getElementById('qrcode').querySelector('img');

      const canvas = document.createElement('canvas');
      canvas.width = qrCodeElement.width;
      canvas.height = qrCodeElement.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(qrCodeElement, 0, 0, qrCodeElement.width, qrCodeElement.height);

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showNotification('QR code image copied to clipboard.');
        } catch (err) {
          console.error('Failed to copy QR code image: ', err);
          showNotification('Failed to copy QR code image.');
        }
      }, 'image/png');
    }, 100);
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
