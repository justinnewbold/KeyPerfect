import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  colors: string[];
  onPress: () => void;
}

function QuickAction({ icon, title, subtitle, colors, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickAction}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickActionGradient}
      >
        <Ionicons name={icon} size={32} color="#fff" />
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  value: string | number;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation();

  // TODO: Get these from state/storage
  const stats = {
    streak: 5,
    totalXP: 1250,
    accuracy: 78,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.levelText}>Level 3 - Seventh Heaven</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard value={stats.streak} label="Day Streak" />
        <StatCard value={stats.totalXP} label="Total XP" />
        <StatCard value={`${stats.accuracy}%`} label="Accuracy" />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Start</Text>
      <View style={styles.quickActionsGrid}>
        <QuickAction
          icon="musical-notes"
          title="Chords"
          subtitle="Identify chords"
          colors={['#A855F7', '#6366F1']}
          onPress={() => navigation.navigate('Game' as never, { mode: 'chords' } as never)}
        />
        <QuickAction
          icon="git-branch"
          title="Intervals"
          subtitle="Train your ear"
          colors={['#22C55E', '#10B981']}
          onPress={() => navigation.navigate('Game' as never, { mode: 'intervals' } as never)}
        />
        <QuickAction
          icon="layers"
          title="Scales"
          subtitle="Learn modes"
          colors={['#3B82F6', '#06B6D4']}
          onPress={() => navigation.navigate('Game' as never, { mode: 'scales' } as never)}
        />
        <QuickAction
          icon="flash"
          title="Daily"
          subtitle="Challenge"
          colors={['#F59E0B', '#EF4444']}
          onPress={() => navigation.navigate('Game' as never, { mode: 'daily' } as never)}
        />
      </View>

      {/* Genre Training */}
      <Text style={styles.sectionTitle}>Genre Training</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
        {[
          { name: 'Jazz', icon: 'musical-note', color: '#F59E0B' },
          { name: 'Classical', icon: 'library', color: '#8B5CF6' },
          { name: 'Blues', icon: 'guitar', color: '#3B82F6' },
          { name: 'Pop', icon: 'mic', color: '#EC4899' },
        ].map((genre) => (
          <TouchableOpacity key={genre.name} style={styles.genreCard}>
            <View style={[styles.genreIcon, { backgroundColor: genre.color }]}>
              <Ionicons name={genre.icon as any} size={24} color="#fff" />
            </View>
            <Text style={styles.genreName}>{genre.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Continue Practice</Text>
      <TouchableOpacity style={styles.continueCard}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.2)', 'rgba(99, 102, 241, 0.2)']}
          style={styles.continueGradient}
        >
          <View style={styles.continueContent}>
            <Ionicons name="play-circle" size={48} color="#A855F7" />
            <View style={styles.continueText}>
              <Text style={styles.continueTitle}>Level 3 Progress</Text>
              <Text style={styles.continueSubtitle}>15/30 questions completed</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelText: {
    fontSize: 16,
    color: '#A855F7',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickAction: {
    width: (width - 52) / 2,
    marginBottom: 12,
  },
  quickActionGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  genreScroll: {
    marginBottom: 16,
  },
  genreCard: {
    alignItems: 'center',
    marginRight: 16,
  },
  genreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreName: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  continueCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueText: {
    flex: 1,
    marginLeft: 16,
  },
  continueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  continueSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A855F7',
    borderRadius: 3,
  },
});
