import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getClassificationColor } from '../utils/calculations';
import { UNI_PRESETS } from '../utils/gradingData';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

const PRESET_KEYS = Object.keys(UNI_PRESETS);

export default function SettingsScreen({ navigation }) {
  const {
    user, isGuest, appState, gradingSettings, isDarkMode,
    applyGradingPreset, toggleTheme, resetAll, deleteAccount, logout,
  } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();
      let idToken = signInResult.data?.idToken || signInResult.idToken;
      if (idToken) {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, googleCredential);
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      Alert.alert('Sign In Failed', error.message);
    }
  };

  function handlePreset(key) {
    Alert.alert(
      'Apply Preset',
      `Apply "${UNI_PRESETS[key].name}" grading scale? This will update your classification thresholds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Apply', onPress: () => applyGradingPreset(key) },
      ]
    );
  }

  function handleReset() {
    Alert.alert(
      '⚠️ Delete Account & Data',
      'This will permanently erase ALL your academic records and delete your account. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch (e) {
              Alert.alert('Error', 'Could not delete account data.');
            }
          },
        },
      ]
    );
  }

  function handlePrivacyPolicy() {
    Alert.alert(
      'Privacy Policy',
      'Your data is securely backed up (if logged in) and is never shared, sold, or used by third parties. Your academic records remain strictly private and accessible only by you.'
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.avatarGrad}>
            <Text style={styles.avatarText}>{appState.studentName ? appState.studentName.charAt(0).toUpperCase() : '?'}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{appState.studentName || 'Guest'}</Text>
            <Text style={[styles.profileSub, { color: theme.textMuted }]}>
              {appState.semesters.length} semesters · {appState.totalCredits} total credits
            </Text>
            {(isGuest || !user) && (
              <Text style={{ color: COLORS.primary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                Local Data Only
              </Text>
            )}
          </View>
          {(isGuest || !user) ? (
            <TouchableOpacity style={[styles.logoutBtn, { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 }]} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={16} color={COLORS.primary} />
              <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>Sign In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.logoutBtn, { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '10' }]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>

        {/* Appearance & Privacy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>Switch between light and dark theme</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: COLORS.borderLight, true: COLORS.primary + '80' }}
              thumbColor={isDarkMode ? COLORS.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={[styles.settingRow, { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Policy</Text>
              <Text style={[styles.settingSub, { color: theme.textMuted }]}>Read how we protect your data</Text>
            </View>
            <TouchableOpacity onPress={handlePrivacyPolicy} style={[styles.logoutBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grading Presets */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Grading Scale</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            Currently: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
              {UNI_PRESETS[gradingSettings.preset]?.name || 'Custom'}
            </Text>
          </Text>
          {PRESET_KEYS.map(key => {
            const preset = UNI_PRESETS[key];
            const isActive = gradingSettings.preset === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.presetBtn, { borderColor: isActive ? COLORS.primary : theme.border, backgroundColor: isActive ? COLORS.primary + '10' : 'transparent' }]}
                onPress={() => handlePreset(key)}
              >
                <View style={styles.presetBtnLeft}>
                  <Text style={[styles.presetBtnName, { color: isActive ? COLORS.primary : theme.text }]}>{preset.name}</Text>
                  <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>Max GPA: {preset.maxGpa}</Text>
                </View>
                {isActive && <View style={[styles.activeIndicator, { backgroundColor: COLORS.primary }]}><Ionicons name="checkmark" size={16} color="#fff" /></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Classification Guide */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Classification Guide</Text>
          {gradingSettings.classifications.map((c, i) => (
            <View key={c.label} style={[styles.classRow, { borderBottomColor: theme.border }]}>
              <View style={[styles.classDot, { backgroundColor: getClassificationColor(i) }]} />
              <Text style={[styles.classLabel, { color: theme.text }]}>{c.label}</Text>
              <Text style={[styles.classMin, { color: theme.textMuted }]}>≥ {c.minGpa.toFixed(2)} CGPA</Text>
            </View>
          ))}
        </View>

        {/* Grade Scale */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Grade Reference Table</Text>
          <View style={styles.gradeTableHeader}>
            <Text style={[styles.gradeTableCell, { color: theme.textMuted, flex: 0.8 }]}>Grade</Text>
            <Text style={[styles.gradeTableCell, { color: theme.textMuted }]}>Points</Text>
            <Text style={[styles.gradeTableCell, { color: theme.textMuted }]}>Mark Range</Text>
          </View>
          {gradingSettings.grades.map((g, i) => (
            <View key={g.grade} style={[styles.gradeTableRow, { borderBottomColor: theme.border, backgroundColor: i % 2 === 0 ? 'transparent' : theme.border + '30' }]}>
              <View style={[styles.gradeTableCell, { flex: 0.8 }]}>
                <View style={[styles.gradeChip, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary + '40' }]}>
                  <Text style={[styles.gradeChipText, { color: COLORS.primary }]}>{g.grade}</Text>
                </View>
              </View>
              <Text style={[styles.gradeTableCell, { color: theme.text, fontWeight: '700' }]}>{g.points.toFixed(2)}</Text>
              <Text style={[styles.gradeTableCell, { color: theme.textMuted }]}>{g.markMin}–{g.markMax}%</Text>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <View style={[styles.dangerSection, { backgroundColor: COLORS.danger + '10', borderColor: COLORS.danger + '30' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs }}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
            <Text style={[styles.dangerTitle, { color: COLORS.danger, marginBottom: 0 }]}>Danger Zone</Text>
          </View>
          <Text style={[styles.dangerDesc, { color: theme.textMuted }]}>
            Permanently delete your account and all academic records. This cannot be undone.
          </Text>
          <TouchableOpacity style={[styles.resetBtn, { borderColor: COLORS.danger }]} onPress={handleReset}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trash" size={20} color={COLORS.danger} />
              <Text style={[styles.resetBtnText, { color: COLORS.danger }]}>Delete My Account & Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.textMuted }]}>SmartGPA · All data stored locally on your device</Text>
      </View>
    </ScrollView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight };

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  profileCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...SHADOW.sm },
  avatarGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  profileSub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  logoutBtn: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  sectionSub: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  settingSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  presetBtn: { borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' },
  presetBtnLeft: { flex: 1 },
  presetBtnName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  presetBtnSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  activeIndicator: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activeIndicatorText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  classRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  classDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
  classLabel: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600' },
  classMin: { fontSize: FONT_SIZE.sm },
  gradeTableHeader: { flexDirection: 'row', marginBottom: SPACING.xs, paddingBottom: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark },
  gradeTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1 },
  gradeTableCell: { flex: 1, fontSize: FONT_SIZE.sm },
  gradeChip: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.xs, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeChipText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  dangerSection: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.md },
  dangerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.xs },
  dangerDesc: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  resetBtn: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, padding: SPACING.md, alignItems: 'center' },
  resetBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: FONT_SIZE.xs, marginBottom: SPACING.xl, marginTop: SPACING.sm },
});
