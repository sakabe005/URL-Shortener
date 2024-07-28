document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('shortUrl1');
  // ポップアップが開かれたときに入力欄にフォーカスを当てる
  input.focus();
  input.addEventListener('keydown', handleKeyDown);
});

function handleKeyDown(event) {
  if (event.isComposing) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      document.getElementById('make').click();
    } else {
      document.getElementById('go').click();
    }
  }
};
