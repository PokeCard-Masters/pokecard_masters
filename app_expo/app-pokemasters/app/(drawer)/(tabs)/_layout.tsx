import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import FloatingUserMenu from '@/components/FloattingMenu';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#9B9EF0',
          tabBarInactiveTintColor: '#8C8CA1',
          headerStyle: { backgroundColor: '#F8F8FF' },
          headerShadowVisible: false,
          headerTintColor: '#2F265F',
          headerTitleAlign: 'center',
          tabBarStyle: {
            backgroundColor: '#F8F8FF',
            borderTopWidth: 0,
            height: 68,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerTitle: 'Menu',
            headerLeft: () => <></>,
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'home-sharp' : 'home-outline'}
                color={color}
                size={20}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="booster"
          options={{
            headerTitle: 'Jouer',
            tabBarLabel: 'Jouer',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={
                  focused
                    ? 'game-controller-sharp'
                    : 'game-controller-outline'
                }
                color={color}
                size={20}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="pokedex"
          options={{
            headerTitle: 'Pokedex',
            tabBarLabel: 'Pokedex',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name="catching-pokemon"
                color={color}
                size={20}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="drawer-btn"
          options={{
            tabBarButton: () => <FloatingUserMenu />,
          }}
        />
      </Tabs>
    </View>
  );
}
