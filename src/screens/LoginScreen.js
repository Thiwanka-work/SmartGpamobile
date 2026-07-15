import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOW } from '../utils/theme';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { isDarkMode } = useApp();

  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const card = isDarkMode ? COLORS.bgDark2 : '#fff';
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;
  const textMuted = isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: text }]}>Sign In</Text>
          <Text style={[styles.instruction, { color: textMuted }]}>
            Choose how you would like to continue.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.guestButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate('GuestLogin')}
          activeOpacity={0.85}
        >
          <Ionicons name="person" size={22} color="#fff" style={styles.btnIcon} />
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={[styles.orText, { color: textMuted }]}>— or —</Text>

        <TouchableOpacity
          style={[
            styles.googleButton,
            { backgroundColor: card, borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight },
          ]}
          onPress={() => navigation.navigate('GoogleLogin')}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.btnIcon} />
          <Text style={[styles.googleButtonText, { color: text }]}>
            Sign in with Google
          </Text>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}>
          <Ionicons name="information-circle" size={16} color={COLORS.primary} />
          <Text style={[styles.infoText, { color: textMuted }]}>
            Guest mode saves your data locally. Sign in with Google to back up to the cloud.
          </Text>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  instruction: {
    fontSize: FONT_SIZE.md,
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
  orText: {
    marginVertical: SPACING.lg,
    fontSize: FONT_SIZE.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    width: '100%',
  },
  googleButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: SPACING.xxl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    fontSize: FONT_SIZE.xs,
    flex: 1,
    lineHeight: 18,
  },
});
