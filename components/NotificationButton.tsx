import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Dimensions } from 'react-native';
import { Send } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export function NotificationButton() {
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    setIsSending(true);
    
    // Simulate sending notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSending(false);
    
    Alert.alert(
      '✅ Notification Sent',
      'Your healthcare provider has been notified about your current status and vital signs. They will review your data and contact you if needed.',
      [{ text: 'OK' }]
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.notificationButton, isSending && styles.sendingButton]}
      onPress={handleSendNotification}
      disabled={isSending}
      activeOpacity={0.8}
    >
      <Send color="#2563EB" size={isTablet ? 28 : 20} />
      <Text style={styles.notificationText}>
        {isSending ? 'Sending...' : 'Send Update to Provider'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: isTablet ? 72 : 56,
    borderRadius: isTablet ? 16 : 12,
    gap: isTablet ? 16 : 12,
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sendingButton: {
    opacity: 0.6,
  },
  notificationText: {
    color: '#2563EB',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
  },
});