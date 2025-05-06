// Toàn bộ code của content.js ở đây
console.log("content.js loaded");


// Nút tròn ở góc phải
const widgetBtn = document.createElement("div");
widgetBtn.innerHTML = "💬";
Object.assign(widgetBtn.style, {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  backgroundColor: "#fff",
  border: "2px solid red",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  cursor: "pointer",
  zIndex: "99999999999",
});

// Tạo iframe nhưng ẩn ban đầu
const iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("panel.html");
Object.assign(iframe.style, {
  position: "fixed",
  bottom: "90px",
  right: "20px",
  width: "320px",
  height: "200px",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  display: "none",
  zIndex: "999999",
});

widgetBtn.addEventListener("click", () => {
  event.stopPropagation();   // Dừng sự kiện khỏi lan truyền
    event.preventDefault();   // Ngăn trình duyệt hành xử mặc định nếu cần
  iframe.style.display = iframe.style.display === "none" ? "block" : "none";
});

document.body.appendChild(widgetBtn);
document.body.appendChild(iframe);

function startCapture() {
  console.log("Bắt đầu cap");
  let sizeDisplay = document.createElement("div");
  sizeDisplay.style.cssText =
    "position: absolute; background-color: rgba(0, 0, 0, 0.7); color: white; padding: 5px; border-radius: 3px; font-size: 12px; z-index: 10000; display: none;"; // Style cho element hiển thị kích thước
  document.body.appendChild(sizeDisplay);
  let isDragging = false;
  let startX, startY;
  let currentX, currentY;
  let overlay = document.createElement("div");
  overlay.style.cssText =
    "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 9999; cursor: crosshair;";
  document.body.appendChild(overlay);

  let snipArea = document.createElement("div");
  snipArea.style.cssText =
    "position: absolute; border: 2px dashed red; display: none;";
  overlay.appendChild(snipArea);

  overlay.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    console.log("startX:", startX);
    console.log("startY:", startY);
    snipArea.style.display = "block";
  });

  overlay.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    currentX = e.clientX;
    currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    console.log("x trong mousemove:", x);
    console.log("y trong mousemove:", y);

    snipArea.style.left = x + "px";
    snipArea.style.top = y + "px";
    snipArea.style.width = width + "px";
    snipArea.style.height = height + "px";

    sizeDisplay.textContent = `${width}x${height}`; // Hiển thị kích thước
    sizeDisplay.style.left = e.clientX + 10 + "px"; // Vị trí hiển thị
    sizeDisplay.style.top = e.clientY + 10 + "px";
    sizeDisplay.style.display = "block";
  });

  overlay.addEventListener("mouseup", async (e) => {
    isDragging = false;
    overlay.style.cursor = "default";
    const width = parseInt(getComputedStyle(snipArea).width);
    const height = parseInt(getComputedStyle(snipArea).height);
    // const scrollLeft =
    //   window.pageXOffset || document.documentElement.scrollLeft;
    // const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const x = parseInt(getComputedStyle(snipArea).left); // Trừ đi scrollLeft
    const y = parseInt(getComputedStyle(snipArea).top); // Trừ đi scrollTop

    // console.log("scrollLeft:", scrollLeft);
    // console.log("scrollTop:", scrollTop);
    console.log("x:", x);
    console.log("y:", y);
    console.log("currentX:", currentX);
    console.log("currentY:", currentY);
    console.log("width:", width);
    console.log("height:", height);
    try {
      chrome.runtime.sendMessage({ action: "capture" }, (response) => {
        // Yêu cầu background script chụp màn hình
        if (response === undefined) {
          console.error("Background script đã không trả lời.");
          overlay.remove();

          return;
        }
        if (response && response.error) {
          // Kiểm tra response và response.error
          console.error(response.error);
          overlay.remove();
          return;
        }
        const screenshot = response.screenshot;

        const image = new Image();
        image.src = screenshot;

        image.onload = async () => {
          console.log("image.naturalWidth:", image.naturalWidth);
          console.log("image.naturalHeight:", image.naturalHeight);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = width;
          canvas.height = height;

          const scaleX = image.naturalWidth / window.innerWidth;
          const scaleY = image.naturalHeight / window.innerHeight;

          const adjustedX = x * scaleX;
          const adjustedY = y * scaleY;
          const adjustedWidth = width * scaleX;
          const adjustedHeight = height * scaleY;

          ctx.drawImage(
            image,
            adjustedX,
            adjustedY,
            adjustedWidth,
            adjustedHeight, // Vùng cần cắt
            0,
            0,
            width,
            height // Vẽ vào canvas đúng kích thước mong muốn
          );

          // Tạo Blob từ data URL
          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );

          const formData = new FormData();
          formData.append("image", blob, "screenshot.png");

          fetch("http://127.0.0.1:7860//manga_ocr", {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Success:", data);
              overlay.remove();
              console.log("Đã chụp màn hình");

              console.log("Chuẩn bị gửi OCR text:", data.ocr_text);
              // Gửi kết quả OCR đến iframe
              iframe.contentWindow.postMessage({
                action: "ocr_result",
                ocr_text: data.ocr_text,
                translation: data.translation
              }, "*");
              console.log("Đã gửi message đến iframe");

              
            })
            .catch((error) => {
              console.error("Error:", error);
              overlay.remove();
            });
        };
      });
    } catch (error) {
      console.error("Lỗi chụp màn hình:", error);
      overlay.remove();
    }
    sizeDisplay.style.display = "none"; // Ẩn element hiển thị kích thước
  });

  overlay.addEventListener("click", (e) => {
    if (!isDragging) {
      console.log("Xóa overlay");
      overlay.remove();
    }
  });
}

// Lắng nghe message từ panel.html và popup.js
window.addEventListener('message', (event) => {
  console.log("Content script nhận message:", event.data);
  if (event.data && event.data.action === "start_capture") {
    console.log("Bắt đầu chụp từ content script");
    startCapture();
  }
});

//chỗ nhận request từ popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capture") {
    console.log("Received message from popup:", message);
    startCapture(); // Gọi startCapture khi nhận được message
  }
});
