import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail, Lock, User, Phone, Calendar, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    const success = await signUp(formData);
    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Sign Up Failed', 'Unable to create account. Please try again.');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join MedTracker to start monitoring your health</Text>

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <User color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First name"
                      value={formData.firstName}
                      onChangeText={(value) => updateField('firstName', value)}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <User color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last name"
                      value={formData.lastName}
                      onChangeText={(value) => updateField('lastName', value)}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <View style={styles.inputWrapper}>
                  <Calendar color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={formData.dateOfBirth}
                    onChangeText={(value) => updateField('dateOfBirth', value)}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Create password"
                    value={formData.password}
                    onChangeText={(value) => updateField('password', value)}
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#94A3B8" size={isTablet ? 24 : 20} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateField('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? 
                      <EyeOff color="#94A3B8" size={isTablet ? 24 : 20} /> : 
                      <Eye color="#94A3B8" size={isTablet ? 24 : 20} />
                    }
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              <TouchableOpacity 
                style={[styles.signUpButton, isLoading && styles.disabledButton]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.signUpButtonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    maxWidth: isTablet ? 800 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 10,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingBottom: isTablet ? 40 : 20,
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
    marginBottom: isTablet ? 40 : 32,
  },
  row: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: isTablet ? 24 : 0,
  },
  inputContainer: {
    marginBottom: isTablet ? 28 : 20,
  },
  halfWidth: {
    flex: isTablet ? 1 : undefined,
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
  signUpButton: {
    backgroundColor: '#2563EB',
    height: isTablet ? 64 : 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isTablet ? 16 : 8,
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
  signUpButtonText: {
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
});