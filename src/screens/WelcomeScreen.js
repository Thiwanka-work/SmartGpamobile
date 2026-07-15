import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOW } from '../utils/theme';
import { useApp } from '../context/AppContext';

export default function WelcomeScreen({ navigation }) {
  const { isDarkMode } = useApp();
  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;
  const textMuted = isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '20' }]}>
          <Ionicons name="school" size={72} color={COLORS.primary} />
        </View>
        <Text style={[styles.title, { color: text }]}>SmartGPA</Text>
        <Text style={[styles.subtitle, { color: textMuted }]}>
          Your Ultimate Academic Companion
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: textMuted }]}>
          Track your GPA effortlessly, manage your semesters, and predict your academic future with powerful analytics.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('LoginSelection')}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.xl,
  },
  header: {
    flex: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    paddingHorizontal: SPACING.sm,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    ...SHADOW.md,
  },
  startButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
