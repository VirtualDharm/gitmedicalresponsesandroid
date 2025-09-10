from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import cv2
import face_recognition
import numpy as np
import os
import time
from collections import Counter
import threading
import base64
import re

app = Flask(__name__)
# Allow CORS for HTTP requests and Socket.IO
CORS(app, resources={r"/*": {"origins": "*"}}) # Adjust origins in production
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading') # Async mode for better performance with threads

ENCODINGS_PATH = 'faces'
os.makedirs(ENCODINGS_PATH, exist_ok=True)

# --- Face Recognition State Management (modified for Socket.IO and per-session) ---
# For a production app, you would use a proper session management system
# (e.g., Flask sessions, Redis) to store FaceDetectionState per connected client.
# For simplicity, we'll use a dictionary mapping session IDs to states.
session_states = {}
SESSION_TIMEOUT = 300 # seconds (5 minutes)

class FaceDetectionState:
    def __init__(self, sid):
        self.sid = sid # Store session ID
        self.detection_history = []
        self.detection_count = 0
        self.confirmed_user = None
        self.sign_in_time = None
        self.is_signed_in = False
        self.last_update_time = time.time()
        self.lock = threading.Lock() # For thread-safe updates

    def add_detection(self, name):
        with self.lock:
            self.last_update_time = time.time()
            if self.is_signed_in:
                return # Already signed in, no more detections needed for this session

            if self.detection_count < 5:
                self.detection_count += 1
                self.detection_history.append(name)
                print(f"[{self.sid}] Detection {self.detection_count}: {name}")

                if self.detection_count == 5:
                    self.determine_user()
                    self.emit_status() # Emit status immediately after determining
            elif self.detection_count == 5 and not self.is_signed_in:
                # If 5 detections reached and still not signed in (e.g., mostly 'Unknown' or inconclusive)
                # Ensure the final 'failed' state is emitted
                self.emit_status()

    def determine_user(self):
        with self.lock:
            if self.is_signed_in:
                return

            name_counts = Counter(self.detection_history)
            most_common = name_counts.most_common(1)

            if most_common and most_common[0][1] >= 3:
                self.confirmed_user = most_common[0][0]
                if self.confirmed_user != "Unknown":
                    self.sign_in_time = time.strftime("%Y-%m-%d %H:%M:%S")
                    self.is_signed_in = True
                    print(f"[{self.sid}] ✅ USER CONFIRMED: {self.confirmed_user}")
                else:
                    print(f"[{self.sid}] ❌ UNKNOWN USER - Access Denied (Most frequent was 'Unknown')")
            else:
                print(f"[{self.sid}] ⚠️  INCONCLUSIVE RESULTS - Please try again")

    def reset(self):
        with self.lock:
            self.detection_history = []
            self.detection_count = 0
            self.confirmed_user = None
            self.sign_in_time = None
            self.is_signed_in = False
            self.last_update_time = time.time()
            print(f"[{self.sid}] 🔄 Detection state reset.")
            self.emit_status() # Emit reset status

    def get_status(self):
        with self.lock:
            status = {
                "is_signed_in": self.is_signed_in,
                "confirmed_user": self.confirmed_user,
                "detection_count": self.detection_count,
                "sign_in_time": self.sign_in_time,
                "message": "Recognition in progress"
            }
            if status["is_signed_in"]:
                status["message"] = f"User '{status['confirmed_user']}' confirmed."
            elif status["detection_count"] >= 5 and not status["is_signed_in"]:
                status["message"] = "Recognition failed or inconclusive after 5 detections."
            elif status["detection_count"] == 0:
                status["message"] = "Waiting for face detection..."
            else:
                status["message"] = f"Analyzing... {self.detection_count}/5 detections"
            return status

    def emit_status(self):
        # Emits the current state to the client associated with this SID
        current_status = self.get_status()
        socketio.emit('recognition_status', current_status, room=self.sid)
        print(f"[{self.sid}] Emitted status: {current_status['message']}")


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
        img_path = os.path.join(ENCODINGS_PATH, f'{name}.jpg')
        cv2.imwrite(img_path, frame)

        np.save(os.path.join(ENCODINGS_PATH, f'{name}_encoding.npy'), encodings[0])
        print(f"Image and encoding saved for {name}")

        global known_encodings, class_names # Update global list for real-time recognition
        known_encodings, class_names = load_encodings(ENCODINGS_PATH)
        return True
    return False

