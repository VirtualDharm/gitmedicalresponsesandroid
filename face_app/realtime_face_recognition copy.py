import cv2
import face_recognition
import numpy as np
import os
from collections import Counter
import time

# Path for saved encodings
encodings_path = 'faces'

# Load encodings and class names
def load_encodings(encodings_path):
    encodings = []
    class_names = []
    
    if not os.path.exists(encodings_path):
        print(f"Error: Encodings path '{encodings_path}' does not exist.")
        return [], []

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

# Face detection state management
class FaceDetectionState:
    def __init__(self):
        self.detection_history = []
        self.detection_count = 0
        self.confirmed_user = None
        self.sign_in_time = None
        self.is_signed_in = False
        
    def add_detection(self, name):
        self.detection_count += 1
        self.detection_history.append(name)
        print(f"Detection {self.detection_count}: {name}")
        
        # After 5 detections, determine the most frequent user
        if self.detection_count == 5:
            self.determine_user()
            
    def determine_user(self):
        # Count occurrences of each detected name
        name_counts = Counter(self.detection_history)
        most_common = name_counts.most_common(1)
        
        if most_common and most_common[0][1] >= 3:  # At least 3 out of 5 detections
            self.confirmed_user = most_common[0][0]
            if self.confirmed_user != "Unknown":
                self.sign_in_time = time.strftime("%Y-%m-%d %H:%M:%S")
                self.is_signed_in = True
                print(f"\n✅ USER CONFIRMED: {self.confirmed_user}")
                print(f"📅 Sign-in Time: {self.sign_in_time}")
                print(f"🔍 Detection History: {self.detection_history}")
                print(f"📊 Confidence: {most_common[0][1]}/5 detections")
            else:
                print(f"\n❌ UNKNOWN USER - Access Denied")
                print(f"🔍 Detection History: {self.detection_history}")
        else:
            print(f"\n⚠️  INCONCLUSIVE RESULTS - Please try again")
            print(f"🔍 Detection History: {self.detection_history}")
            print(f"📊 Most frequent: {most_common[0][0] if most_common else 'None'} ({most_common[0][1] if most_common else 0}/5)")
            
    def reset(self):
        self.detection_history = []
        self.detection_count = 0
        self.confirmed_user = None
        self.sign_in_time = None
        self.is_signed_in = False
        print("\n🔄 Detection reset. Starting new recognition cycle...")

known_encodings, class_names = load_encodings(encodings_path)

if not known_encodings:
    print("No known face encodings found. Please run 'capture_training_images.py' first.")
    exit()

print(f"Loaded classes: {class_names}")

# Initialize video capture
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam. Please ensure it's connected and not in use.")
    exit()

# Initialize face detection state
face_state = FaceDetectionState()

# Downscale factor for performance (0.25 means 1/4th resolution)
scale_factor = 0.25

print("\n--- Real-Time Face Recognition with 5-Detection Averaging ---")
print("📋 Instructions:")
print("  - Look directly at the camera for accurate detection")
print("  - System will analyze first 5 detections to confirm identity")
print("  - Press 'r' to RESET and start new detection cycle")
print("  - Press 'q' to QUIT the recognition system")
print("\n🎯 Starting detection cycle...")

while True:
    success, frame = cap.read()
    if not success:
        print("Failed to capture frame from webcam. Exiting.")
        break

    # Create info overlay
    overlay_y = 30
    
    # Show current detection count and status
    if not face_state.is_signed_in:
        status_text = f"Detections: {face_state.detection_count}/5"
        cv2.putText(frame, status_text, (10, overlay_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        if face_state.detection_count > 0:
            history_text = f"History: {', '.join(face_state.detection_history[-3:])}"  # Show last 3
            cv2.putText(frame, history_text, (10, overlay_y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
    else:
        # Show signed-in user details
        user_text = f"SIGNED IN: {face_state.confirmed_user}"
        time_text = f"Time: {face_state.sign_in_time}"
        cv2.putText(frame, user_text, (10, overlay_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, time_text, (10, overlay_y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    # Only process face detection if not signed in or still collecting samples
    if not face_state.is_signed_in and face_state.detection_count < 5:
        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=scale_factor, fy=scale_factor)
        
        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        # Find all the faces and face encodings in the current frame of video
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        # Process each detected face (typically we expect one face for sign-in)
        for face_encoding, face_location in zip(face_encodings, face_locations):
            # Compare current face with known faces
            matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
            name = "Unknown"

            # If a match was found in known_face_encodings, use the first one
            if True in matches:
                first_match_index = matches.index(True)
                name = class_names[first_match_index]

            # Add detection to history
            face_state.add_detection(name)

            # Scale back up face locations to original frame size
            y1, x2, y2, x1 = [int(loc / scale_factor) for loc in face_location]

            # Choose color based on detection status
            if name == "Unknown":
                color = (0, 0, 255)  # Red for unknown
            else:
                color = (0, 255, 0)  # Green for known

            # Draw a rectangle around the face
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Draw a label with a name below the face
            cv2.rectangle(frame, (x1, y2 - 25), (x2, y2), color, cv2.FILLED)
            font = cv2.FONT_HERSHEY_DUPLEX
            cv2.putText(frame, name.upper(), (x1 + 6, y2 - 6), font, 0.7, (255, 255, 255), 1)

            # Break after first face to avoid multiple simultaneous detections
            break

    # Display the resulting image
    cv2.imshow("Face Recognition System - Press 'r' to reset, 'q' to quit", frame)

    key = cv2.waitKey(1) & 0xFF
    
    # Reset detection when 'r' is pressed
    if key == ord('r'):
        face_state.reset()
    
    # Hit 'q' on the keyboard to quit
    elif key == ord('q'):
        if face_state.is_signed_in:
            print(f"\n👋 Goodbye {face_state.confirmed_user}!")
            print(f"📊 Session Summary:")
            print(f"   - User: {face_state.confirmed_user}")
            print(f"   - Sign-in Time: {face_state.sign_in_time}")
            print(f"   - Detection History: {face_state.detection_history}")
        break

# Release handle to the webcam
cap.release()
cv2.destroyAllWindows()
print("Resources released.")