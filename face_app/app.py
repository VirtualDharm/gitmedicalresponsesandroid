from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import face_recognition
import numpy as np
import os
import time
from collections import Counter
import threading

app = Flask(__name__)
CORS(app) # Enable CORS for your React Native app

ENCODINGS_PATH = 'faces'
os.makedirs(ENCODINGS_PATH, exist_ok=True)

# Global variables for video capture and recognition state
cap = None
recognition_thread = None
stop_recognition_event = threading.Event()
current_recognized_user = None
last_detection_time = time.time() # To manage "unknown" state timeouts

# --- Face Recognition State Management (from realtime_face_recognition.py) ---
class FaceDetectionState:
    def __init__(self):
        self.detection_history = []
        self.detection_count = 0
        self.confirmed_user = None
        self.sign_in_time = None
        self.is_signed_in = False
        self.lock = threading.Lock() # For thread-safe updates

    def add_detection(self, name):
        with self.lock:
            self.detection_count += 1
            self.detection_history.append(name)
            print(f"Detection {self.detection_count}: {name}")

            if self.detection_count == 5:
                self.determine_user()

    def determine_user(self):
        with self.lock:
            name_counts = Counter(self.detection_history)
            most_common = name_counts.most_common(1)

            if most_common and most_common[0][1] >= 3:
                self.confirmed_user = most_common[0][0]
                if self.confirmed_user != "Unknown":
                    self.sign_in_time = time.strftime("%Y-%m-%d %H:%M:%S")
                    self.is_signed_in = True
                    print(f"\n✅ USER CONFIRMED: {self.confirmed_user}")
                else:
                    print(f"\n❌ UNKNOWN USER - Access Denied")
            else:
                print(f"\n⚠️  INCONCLUSIVE RESULTS - Please try again")
            # Reset history after determining, or keep for debugging? Let's reset for next cycle.
            self.detection_history = []
            self.detection_count = 0


    def reset(self):
        with self.lock:
            self.detection_history = []
            self.detection_count = 0
            self.confirmed_user = None
            self.sign_in_time = None
            self.is_signed_in = False
            print("\n🔄 Detection reset. Starting new recognition cycle...")

face_detection_state = FaceDetectionState()


# --- Utility Functions ---
def load_encodings(encodings_path):
    encodings = []
    class_names = []
    for file in os.listdir(encodings_path):
        if file.endswith("_encoding.npy"):
            class_name = file.split('_')[0]
            try:
                encoding = np.load(os.path.join(encodings_path, file))
                encodings.append(encoding)
                class_names.append(class_name)
            except Exception as e:
                print(f"Error loading encoding from {file}: {e}")
    return encodings, class_names

known_encodings, class_names = load_encodings(ENCODINGS_PATH)
print(f"Loaded known classes: {class_names}")

def save_face_encoding(name, frame):
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(img_rgb)

    if encodings:
        # Save the original image (optional, for verification)
        img_path = os.path.join(ENCODINGS_PATH, f'{name}.jpg')
        cv2.imwrite(img_path, frame)

        # Save the face encoding as a numpy array
        np.save(os.path.join(ENCODINGS_PATH, f'{name}_encoding.npy'), encodings[0])
        print(f"Image and encoding saved for {name}")

        # Update global known encodings and class names
        global known_encodings, class_names
        known_encodings, class_names = load_encodings(ENCODINGS_PATH)
        return True
    return False

