import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { calcSemesterGPA, calcCGPA, classifyGpa, getClassificationColor } from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

// ── Low Grade Threshold ────────────────────────────────────────────────
// Below C = points < 2.0 (C-, D+, D, E, F etc.)
const LOW_GRADE_THRESHOLD = 2.0;

// ── Upgrade Impact Calculator ────────────────────────────────────────
// Given a course list, what happens if we upgrade one course to grade C (2.0 pts)?
function calcUpgradeImpact(courses, courseId, gradingSettings, appStateSemesters) {
  const upgraded = courses.map(c =>
    c.id === courseId ? { ...c, grade: { ...c.grade, points: LOW_GRADE_THRESHOLD } } : c
  );
  const oldSemGpa = calcSemesterGPA(courses);
  const newSemGpa = calcSemesterGPA(upgraded);

  // CGPA impact: existing semesters + this semester (with old vs new GPA)
  const totalCreditsInSem = courses.filter(c => c.grade && c.credits > 0).reduce((a, c) => a + c.credits, 0);
  const currentCgpa = calcCGPA(appStateSemesters);
  const creditsAlreadyDone = appStateSemesters
    .filter(s => !s.skipped && s.gpa !== null && s.gpa !== undefined)
    .reduce((a, s) => a + s.credits, 0);

  // Projected CGPA if this semester is added with old GPA
  const projWithOld = totalCreditsInSem > 0
    ? (currentCgpa * creditsAlreadyDone + oldSemGpa * totalCreditsInSem) / (creditsAlreadyDone + totalCreditsInSem)
    : currentCgpa;

  // Projected CGPA if this semester is added with new (upgraded) GPA
  const projWithNew = totalCreditsInSem > 0
    ? (currentCgpa * creditsAlreadyDone + newSemGpa * totalCreditsInSem) / (creditsAlreadyDone + totalCreditsInSem)
    : currentCgpa;

  return {
    oldSemGpa,
    newSemGpa,
    oldCgpa: projWithOld,
    newCgpa: projWithNew,
    semGpaDelta: newSemGpa - oldSemGpa,
    cgpaDelta: projWithNew - projWithOld,
  };
}

