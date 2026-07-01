import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { C } from '../../src/theme';

export default function AppLayout() {
  const { isSignedIn, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace('/(auth)/welcome');
    }
  }, [isSignedIn, isLoading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.systemGray,
        tabBarStyle: {
          borderTopColor: C.separator,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Aujourd'hui",
          tabBarIcon: ({ color }) => (
            <SFIcon name="calendar.fill" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Listes',
          tabBarIcon: ({ color }) => (
            <SFIcon name="list.bullet" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'IA',
          tabBarIcon: ({ color }) => (
            <SFIcon name="sparkles" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <SFIcon name="star.fill" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Moi',
          tabBarIcon: ({ color }) => (
            <SFIcon name="person.crop.circle.fill" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="routines" options={{ href: null }} />
      <Tabs.Screen name="integrations" options={{ href: null }} />
      <Tabs.Screen name="preferences" options={{ href: null }} />
      <Tabs.Screen name="detail" options={{ href: null }} />
      <Tabs.Screen name="edit" options={{ href: null }} />
      <Tabs.Screen name="paywall" options={{ href: null }} />
    </Tabs>
  );
}
