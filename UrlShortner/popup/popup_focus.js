document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('shortUrl1');

  // ポップアップが開かれたときに入力欄にフォーカスを当てる
  input.focus();
  input.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', handleUrlSelectionKeyDown);
});

export function handleKeyDown(event) {
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

function handleUrlSelectionKeyDown(event) {
  const selectionDiv = document.getElementById('urlSelection');
  if (selectionDiv.style.display !== 'block') return;

  const buttons = selectionDiv.querySelectorAll('.url-item');
  const focusedElement = document.activeElement;
  let currentIndex = Array.from(buttons).indexOf(focusedElement);

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      if (currentIndex > 0) {
        buttons[currentIndex - 1].focus();
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (currentIndex < buttons.length - 1) {
        buttons[currentIndex + 1].focus();
      }
      break;
    case 'Enter':
      if (focusedElement.classList.contains('url-item')) {
        chrome.tabs.update({ url: focusedElement.getAttribute('data-url') });
      }
      break;
  }
};
