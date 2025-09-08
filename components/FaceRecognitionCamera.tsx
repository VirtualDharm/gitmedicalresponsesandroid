import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { faceRecognitionService, FaceRecognitionStatus } from '@/services/FaceRecognitionService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface Props {
  onRecognitionComplete: (user: string) => void;
  onRecognitionFailed: () => void;
}

export function FaceRecognitionCamera({ onRecognitionComplete, onRecognitionFailed }: Props) {
  const [status, setStatus] = useState<FaceRecognitionStatus | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    startRecognition();
    return () => {
      cleanup();
    };
  }, []);

  const startRecognition = async () => {
    try {
      const result = await faceRecognitionService.startRecognitionStream();
      if (result.success) {
        setIsStreaming(true);
        // Start polling for recognition status
        faceRecognitionService.startPolling((newStatus) => {
          setStatus(newStatus);
          
          // Check if recognition is complete
          if (newStatus.is_signed_in && newStatus.confirmed_user) {
            onRecognitionComplete(newStatus.confirmed_user);
            cleanup();
          } else if (newStatus.detection_count >= 5 && !newStatus.is_signed_in) {
            onRecognitionFailed();
            cleanup();
          }
        });
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start face recognition');
    }
  };

  const cleanup = async () => {
    faceRecognitionService.stopPolling();
    if (isStreaming) {
      await faceRecognitionService.stopRecognitionStream();
      setIsStreaming(false);
    }
  };

  const getStatusColor = () => {
    if (!status) return '#64748B';
    if (status.is_signed_in) return '#059669';
    if (status.detection_count >= 5) return '#DC2626';
    return '#D97706';
  };

  const getStatusMessage = () => {
    if (!status) return 'Initializing...';
    if (status.is_signed_in) return `Welcome ${status.confirmed_user}!`;
    if (status.detection_count >= 5) return 'Recognition failed. Please try again.';
    return `Analyzing... ${status.detection_count}/5 detections`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {isStreaming ? (
          <WebView
            source={{ uri: faceRecognitionService.getVideoFeedUrl() }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Starting camera...</Text>
          </View>
        )}
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
  },
  webview: {
    flex: 1,
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
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 24 : 20,
    paddingHorizontal: isTablet ? 32 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
});