export default function GPACalculatorScreen({ navigation }) {
  const { appState, gradingSettings, isDarkMode, addSemester } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [courses, setCourses] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [errors, setErrors] = useState({});
  const [semName, setSemName] = useState(`Semester ${appState.semesters.length + 1}`);
  const [saved, setSaved] = useState(false);
  const [expandedImpact, setExpandedImpact] = useState(null); // courseId of expanded impact card

  // Keep semName in sync with the actual number of semesters
  useEffect(() => {
    if (!saved) {
      setSemName(`Semester ${appState.semesters.length + 1}`);
    }
  }, [appState.semesters.length]);

  const semGpa = calcSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const cls = courses.length > 0 ? classifyGpa(semGpa, gradingSettings) : null;
  const clsColor = cls ? getClassificationColor(cls.index) : COLORS.textMutedLight;

  // Low-grade courses (points < 2.0)
  const lowGradeCourses = courses.filter(c => c.grade && c.grade.points < LOW_GRADE_THRESHOLD);
  const hasLowGrades = lowGradeCourses.length > 0;

  // Is the currently selected grade a low grade?
  const selectedIsLow = selectedGrade && selectedGrade.points < LOW_GRADE_THRESHOLD;

  function addCourse() {
    const newErrors = {};
    if (!courseName.trim()) newErrors.name = 'Course name required';
    if (!selectedGrade) newErrors.grade = 'Select a grade';
    const cr = parseInt(courseCredits, 10);
    if (isNaN(cr) || cr < 1 || cr > 12) newErrors.credits = 'Credits: 1–12';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setCourses(prev => [...prev, { id: Date.now(), name: courseName.trim(), grade: selectedGrade, credits: cr }]);
    setCourseName('');
    setCourseCredits('');
    setSelectedGrade(null);
    setSaved(false);
  }

  function removeCourse(id) {
    setCourses(prev => prev.filter(c => c.id !== id));
    if (expandedImpact === id) setExpandedImpact(null);
    setSaved(false);
  }

  async function saveToRecord() {
    if (courses.length === 0) {
      Alert.alert('No courses', 'Add at least one course before saving.');
      return;
    }
    // Save with full courses array for breakdown view in Semesters screen
    await addSemester({
      name: semName,
      gpa: semGpa,
      credits: totalCredits,
      skipped: false,
      skipReason: '',
      courses: courses, // ← store course details
    });
    setSaved(true);
    Alert.alert(
      '✅ Saved!',
      `${semName} with GPA ${semGpa.toFixed(2)} saved to your CGPA record.`,
      [{ text: 'View CGPA', onPress: () => navigation.navigate('CGPACalculator') }, { text: 'OK' }]
    );
    // Reset after save
    setCourses([]);
    setSaved(false);
    setExpandedImpact(null);
  }

  function clearAll() {
    Alert.alert('Clear All', 'Remove all courses?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setCourses([]); setSaved(false); setExpandedImpact(null); } },
    ]);
  }

  function toggleImpact(courseId) {
    setExpandedImpact(prev => prev === courseId ? null : courseId);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} keyboardShouldPersistTaps="handled">

        {/* GPA Result Card */}
        <LinearGradient
          colors={courses.length > 0 ? [clsColor + 'cc', clsColor] : ['#1e293b', '#334155']}
          style={styles.gpaCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.gpaCardLabel}>Semester GPA</Text>
          <Text style={styles.gpaCardValue}>{courses.length > 0 ? semGpa.toFixed(2) : '--'}</Text>
          {courses.length > 0 && cls && (
            <View style={styles.gpaCardBadge}>
              <Text style={styles.gpaCardBadgeText}>{cls.label}</Text>
            </View>
          )}
          <View style={styles.gpaCardStats}>
            <View style={styles.gpaCardStat}>
              <Text style={styles.gpaCardStatVal}>{courses.length}</Text>
              <Text style={styles.gpaCardStatLabel}>Courses</Text>
            </View>
            <View style={styles.gpaCardStat}>
              <Text style={styles.gpaCardStatVal}>{totalCredits}</Text>
              <Text style={styles.gpaCardStatLabel}>Credits</Text>
            </View>
            {hasLowGrades && (
              <View style={styles.gpaCardStat}>
                <Text style={[styles.gpaCardStatVal, { color: '#fbbf24' }]}>{lowGradeCourses.length}</Text>
                <Text style={[styles.gpaCardStatLabel, { color: '#fbbf24' }]}>⚠️ Low</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Low Grade Banner ─────────────────────────────────── */}
        {hasLowGrades && (
          <View style={styles.lowGradeBanner}>
            <View style={styles.lowGradeBannerHeader}>
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text style={styles.lowGradeBannerTitle}>
                {lowGradeCourses.length} subject{lowGradeCourses.length > 1 ? 's' : ''} below C grade!
              </Text>
            </View>
            <Text style={styles.lowGradeBannerSub}>
              Subjects below grade C ({"<"} 2.0 pts) may affect your CGPA. Tap each subject below to see the upgrade impact.
            </Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Add Course Form */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.text }]}>Add Course</Text>

            <Text style={[styles.label, { color: theme.textMuted }]}>Course Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.name ? COLORS.danger : theme.border }]}
              value={courseName}
              onChangeText={t => { setCourseName(t); setErrors(e => ({ ...e, name: null })); }}
              placeholder="e.g. Data Structures"
              placeholderTextColor={theme.textMuted}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={[styles.label, { color: theme.textMuted }]}>Credits</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: errors.credits ? COLORS.danger : theme.border }]}
              value={courseCredits}
              onChangeText={t => { setCourseCredits(t); setErrors(e => ({ ...e, credits: null })); }}
              placeholder="e.g. 3"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
            />
            {errors.credits && <Text style={styles.errorText}>{errors.credits}</Text>}

            <Text style={[styles.label, { color: theme.textMuted }]}>Select Grade</Text>
            {errors.grade && <Text style={styles.errorText}>{errors.grade}</Text>}

            {/* Low-grade pre-selection warning */}
            {selectedIsLow && (
              <View style={styles.lowGradeSelectWarn}>
                <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                <Text style={styles.lowGradeSelectWarnText}>
                  ⚠️ {selectedGrade.grade} ({selectedGrade.points.toFixed(2)} pts) is below grade C — this will lower your GPA!
                </Text>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gradeGrid}>
                {gradingSettings.grades.map(g => {
                  const isLow = g.points < LOW_GRADE_THRESHOLD;
                  const isSelected = selectedGrade?.grade === g.grade;
                  return (
                    <TouchableOpacity
                      key={g.grade}
                      style={[
                        styles.gradeBtn,
                        { borderColor: isLow ? '#f59e0b60' : theme.border },
                        isSelected && { backgroundColor: isLow ? '#f59e0b' : COLORS.primary, borderColor: isLow ? '#f59e0b' : COLORS.primary },
                      ]}
                      onPress={() => { setSelectedGrade(g); setErrors(e => ({ ...e, grade: null })); }}
                    >
                      <Text style={[styles.gradeBtnGrade, { color: isSelected ? '#fff' : isLow ? '#f59e0b' : theme.text }]}>
                        {g.grade}
                      </Text>
                      <Text style={[styles.gradeBtnPoints, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
                        {g.points.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {selectedGrade && (
              <View style={[styles.selectedGradeInfo, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '30' }]}>
                <Text style={[styles.selectedGradeText, { color: COLORS.primary }]}>
                  Grade: {selectedGrade.grade} = {selectedGrade.points.toFixed(2)} points · Mark range: {selectedGrade.markMin}–{selectedGrade.markMax}%
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.addCourseBtn} onPress={addCourse}>
              <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.addCourseBtnGrad}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.addCourseBtnText}>Add Course</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Courses List */}
          {courses.length > 0 && (
            <View style={[styles.courseList, { backgroundColor: theme.card }]}>
              <View style={styles.courseListHeader}>
                <Text style={[styles.courseListTitle, { color: theme.text }]}>Courses ({courses.length})</Text>
                <TouchableOpacity onPress={clearAll}>
                  <Text style={{ color: COLORS.danger, fontWeight: '600', fontSize: FONT_SIZE.sm }}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {courses.map((c) => {
                const isLow = c.grade.points < LOW_GRADE_THRESHOLD;
                const impact = isLow ? calcUpgradeImpact(courses, c.id, gradingSettings, appState.semesters) : null;
                const isExpanded = expandedImpact === c.id;

                return (
                  <View key={c.id}>
                    <View style={[styles.courseItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.courseItemLeft}>
                        <Text style={[styles.courseItemName, { color: theme.text }]}>{c.name}</Text>
                        <Text style={[styles.courseItemCredits, { color: theme.textMuted }]}>{c.credits} credits</Text>
                      </View>
                      <View style={styles.courseItemRight}>
                        <View style={[
                          styles.gradeTag,
                          isLow
                            ? { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }
                            : { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary + '40' }
                        ]}>
                          <Text style={[styles.gradeTagText, { color: isLow ? '#f59e0b' : COLORS.primary }]}>
                            {c.grade.grade}
                          </Text>
                        </View>
                        <Text style={[styles.gradePoints, { color: isLow ? '#f59e0b' : theme.textMuted }]}>
                          {c.grade.points.toFixed(2)}
                        </Text>
                        {isLow && (
                          <TouchableOpacity onPress={() => toggleImpact(c.id)} style={styles.impactToggleBtn}>
                            <Ionicons
                              name={isExpanded ? 'chevron-up-circle' : 'trending-up'}
                              size={22}
                              color="#f59e0b"
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => removeCourse(c.id)} style={styles.removeBtn}>
                          <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* ── Upgrade Impact Card ─────────────────────── */}
                    {isLow && isExpanded && impact && (
                      <View style={styles.impactCard}>
                        <View style={styles.impactCardHeader}>
                          <Ionicons name="trending-up" size={18} color="#10b981" />
                          <Text style={styles.impactCardTitle}>
                            Upgrade "{c.name}" to C — Impact
                          </Text>
                        </View>
                        <View style={styles.impactRow}>
                          <View style={styles.impactStat}>
                            <Text style={styles.impactStatLabel}>Sem GPA</Text>
                            <View style={styles.impactArrow}>
                              <Text style={[styles.impactStatVal, { color: '#f59e0b' }]}>
                                {impact.oldSemGpa.toFixed(2)}
                              </Text>
                              <Ionicons name="arrow-forward" size={14} color="#10b981" style={{ marginHorizontal: 4 }} />
                              <Text style={[styles.impactStatVal, { color: '#10b981' }]}>
                                {impact.newSemGpa.toFixed(2)}
                              </Text>
                            </View>
                            <Text style={styles.impactDelta}>
                              +{impact.semGpaDelta.toFixed(2)} improvement
                            </Text>
                          </View>
                          <View style={[styles.impactDivider, { backgroundColor: theme.border }]} />
                          <View style={styles.impactStat}>
                            <Text style={styles.impactStatLabel}>CGPA (projected)</Text>
                            <View style={styles.impactArrow}>
                              <Text style={[styles.impactStatVal, { color: '#f59e0b' }]}>
                                {impact.oldCgpa.toFixed(2)}
                              </Text>
                              <Ionicons name="arrow-forward" size={14} color="#10b981" style={{ marginHorizontal: 4 }} />
                              <Text style={[styles.impactStatVal, { color: '#10b981' }]}>
                                {impact.newCgpa.toFixed(2)}
                              </Text>
                            </View>
                            <Text style={styles.impactDelta}>
                              +{impact.cgpaDelta.toFixed(2)} improvement
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.impactTip}>
                          💡 Retaking or upgrading this subject to at least a C grade can boost your CGPA significantly!
                        </Text>
                      </View>
                    )}

                    {/* Low grade row hint (collapsed state) */}
                    {isLow && !isExpanded && (
                      <TouchableOpacity style={styles.impactCollapsed} onPress={() => toggleImpact(c.id)}>
                        <Ionicons name="trending-up" size={14} color="#f59e0b" />
                        <Text style={styles.impactCollapsedText}>
                          Tap ↑ to see CGPA upgrade impact for this subject
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Save to Record */}
          {courses.length > 0 && (
            <View style={[styles.saveSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.saveTitle, { color: theme.text }]}>Save to CGPA Record</Text>
              {hasLowGrades && (
                <View style={styles.saveLowGradeNote}>
                  <Ionicons name="information-circle" size={16} color={COLORS.warning} />
                  <Text style={styles.saveLowGradeNoteText}>
                    You have {lowGradeCourses.length} low-grade subject{lowGradeCourses.length > 1 ? 's' : ''}. Consider upgrading before finalizing.
                  </Text>
                </View>
              )}
              <Text style={[styles.label, { color: theme.textMuted }]}>Semester Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={semName}
                onChangeText={setSemName}
                placeholder="e.g. Semester 1"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveToRecord}>
                <LinearGradient colors={['#059669', '#047857']} style={styles.saveBtnGrad}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Save GPA to Record</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark, inputBg: COLORS.bgDark3 };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight, inputBg: COLORS.bgLight3 };

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── GPA Card ──
  gpaCard: { margin: SPACING.md, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.lg },
  gpaCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase' },
  gpaCardValue: { color: '#fff', fontSize: 56, fontWeight: '800', lineHeight: 62 },
  gpaCardBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, marginTop: SPACING.xs },
  gpaCardBadgeText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  gpaCardStats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.md },
  gpaCardStat: { alignItems: 'center' },
  gpaCardStatVal: { color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: '700' },
  gpaCardStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs },

  // ── Low Grade Banner ──
  lowGradeBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#f59e0b15',
    borderWidth: 1.5,
    borderColor: '#f59e0b50',
    padding: SPACING.md,
  },
  lowGradeBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  lowGradeBannerTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: '#f59e0b' },
  lowGradeBannerSub: { fontSize: FONT_SIZE.sm, color: '#92400e', lineHeight: 18 },

  // ── Content ──
  content: { padding: SPACING.md },
  formCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  formTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginTop: -SPACING.xs, marginBottom: SPACING.xs },

  // Low grade selection warning
  lowGradeSelectWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#f59e0b15',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  lowGradeSelectWarnText: { color: '#92400e', fontSize: FONT_SIZE.xs, flex: 1, lineHeight: 16 },

  // ── Grade Picker ──
  gradeGrid: { flexDirection: 'row', gap: SPACING.xs, paddingVertical: SPACING.xs, paddingBottom: SPACING.sm },
  gradeBtn: { borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, alignItems: 'center', minWidth: 50 },
  gradeBtnGrade: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  gradeBtnPoints: { fontSize: FONT_SIZE.xs },
  selectedGradeInfo: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.sm },
  selectedGradeText: { fontSize: FONT_SIZE.sm },

  addCourseBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xs, ...SHADOW.sm },
  addCourseBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  addCourseBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  // ── Course List ──
  courseList: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  courseListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  courseListTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  courseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1 },
  courseItemLeft: { flex: 1 },
  courseItemName: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  courseItemCredits: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  courseItemRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  gradeTag: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  gradeTagText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  gradePoints: { fontSize: FONT_SIZE.sm },
  removeBtn: { padding: SPACING.xs },
  impactToggleBtn: { padding: SPACING.xs },

  // ── Upgrade Impact Card ──
  impactCard: {
    marginVertical: SPACING.xs,
    marginHorizontal: -SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#10b98110',
    borderWidth: 1,
    borderColor: '#10b98130',
    padding: SPACING.md,
  },
  impactCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  impactCardTitle: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: '#059669', flex: 1 },
  impactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  impactStat: { flex: 1, alignItems: 'center' },
  impactStatLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  impactArrow: { flexDirection: 'row', alignItems: 'center' },
  impactStatVal: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  impactDelta: { fontSize: FONT_SIZE.xs, color: '#10b981', fontWeight: '600', marginTop: 2 },
  impactDivider: { width: 1, height: 50, marginHorizontal: SPACING.sm },
  impactTip: { fontSize: FONT_SIZE.xs, color: '#059669', lineHeight: 16, marginTop: SPACING.xs, fontStyle: 'italic' },

  // Collapsed impact hint
  impactCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: SPACING.xs,
    marginBottom: 2,
  },
  impactCollapsedText: { fontSize: FONT_SIZE.xs, color: '#f59e0b', fontStyle: 'italic' },

  // ── Save Section ──
  saveSection: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  saveTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  saveLowGradeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.warning + '15',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  saveLowGradeNoteText: { fontSize: FONT_SIZE.xs, color: '#92400e', flex: 1, lineHeight: 16 },
  saveBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOW.md },
  saveBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
