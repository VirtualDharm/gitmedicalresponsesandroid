import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Info } from 'lucide-react-native';

interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Emergency Alert Sent',
      message: 'Your emergency alert has been sent to your healthcare provider.',
      timestamp: '2 minutes ago',
      isRead: false,
    },
    {
      id: '2',
      type: 'reminder',
      title: 'Medication Reminder',
      message: 'Time to take your morning medication.',
      timestamp: '1 hour ago',
      isRead: true,
    },
    {
      id: '3',
      type: 'info',
      title: 'Health Check Scheduled',
      message: 'Your next appointment is scheduled for tomorrow at 2:00 PM.',
      timestamp: '3 hours ago',
      isRead: true,
    },
    {
      id: '4',
      type: 'success',
      title: 'Reading Recorded',
      message: 'Your blood pressure reading has been successfully recorded.',
      timestamp: '5 hours ago',
      isRead: true,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertCircle;
      case 'reminder': return Clock;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert': return '#DC2626';
      case 'reminder': return '#D97706';
      case 'success': return '#059669';
      default: return '#2563EB';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.badgeContainer}>
          <Bell color="#2563EB" size={24} />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notifications.filter(n => !n.isRead).length}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => {
          const IconComponent = getNotificationIcon(notification.type);
          const iconColor = getNotificationColor(notification.type);
          
          return (
            <TouchableOpacity key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationContent}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                  <IconComponent color={iconColor} size={20} />
                </View>
                
                <View style={styles.textContent}>
                  <Text style={[
                    styles.notificationTitle,
                    !notification.isRead && styles.unreadTitle
                  ]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.timestamp}>{notification.timestamp}</Text>
                </View>
                
                {!notification.isRead && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#1E293B',
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginLeft: 8,
    marginTop: 8,
  },
});