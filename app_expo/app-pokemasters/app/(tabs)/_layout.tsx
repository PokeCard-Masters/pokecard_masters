import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#9B9EF0',
                    headerStyle: {
                        backgroundColor: '#F8F8FF'
                    },
                    headerShadowVisible: false,
                    headerTintColor: '#2F265F',
                    headerTitleAlign: 'center',
                    tabBarStyle: {
                        backgroundColor: '#F8F8FF',
                    },
                }}>
                <Tabs.Screen
                    name='index'
                    options={{
                        headerTitle: 'Menu',
                        headerLeft: () => <></>,
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "home-sharp" : "home-outline"}
                                color={color}
                                size={20}
                            />
                        )
                    }}
                />
                <Tabs.Screen
                    name='about'
                    options={{
                        headerTitle: 'Jouer',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "game-controller-sharp" : "game-controller-outline"}
                                color={color}
                                size={20}
                            />
                        )
                    }}
                />
                <Tabs.Screen
                    name="pokedex"
                    options={{
                        headerTitle: 'Pokedex',
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons
                                name='catching-pokemon'
                                color={color}
                                size={20}
                            />
                        )
                    }}
                />
            </Tabs>
        </>
    );
}