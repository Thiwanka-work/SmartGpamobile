import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
  TextInput, KeyboardAvoidingView, Platform, Modal,
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
    applyGradingPreset, updateGradingSettings, toggleTheme, resetAll, deleteAccount, logout,
  } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  // ── Custom Grading Editor state ──────────────────────────────────
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [customGrades, setCustomGrades] = useState(
    JSON.parse(JSON.stringify(gradingSettings.grades))
  );
  const [customMaxGpa, setCustomMaxGpa] = useState(String(gradingSettings.maxGpa));
  const [customErrors, setCustomErrors] = useState({});

  function openCustomEditor() {
    // Reset editor to current grades
    setCustomGrades(JSON.parse(JSON.stringify(gradingSettings.grades)));
    setCustomMaxGpa(String(gradingSettings.maxGpa));
    setCustomErrors({});
    setShowCustomEditor(true);
  }

  function updateCustomGradeField(index, field, value) {
    setCustomGrades(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async function saveCustomGrading() {
    const errors = {};
    const maxGpaNum = parseFloat(customMaxGpa);
    if (isNaN(maxGpaNum) || maxGpaNum < 1.0 || maxGpaNum > 10.0) {
      errors.maxGpa = 'Max GPA must be between 1.0 and 10.0';
    }

    const parsedGrades = customGrades.map((g, i) => {
      const pts = parseFloat(g.points);
      const min = parseInt(g.markMin, 10);
      const max = parseInt(g.markMax, 10);
      if (isNaN(pts) || pts < 0) errors[`pts_${i}`] = `Row ${i + 1}: invalid points`;
      if (isNaN(min) || isNaN(max) || min > max) errors[`range_${i}`] = `Row ${i + 1}: invalid mark range`;
      return { grade: g.grade, points: isNaN(pts) ? 0 : pts, markMin: isNaN(min) ? 0 : min, markMax: isNaN(max) ? 100 : max };
    });

    if (Object.keys(errors).length > 0) {
      setCustomErrors(errors);
      return;
    }

    const newSettings = {
      preset: 'custom',
      grades: parsedGrades,
      classifications: gradingSettings.classifications,
      maxGpa: maxGpaNum,
    };

    await updateGradingSettings(newSettings);
    setShowCustomEditor(false);
    Alert.alert('✅ Saved', 'Your custom grading scale has been applied.');
  }

  // ── Google Sign-In ───────────────────────────────────────────────
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
    if (key === 'custom') {
      openCustomEditor();
      return;
    }
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

  const isCustomActive = gradingSettings.preset === 'custom';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* ── Guest Mode Banner ──────────────────────────────────── */}
          {(isGuest || !user) && (
            <TouchableOpacity onPress={handleGoogleSignIn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#1e3a8a', '#2563eb']}
                style={styles.guestBanner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <View style={styles.guestBannerLeft}>
                  <View style={styles.guestBannerIconWrap}>
                    <Ionicons name="cloud-offline" size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.guestBannerTitle}>You're in Guest Mode</Text>
                    <Text style={styles.guestBannerSub}>
                      Sign in with Google to back up your data to the cloud & sync across devices.
                    </Text>
                  </View>
                </View>
                <View style={styles.guestBannerBtn}>
                  <Ionicons name="logo-google" size={14} color="#2563eb" />
                  <Text style={styles.guestBannerBtnText}>Sign In</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── Profile Card ───────────────────────────────────────── */}
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
                <Text style={{ color: COLORS.warning, fontSize: 11, marginTop: 3, fontWeight: '600' }}>
                  ⚠️ Local data only — not backed up
                </Text>
              )}
              {user && (
                <Text style={{ color: COLORS.success, fontSize: 11, marginTop: 3, fontWeight: '600' }}>
                  ✅ Cloud synced · {user.email}
                </Text>
              )}
            </View>
            {(isGuest || !user) ? (
              <TouchableOpacity
                style={[styles.logoutBtn, { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 }]}
                onPress={handleGoogleSignIn}
              >
                <Ionicons name="logo-google" size={16} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>Sign In</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.logoutBtn, { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '10' }]} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Appearance & Privacy ──────────────────────────────── */}
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

          {/* ── Grading Presets ───────────────────────────────────── */}
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
              const isCustom = key === 'custom';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.presetBtn,
                    { borderColor: isActive ? COLORS.primary : theme.border, backgroundColor: isActive ? COLORS.primary + '10' : 'transparent' },
                  ]}
                  onPress={() => handlePreset(key)}
                >
                  <View style={styles.presetBtnLeft}>
                    <Text style={[styles.presetBtnName, { color: isActive ? COLORS.primary : theme.text }]}>{preset.name}</Text>
                    <Text style={[styles.presetBtnSub, { color: theme.textMuted }]}>Max GPA: {preset.maxGpa}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                    {isCustom && (
                      <View style={[styles.editBadge, { borderColor: isActive ? COLORS.primary : theme.border }]}>
                        <Ionicons name="pencil" size={13} color={isActive ? COLORS.primary : theme.textMuted} />
                        <Text style={{ fontSize: FONT_SIZE.xs, color: isActive ? COLORS.primary : theme.textMuted, fontWeight: '600' }}>
                          Edit
                        </Text>
                      </View>
                    )}
                    {isActive && (
                      <View style={[styles.activeIndicator, { backgroundColor: COLORS.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* If custom is active, show quick-edit button */}
            {isCustomActive && (
              <TouchableOpacity style={styles.editCustomBtn} onPress={openCustomEditor}>
                <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.editCustomBtnGrad}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                  <Text style={styles.editCustomBtnText}>Edit Custom Grading Scale</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Classification Guide ──────────────────────────────── */}
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

          {/* ── Grade Reference Table ─────────────────────────────── */}
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

          {/* ── Danger Zone ───────────────────────────────────────── */}
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
          <Text style={[styles.footer, { color: theme.textMuted }]}>SmartGPA v1.0.0 · {user ? 'Cloud Synced' : 'Local Storage'}</Text>
        </View>
      </ScrollView>

      {/* ── Custom Grading Editor Modal ───────────────────────────── */}
      <Modal
        visible={showCustomEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomEditor(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? COLORS.bgDark2 : '#fff' }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? COLORS.textDark : COLORS.textLight }]}>
                Custom Grading Scale
              </Text>
              <TouchableOpacity onPress={() => setShowCustomEditor(false)}>
                <Ionicons name="close-circle" size={28} color={isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Max GPA */}
              <View style={styles.customMaxGpaRow}>
                <Text style={[styles.customLabel, { color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>
                  Max GPA Scale
                </Text>
                <TextInput
                  style={[styles.customInput, {
                    backgroundColor: isDarkMode ? COLORS.bgDark3 : COLORS.bgLight3,
                    color: isDarkMode ? COLORS.textDark : COLORS.textLight,
                    borderColor: customErrors.maxGpa ? COLORS.danger : isDarkMode ? COLORS.borderDark : COLORS.borderLight,
                    width: 80,
                  }]}
                  value={customMaxGpa}
                  onChangeText={t => { setCustomMaxGpa(t); setCustomErrors(e => ({ ...e, maxGpa: null })); }}
                  keyboardType="decimal-pad"
                  placeholder="4.0"
                  placeholderTextColor={isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight}
                />
              </View>
              {customErrors.maxGpa && <Text style={styles.customError}>{customErrors.maxGpa}</Text>}

              {/* Column headers */}
              <View style={styles.customTableHeader}>
                <Text style={[styles.customTableHeaderCell, { flex: 1, color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>Grade</Text>
                <Text style={[styles.customTableHeaderCell, { flex: 1, color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>Points</Text>
                <Text style={[styles.customTableHeaderCell, { flex: 1.2, color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>Min%</Text>
                <Text style={[styles.customTableHeaderCell, { flex: 1.2, color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>Max%</Text>
              </View>

              {/* Grade rows */}
              {customGrades.map((g, i) => (
                <View key={i} style={[styles.customTableRow, { borderBottomColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]}>
                  <Text style={[styles.customGradeName, { flex: 1, color: COLORS.primary }]}>{g.grade}</Text>
                  <TextInput
                    style={[styles.customInput, {
                      flex: 1,
                      backgroundColor: isDarkMode ? COLORS.bgDark3 : COLORS.bgLight3,
                      color: isDarkMode ? COLORS.textDark : COLORS.textLight,
                      borderColor: customErrors[`pts_${i}`] ? COLORS.danger : isDarkMode ? COLORS.borderDark : COLORS.borderLight,
                    }]}
                    value={String(g.points)}
                    onChangeText={t => { updateCustomGradeField(i, 'points', t); setCustomErrors(e => ({ ...e, [`pts_${i}`]: null })); }}
                    keyboardType="decimal-pad"
                    placeholderTextColor={isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight}
                  />
                  <TextInput
                    style={[styles.customInput, {
                      flex: 1.2,
                      backgroundColor: isDarkMode ? COLORS.bgDark3 : COLORS.bgLight3,
                      color: isDarkMode ? COLORS.textDark : COLORS.textLight,
                      borderColor: customErrors[`range_${i}`] ? COLORS.danger : isDarkMode ? COLORS.borderDark : COLORS.borderLight,
                      marginHorizontal: 3,
                    }]}
                    value={String(g.markMin)}
                    onChangeText={t => { updateCustomGradeField(i, 'markMin', t); setCustomErrors(e => ({ ...e, [`range_${i}`]: null })); }}
                    keyboardType="number-pad"
                    placeholderTextColor={isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight}
                  />
                  <TextInput
                    style={[styles.customInput, {
                      flex: 1.2,
                      backgroundColor: isDarkMode ? COLORS.bgDark3 : COLORS.bgLight3,
                      color: isDarkMode ? COLORS.textDark : COLORS.textLight,
                      borderColor: customErrors[`range_${i}`] ? COLORS.danger : isDarkMode ? COLORS.borderDark : COLORS.borderLight,
                    }]}
                    value={String(g.markMax)}
                    onChangeText={t => { updateCustomGradeField(i, 'markMax', t); setCustomErrors(e => ({ ...e, [`range_${i}`]: null })); }}
                    keyboardType="number-pad"
                    placeholderTextColor={isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight}
                  />
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight }]}
                  onPress={() => setShowCustomEditor(false)}
                >
                  <Text style={[styles.modalCancelText, { color: isDarkMode ? COLORS.textDark : COLORS.textLight }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={saveCustomGrading}>
                  <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.modalSaveBtnGrad}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.modalSaveText}>Save Custom Scale</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight };

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },

  // ── Guest Banner ──
  guestBanner: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    ...SHADOW.md,
  },
  guestBannerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, flex: 1 },
  guestBannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBannerTitle: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  guestBannerSub: { color: 'rgba(255,255,255,0.75)', fontSize: FONT_SIZE.xs, lineHeight: 16, marginTop: 2 },
  guestBannerBtn: {
    backgroundColor: '#fff',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestBannerBtnText: { color: '#2563eb', fontSize: FONT_SIZE.sm, fontWeight: '700' },

  // ── Profile Card ──
  profileCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, ...SHADOW.sm },
  avatarGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  profileSub: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  logoutBtn: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Sections ──
  section: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  sectionSub: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  settingSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },

  // ── Preset Buttons ──
  presetBtn: { borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' },
  presetBtnLeft: { flex: 1 },
  presetBtnName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  presetBtnSub: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  activeIndicator: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  editCustomBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xs, ...SHADOW.sm },
  editCustomBtnGrad: { padding: SPACING.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  editCustomBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  // ── Classification Guide ──
  classRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  classDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
  classLabel: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600' },
  classMin: { fontSize: FONT_SIZE.sm },

  // ── Grade Table ──
  gradeTableHeader: { flexDirection: 'row', marginBottom: SPACING.xs, paddingBottom: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark },
  gradeTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1 },
  gradeTableCell: { flex: 1, fontSize: FONT_SIZE.sm },
  gradeChip: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.xs, paddingVertical: 2, alignSelf: 'flex-start' },
  gradeChipText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  // ── Danger Zone ──
  dangerSection: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.md },
  dangerTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.xs },
  dangerDesc: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  resetBtn: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, padding: SPACING.md, alignItems: 'center' },
  resetBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: FONT_SIZE.xs, marginBottom: SPACING.xl, marginTop: SPACING.sm },

  // ── Custom Grading Modal ──
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  customMaxGpaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  customLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  customInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  customError: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginBottom: SPACING.xs },
  customTableHeader: { flexDirection: 'row', marginBottom: SPACING.xs, paddingBottom: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark },
  customTableHeaderCell: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  customTableRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACING.xs, borderBottomWidth: 1 },
  customGradeName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, paddingBottom: SPACING.md },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  modalCancelText: { fontWeight: '600', fontSize: FONT_SIZE.md },
  modalSaveBtn: { flex: 2, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  modalSaveBtnGrad: { padding: SPACING.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
});
