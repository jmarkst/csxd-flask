from flask import Flask, request, jsonify, render_template
from ultralytics import YOLO
from PIL import Image

app = Flask(__name__)

# Load the YOLOv8 model
model = YOLO("static/raw/models/best.pt")  # Replace with your trained YOLOv8 model path

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    # Process the image with the YOLOv8 model
    image = Image.open(file.stream)
    results = model(image)

    # Convert results to JSON-friendly format
    boxes = []
    for result in results:
        for box in result.boxes:
            xyxy = box.xyxy[0].tolist()  # Extract coordinates as a list [x1, y1, x2, y2]
            boxes.append({
                'x1': int(xyxy[0]),
                'y1': int(xyxy[1]),
                'x2': int(xyxy[2]),
                'y2': int(xyxy[3]),
                'confidence': float(box.conf),
                'class': int(box.cls)
            })

    return jsonify({'boxes': boxes})

if __name__ == '__main__':
    app.run(debug=True)
