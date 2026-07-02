import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { calcCGPA, calcCompletedCredits, classifyGpa, getClassificationColor } from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

export default function CGPACalculatorScreen({ navigation }) {
  const { appState, gradingSettings, isDarkMode, addSemester, deleteSemester } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [semName, setSemName] = useState(`Semester ${appState.semesters.length + 1}`);
  const [semGpa, setSemGpa] = useState('');
  const [semCredits, setSemCredits] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const cgpa = calcCGPA(appState.semesters);
  const completedCredits = calcCompletedCredits(appState.semesters);
  const cls = classifyGpa(cgpa, gradingSettings);
  const clsColor = getClassificationColor(cls.index);

  async function handleAdd() {
    const newErrors = {};
    const name = semName.trim();
    const gpaRaw = semGpa.trim();
    const gpa = gpaRaw === '' ? null : parseFloat(gpaRaw);
    const credits = parseInt(semCredits, 10);
    const skipped = gpaRaw === '' || gpa === null;

    if (!name) newErrors.name = 'Semester name is required';
    if (!skipped && (isNaN(gpa) || gpa < 0 || gpa > 4)) newErrors.gpa = 'GPA must be between 0.0 and 4.0';
    if (isNaN(credits) || credits < 1 || credits > 60) newErrors.credits = 'Credits must be between 1 and 60';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await addSemester({ name, gpa: skipped ? null : gpa, credits, skipped, skipReason: '' });
      const nextNum = appState.semesters.length + 2;
      setSemName(`Semester ${nextNum}`);
      setSemGpa('');
      setSemCredits('');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    Alert.alert('Delete Semester', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteSemester(id); },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} keyboardShouldPersistTaps="handled">

        {/* CGPA Preview Card */}
        <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.cgpaCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.cgpaLabel}>Current CGPA</Text>
          <Text style={styles.cgpaValue}>{appState.semesters.length > 0 ? cgpa.toFixed(2) : '0.00'}</Text>
          <Text style={styles.cgpaOutOf}>out of {gradingSettings.maxGpa.toFixed(1)}</Text>
          <View style={[styles.cgpaBadge, { backgroundColor: clsColor + '30', borderColor: clsColor + '60' }]}>
            <Text style={[styles.cgpaBadgeText, { color: '#fff' }]}>
              {appState.semesters.length > 0 ? cls.label : 'Not Calculated'}
            </Text>
          </View>
          <Text style={styles.cgpaCredits}>{completedCredits} credits completed</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Instructions */}
          <View style={[styles.instructionCard, { backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm }}>
              <Ionicons name="information-circle" size={20} color={theme.text} />
              <Text style={[styles.instructionTitle, { color: theme.text, marginBottom: 0 }]}>How to Add Your Semester GPA</Text>
            </View>
            <Text style={[styles.instructionItem, { color: theme.textMuted }]}>1. Enter your semester name (e.g. "Semester 1")</Text>
            <Text style={[styles.instructionItem, { color: theme.textMuted }]}>2. Enter your GPA (0.0–4.0) — leave blank for Non-GPA semesters</Text>
            <Text style={[styles.instructionItem, { color: theme.textMuted }]}>3. Enter the total credits taken that semester</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs }}>
              <Ionicons name="bulb" size={18} color={COLORS.warning} />
              <Text style={[styles.instructionTip, { color: COLORS.warning, marginTop: 0 }]}>
                Don't have a final GPA? Use the GPA Calculator first!
              </Text>
            </View>
          </View>

          {/* Add Form */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>New Semester Entry</Text>

            <Text style={[styles.label, { color: theme.textMuted }]}>Semester Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.name ? COLORS.danger : theme.border }]}
              value={semName}
              onChangeText={t => { setSemName(t); setErrors(e => ({ ...e, name: null })); }}
              placeholder="e.g. Semester 1"
              placeholderTextColor={theme.textMuted}
              maxLength={30}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>GPA (0.0 – 4.0)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.gpa ? COLORS.danger : theme.border }]}
                  value={semGpa}
                  onChangeText={t => { setSemGpa(t); setErrors(e => ({ ...e, gpa: null })); }}
                  placeholder="optional"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                />
                {errors.gpa && <Text style={styles.errorText}>{errors.gpa}</Text>}
              </View>
              <View style={{ width: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Credits Taken</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.credits ? COLORS.danger : theme.border }]}
                  value={semCredits}
                  onChangeText={t => { setSemCredits(t); setErrors(e => ({ ...e, credits: null })); }}
                  placeholder="e.g. 18"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                />
                {errors.credits && <Text style={styles.errorText}>{errors.credits}</Text>}
              </View>
            </View>

            {semGpa === '' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.sm }}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
                <Text style={[styles.skipHint, { color: COLORS.accent, marginBottom: 0 }]}>Leaving GPA blank = Non-GPA semester (e.g. internship)</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.addBtn, loading && { opacity: 0.6 }]} onPress={handleAdd} disabled={loading}>
              <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.addBtnGrad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Semester & Calculate CGPA</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Semester List */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recorded Semesters</Text>
          {appState.semesters.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Ionicons name="list" size={36} color={theme.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No semesters added yet</Text>
            </View>
          ) : (
            [...appState.semesters].reverse().map(sem => {
              const isSkipped = sem.skipped || sem.gpa === null || sem.gpa === undefined;
              const semCls = isSkipped ? null : classifyGpa(sem.gpa, gradingSettings);
              const semColor = isSkipped ? COLORS.skip : getClassificationColor(semCls.index);
              return (
                <View key={sem.id} style={[styles.semItem, { backgroundColor: theme.card, borderLeftColor: semColor }]}>
                  <View style={styles.semItemLeft}>
                    <Text style={[styles.semItemName, { color: theme.text }]}>{sem.name}</Text>
                    <Text style={[styles.semItemCredits, { color: theme.textMuted }]}>
                      {sem.credits} credits {isSkipped ? `· ${sem.skipReason || 'Non-GPA'}` : `· ${semCls.label}`}
                    </Text>
                  </View>
                  <View style={styles.semItemRight}>
                    <Text style={[styles.semItemGpa, { color: semColor }]}>
                      {isSkipped ? 'Skip' : sem.gpa.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(sem.id, sem.name)} style={styles.deleteBtn}>
                      <Ionicons name="trash" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Classification Guide */}
          <View style={[styles.classGuide, { backgroundColor: theme.card }]}>
            <Text style={[styles.classGuideTitle, { color: theme.text }]}>Classification Reference</Text>
            {gradingSettings.classifications.map((c, i) => (
              <View key={c.label} style={styles.classRow}>
                <View style={[styles.classDot, { backgroundColor: getClassificationColor(i) }]} />
                <Text style={[styles.classLabel, { color: theme.text }]}>{c.label}</Text>
                <Text style={[styles.classMin, { color: theme.textMuted }]}>≥ {c.minGpa.toFixed(2)} GPA</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const darkTheme = {
  bg: COLORS.bgDark, card: COLORS.bgDark2,
  text: COLORS.textDark, textMuted: COLORS.textMutedDark,
  border: COLORS.borderDark, inputBg: COLORS.bgDark3,
};
const lightTheme = {
  bg: COLORS.bgLight, card: COLORS.bgLight2,
  text: COLORS.textLight, textMuted: COLORS.textMutedLight,
  border: COLORS.borderLight, inputBg: COLORS.bgLight3,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  cgpaCard: { margin: SPACING.md, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.lg },
  cgpaLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  cgpaValue: { color: '#fff', fontSize: 56, fontWeight: '800', lineHeight: 60 },
  cgpaOutOf: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.md },
  cgpaBadge: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, marginTop: SPACING.sm },
  cgpaBadgeText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  cgpaCredits: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.sm, marginTop: SPACING.xs },
  content: { padding: SPACING.md },
  instructionCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  instructionTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  instructionItem: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  instructionTip: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, fontWeight: '600' },
  formCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  formTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row' },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginTop: -SPACING.xs, marginBottom: SPACING.xs },
  skipHint: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm, fontStyle: 'italic' },
  addBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOW.md, marginTop: SPACING.xs },
  addBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md },
  emptyState: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZE.md },
  semItem: { borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOW.sm },
  semItemLeft: { flex: 1 },
  semItemName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  semItemCredits: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  semItemRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  semItemGpa: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  deleteBtn: { padding: SPACING.xs },
  deleteBtnText: { fontSize: 18 },
  classGuide: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  classGuideTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.md },
  classRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  classDot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.sm },
  classLabel: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600' },
  classMin: { fontSize: FONT_SIZE.sm },
});
