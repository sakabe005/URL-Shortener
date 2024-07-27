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
  });
});
