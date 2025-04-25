console.log("popup.js đang chạy");
document.getElementById("capture").addEventListener("click", async () => {
  console.log("Đã nhấn vào nút capture");
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || isNaN(tab.id)) {
      console.error("Không thể lấy tabId.");
      return;
    }

    // Gửi message trực tiếp đến content script
    chrome.tabs.sendMessage(tab.id, { action: "capture" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Lỗi khi gửi message:", chrome.runtime.lastError.message);
      } else {
        console.log("Phản hồi từ content script:", response);
      }
    });
  } catch (error) {
    console.error("Lỗi:", error);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "ocr_result") {
    const resultDiv = document.getElementById("result");
    resultDiv.textContent = message.ocr_text;
  }
});
