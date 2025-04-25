from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime
from manga_ocr import MangaOcr

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
                mocr = MangaOcr()  # Initialize MangaOcr
                ocr_text = mocr(filepath)
                print("OCR Text:", ocr_text)  # Print text to console
            except Exception as ocr_error:
                print("OCR Error:", str(ocr_error))

            return jsonify({
                "message": "Upload successful",
                "ocr_text" : ocr_text
            })
        
        return jsonify({"error": "No image received"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)