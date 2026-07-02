import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth.store';

export default function Index() {
  const { isSignedIn, isLoading, onboardingSeen, remSetupSeen } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isSignedIn) {
      router.replace('/(auth)/welcome');
    } else if (!onboardingSeen) {
      router.replace('/(auth)/onboarding');
    } else if (!remSetupSeen) {
      router.replace('/(auth)/rem-setup');
    } else {
      router.replace('/(app)/home');
    }
  }, [isLoading, isSignedIn, onboardingSeen, remSetupSeen]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7F77DD' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
