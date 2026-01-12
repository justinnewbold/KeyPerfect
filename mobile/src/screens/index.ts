export { HomeScreen } from './HomeScreen';

// Placeholder screens - to be implemented
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const createPlaceholderScreen = (name: string) => {
  return function PlaceholderScreen() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
      </View>
    );
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
  },
});

export const PlayScreen = createPlaceholderScreen('Play');
export const LearnScreen = createPlaceholderScreen('Learn');
export const StatsScreen = createPlaceholderScreen('Stats');
export const SettingsScreen = createPlaceholderScreen('Settings');
export const GameScreen = createPlaceholderScreen('Game');
