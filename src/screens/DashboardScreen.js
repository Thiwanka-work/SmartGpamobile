import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';
import { calcCGPA, calcCompletedCredits, classifyGpa, getClassificationColor, getClassificationGradient, getImprovementOpportunities } from '../utils/calculations';

export default function DashboardScreen({ navigation }) {
  const { appState, gradingSettings, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const cgpa = calcCGPA(appState.semesters);
  const completedCredits = calcCompletedCredits(appState.semesters);
  const totalCredits = appState.totalCredits || 0;
  const remaining = Math.max(0, totalCredits - completedCredits);
  const creditPct = totalCredits > 0 ? Math.min(100, (completedCredits / totalCredits) * 100) : 0;
  const cls = classifyGpa(cgpa, gradingSettings);
  const clsColor = getClassificationColor(cls.index);
  const validSems = appState.semesters.filter(s => !s.skipped && s.gpa !== null && s.gpa !== undefined);
  const bestGpa = validSems.length > 0 ? Math.max(...validSems.map(s => s.gpa)) : null;
  const lowestGpa = validSems.length > 0 ? Math.min(...validSems.map(s => s.gpa)) : null;

  const lowCourses = getImprovementOpportunities(appState.semesters);

  let trendText = 'Add semesters to see trend';
  let trendColor = COLORS.textMutedLight;
  if (validSems.length >= 2) {
    const last = validSems[validSems.length - 1].gpa;
    const prev = validSems[validSems.length - 2].gpa;
    const diff = (last - prev).toFixed(2);
    if (last > prev) { trendText = `↑ Up ${diff} from last semester`; trendColor = COLORS.success; }
    else if (last < prev) { trendText = `↓ Down ${Math.abs(diff)} from last semester`; trendColor = COLORS.danger; }
    else { trendText = '→ Same as last semester'; trendColor = COLORS.textMutedLight; }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Hero CGPA Card */}
      <LinearGradient colors={['#1e3a8a', '#2563eb', '#1d4ed8']} style={styles.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.heroTop}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.heroGreeting}>Hello, {appState.studentName || 'Student'}</Text>
              <Ionicons name="hand-right" size={20} color="#facc15" />
            </View>
            <Text style={styles.heroSub}>Your Academic Overview</Text>
          </View>
          <View style={[styles.cgpaBubble, { borderColor: clsColor + '60' }]}>
            <Text style={[styles.cgpaValueBig, { color: clsColor === COLORS.firstClass ? '#10b981' : '#fff' }]}>
              {appState.semesters.length > 0 ? cgpa.toFixed(2) : '--'}
            </Text>
            <Text style={styles.cgpaOutOf}>/ {gradingSettings.maxGpa.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.heroBadgeRow}>
          <View style={[styles.heroBadge, { backgroundColor: clsColor + '30', borderColor: clsColor + '60' }]}>
            <Text style={[styles.heroBadgeText, { color: '#fff' }]}>
              {appState.semesters.length > 0 ? cls.label : 'Not Calculated'}
            </Text>
          </View>
          <Text style={[styles.trendHero, { color: trendColor === COLORS.success ? '#86efac' : trendColor === COLORS.danger ? '#fca5a5' : 'rgba(255,255,255,0.6)' }]}>
            {trendText}
          </Text>
        </View>

        {/* CGPA progress bar */}
        {appState.semesters.length > 0 && (
          <View style={styles.heroProgressContainer}>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${(cgpa / (gradingSettings.maxGpa || 4)) * 100}%`, backgroundColor: clsColor }]} />
            </View>
            <Text style={styles.heroProgressLabel}>{cgpa.toFixed(2)} / {gradingSettings.maxGpa.toFixed(1)}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Credits Card */}
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Credit Progress</Text>
            <View style={styles.creditRow}>
              <Text style={[styles.statValue, { color: theme.text }]}>{completedCredits}</Text>
              <Text style={[styles.statValueSub, { color: theme.textMuted }]}>/ {totalCredits}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${creditPct}%`, backgroundColor: COLORS.secondary }]} />
            </View>
            <Text style={[styles.remainingText, { color: theme.textMuted }]}>{remaining} cr. remaining</Text>
          </View>

          {/* Semesters Card */}
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Semesters</Text>
            <Text style={[styles.statValueLarge, { color: theme.text }]}>{appState.semesters.length}</Text>
            <Text style={[styles.statSub, { color: theme.textMuted }]}>recorded</Text>
            <View style={styles.miniStatRow}>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>Best</Text>
                <Text style={[styles.miniStatVal, { color: COLORS.firstClass }]}>{bestGpa !== null ? bestGpa.toFixed(2) : '--'}</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatLabel, { color: theme.textMuted }]}>Lowest</Text>
                <Text style={[styles.miniStatVal, { color: COLORS.danger }]}>{lowestGpa !== null ? lowestGpa.toFixed(2) : '--'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('CGPACalculator')}>
            <LinearGradient colors={COLORS.primary ? ['#2563eb', '#1d4ed8'] : ['#2563eb', '#1d4ed8']} style={styles.quickBtnGrad}>
              <Ionicons name="add-circle" size={28} color="#fff" style={styles.quickBtnIcon} />
              <Text style={styles.quickBtnText}>Add Semester</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('GPACalculator')}>
            <LinearGradient colors={['#059669', '#047857']} style={styles.quickBtnGrad}>
              <Ionicons name="calculator" size={28} color="#fff" style={styles.quickBtnIcon} />
              <Text style={styles.quickBtnText}>GPA Calculator</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Prediction')}>
            <LinearGradient colors={['#7c3aed', '#5b21b6']} style={styles.quickBtnGrad}>
              <Ionicons name="compass" size={28} color="#fff" style={styles.quickBtnIcon} />
              <Text style={styles.quickBtnText}>Prediction</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Analytics')}>
            <LinearGradient colors={['#d97706', '#b45309']} style={styles.quickBtnGrad}>
              <Ionicons name="bar-chart" size={28} color="#fff" style={styles.quickBtnIcon} />
              <Text style={styles.quickBtnText}>Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Improvement Hints */}
        {lowCourses.length > 0 && (
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Improvement Opportunities</Text>
            <View style={{ backgroundColor: COLORS.warning + '15', borderColor: COLORS.warning + '30', borderWidth: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: 8 }}>
                <Ionicons name="bulb" size={24} color={COLORS.warning} />
                <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.warning, flex: 1 }}>Boost your CGPA!</Text>
              </View>
              <Text style={{ fontSize: FONT_SIZE.sm, color: theme.text, marginBottom: SPACING.sm, lineHeight: 20 }}>
                You have {lowCourses.length} course{lowCourses.length > 1 ? 's' : ''} with a grade lower than C. Retaking or updating these modules can significantly improve your overall CGPA.
              </Text>
              <View style={{ gap: 8 }}>
                {lowCourses.slice(0, 3).map((course, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: theme.text }} numberOfLines={1}>{course.name || 'Unnamed Course'}</Text>
                      <Text style={{ fontSize: FONT_SIZE.xs, color: theme.textMuted }}>{course.semesterName}</Text>
                    </View>
                    <View style={{ backgroundColor: COLORS.danger + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm }}>
                      <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: COLORS.danger }}>{course.grade.grade}</Text>
                    </View>
                  </View>
                ))}
                {lowCourses.length > 3 && (
                  <Text style={{ fontSize: FONT_SIZE.xs, color: theme.textMuted, textAlign: 'center', marginTop: 4 }}>+ {lowCourses.length - 3} more</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Recent Semesters */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: lowCourses.length > 0 ? 0 : SPACING.md }]}>Recent Semesters</Text>
        {appState.semesters.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Ionicons name="school" size={48} color={theme.textMuted} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No semesters yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Add your first semester to start tracking your GPA</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CGPACalculator')}>
              <Text style={styles.emptyBtnText}>Add Semester</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...appState.semesters].reverse().slice(0, 5).map((sem, idx) => {
            const isSkipped = sem.skipped || sem.gpa === null || sem.gpa === undefined;
            const semCls = isSkipped ? null : classifyGpa(sem.gpa, gradingSettings);
            const semColor = isSkipped ? COLORS.skip : getClassificationColor(semCls.index);
            return (
              <View key={sem.id} style={[styles.semCard, { backgroundColor: theme.card, borderLeftColor: semColor }]}>
                <View style={styles.semCardLeft}>
                  <Text style={[styles.semName, { color: theme.text }]}>{sem.name}</Text>
                  <Text style={[styles.semCredits, { color: theme.textMuted }]}>{sem.credits} credits</Text>
                  {isSkipped && <Text style={[styles.semSkipReason, { color: COLORS.skip }]}>{sem.skipReason || 'Non-GPA'}</Text>}
                </View>
                <View style={styles.semCardRight}>
                  {isSkipped ? (
                    <View style={[styles.semBadge, { backgroundColor: COLORS.skip + '20', borderColor: COLORS.skip + '40' }]}>
                      <Text style={[styles.semBadgeText, { color: COLORS.skip }]}>Non-GPA</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.semGpa, { color: semColor }]}>{sem.gpa.toFixed(2)}</Text>
                      <View style={[styles.semBadge, { backgroundColor: semColor + '20', borderColor: semColor + '40' }]}>
                        <Text style={[styles.semBadgeText, { color: semColor }]}>{semCls.label}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}

        {appState.semesters.length > 5 && (
          <TouchableOpacity style={[styles.viewAllBtn, { borderColor: theme.border }]} onPress={() => navigation.navigate('Semesters')}>
            <Text style={[styles.viewAllText, { color: COLORS.primary }]}>View all semesters →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const darkTheme = {
  bg: COLORS.bgDark,
  card: COLORS.bgDark2,
  text: COLORS.textDark,
  textMuted: COLORS.textMutedDark,
  border: COLORS.borderDark,
};
const lightTheme = {
  bg: COLORS.bgLight,
  card: COLORS.bgLight2,
  text: COLORS.textLight,
  textMuted: COLORS.textMutedLight,
  border: COLORS.borderLight,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  heroGreeting: { color: '#fff', fontSize: FONT_SIZE.lg, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm, marginTop: 2 },
  cgpaBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    minWidth: 90,
  },
  cgpaValueBig: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: '#fff' },
  cgpaOutOf: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.sm },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  heroBadge: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  heroBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  trendHero: { fontSize: FONT_SIZE.xs, fontStyle: 'italic' },
  heroProgressContainer: { marginTop: SPACING.md },
  heroProgressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  heroProgressFill: { height: 6, borderRadius: 3 },
  heroProgressLabel: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs, marginTop: 4, textAlign: 'right' },
  content: { padding: SPACING.md },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  statLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  creditRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  statValueSub: { fontSize: FONT_SIZE.md },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.bgDark3, marginTop: SPACING.xs, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  remainingText: { fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  statValueLarge: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  statSub: { fontSize: FONT_SIZE.xs },
  miniStatRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  miniStat: {},
  miniStatLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  miniStatVal: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm, marginTop: SPACING.md },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  quickBtn: { width: '47%', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOW.sm },
  quickBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  quickBtnIcon: { marginBottom: SPACING.xs },
  quickBtnText: { color: '#fff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  emptyCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm },
  emptyIcon: { marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.xs },
  emptyDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.md },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
  semCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  semCardLeft: { flex: 1 },
  semName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  semCredits: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  semSkipReason: { fontSize: FONT_SIZE.xs, marginTop: 2, fontStyle: 'italic' },
  semCardRight: { alignItems: 'flex-end' },
  semGpa: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  semBadge: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: 4 },
  semBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  viewAllBtn: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.xl },
  viewAllText: { fontWeight: '700', fontSize: FONT_SIZE.md },
});
