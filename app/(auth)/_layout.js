import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="face-signin" />
    </Stack>
  );
}