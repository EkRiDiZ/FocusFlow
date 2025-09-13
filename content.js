function getSelectedText() {
  return window.getSelection().toString();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "get_text") {
    sendResponse({ text: getSelectedText() });
  }
});