def process_image_for_recognition(image_np, state: FaceDetectionState):
    """
    Performs face recognition on a single image and updates the detection state.
    Emits status if state changes.
    """
    global known_encodings, class_names

    with state.lock:
        if state.is_signed_in or (state.detection_count >= 5 and not state.is_signed_in):
            # If already signed in or reached max detections for an inconclusive result,
            # don't process new frames until reset.
            return

    rgb_frame = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_frame)
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    current_name = "Unknown"

    if not face_encodings:
        # print(f"[{state.sid}] No face detected in the received image.")
        state.add_detection("NoFace") # Record no face if desired for averaging
        state.emit_status() # Emit status to show "Analyzing... (X/5)" or "Waiting..."
        return

    # For simplicity, we'll assume one face per image for sign-in
    face_encoding = face_encodings[0]
    matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)

    if True in matches:
        first_match_index = matches.index(True)
        current_name = class_names[first_match_index]

    state.add_detection(current_name)
    state.emit_status() # Emit status whenever a detection is added

# --- Flask HTTP Endpoints (for training and session management) ---

# Cleanup inactive sessions
def cleanup_sessions():
    while True:
        time.sleep(60) # Check every minute
        current_time = time.time()
        inactive_sids = []
        with threading.Lock(): # Protect session_states dictionary
            for sid, state in session_states.items():
                with state.lock:
                    if (current_time - state.last_update_time) > SESSION_TIMEOUT:
                        inactive_sids.append(sid)
            for sid in inactive_sids:
                print(f"Cleaning up inactive session: {sid}")
                del session_states[sid]

# Start session cleanup thread
session_cleanup_thread = threading.Thread(target=cleanup_sessions, daemon=True)
session_cleanup_thread.start()


