print("Starting the training image capture process...")
import cv2
import face_recognition
import os
import numpy as np
print("Starting the training image capture process...")

# Create a directory to store training images if it doesn't exist
output_folder = 'faces'
os.makedirs(output_folder, exist_ok=True)
print(f"Ensured directory '{output_folder}' exists.")
print("Starting the training image capture process...")

# Get the name for encoding
name = input("Enter name for the person (e.g., JohnDoe): ")
if not name:
    print("Name cannot be empty. Exiting.")
    exit()

# Initialize video capture
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam. Please ensure it's connected and not in use.")
    exit()

print("\n--- Training Image Capture ---")
print(f"Capturing image for: {name}")
print("Press 'c' to CAPTURE the image.")
print("Press 'q' to QUIT without capturing.")

while True:
    success, frame = cap.read()
    if not success:
        print("Failed to capture frame from webcam. Exiting.")
        break

    # Display the captured frame
    cv2.imshow("Training - Press 'c' to capture or 'q' to quit", frame)

    key = cv2.waitKey(1) & 0xFF

    # Capture the frame when 'c' is pressed
    if key == ord('c'):
        img_path = os.path.join(output_folder, f'{name}.jpg')
        cv2.imwrite(img_path, frame)  # Save the original frame
        print(f"Image saved at: {img_path}")

        # Convert the frame to RGB and find encodings
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(img_rgb)

        if encodings:
            # Save the face encoding as a numpy array
            np.save(os.path.join(output_folder, f'{name}_encoding.npy'), encodings[0])
            print(f"Encoding saved for {name}")
            print("Image and encoding saved. You can now run the real-time recognition script.")
            break # Exit after successful capture and encoding
        else:
            print("No face detected in the captured image. Please try again with your face clearly visible.")
            # Do not break, allow user to try again
            
    # Exit the loop when 'q' is pressed
    elif key == ord('q'):
        print("Exiting capture process.")
        break

# Release the video capture and close windows
cap.release()
cv2.destroyAllWindows()
print("Resources released.")