import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { calcSemesterGPA, classifyGpa, getClassificationColor } from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

const SKIP_REASONS = ['Industrial Training', 'Internship', 'Medical Leave', 'Study Leave', 'Other'];

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

  // FIX: Keep semName in sync with the actual number of semesters
  useEffect(() => {
    setSemName(`Semester ${appState.semesters.length + 1}`);
  }, [appState.semesters.length]);

  const semGpa = calcSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const cls = courses.length > 0 ? classifyGpa(semGpa, gradingSettings) : null;
  const clsColor = cls ? getClassificationColor(cls.index) : COLORS.textMutedLight;

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
    setSaved(false);
  }

  async function saveToRecord() {
    if (courses.length === 0) {
      Alert.alert('No courses', 'Add at least one course before saving.');
      return;
    }
    await addSemester({ name: semName, gpa: semGpa, credits: totalCredits, skipped: false, skipReason: '' });
    setSaved(true);
    Alert.alert('Saved!', `${semName} with GPA ${semGpa.toFixed(2)} saved to your CGPA record.`);
    navigation.navigate('CGPACalculator');
  }

  function clearAll() {
    Alert.alert('Clear All', 'Remove all courses?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { setCourses([]); setSaved(false); } },
    ]);
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
          </View>
        </LinearGradient>

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.gradeGrid}>
                {gradingSettings.grades.map(g => (
                  <TouchableOpacity
                    key={g.grade}
                    style={[
                      styles.gradeBtn,
                      { borderColor: theme.border },
                      selectedGrade?.grade === g.grade && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                    ]}
                    onPress={() => { setSelectedGrade(g); setErrors(e => ({ ...e, grade: null })); }}
                  >
                    <Text style={[styles.gradeBtnGrade, { color: selectedGrade?.grade === g.grade ? '#fff' : theme.text }]}>{g.grade}</Text>
                    <Text style={[styles.gradeBtnPoints, { color: selectedGrade?.grade === g.grade ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
                      {g.points.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
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
              {courses.map((c, i) => (
                <View key={c.id} style={[styles.courseItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.courseItemLeft}>
                    <Text style={[styles.courseItemName, { color: theme.text }]}>{c.name}</Text>
                    <Text style={[styles.courseItemCredits, { color: theme.textMuted }]}>{c.credits} credits</Text>
                  </View>
                  <View style={styles.courseItemRight}>
                    <View style={[styles.gradeTag, { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary + '40' }]}>
                      <Text style={[styles.gradeTagText, { color: COLORS.primary }]}>{c.grade.grade}</Text>
                    </View>
                    <Text style={[styles.gradePoints, { color: theme.textMuted }]}>{c.grade.points.toFixed(2)}</Text>
                    <TouchableOpacity onPress={() => removeCourse(c.id)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Save to Record */}
          {courses.length > 0 && (
            <View style={[styles.saveSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.saveTitle, { color: theme.text }]}>Save to CGPA Record</Text>
              <Text style={[styles.label, { color: theme.textMuted }]}>Semester Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
                value={semName}
                onChangeText={setSemName}
                placeholder="e.g. Semester 1"
                placeholderTextColor={theme.textMuted}
              />
              <TouchableOpacity style={[styles.saveBtn, saved && { opacity: 0.6 }]} onPress={saveToRecord} disabled={saved}>
                <LinearGradient colors={['#059669', '#047857']} style={styles.saveBtnGrad}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={saved ? 'checkmark-circle' : 'save'} size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save GPA to Record'}</Text>
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
  gpaCard: { margin: SPACING.md, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOW.lg },
  gpaCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase' },
  gpaCardValue: { color: '#fff', fontSize: 56, fontWeight: '800', lineHeight: 62 },
  gpaCardBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, marginTop: SPACING.xs },
  gpaCardBadgeText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  gpaCardStats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.md },
  gpaCardStat: { alignItems: 'center' },
  gpaCardStatVal: { color: '#fff', fontSize: FONT_SIZE.xl, fontWeight: '700' },
  gpaCardStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs },
  content: { padding: SPACING.md },
  formCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  formTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginTop: -SPACING.xs, marginBottom: SPACING.xs },
  gradeGrid: { flexDirection: 'row', gap: SPACING.xs, paddingVertical: SPACING.xs, paddingBottom: SPACING.sm },
  gradeBtn: { borderWidth: 1.5, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, alignItems: 'center', minWidth: 50 },
  gradeBtnGrade: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  gradeBtnPoints: { fontSize: FONT_SIZE.xs },
  selectedGradeInfo: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, padding: SPACING.sm, marginBottom: SPACING.sm },
  selectedGradeText: { fontSize: FONT_SIZE.sm },
  addCourseBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xs, ...SHADOW.sm },
  addCourseBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  addCourseBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
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
  saveSection: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  saveTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  saveBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOW.md },
  saveBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
