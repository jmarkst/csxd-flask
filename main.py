from flask import Flask, request, jsonify, render_template, Response
from ultralytics import YOLO
import os
import requests
from PIL import Image
from dotenv import load_dotenv
import numpy as np
import cv2
import time

load_dotenv()

app = Flask(__name__)

# Load the YOLOv8 model
model = YOLO("static/raw/models/ccbv2c.pt")  # Replace with your trained YOLOv8 model path
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
    inferenceTimeStart = time.time()
    results = model(image)
    annotate = annotations(results)
    inferenceTimeEnd = time.time()
    inferenceTime = inferenceTimeEnd - inferenceTimeStart
    return jsonify({
        'results': annotate,
        'inferenceTime': inferenceTime
    })

def annotate(frame):
    inferenceTimeStart = time.time()
    results = model(frame)
    inferenceTimeEnd = time.time()
    inferenceTime = inferenceTimeEnd - inferenceTimeStart
    return jsonify({
        'results': annotations(results),
        'inferenceTime': inferenceTime
    })

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

    return boxes

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

def draw_box(frame, detection):
    # Simplify bounding box and text rendering for better performance
    x1, y1, x2, y2 = detection['x1'], detection['y1'], detection['x2'], detection['y2']
    confidence = detection['confidence']
    cls = detection['class']
    
    # Draw bounding box with reduced thickness and faster rendering
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)  # Thinner lines
    label = f'{model.names[cls]} {confidence:.2f}'
    
    # Render a smaller text size
    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

camera = cv2.VideoCapture(0)  # Capture from webcam
latest_detections = []  # To store the latest detections
videoStartTime = 0
videoFrames = 0

latest_detections = []  # This will store the latest detection boxes
frame_count = 0  # Keep track of frames
skip_inference = 5  # Number of frames to skip between inferences

def generate_frames():
    global latest_detections
    prev_frame_time = 0
    new_frame_time = 0
    frame_count = 0  # Keep track of frames

    while True:
        success, frame = camera.read()
        if not success:
            continue

        frame = cv2.resize(frame, (640, 480))  # Resize the frame to improve performance

        frame_count += 1
        new_frame_time = time.time()

        # Perform YOLOv8 inference only every 5th frame
        if frame_count % skip_inference == 0:
            results = model(frame, stream=True)
            current_detections = []  # Temporary storage for detections in this frame

            # Process results
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

            # Update global latest detections with current detections
            latest_detections = current_detections

        # Render the current frame using the latest detections
        for detection in latest_detections:
            draw_box(frame, detection)

        # FPS calculation
        fps = 1 / (new_frame_time - prev_frame_time)
        prev_frame_time = new_frame_time

        # Display FPS on the frame
        cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Encode the frame in JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


def draw_box(frame, detection):
    # Simplify bounding box and text rendering for better performance
    x1, y1, x2, y2 = detection['x1'], detection['y1'], detection['x2'], detection['y2']
    confidence = detection['confidence']
    cls = detection['class']

    # Draw bounding box
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    label = f'{model.names[cls]} {confidence:.2f}'

    # Render text label
    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detections')
def detections():
    # Return the latest detections as JSON (if no new detections, return the last known ones)
    return jsonify(latest_detections)


if __name__ == '__main__':
    app.run(debug=True)
