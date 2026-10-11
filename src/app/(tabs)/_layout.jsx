import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#8A94A6',

        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },

        tabBarStyle: {
          position: 'absolute',

          // Keep the floating bar above the bottom system area.
          bottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 10),

          left: 20,
          right: 20,

          height: 65,
          paddingTop: 8,
          paddingBottom: 8,

          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          borderTopWidth: 0,

          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },

        // Keep screen content clear of the floating tab bar.
        sceneStyle: {
          backgroundColor: '#F8FAFC',
        },

        tabBarItemStyle: {
          borderRadius: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="add-circle"
              size={30}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="message"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
