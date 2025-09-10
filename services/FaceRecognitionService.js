import io from 'socket.io-client'; // Import socket.io-client

class FaceRecognitionService {
  constructor() {
    this.baseUrl = 'http://localhost:5000'; // Flask server URL
    this.socket = null; // Socket.IO client instance
  }

  connectSocket() {
    if (!this.socket || !this.socket.connected) {
      console.log('Connecting to Socket.IO server...');
      this.socket = io(this.baseUrl, {
        transports: ['websocket'], // Prefer WebSocket for real-time streaming
        jsonp: false // Recommended for React Native
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected!');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });
    }
  }

  disconnectSocket() {
    if (this.socket && this.socket.connected) {
      console.log('Disconnecting Socket.IO client...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async trainFace(name) {
    try {
      const response = await fetch(`${this.baseUrl}/train_face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error training face:', error);
      return {
        success: false,
        message: 'Failed to connect to face recognition service',
      };
    }
  }

  // recognizeFace (HTTP POST) is no longer used for streaming,
  // it's replaced by emitting 'image_stream' via socket.
  // Keeping it as a placeholder if you need it for single image POST elsewhere.
  async recognizeFace(imageDataBase64) {
      console.warn("recognizeFace (HTTP POST) is deprecated for streaming. Use socket.emit('image_stream').");
      // You could still use this for a one-off recognition if needed,
      // but the streaming logic now relies on sockets.
      try {
        const response = await fetch(`${this.baseUrl}/recognize_image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imageDataBase64 }),
        });

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error recognizing face from image via HTTP:', error);
        return {
          success: false,
          message: 'Failed to connect to face recognition service or process image via HTTP',
        };
      }
  }


  async resetRecognitionState() {
      try {
          // Send an HTTP POST request to reset the backend's state
          const response = await fetch(`${this.baseUrl}/reset_recognition_state`, { method: 'POST' });
          const data = await response.json();
          console.log("Backend state reset response:", data);
          return { success: true, message: "Backend recognition state reset." };
      } catch (error) {
          console.error('Error resetting backend state:', error);
          return { success: false, message: "Failed to reset backend state." };
      }
  }

  // stopRecognitionStream and getRecognitionStatus (HTTP polling) are removed.
  // Status updates are now real-time via Socket.IO.
  // The client no longer needs to poll the backend.
  // The backend will *emit* status when it changes.

  // The previous polling methods are now obsolete for the streaming use case.
  // However, the `recognition_status` *event* still exists on the backend
  // and is listened to by the client `socket.on('recognition_status', ...)`
}

export const faceRecognitionService = new FaceRecognitionService();