@app.route('/train_face', methods=['POST'])
def train_face_http():
    # This endpoint remains for training, which usually involves a manual capture.
    name = request.json.get('name')
    if not name:
        return jsonify({"success": False, "message": "Name is required."}), 400

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"success": False, "message": "Could not open webcam for training."}), 500

    print(f"Starting face capture for {name} for training...")
    start_time = time.time()
    capture_duration = 10
    face_captured = False

    # This part typically runs on a dedicated training machine, not the main server
    # to avoid UI blocking. You might remove or adapt the cv2.imshow for serverless.
    cv2.namedWindow(f"Capture Face for {name}", cv2.WINDOW_NORMAL)
    cv2.resizeWindow(f"Capture Face for {name}", 640, 480)

    while (time.time() - start_time) < capture_duration and not face_captured:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame during training capture.")
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)

        display_frame = frame.copy()
        if face_locations:
            face_captured = save_face_encoding(name, frame)
            y1, x2, y2, x1 = face_locations[0]
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(display_frame, "Face Detected! Capturing...", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            if face_captured:
                cv2.putText(display_frame, "Face Captured Successfully!", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.imshow(f"Capture Face for {name}", display_frame)
                cv2.waitKey(2000)
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

@app.route('/reset_recognition_state', methods=['POST'])
def reset_recognition_state_http():
    try:
        # For HTTP requests, we need to handle session identification differently
        # since request.sid is typically None for regular HTTP requests
        
        # Check if a specific session_id is provided in the request body
        data = request.get_json() or {}
        session_id = data.get('session_id')
        
        if session_id and session_id in session_states:
            # Reset specific session
            session_states[session_id].reset()
            return jsonify({"success": True, "message": f"Session {session_id} recognition state reset."})
        elif session_id:
            # Session ID provided but not found
            return jsonify({"success": False, "message": f"Session {session_id} not found."}), 404
        else:
            # No session ID provided - this is typically called before establishing socket connection
            # In this case, we'll prepare for a fresh session by not doing anything
            # The actual reset will happen when the socket connects
            return jsonify({"success": True, "message": "Ready for new recognition session. Connect via Socket.IO to begin."})
    except Exception as err:
        print("The error is:", str(err))


@app.route('/get_session_status/<session_id>', methods=['GET'])
def get_session_status_http(session_id):
    """HTTP endpoint to check session status without Socket.IO"""
    if session_id in session_states:
        status = session_states[session_id].get_status()
        return jsonify({"success": True, "status": status})
    else:
        return jsonify({"success": False, "message": "Session not found."}), 404

# --- Socket.IO Event Handlers ---

@socketio.on('connect')
def handle_connect():
    sid = request.sid
    print(f"[{sid}] Client connected")
    
    # Create a new detection state for this session
    session_states[sid] = FaceDetectionState(sid)
    join_room(sid)  # Join a room with the session ID for targeted emissions
    
    # Send initial status
    emit('recognition_status', session_states[sid].get_status())
    emit('connection_confirmed', {'sid': sid, 'message': 'Connected successfully'})

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f"[{sid}] Client disconnected")
    
    # Clean up the session state
    if sid in session_states:
        del session_states[sid]
    leave_room(sid)

@socketio.on('start_recognition')
def handle_start_recognition():
    sid = request.sid
    print(f"[{sid}] Starting recognition session")
    
    if sid not in session_states:
        session_states[sid] = FaceDetectionState(sid)
    else:
        # Reset existing state for fresh recognition
        session_states[sid].reset()
    
    emit('recognition_started', {'message': 'Recognition session started'})

@socketio.on('process_frame')
def handle_process_frame(data):
    sid = request.sid
    
    if sid not in session_states:
        emit('error', {'message': 'No active recognition session. Call start_recognition first.'})
        return
    
    state = session_states[sid]
    
    # Check if recognition is already complete
    if state.is_signed_in or (state.detection_count >= 5 and not state.is_signed_in):
        emit('recognition_complete', state.get_status())
        return
    
    try:
        image_data_b64 = data.get('image')
        if not image_data_b64:
            emit('error', {'message': 'No image data provided'})
            return
        
        # Clean the base64 string (remove 'data:image/jpeg;base64,' prefix if present)
        if ',' in image_data_b64:
            image_data_b64 = image_data_b64.split(',')[1]
        
        # Decode base64 string to bytes
        img_bytes = base64.b64decode(image_data_b64)
        
        # Convert bytes to numpy array
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img_np = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img_np is None:
            emit('error', {'message': 'Could not decode image'})
            return
        
        # Process the frame for recognition
        process_image_for_recognition(img_np, state)
        
        # Check if recognition is now complete
        if state.is_signed_in or (state.detection_count >= 5 and not state.is_signed_in):
            emit('recognition_complete', state.get_status())
        
    except Exception as e:
        print(f"[{sid}] Error processing frame: {e}")
        emit('error', {'message': f'Error processing frame: {str(e)}'})

@socketio.on('reset_session')
def handle_reset_session():
    sid = request.sid
    print(f"[{sid}] Resetting recognition session")
    
    if sid in session_states:
        session_states[sid].reset()
        emit('session_reset', {'message': 'Recognition session reset successfully'})
    else:
        # Create new session if doesn't exist
        session_states[sid] = FaceDetectionState(sid)
        emit('session_reset', {'message': 'New recognition session created'})

@socketio.on('get_status')
def handle_get_status():
    sid = request.sid
    
    if sid in session_states:
        status = session_states[sid].get_status()
        emit('recognition_status', status)
    else:
        emit('error', {'message': 'No active session found'})

@socketio.on('end_session')
def handle_end_session():
    sid = request.sid
    print(f"[{sid}] Ending recognition session")
    
    if sid in session_states:
        final_status = session_states[sid].get_status()
        del session_states[sid]
        emit('session_ended', {'message': 'Recognition session ended', 'final_status': final_status})
    else:
        emit('session_ended', {'message': 'No active session to end'})

# --- Additional HTTP endpoints for compatibility ---

@app.route('/active_sessions', methods=['GET'])
def get_active_sessions():
    """Debug endpoint to see active sessions"""
    sessions_info = {}
    for sid, state in session_states.items():
        sessions_info[sid] = {
            'detection_count': state.detection_count,
            'is_signed_in': state.is_signed_in,
            'confirmed_user': state.confirmed_user,
            'last_update': state.last_update_time
        }
    return jsonify({"active_sessions": sessions_info, "total": len(sessions_info)})

if __name__ == '__main__':
    print("Starting Socket.IO Face Recognition Server...")
    print(f"Loaded {len(class_names)} known faces: {class_names}")
    # Use socketio.run instead of app.run for Socket.IO support
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)