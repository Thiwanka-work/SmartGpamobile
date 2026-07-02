import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

export default function ProfileSetupScreen() {
  const { isDarkMode, setupProfile } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [name, setName] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [totalSems, setTotalSems] = useState('8');
  const [completedSems, setCompletedSems] = useState('0');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    const cr = parseInt(totalCredits, 10);
    if (isNaN(cr) || cr < 30 || cr > 300) newErrors.totalCredits = 'Total credits: 30–300';
    const ts = parseInt(totalSems, 10);
    if (isNaN(ts) || ts < 1 || ts > 20) newErrors.totalSems = 'Total semesters: 1–20';
    const cs = parseInt(completedSems, 10);
    if (isNaN(cs) || cs < 0 || cs > ts) newErrors.completedSems = `Completed semesters: 0–${ts}`;

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setLoading(true);
    try {
      await setupProfile({
        studentName: name.trim(),
        totalCredits: cr,
        totalSemesters: ts,
        completedSemesters: cs,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Hero Header */}
        <LinearGradient colors={['#1e3a8a', '#2563eb', '#1d4ed8']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Ionicons name="school" size={64} color="#fff" style={{ marginBottom: SPACING.sm }} />
          <Text style={styles.heroTitle}>SmartGPA</Text>
          <Text style={styles.heroSub}>Your intelligent academic companion</Text>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: 'bar-chart', text: 'Track CGPA every semester' },
              { icon: 'calendar', text: 'Manage semester records' },
              { icon: 'trending-up', text: 'Visualize GPA trends' },
              { icon: 'compass', text: 'Predict what GPA you need' },
              { icon: 'calculator', text: 'Calculate GPA course-by-course' },
            ].map((f, i) => (
              <View key={i} style={styles.featurePill}>
                <Ionicons name={f.icon} size={20} color="#fff" style={styles.featureIcon} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.heroNote}>All data is stored locally on your device — no login required.</Text>
        </LinearGradient>

        {/* Setup Form */}
        <View style={[styles.formCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Create Your Profile</Text>
          <Text style={[styles.formSub, { color: theme.textMuted }]}>Set up your academic profile to get started</Text>

          <Text style={[styles.label, { color: theme.textMuted }]}>Your Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.name ? COLORS.danger : theme.border }]}
            value={name}
            onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: null })); }}
            placeholder="Enter your name"
            placeholderTextColor={theme.textMuted}
            maxLength={50}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <Text style={[styles.label, { color: theme.textMuted }]}>Total Program Credits</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>Total credits required to graduate (e.g. 120)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.totalCredits ? COLORS.danger : theme.border }]}
            value={totalCredits}
            onChangeText={t => { setTotalCredits(t); setErrors(e => ({ ...e, totalCredits: null })); }}
            placeholder="e.g. 120"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />
          {errors.totalCredits && <Text style={styles.errorText}>{errors.totalCredits}</Text>}

          <Text style={[styles.label, { color: theme.textMuted }]}>Total Program Semesters</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>Total semesters in your degree (e.g. 8)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.totalSems ? COLORS.danger : theme.border }]}
            value={totalSems}
            onChangeText={t => { setTotalSems(t); setErrors(e => ({ ...e, totalSems: null })); }}
            placeholder="e.g. 8"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />
          {errors.totalSems && <Text style={styles.errorText}>{errors.totalSems}</Text>}

          <Text style={[styles.label, { color: theme.textMuted }]}>Completed Semesters So Far</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>How many semesters have you already finished?</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.completedSems ? COLORS.danger : theme.border }]}
            value={completedSems}
            onChangeText={t => { setCompletedSems(t); setErrors(e => ({ ...e, completedSems: null })); }}
            placeholder="e.g. 0"
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
          />
          {errors.completedSems && <Text style={styles.errorText}>{errors.completedSems}</Text>}

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.submitBtnGrad}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.submitBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark, inputBg: COLORS.bgDark3 };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight, inputBg: COLORS.bgLight3 };

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  hero: { padding: SPACING.xl, paddingTop: 60, alignItems: 'center' },
  appIcon: { fontSize: 64, marginBottom: SPACING.sm },
  heroTitle: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.md, marginTop: SPACING.xs, marginBottom: SPACING.xl },
  features: { gap: SPACING.sm, marginBottom: SPACING.lg, width: '100%' },
  featurePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  featureIcon: { marginRight: 2 },
  featureText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '500' },
  heroNote: { color: 'rgba(255,255,255,0.5)', fontSize: FONT_SIZE.xs, textAlign: 'center' },
  formCard: { margin: SPACING.md, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, ...SHADOW.lg },
  formTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', marginBottom: SPACING.xs },
  formSub: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  hint: { fontSize: FONT_SIZE.xs, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginTop: -SPACING.xs, marginBottom: SPACING.xs },
  submitBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.sm, ...SHADOW.md },
  submitBtnGrad: { padding: SPACING.md + 4, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '800' },
});
