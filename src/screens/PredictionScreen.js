import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  calcCGPA, calcCompletedCredits, classifyGpa,
  getClassificationColor, predictNextSemester, predictMultiSemester, getDifficultyInfo,
} from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

const TARGETS = [
  { label: 'First Class',  minGpa: 3.70, icon: 'trophy', color: COLORS.firstClass },
  { label: 'Second Upper', minGpa: 3.30, icon: 'medal', color: COLORS.secondUpper },
  { label: 'Second Lower', minGpa: 3.00, icon: 'ribbon', color: COLORS.secondLower },
  { label: 'General Pass', minGpa: 2.00, icon: 'checkmark-circle', color: COLORS.generalPass },
];

export default function PredictionScreen() {
  const { appState, gradingSettings, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [targetIdx, setTargetIdx] = useState(0);
  const [mode, setMode] = useState('next'); // 'next' | 'multi'
  const [nextCredits, setNextCredits] = useState('18');
  const [result, setResult] = useState(null);
  const [multiResult, setMultiResult] = useState(null);
  const [credits, setCredits] = useState({});

  const cgpa = calcCGPA(appState.semesters);
  const completedCredits = calcCompletedCredits(appState.semesters);
  const cls = classifyGpa(cgpa, gradingSettings);
  const clsColor = getClassificationColor(cls.index);
  const target = TARGETS[targetIdx];

  const startSemOffset = Math.max(appState.completedSemesters || 0, appState.semesters.length);
  const remainingSems = Math.max(0, (appState.totalSemesters || 8) - startSemOffset);

  function runPrediction() {
    if (appState.semesters.length === 0) {
      alert('Please add at least one semester before running prediction.');
      return;
    }
    if (remainingSems === 0) {
      setResult({ type: 'done', message: 'You have completed all semesters!' });
      return;
    }

    if (mode === 'next') {
      const cr = parseInt(nextCredits, 10);
      if (isNaN(cr) || cr < 1 || cr > 60) return;
      const needed = predictNextSemester(cgpa, completedCredits, target.minGpa, cr);
      setResult({ type: 'next', needed, cr, achievable: needed <= 4.0 });
      setMultiResult(null);
    } else {
      const remainingCreditsTotal = Math.max(0, (appState.totalCredits || 120) - completedCredits);
      if (remainingCreditsTotal <= 0) {
        setResult({ type: 'done', message: 'All credits completed!' });
        return;
      }
      const creditsPerSem = remainingCreditsTotal / remainingSems;
      const semWeights = Array.from({ length: remainingSems }, (_, i) => ({
        semNum: startSemOffset + i + 1,
        credits: parseFloat((credits[startSemOffset + i + 1] || creditsPerSem).toFixed(2)),
      }));
      const neededAvg = predictMultiSemester(cgpa, completedCredits, target.minGpa, semWeights);
      const achievable = neededAvg !== null && neededAvg <= 4.0;
      const diffInfo = neededAvg ? getDifficultyInfo(neededAvg) : null;

      setResult({
        type: 'multi',
        neededAvg,
        achievable,
        diffInfo,
        semWeights,
        remainingSems,
        creditsPerSem,
      });
      setMultiResult({ neededAvg, achievable, semWeights });
    }
  }

  function renderResult() {
    if (!result) return null;

    if (result.type === 'done') {
      return (
        <View style={[styles.resultCard, { backgroundColor: COLORS.firstClass + '15', borderColor: COLORS.firstClass + '40' }]}>
          <Ionicons name="school" size={40} color={COLORS.firstClass} style={{ marginBottom: SPACING.sm }} />
          <Text style={[styles.resultTitle, { color: COLORS.firstClass }]}>Program Completed!</Text>
          <Text style={[styles.resultSub, { color: theme.textMuted }]}>{result.message}</Text>
        </View>
      );
    }

    if (result.type === 'next') {
      const { needed, cr, achievable } = result;
      const reqGpa = achievable ? Math.max(0, needed).toFixed(2) : '> 4.00';
      const diffInfo = achievable ? getDifficultyInfo(Math.max(0, needed)) : null;
      return (
        <View style={[styles.resultCard, { backgroundColor: achievable ? COLORS.success + '15' : COLORS.danger + '15', borderColor: achievable ? COLORS.success + '40' : COLORS.danger + '40' }]}>
          <Ionicons name={achievable ? 'rocket' : 'warning'} size={40} color={achievable ? COLORS.success : COLORS.danger} style={{ marginBottom: SPACING.sm }} />
          <Text style={[styles.resultTitle, { color: achievable ? COLORS.success : COLORS.danger }]}>
            {achievable ? (cgpa >= target.minGpa ? 'Maintain Your Standing' : 'Highly Achievable!') : 'Mathematically Impossible'}
          </Text>
          <View style={styles.resultGpaBox}>
            <Text style={[styles.resultGpa, { color: achievable ? COLORS.success : COLORS.danger }]}>{reqGpa}</Text>
            <Text style={[styles.resultGpaLabel, { color: theme.textMuted }]}>Required GPA</Text>
          </View>
          {achievable && diffInfo && (
            <View style={[styles.diffBadge, { backgroundColor: diffInfo.color + '20', borderColor: diffInfo.color + '40', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Ionicons name={diffInfo.iconName} size={16} color={diffInfo.color} />
              <Text style={styles.diffBadgeText}>{diffInfo.label} Difficulty</Text>
            </View>
          )}
          <Text style={[styles.resultNote, { color: theme.textMuted }]}>
            Based on taking {cr} credits in Semester {startSemOffset + 1}
          </Text>
          {!achievable && (
            <Text style={[styles.resultNote, { color: theme.textMuted }]}>
              You would need {needed.toFixed(2)} GPA — exceeds 4.00. Try Multi-Semester mode.
            </Text>
          )}
        </View>
      );
    }

    if (result.type === 'multi') {
      const { neededAvg, achievable, diffInfo, semWeights, remainingSems, creditsPerSem } = result;
      return (
        <View>
          <View style={[styles.resultCard, { backgroundColor: achievable ? COLORS.success + '15' : COLORS.danger + '15', borderColor: achievable ? COLORS.success + '40' : COLORS.danger + '40' }]}>
            <Ionicons name={achievable ? 'trending-up' : 'trending-down'} size={40} color={achievable ? COLORS.success : COLORS.danger} style={{ marginBottom: SPACING.sm }} />
            <Text style={[styles.resultTitle, { color: achievable ? COLORS.success : COLORS.danger }]}>
              {achievable ? 'Long-term Goal' : 'Mathematical Limit Reached'}
            </Text>
            {achievable && neededAvg !== null && (
              <>
                <View style={styles.resultGpaBox}>
                  <Text style={[styles.resultGpa, { color: achievable ? COLORS.success : COLORS.danger }]}>
                    {Math.max(0, neededAvg).toFixed(2)}
                  </Text>
                  <Text style={[styles.resultGpaLabel, { color: theme.textMuted }]}>Avg GPA Needed/Sem</Text>
                </View>
                {diffInfo && (
                  <View style={[styles.diffBadge, { backgroundColor: diffInfo.color + '20', borderColor: diffInfo.color + '40', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <Ionicons name={diffInfo.iconName} size={16} color={diffInfo.color} />
                    <Text style={styles.diffBadgeText}>{diffInfo.label} Difficulty</Text>
                  </View>
                )}
              </>
            )}
            {!achievable && (
              <Text style={[styles.resultNote, { color: theme.textMuted }]}>
                Even with perfect 4.00 GPAs, you cannot reach {target.minGpa} CGPA with remaining credits.
              </Text>
            )}
          </View>

          {achievable && semWeights.length > 0 && (
            <View style={[styles.semCardsContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.semCardsTitle, { color: theme.text }]}>Semester-by-Semester Plan</Text>
              {/* Current standing */}
              <View style={[styles.semPlanCard, { borderColor: COLORS.textMutedLight + '40', backgroundColor: theme.card }]}>
                <View style={[styles.semPlanNum, { backgroundColor: COLORS.textMutedLight + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={theme.textMuted} />
                </View>
                <View style={styles.semPlanInfo}>
                  <Text style={[styles.semPlanName, { color: theme.text }]}>Current Standing</Text>
                  <Text style={[styles.semPlanNote, { color: theme.textMuted }]}>{completedCredits} credits completed</Text>
                </View>
                <View style={styles.semPlanGpa}>
                  <Text style={[styles.semPlanGpaVal, { color: COLORS.primary }]}>{cgpa.toFixed(2)}</Text>
                  <Text style={[styles.semPlanGpaLabel, { color: theme.textMuted }]}>CGPA Now</Text>
                </View>
              </View>
              {semWeights.map((sw, idx) => {
                const balancedGPA = Math.max(0, neededAvg || 0);
                const isLast = idx === semWeights.length - 1;
                const diffI = getDifficultyInfo(balancedGPA);
                const actualSem = appState.semesters.find(s => s.semNumber === sw.semNum);
                const isAchieved = actualSem && !actualSem.skipped && actualSem.gpa >= balancedGPA;
                return (
                  <View key={sw.semNum} style={[styles.semPlanCard, { borderColor: isAchieved ? COLORS.success + '60' : diffI.color + '40', backgroundColor: isAchieved ? COLORS.success + '10' : diffI.color + '08' }]}>
                    <View style={[styles.semPlanNum, { backgroundColor: isAchieved ? COLORS.success + '20' : diffI.color + '20' }]}>
                      <Text style={[styles.semPlanNumText, { color: isAchieved ? COLORS.success : diffI.color }]}>{sw.semNum}</Text>
                    </View>
                    <View style={styles.semPlanInfo}>
                      <Text style={[styles.semPlanName, { color: theme.text }]}>Semester {sw.semNum}</Text>
                      <Text style={[styles.semPlanNote, { color: theme.textMuted }]}>{sw.credits.toFixed(0)} credits {isAchieved ? '· ✓ Achieved!' : ''}</Text>
                    </View>
                    <View style={styles.semPlanGpa}>
                      <Text style={[styles.semPlanGpaVal, { color: isAchieved ? COLORS.success : diffI.color }]}>
                        {isAchieved ? actualSem.gpa.toFixed(2) : balancedGPA.toFixed(2)}
                      </Text>
                      <Text style={[styles.semPlanGpaLabel, { color: theme.textMuted }]}>{isLast ? 'Final Goal' : 'Target GPA'}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      );
    }

    return null;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Current Standing */}
          <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.standingCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.standingTitle}>Current Standing</Text>
            <View style={styles.standingRow}>
              <View style={styles.standingStat}>
                <Text style={styles.standingVal}>{appState.semesters.length > 0 ? cgpa.toFixed(2) : '--'}</Text>
                <Text style={styles.standingLabel}>CGPA</Text>
              </View>
              <View style={styles.standingStat}>
                <Text style={[styles.standingVal, { color: clsColor === COLORS.firstClass ? '#10b981' : '#fff' }]}>
                  {appState.semesters.length > 0 ? cls.label : '--'}
                </Text>
                <Text style={styles.standingLabel}>Classification</Text>
              </View>
              <View style={styles.standingStat}>
                <Text style={styles.standingVal}>{completedCredits}</Text>
                <Text style={styles.standingLabel}>Credits Done</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Target Selection */}
          <View style={[styles.targetCard, { backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md }}>
              <Ionicons name="locate" size={24} color={theme.text} />
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Select Your Target</Text>
            </View>
            <View style={styles.targetGrid}>
              {TARGETS.map((t, i) => (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.targetBtn, { borderColor: targetIdx === i ? t.color : theme.border, backgroundColor: targetIdx === i ? t.color + '15' : 'transparent' }]}
                  onPress={() => { setTargetIdx(i); setResult(null); setMultiResult(null); }}
                >
                  <Ionicons name={t.icon} size={28} color={targetIdx === i ? t.color : theme.textMuted} style={{ marginBottom: SPACING.xs }} />
                  <Text style={[styles.targetBtnLabel, { color: targetIdx === i ? t.color : theme.text }]}>{t.label}</Text>
                  <Text style={[styles.targetBtnMin, { color: theme.textMuted }]}>≥ {t.minGpa.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode Selection */}
          <View style={[styles.modeCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Prediction Mode</Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'next' && { backgroundColor: COLORS.primary }]}
                onPress={() => { setMode('next'); setResult(null); }}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'next' ? '#fff' : theme.textMuted }]}>Next Semester</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'multi' && { backgroundColor: COLORS.primary }]}
                onPress={() => { setMode('multi'); setResult(null); }}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'multi' ? '#fff' : theme.textMuted }]}>Multi-Semester</Text>
              </TouchableOpacity>
            </View>

            {mode === 'next' && (
              <View style={styles.inputArea}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Credits for Semester {startSemOffset + 1}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                  value={nextCredits}
                  onChangeText={setNextCredits}
                  keyboardType="number-pad"
                  placeholder="e.g. 18"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            )}
            {mode === 'multi' && (
              <View style={styles.multiNote}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Ionicons name="information-circle" size={16} color={theme.textMuted} />
                  <Text style={[styles.multiNoteText, { color: theme.textMuted, flex: 1 }]}>
                    Will calculate average GPA needed across your remaining {remainingSems} semesters ({Math.max(0, (appState.totalCredits || 120) - completedCredits)} credits remaining)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Run Prediction Button */}
          <TouchableOpacity style={styles.runBtn} onPress={runPrediction}>
            <LinearGradient colors={[target.color, target.color + 'cc']} style={styles.runBtnGrad}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={target.icon} size={24} color="#fff" />
                <Text style={styles.runBtnText}>Calculate Prediction</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Result */}
          {renderResult()}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark, inputBg: COLORS.bgDark3 };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight, inputBg: COLORS.bgLight3 };

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  standingCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.lg },
  standingTitle: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', marginBottom: SPACING.md },
  standingRow: { flexDirection: 'row', justifyContent: 'space-around' },
  standingStat: { alignItems: 'center' },
  standingVal: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  standingLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs, marginTop: 2 },
  targetCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  targetBtn: { width: '47%', borderRadius: BORDER_RADIUS.lg, borderWidth: 2, padding: SPACING.md, alignItems: 'center' },
  targetBtnIcon: { fontSize: 24, marginBottom: SPACING.xs },
  targetBtnLabel: { fontSize: FONT_SIZE.md, fontWeight: '700', textAlign: 'center' },
  targetBtnMin: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  modeCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: BORDER_RADIUS.full, padding: 4, marginBottom: SPACING.md },
  modeBtn: { flex: 1, borderRadius: BORDER_RADIUS.full, padding: SPACING.sm, alignItems: 'center' },
  modeBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  inputArea: { marginTop: SPACING.xs },
  inputLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md },
  multiNote: { backgroundColor: COLORS.primary + '10', borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm },
  multiNoteText: { fontSize: FONT_SIZE.sm },
  runBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.md, ...SHADOW.md },
  runBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  runBtnText: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  resultCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.md, alignItems: 'center' },
  resultTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.md },
  resultGpaBox: { alignItems: 'center', marginBottom: SPACING.sm },
  resultGpa: { fontSize: 52, fontWeight: '800' },
  resultGpaLabel: { fontSize: FONT_SIZE.sm },
  diffBadge: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginBottom: SPACING.sm },
  diffBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  resultNote: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginTop: SPACING.xs },
  semCardsContainer: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  semCardsTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  semPlanCard: { flexDirection: 'row', alignItems: 'center', borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.sm },
  semPlanNum: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  semPlanNumText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  semPlanInfo: { flex: 1 },
  semPlanName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  semPlanNote: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  semPlanGpa: { alignItems: 'flex-end' },
  semPlanGpaVal: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  semPlanGpaLabel: { fontSize: FONT_SIZE.xs },
});
