import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { PlayScreen } from './src/screens/PlayScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GameScreen } from './src/screens/GameScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Play':
              iconName = focused ? 'play-circle' : 'play-circle-outline';
              break;
            case 'Learn':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Stats':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
        },
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: '#A855F7',
              background: '#0f0c29',
              card: '#1a1a2e',
              text: '#ffffff',
              border: '#333',
              notification: '#A855F7',
            },
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{
                presentation: 'fullScreenModal',
              }}
            />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
