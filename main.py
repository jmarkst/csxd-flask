from flask import Flask, request, jsonify, render_template, Response
from ultralytics import YOLO
import os
import requests
from PIL import Image
from dotenv import load_dotenv
import numpy as np
import cv2
from decimal import Decimal

load_dotenv()

app = Flask(__name__)

# Load the YOLOv8 model
model = YOLO("static/raw/models/best.pt")  # Replace with your trained YOLOv8 model path
#model = YOLO('yolov8n.pt')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video')
def video():
    return render_template('video.html')

@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    # Process the image with the YOLOv8 model
    image = Image.open(file.stream)
    results = model(image)
    annotate = annotations(results)
    return annotate

def annotate(frame):
    results = model(frame)
    return annotations(results)

def annotations(results):
    # Convert results to JSON-friendly format
    boxes = []
    for result in results:
        for box in result.boxes:
            if box.conf >= 0.7:
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

@app.route('/nutrition', methods=['GET'])
def handle_request():
    # Get the vegetable from the query string
    vegetable = request.args.get('vegetable')

    # You can now use this vegetable to make an API call or perform any logic
    api_key = os.getenv("API_KEY")

    # Example: Make a mock API call using the vegetable name
    api_response = requests.get(
        f"https://api.nal.usda.gov/fdc/v1/food/{vegetable}?API_KEY={api_key}"
    )

    # Return the response back to the frontend
    return jsonify(api_response.json())

@app.route('/frame', methods=['POST'])
def frame():
    if request.method == 'POST':
        # Read the frame sent from client
        nparr = np.frombuffer(request.data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        detections = annotate(frame)
        return detections

camera = cv2.VideoCapture(0)  # Capture from webcam
latest_detections = []  # To store the latest detections

def generate_frames():
    global latest_detections
    while True:
        success, frame = camera.read()  # Capture frame-by-frame
        if not success:
            break
        else:
            # YOLOv8 inference with stream=True
            results = model(frame, stream=True)

            # Initialize a temporary list to store detections for this frame
            current_detections = []

            # Process results and draw bounding boxes
            for result in results:
                for box in result.boxes:
                    if box.conf >= 0.7:
                        xyxy = box.xyxy[0].tolist()  # Extract coordinates as a list [x1, y1, x2, y2]
                        current_detections.append({
                            'x1': int(xyxy[0]),
                            'y1': int(xyxy[1]),
                            'x2': int(xyxy[2]),
                            'y2': int(xyxy[3]),
                            'confidence': float(box.conf),
                            'class': int(box.cls)
                        })


                        # Draw bounding box on the frame
                        cv2.rectangle(frame, (int(xyxy[0]), int(xyxy[1])), (int(xyxy[2]), int(xyxy[3])), (0, 255, 0), 2)
                        label = f'{model.names[int(box.cls)]} {float(box.conf):.2f}'
                        cv2.putText(frame, label, (int(xyxy[0]), int(xyxy[1]) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # If there are detections, update the global latest_detections
            if current_detections:
                latest_detections = current_detections

            # Encode the frame in JPEG format
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            # Stream the frame as a multipart response
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detections')
def detections():
    # Return the latest detections as JSON (if no new detections, return the last known ones)
    return jsonify(latest_detections)


if __name__ == '__main__':
    app.run(debug=True)
