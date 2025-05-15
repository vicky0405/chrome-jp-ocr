from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
import requests
import base64
from dotenv import load_dotenv
load_dotenv()
# import psutil


# def log_memory_usage():
#     process = psutil.Process(os.getpid())
#     mem = process.memory_info().rss / 1024 / 1024
#     print(f"[MEMORY USAGE] {mem:.2f} MB")

# log_memory_usage()  # Đo RAM khi khởi động server

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

app = Flask(__name__)
CORS(app)

# Tạo thư mục để lưu ảnh
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def home():
    return "Server is running!"

@app.route('/ocr', methods=['POST'])
def upload_image():
    try:
        # log_memory_usage()  # Đo RAM trước khi xử lý request
        image_data = request.files['image']
        if image_data:
            # Tạo tên file dựa trên thời gian
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'screenshot_{timestamp}.png'
            
            # Lưu file vào thư mục uploads
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image_data.save(filepath)

            # Đọc file ảnh và chuyển thành base64
            with open(filepath, "rb") as image_file:
                image_bytes = image_file.read()
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')

            # log_memory_usage()  # Đo RAM sau khi xử lý ảnh

            # Gọi Gemini 2.0 FLASH để OCR
            payload = {
                "contents": [{
                    "parts": [
                        {"text": "Hãy đọc và trích xuất tất cả văn bản tiếng Nhật trong hình ảnh này. Chỉ trả về văn bản, không có giải thích thêm."},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": image_base64
                            }
                        }
                    ]
                }]
            }

            response = requests.post(GEMINI_URL, json=payload)
            if response.status_code == 200:
                result = response.json()
                ocr_text = result['candidates'][0]['content']['parts'][0]['text']
                print("OCR Text:", ocr_text)
                translation = translate_text(ocr_text)
                print("Translation:", translation)
            else:
                print("OCR Error:", response.text)
                return jsonify({"error": "OCR failed"}), 500

            # log_memory_usage()  # Đo RAM sau khi hoàn thành OCR và dịch

            return jsonify({
                "message": "Upload successful",
                "ocr_text": ocr_text,
                "translation": translation
            })
        
        return jsonify({"error": "No image received"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def build_prompt(japanese_text, context=None):
    prompt = "Bạn là một dịch giả tiếng Nhật sang tiếng Việt. Hãy dịch chính xác và tự nhiên đoạn sau (Chỉ trả về bản dịch, không có thêm gì khác):\n"
    if context:
        prompt += f"Ngữ cảnh trước đó:\n{context}\n"
    prompt += f"Japanese: {japanese_text}\nVietnamese:"
    return prompt

def translate_text(japanese_text, context=None):
    # log_memory_usage()  # Đo RAM trước khi dịch
    prompt = build_prompt(japanese_text, context)
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    
    response = requests.post(GEMINI_URL, json=payload)
    print("Response:", response.json())
    if response.status_code == 200:
        result = response.json()
        translation = result['candidates'][0]['content']['parts'][0]['text']
        # log_memory_usage()  # Đo RAM sau khi dịch
        return translation.strip()
    else:
        return None

if __name__ == "__main__":
    app.run(debug=True, port=7860)
    # log_memory_usage()  # Đo RAM khi kết thúc server