import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOW } from '../utils/theme';

export default function GuestLoginScreen() {
  const { isDarkMode, continueAsGuest } = useApp();

  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const card = isDarkMode ? COLORS.bgDark2 : '#fff';
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;
  const textMuted = isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '20' }]}>
          <Ionicons name="person" size={56} color={COLORS.primary} />
        </View>
        <Text style={[styles.title, { color: text }]}>Guest Mode</Text>
        <Text style={[styles.description, { color: textMuted }]}>
          Continuing as a guest means all your academic data will be saved locally on this device.
        </Text>

        <View style={[styles.infoBox, { backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning + '40' }]}>
          <Ionicons name="warning" size={20} color={COLORS.warning} />
          <Text style={[styles.infoText, { color: textMuted }]}>
            Warning: If you uninstall the app or clear data, your progress will be lost. Cloud backup is not available for Guest Mode.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.guestButton, { backgroundColor: COLORS.primary }]}
          onPress={continueAsGuest}
          activeOpacity={0.85}
        >
          <Text style={styles.guestButtonText}>Confirm & Start</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  description: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xxl,
    width: '100%',
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 20,
    marginLeft: 12,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    ...SHADOW.md,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
