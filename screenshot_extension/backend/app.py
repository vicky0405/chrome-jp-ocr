from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from transformers import pipeline
import requests
GEMINI_API_KEY = "AIzaSyCxZiDCgHLoB7Ums7Q3cmptBg66kK1OXdM" 

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"


mocr = pipeline("image-to-text", model="kha-white/manga-ocr-base")
app = Flask(__name__)
CORS(app)


# Tạo thư mục để lưu ảnh
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def home():
    return "Server is running!"

@app.route('/manga_ocr', methods=['POST'])
def upload_image():
    try:
        image_data = request.files['image']
        if image_data:
            # Tạo tên file dựa trên thời gian
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'screenshot_{timestamp}.png'
            
            # Lưu file vào thư mục uploads
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image_data.save(filepath)

            # Perform OCR and print text
            try:
                
                ocr_text = mocr(filepath)[0]['generated_text']
                print("OCR Text:", ocr_text)  # Print text to console
                translation = translate_text(ocr_text)
                print("Translation:", translation)
            except Exception as ocr_error:
                print("OCR Error:", str(ocr_error))

            return jsonify({
                "message": "Upload successful",
                "ocr_text" : ocr_text,
                "translation" : translation
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
        return translation.strip()
    else:
        return None

if __name__ == "__main__":
    app.run(debug=True, port=7860)