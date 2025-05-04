// Lắng nghe kết quả OCR từ content script thông qua postMessage
window.addEventListener('message', (event) => {
  console.log("Panel nhận được message:", event.data);
  if (event.data && event.data.action === "ocr_result") {
    console.log("Nhận được OCR text:", event.data.ocr_text);
    console.log("Nhận được translation text:", event.data.translation);
    document.getElementById("original-text").textContent = event.data.ocr_text;
    document.getElementById("translation-text").textContent = event.data.translation;
    // TODO: Thêm logic để dịch và phân tích kanji
  }
});

// Thêm log khi panel.html được load
console.log("Panel.html đã được load");

// Xử lý sự kiện click nút capture
document.getElementById('captureBtn').addEventListener('click', () => {
  console.log("Bắt đầu chụp từ panel");
  // Gửi message đến content script để bắt đầu chụp
  window.parent.postMessage({ action: "start_capture" }, "*");
});

// Hiển thị thông tin kanji
function displayKanji(kanji) {
  const kanjiGrid = document.getElementById("kanji-grid");
  kanjiGrid.innerHTML = kanji.map(k => `
    <div class="kanji-item">
      <div class="kanji-char">${k.character}</div>
      <div class="kanji-meaning">${k.meaning}</div>
    </div>
  `).join("");
} 