# --- Video Streaming and Recognition Logic ---
def generate_frames():
    global cap, current_recognized_user, last_detection_time
    if cap is None or not cap.isOpened():
        print("Error: Webcam not opened for streaming.")
        return

    # Downscale factor for performance
    scale_factor = 0.25

    while not stop_recognition_event.is_set():
        success, frame = cap.read()
        if not success:
            break

        current_name = "Unknown" # Default for this frame

        # Only process face detection if not signed in and still collecting samples
        if not face_detection_state.is_signed_in and face_detection_state.detection_count < 5:
            small_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

            for face_encoding, face_location in zip(face_encodings, face_locations):
                matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
                
                if True in matches:
                    first_match_index = matches.index(True)
                    current_name = class_names[first_match_index]
                
                face_detection_state.add_detection(current_name)

                # Scale back up face locations to original frame size and draw
                y1, x2, y2, x1 = [int(loc / scale_factor) for loc in face_location]
                color = (0, 255, 0) if current_name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.rectangle(frame, (x1, y2 - 25), (x2, y2), color, cv2.FILLED)
                font = cv2.FONT_HERSHEY_DUPLEX
                cv2.putText(frame, current_name.upper(), (x1 + 6, y2 - 6), font, 0.7, (255, 255, 255), 1)
                break # Process only the first detected face

        # Overlay text
        if not face_detection_state.is_signed_in:
            status_text = f"Detections: {face_detection_state.detection_count}/5"
            cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            if face_detection_state.detection_count > 0:
                history_text = f"History: {', '.join(face_detection_state.detection_history[-3:])}"
                cv2.putText(frame, history_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
        else:
            user_text = f"SIGNED IN: {face_detection_state.confirmed_user}"
            time_text = f"Time: {face_detection_state.sign_in_time}"
            cv2.putText(frame, user_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame, time_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)


        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    print("Stopping frame generation.")


# --- API Endpoints ---
@app.route('/train_face', methods=['POST'])
def train_face():
    global cap
    name = request.json.get('name')
    if not name:
        return jsonify({"success": False, "message": "Name is required."}), 400

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"success": False, "message": "Could not open webcam."}), 500

    print(f"Starting face capture for {name}...")
    start_time = time.time()
    capture_duration = 10 # seconds to try to capture a face
    face_captured = False

    # Display window for capturing face
    cv2.namedWindow(f"Capture Face for {name}", cv2.WINDOW_NORMAL)
    cv2.resizeWindow(f"Capture Face for {name}", 640, 480)

    while (time.time() - start_time) < capture_duration and not face_captured:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        # Convert to RGB for face detection
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)

        display_frame = frame.copy() # Frame to display
        if face_locations:
            face_captured = save_face_encoding(name, frame) # Save the original frame
            # Draw rectangle on display frame for user feedback
            y1, x2, y2, x1 = face_locations[0]
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(display_frame, "Face Detected! Capturing...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            if face_captured:
                cv2.putText(display_frame, "Face Captured Successfully!", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.imshow(f"Capture Face for {name}", display_frame)
                cv2.waitKey(2000) # Show success message for 2 seconds
                break
        else:
            cv2.putText(display_frame, "No face detected. Please look at camera.", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        cv2.imshow(f"Capture Face for {name}", display_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Capture process interrupted by user.")
            break

    cap.release()
    cv2.destroyAllWindows()

    if face_captured:
        return jsonify({"success": True, "message": f"Face for {name} trained successfully."})
    else:
        return jsonify({"success": False, "message": "Failed to capture or detect face for training."}), 400


@app.route('/start_recognition_stream', methods=['GET'])
def start_recognition_stream():
    print('reaching start_recognition_stream python app')
    global cap, recognition_thread, stop_recognition_event
    
    if recognition_thread and recognition_thread.is_alive():
        print("Recognition stream already running.")
        return jsonify({"success": False, "message": "Recognition stream already active."}), 409

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"success": False, "message": "Could not open webcam."}), 500
    print("250")
    face_detection_state.reset() # Reset state for a new sign-in attempt
    stop_recognition_event.clear() # Ensure event is clear for a new start

    recognition_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5000))
    # This ^ is not how to run flask in a thread. 
    # The `generate_frames` function will handle the actual streaming
    # We will just start a thread that *generates* the frames,
    # and the /video_feed endpoint will consume them.
    
    # Corrected approach:
    # We don't need to run `app.run` in a thread. The `app.run` is already running
    # in the main thread. We just need to make sure `generate_frames` is called
    # by the `/video_feed` endpoint.
    
    # Let's ensure the webcam is opened, and then the /video_feed will start generating.
    # The `recognition_thread` isn't strictly necessary here for the stream itself,
    # as `generate_frames` will be called by Flask's Response.
    # We need a separate thread if we want to run the recognition logic (like updating `face_detection_state`)
    # *independently* of the HTTP request-response cycle for `/video_feed`.
    # For now, `generate_frames` will do everything.
    print("Webcam opened. Ready to start streaming.")
    return jsonify({"success": True, "message": "Webcam initialized. Access /video_feed for stream."})

@app.route('/video_feed')
def video_feed():
    # It is important that `generate_frames` has access to the global `cap`
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stop_recognition_stream', methods=['GET'])
def stop_recognition_stream():
    global cap, recognition_thread, stop_recognition_event
    stop_recognition_event.set() # Signal the thread to stop

    if cap:
        cap.release()
        print("Webcam released.")
        cv2.destroyAllWindows()
        cap = None

    # Wait for the thread to finish if it was running
    # This might block, so consider if this is desired in a real application
    # if recognition_thread and recognition_thread.is_alive():
    #     recognition_thread.join()

    final_result = {
        "is_signed_in": face_detection_state.is_signed_in,
        "confirmed_user": face_detection_state.confirmed_user,
        "sign_in_time": face_detection_state.sign_in_time
    }
    face_detection_state.reset() # Reset for next session

    return jsonify({"success": True, "message": "Recognition stream stopped.", "result": final_result})

@app.route('/recognition_status', methods=['GET'])
def recognition_status():
    """
    Endpoint for the React Native app to poll for recognition results.
    """
    with face_detection_state.lock:
        status = {
            "is_signed_in": face_detection_state.is_signed_in,
            "confirmed_user": face_detection_state.confirmed_user,
            "detection_count": face_detection_state.detection_count,
            "sign_in_time": face_detection_state.sign_in_time,
            "message": "Recognition in progress"
        }
        if status["is_signed_in"]:
            status["message"] = f"User '{status['confirmed_user']}' confirmed."
        elif status["detection_count"] >= 5 and not status["is_signed_in"]:
             status["message"] = "Inconclusive or Unknown user after 5 detections."
        
        # Optionally reset state if polling after a full cycle
        # No, let's keep the state until /stop_recognition_stream is called,
        # so the RN app can get the final result.

    return jsonify(status)

if __name__ == '__main__':
    # Make sure to run this script directly in the terminal
    # python face_app/app.py
    # Flask will start on http://127.0.0.1:5000 or http://localhost:5000
    app.run(host='0.0.0.0', port=5000, threaded=True)