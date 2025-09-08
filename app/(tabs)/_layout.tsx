import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Heart } from 'lucide-react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function TabLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E2E8F0',
          height: isTablet ? 90 : 80,
          paddingBottom: isTablet ? 25 : 20,
          paddingTop: isTablet ? 12 : 8,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 14 : 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: isTablet ? 4 : 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Patient Data',
          tabBarIcon: ({ size, color }) => (
            <Heart size={isTablet ? size + 4 : size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}