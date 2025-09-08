import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Camera } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    const success = await signIn(email, password);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft color="#64748B" size={isTablet ? 28 : 24} />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your medical dashboard</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? 
                    <EyeOff color="#94A3B8" size={isTablet ? 24 : 20} /> : 
                    <Eye color="#94A3B8" size={isTablet ? 24 : 20} />
                  }
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity 
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.faceRecognitionButton}
            onPress={() => router.push('/(auth)/face-signin')}
          >
            <Camera color="#2563EB" size={isTablet ? 24 : 20} />
            <Text style={styles.faceRecognitionText}>Sign in with Face Recognition</Text>
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
    maxWidth: isTablet ? 600 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 40 : 20,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: isTablet ? 48 : 40,
    lineHeight: isTablet ? 26 : 24,
  },
  form: {
    marginBottom: isTablet ? 48 : 40,
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
  passwordInput: {
    paddingRight: isTablet ? 48 : 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: isTablet ? 20 : 16,
  },
  signInButton: {
    backgroundColor: '#2563EB',
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  signInButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: isTablet ? 16 : 14,
    color: '#64748B',
  },
  linkText: {
    fontSize: isTablet ? 16 : 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: isTablet ? 14 : 12,
    marginTop: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isTablet ? 32 : 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: isTablet ? 20 : 16,
    fontSize: isTablet ? 14 : 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  faceRecognitionButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    gap: isTablet ? 12 : 8,
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faceRecognitionText: {
    color: '#2563EB',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});