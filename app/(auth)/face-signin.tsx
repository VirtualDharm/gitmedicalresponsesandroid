import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Camera, UserPlus } from 'lucide-react-native';
import { FaceRecognitionCamera } from '@/components/FaceRecognitionCamera';
import { FaceTrainingModal } from '@/components/FaceTrainingModal';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function FaceSignInScreen() {
  const { signInWithFace } = useAuth();
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);

  const handleRecognitionComplete = async (recognizedUser: string) => {
    setIsRecognizing(false);
    
    const success = await signInWithFace(recognizedUser);
    if (success) {
      Alert.alert(
        'Welcome!',
        `Successfully signed in as ${recognizedUser}`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          }
        ]
      );
    } else {
      Alert.alert('Sign In Failed', 'Unable to sign in with face recognition. Please try again.');
    }
  };

  const handleRecognitionFailed = () => {
    setIsRecognizing(false);
    Alert.alert(
      'Recognition Failed',
      'Face not recognized. Would you like to train your face or try again?',
      [
        { text: 'Try Again', onPress: () => setIsRecognizing(true) },
        { text: 'Train Face', onPress: () => setShowTrainingModal(true) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTrainingComplete = (name: string) => {
    Alert.alert(
      'Training Complete',
      `Face training completed for ${name}. You can now try signing in with face recognition.`,
      [
        {
          text: 'Sign In Now',
          onPress: () => setIsRecognizing(true),
        }
      ]
    );
  };

  const startRecognition = () => {
    setIsRecognizing(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft color="#64748B" size={isTablet ? 28 : 24} />
        </TouchableOpacity>
        <Text style={styles.title}>Face Recognition</Text>
        <View style={styles.placeholder} />
      </View>

      {isRecognizing ? (
        <FaceRecognitionCamera
          onRecognitionComplete={handleRecognitionComplete}
          onRecognitionFailed={handleRecognitionFailed}
        />
      ) : (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Camera color="#2563EB" size={isTablet ? 80 : 64} />
          </View>

          <Text style={styles.mainTitle}>Secure Face Recognition</Text>
          <Text style={styles.subtitle}>
            Use your face to securely access your medical dashboard. Our advanced biometric 
            system ensures only you can access your sensitive health information.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Camera color="#2563EB" size={isTablet ? 24 : 20} />
              </View>
              <Text style={styles.featureText}>Advanced facial recognition technology</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <UserPlus color="#059669" size={isTablet ? 24 : 20} />
              </View>
              <Text style={styles.featureText}>Secure biometric authentication</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={startRecognition}
            >
              <Camera color="white" size={isTablet ? 24 : 20} />
              <Text style={styles.primaryButtonText}>Start Face Recognition</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowTrainingModal(true)}
            >
              <UserPlus color="#2563EB" size={isTablet ? 24 : 20} />
              <Text style={styles.secondaryButtonText}>Train New Face</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FaceTrainingModal
        visible={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onTrainingComplete={handleTrainingComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: isTablet ? 60 : 50,
    paddingHorizontal: isTablet ? 32 : 24,
    paddingBottom: isTablet ? 24 : 20,
  },
  backButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholder: {
    width: isTablet ? 48 : 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 40 : 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: isTablet ? 40 : 32,
  },
  mainTitle: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: isTablet ? 20 : 16,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 24,
    marginBottom: isTablet ? 40 : 32,
    maxWidth: isTablet ? 600 : 320,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: isTablet ? 48 : 40,
    gap: isTablet ? 20 : 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: isTablet ? 20 : 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 16 : 12,
  },
  featureText: {
    fontSize: isTablet ? 16 : 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: isTablet ? 16 : 12,
  },
  primaryButton: {
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
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    gap: isTablet ? 12 : 8,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});