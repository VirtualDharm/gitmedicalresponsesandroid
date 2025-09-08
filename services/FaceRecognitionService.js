class FaceRecognitionService {
  constructor() {
    this.baseUrl = 'http://localhost:5000'; // Flask server URL
    this.pollingInterval = null;
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

  async startRecognitionStream() {
    try {
      const response = await fetch(`${this.baseUrl}/start_recognition_stream`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting recognition stream:', error);
      return {
        success: false,
        message: 'Failed to start recognition stream',
      };
    }
  }

  async stopRecognitionStream() {
    try {
      const response = await fetch(`${this.baseUrl}/stop_recognition_stream`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error stopping recognition stream:', error);
      return {
        success: false,
        message: 'Failed to stop recognition stream',
      };
    }
  }

  async getRecognitionStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/recognition_status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting recognition status:', error);
      return {
        is_signed_in: false,
        confirmed_user: null,
        detection_count: 0,
        sign_in_time: null,
        message: 'Failed to get status',
      };
    }
  }

  startPolling(callback, interval = 1000) {
    this.pollingInterval = setInterval(async () => {
      const status = await this.getRecognitionStatus();
      callback(status);
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getVideoFeedUrl() {
    return `${this.baseUrl}/video_feed`;
  }
}

export const faceRecognitionService = new FaceRecognitionService();