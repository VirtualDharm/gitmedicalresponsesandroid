import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { faceRecognitionService } from '@/services/FaceRecognitionService';
import { X } from 'lucide-react-native'; // Only X icon as capture button is removed

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export function FaceRecognitionCamera({ onRecognitionComplete, onRecognitionFailed, onCancel }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false); // New state to manage streaming
  const cameraRef = useRef(null); // Ref for the camera component
  const captureIntervalRef = useRef(null); // Ref for the interval to clear it

  // Initialize Socket.IO connection
  useEffect(() => {
    faceRecognitionService.connectSocket();

    // Listen for real-time status updates from the backend via socket
    faceRecognitionService.socket.on('recognition_status', (newStatus) => {
      setStatus(newStatus);
      console.log('Socket Status Update:', newStatus);

      if (newStatus.is_signed_in && newStatus.confirmed_user) {
        onRecognitionComplete(newStatus.confirmed_user);
        stopStreaming(); // Stop streaming and socket when complete
      } else if (newStatus.detection_count >= 5 && !newStatus.is_signed_in) {
        // Only trigger failure if it's the final count and not signed in
        if (!status || status.detection_count < 5) { // Prevent multiple alerts
             onRecognitionFailed();
             stopStreaming(); // Stop streaming and socket when failed
        }
      }
    });

    // Handle disconnection
    faceRecognitionService.socket.on('disconnect', () => {
      console.log('Socket disconnected from server');
      // Optionally handle UI changes or attempt reconnect
    });

    // Cleanup on component unmount
    return () => {
      stopStreaming();
      faceRecognitionService.disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (permission && permission.granted && !isStreaming) {
      startStreaming();
    }
  }, [permission]);


  const startStreaming = useCallback(async () => {
    if (cameraRef.current && !isStreaming) {
      setIsStreaming(true);
      console.log("Starting continuous image streaming...");

      // Reset backend state for a new recognition attempt
      await faceRecognitionService.resetRecognitionState();

      captureIntervalRef.current = setInterval(async () => {
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.7, // Lower quality for streaming performance
              base64: true,
            });
            if (photo.base64) {
              // Emit the image over Socket.IO
              faceRecognitionService.socket.emit('image_stream', photo.base64);
            }
          } catch (error) {
            console.error("Error capturing frame for streaming:", error);
            // Optionally stop streaming on persistent errors
          }
        }
      }, 200); // Send a frame every 200ms (5 frames/sec)
    }
  }, [isStreaming]);

  const stopStreaming = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (isStreaming) {
        setIsStreaming(false);
        console.log("Stopped continuous image streaming.");
        faceRecognitionService.disconnectSocket(); // Disconnect socket
    }
  }, [isStreaming]);


  const getStatusColor = () => {
    if (!status) return '#64748B'; // Initializing
    if (status.is_signed_in) return '#059669'; // Green
    if (status.detection_count >= 5 && !status.is_signed_in) return '#DC2626'; // Red
    return '#D97706'; // Orange (Analyzing)
  };

  const getStatusMessage = () => {
    if (!status) return 'Initializing recognition...';
    if (status.is_signed_in) return `Welcome ${status.confirmed_user}!`;
    if (status.detection_count >= 5 && !status.is_signed_in) return 'Recognition failed. Please try again.';
    if (status.detection_count > 0) return `Analyzing... ${status.detection_count}/5 detections`;
    return 'Waiting for face detection...';
  };

  if (!permission) {
    return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="front"
          ref={cameraRef}
          // previewEnabled={true} // Generally default, but explicit if needed
          // onCameraReady={startStreaming} // Start streaming when camera is ready
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.faceOutline} />
          </View>
        </CameraView>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusMessage()}</Text>
      </View>

      {status && status.detection_count > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(status.detection_count / 5) * 100}%`,
                  backgroundColor: getStatusColor()
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Detection Progress: {status.detection_count}/5
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {/* The capture button is removed for continuous streaming */}
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={!isStreaming} // Disable if not streaming or already stopped
          >
            <X color="#CBD5E1" size={isTablet ? 28 : 24} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: isTablet ? 20 : 16,
    overflow: 'hidden',
    margin: isTablet ? 20 : 16,
    aspectRatio: 3 / 4, // Maintain a common aspect ratio for cameras
    alignSelf: 'center',
    width: '90%',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOutline: {
    width: '70%',
    height: '60%',
    borderRadius: 999, // Makes it an oval/circle
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderStyle: 'dashed',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  loadingText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 32 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute', // Position over camera
    top: isTablet ? 30 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    borderRadius: 10,
    marginHorizontal: isTablet ? 20 : 16,
  },
  statusIndicator: {
    width: isTablet ? 16 : 12,
    height: isTablet ? 16 : 12,
    borderRadius: isTablet ? 8 : 6,
    marginRight: isTablet ? 16 : 12,
  },
  statusText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: isTablet ? 32 : 24,
    paddingBottom: isTablet ? 32 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    bottom: isTablet ? 120 : 100, // Adjust based on button height
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressBar: {
    height: isTablet ? 8 : 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: isTablet ? 4 : 3,
    overflow: 'hidden',
    marginBottom: isTablet ? 12 : 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: isTablet ? 4 : 3,
  },
  progressText: {
    color: 'white',
    fontSize: isTablet ? 14 : 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isTablet ? 20 : 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cancelButton: {
    position: 'absolute',
    right: isTablet ? 30 : 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: isTablet ? 12 : 10,
    borderRadius: isTablet ? 25 : 20,
  },
});