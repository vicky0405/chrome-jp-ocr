console.log("Background script đã chạy");
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message from content:", message);
  if (message.action === "capture") {
    console.log("bắt đầu chụp ảnh");
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: "png" },
      (screenshotUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Lỗi chụp màn hình:", chrome.runtime.lastError.message);
          sendResponse({ error: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ screenshot: screenshotUrl });
      }
    );
    return true; // Giữ kết nối cho asynchronous response
  }
});
