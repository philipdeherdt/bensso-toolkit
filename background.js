// The onClicked callback function.
function onClickHandler(info, tab) {
  var key = uuidv4();

  localStorage.setItem(key, info.selectionText);

  chrome.tabs.create({ url: 'popup.html?data=' + key, index: tab.index + 1 });
};

chrome.contextMenus.onClicked.addListener(onClickHandler);

// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
  var id = chrome.contextMenus.create({
    "title": "Analyze NSSO XML",
    "contexts": ["selection"],
    "id": "contextselection"
  });
});

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}