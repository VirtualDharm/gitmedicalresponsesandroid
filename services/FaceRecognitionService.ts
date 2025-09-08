export interface FaceRecognitionStatus {
  is_signed_in: boolean;
  confirmed_user: string | null;
  detection_count: number;
  sign_in_time: string | null;
  message: string;
}

export interface TrainingResponse {
  success: boolean;
  message: string;
}

export interface RecognitionResult {
  success: boolean;
  message: string;
  result?: {
    is_signed_in: boolean;
    confirmed_user: string | null;
    sign_in_time: string | null;
  };
}

class FaceRecognitionService {
  private baseUrl = 'http://localhost:5000'; // Flask server URL
  private pollingInterval: NodeJS.Timeout | null = null;

  async trainFace(name: string): Promise<TrainingResponse> {
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

  async startRecognitionStream(): Promise<{ success: boolean; message: string }> {
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

  async stopRecognitionStream(): Promise<RecognitionResult> {
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

  async getRecognitionStatus(): Promise<FaceRecognitionStatus> {
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

  startPolling(callback: (status: FaceRecognitionStatus) => void, interval = 1000) {
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

  getVideoFeedUrl(): string {
    return `${this.baseUrl}/video_feed`;
  }
}

export const faceRecognitionService = new FaceRecognitionService();