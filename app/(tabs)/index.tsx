import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { MedicalReadingCard } from '@/components/MedicalReadingCard';
import { EmergencyButton } from '@/components/EmergencyButton';
import { NotificationButton } from '@/components/NotificationButton';
import { Activity, Droplets, Thermometer, Heart, Clock, User, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface MedicalReading {
  id: string;
  type: 'glucose' | 'blood_pressure' | 'temperature' | 'oxygen';
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  icon: any;
}

export default function PatientDataScreen() {
  const { user, signOut } = useAuth();
  
  const [medicalReadings] = useState<MedicalReading[]>([
    {
      id: '1',
      type: 'glucose',
      value: '98',
      unit: 'mg/dL',
      status: 'normal',
      timestamp: '2 hours ago',
      icon: Droplets,
    },
    {
      id: '2',
      type: 'blood_pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal',
      timestamp: '3 hours ago',
      icon: Activity,
    },
    {
      id: '3',
      type: 'temperature',
      value: '98.6',
      unit: '°F',
      status: 'normal',
      timestamp: '4 hours ago',
      icon: Thermometer,
    },
    {
      id: '4',
      type: 'oxygen',
      value: '98',
      unit: '%',
      status: 'normal',
      timestamp: '5 hours ago',
      icon: Heart,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#059669';
      case 'warning': return '#D97706';
      case 'critical': return '#DC2626';
      default: return '#64748B';
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            signOut();
            router.replace('/(auth)');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <User color="white" size={isTablet ? 32 : 24} />
          </View>
          <View>
            <Text style={styles.greeting}>Patient Dashboard</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut color="#64748B" size={isTablet ? 24 : 20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.patientInfoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medical ID:</Text>
              <Text style={styles.infoValue}>{user?.medicalId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>{user?.dateOfBirth}</Text>
            </View>
          </View>
        </View>

        {/* Vital Signs */}
        <View style={styles.vitalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Vital Signs</Text>
            <TouchableOpacity>
              <Clock color="#64748B" size={isTablet ? 24 : 20} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.readingsGrid}>
            {medicalReadings.map((reading) => (
              <MedicalReadingCard
                key={reading.id}
                reading={reading}
                statusColor={getStatusColor(reading.status)}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <EmergencyButton />
            <NotificationButton />
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isTablet ? 70 : 60,
    paddingHorizontal: isTablet ? 40 : 24,
    paddingBottom: isTablet ? 32 : 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: isTablet ? 64 : 48,
    height: isTablet ? 64 : 48,
    borderRadius: isTablet ? 32 : 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isTablet ? 20 : 16,
  },
  greeting: {
    fontSize: isTablet ? 18 : 16,
    color: '#64748B',
  },
  userName: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? 20 : 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: isTablet ? 10 : 8,
    height: isTablet ? 10 : 8,
    borderRadius: isTablet ? 5 : 4,
    backgroundColor: '#059669',
    marginRight: isTablet ? 10 : 8,
  },
  statusText: {
    fontSize: isTablet ? 16 : 14,
    color: '#059669',
    fontWeight: '600',
  },
  signOutButton: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: isTablet ? 40 : 24,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 32 : 24,
    marginBottom: isTablet ? 32 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: isTablet ? 20 : 16,
  },
  patientInfoGrid: {
    gap: isTablet ? 16 : 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: isTablet ? 8 : 4,
  },
  infoLabel: {
    fontSize: isTablet ? 16 : 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: isTablet ? 16 : 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  vitalsSection: {
    marginBottom: isTablet ? 32 : 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 20 : 16,
  },
  readingsGrid: {
    gap: isTablet ? 20 : 16,
  },
  actionsSection: {
    marginBottom: isTablet ? 60 : 40,
  },
  actionButtons: {
    gap: isTablet ? 20 : 16,
  },
});