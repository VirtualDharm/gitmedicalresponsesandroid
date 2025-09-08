import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Heart, Activity, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Heart color="#2563EB" size={isTablet ? 64 : 48} />
            <Text style={styles.logoText}>MedTracker</Text>
          </View>
          <Activity color="#059669" size={isTablet ? 32 : 24} style={styles.activityIcon} />
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Welcome to MedTracker</Text>
          <Text style={styles.subtitle}>
            Your comprehensive medical monitoring solution. Track vital signs, manage patient data, and ensure healthcare excellence.
          </Text>

          <View style={styles.featureGrid}>
            <View style={styles.feature}>
              <Shield color="#2563EB" size={isTablet ? 32 : 24} />
              <Text style={styles.featureTitle}>Secure Patient Data</Text>
              <Text style={styles.featureText}>HIPAA compliant data storage and management</Text>
            </View>
            <View style={styles.feature}>
              <Activity color="#059669" size={isTablet ? 32 : 24} />
              <Text style={styles.featureTitle}>Real-time Monitoring</Text>
              <Text style={styles.featureText}>Live vital signs tracking and alerts</Text>
            </View>
            <View style={styles.feature}>
              <Heart color="#DC2626" size={isTablet ? 32 : 24} />
              <Text style={styles.featureTitle}>Emergency Response</Text>
              <Text style={styles.featureText}>Instant emergency alert system</Text>
            </View>
          </View>
        </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 80 : 24,
    paddingVertical: isTablet ? 60 : 40,
    maxWidth: isTablet ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isTablet ? 60 : 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 12,
  },
  activityIcon: {
    opacity: 0.7,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: isTablet ? 48 : 36,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: isTablet ? 56 : 42,
  },
  subtitle: {
    fontSize: isTablet ? 20 : 18,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: isTablet ? 30 : 26,
    marginBottom: isTablet ? 60 : 40,
    maxWidth: isTablet ? 800 : 320,
  },
  featureGrid: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: isTablet ? 40 : 24,
    marginBottom: isTablet ? 60 : 40,
  },
  feature: {
    alignItems: 'center',
    padding: isTablet ? 32 : 24,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flex: isTablet ? 1 : undefined,
    minWidth: isTablet ? 200 : undefined,
  },
  featureTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: isTablet ? 16 : 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: isTablet ? 24 : 20,
  },
  buttonContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: isTablet ? 24 : 16,
    marginTop: 'auto',
  },
  button: {
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flex: isTablet ? 1 : undefined,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
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
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});