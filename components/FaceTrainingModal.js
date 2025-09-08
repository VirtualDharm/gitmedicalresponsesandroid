import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Alert,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { X, Camera, User } from 'lucide-react-native';
import { faceRecognitionService } from '@/services/FaceRecognitionService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export function FaceTrainingModal({ visible, onClose, onTrainingComplete }) {
  const [name, setName] = useState('');
  const [isTraining, setIsTraining] = useState(false);

  const handleTrainFace = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for training');
      return;
    }

    setIsTraining(true);
    
    try {
      const result = await faceRecognitionService.trainFace(name.trim());
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Face training completed for ${name}. You can now use face recognition to sign in.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onTrainingComplete(name);
                setName('');
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Training Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to train face. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleClose = () => {
    if (!isTraining) {
      setName('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Train Face Recognition</Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={isTraining}
          >
            <X color="#64748B" size={isTablet ? 28 : 24} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Camera color="#2563EB" size={isTablet ? 64 : 48} />
          </View>

          <Text style={styles.description}>
            Enter your name and we'll capture your face for secure biometric authentication. 
            Make sure you're in a well-lit area and looking directly at the camera.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputWrapper}>
              <User color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#94A3B8"
                editable={!isTraining}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Training Instructions:</Text>
            <Text style={styles.instructionItem}>• Look directly at the camera</Text>
            <Text style={styles.instructionItem}>• Ensure good lighting on your face</Text>
            <Text style={styles.instructionItem}>• Remove glasses if possible</Text>
            <Text style={styles.instructionItem}>• Keep a neutral expression</Text>
            <Text style={styles.instructionItem}>• Stay still during capture</Text>
          </View>

          <TouchableOpacity 
            style={[styles.trainButton, isTraining && styles.disabledButton]}
            onPress={handleTrainFace}
            disabled={isTraining || !name.trim()}
          >
            {isTraining ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.trainButtonText}>Training Face...</Text>
              </View>
            ) : (
              <>
                <Camera color="white" size={isTablet ? 24 : 20} />
                <Text style={styles.trainButtonText}>Start Face Training</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isTablet ? 60 : 50,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingBottom: isTablet ? 24 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: isTablet ? 22 : 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: isTablet ? 32 : 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 32 : 24,
  },
  description: {
    fontSize: isTablet ? 18 : 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 24,
    marginBottom: isTablet ? 32 : 24,
  },
  inputContainer: {
    marginBottom: isTablet ? 32 : 24,
  },
  label: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: isTablet ? 20 : 16,
    height: isTablet ? 64 : 56,
  },
  inputIcon: {
    marginRight: isTablet ? 16 : 12,
  },
  input: {
    flex: 1,
    fontSize: isTablet ? 18 : 16,
    color: '#1E293B',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: isTablet ? 24 : 20,
    marginBottom: isTablet ? 32 : 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: isTablet ? 16 : 12,
  },
  instructionItem: {
    fontSize: isTablet ? 14 : 12,
    color: '#64748B',
    marginBottom: isTablet ? 8 : 6,
    lineHeight: isTablet ? 20 : 18,
  },
  trainButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    gap: isTablet ? 12 : 8,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 12 : 8,
  },
  trainButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});