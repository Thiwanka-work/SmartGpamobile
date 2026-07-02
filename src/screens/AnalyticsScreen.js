import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  calcCGPA, calcCompletedCredits, classifyGpa,
  getClassificationColor, buildCgpaLine,
} from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2 - SPACING.md * 2;
const CHART_HEIGHT = 180;

export default function AnalyticsScreen() {
  const { appState, gradingSettings, isDarkMode } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const cgpa = calcCGPA(appState.semesters);
  const completedCredits = calcCompletedCredits(appState.semesters);
  const totalCredits = appState.totalCredits || 0;
  const creditPct = totalCredits > 0 ? Math.min(100, (completedCredits / totalCredits) * 100) : 0;
  const remaining = Math.max(0, totalCredits - completedCredits);
  const cls = classifyGpa(cgpa, gradingSettings);
  const clsColor = getClassificationColor(cls.index);

  const validSems = appState.semesters.filter(
    s => !s.skipped && s.gpa !== null && s.gpa !== undefined
  );
  const best = validSems.length > 0 ? validSems.reduce((p, c) => (c.gpa > p.gpa ? c : p)) : null;
  const weak = validSems.length > 0 ? validSems.reduce((p, c) => (c.gpa < p.gpa ? c : p)) : null;
  const cgpaLine = validSems.length > 0 ? buildCgpaLine(validSems) : [];

  // Build simple bar chart data
  const maxGpa = gradingSettings.maxGpa || 4;
  const chartData = validSems.map((s, i) => ({
    label: s.name.replace('Semester ', 'S'),
    gpa: s.gpa,
    cgpa: cgpaLine[i] || 0,
    pct: (s.gpa / maxGpa) * 100,
    cgpaPct: ((cgpaLine[i] || 0) / maxGpa) * 100,
    color: getClassificationColor(classifyGpa(s.gpa, gradingSettings).index),
  }));

  let trendLabel = '--';
  let trendColor = theme.textMuted;
  let trendSub = 'Add more semesters to see trend';
  if (validSems.length >= 2) {
    const first = validSems[0].gpa;
    const last = cgpa;
    const diff = (last - first).toFixed(2);
    if (last > first) { trendLabel = 'Improving'; trendColor = COLORS.success; trendSub = `+${diff} since Sem 1`; }
    else if (last < first) { trendLabel = 'Declining'; trendColor = COLORS.danger; trendSub = `${diff} since Sem 1`; }
    else { trendLabel = 'Stable'; trendColor = COLORS.textMutedLight; trendSub = 'No change since Sem 1'; }
  } else if (validSems.length === 1) {
    trendLabel = 'Only 1 semester'; trendSub = 'Add more to see trend';
  }

  const generatePDF = async () => {
    if (appState.semesters.length === 0) {
      Alert.alert('No Data', 'You need to add at least one semester to generate a report.');
      return;
    }
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #2563eb; margin-bottom: 5px; }
              .header-sub { color: #666; margin-bottom: 30px; font-size: 16px; }
              .summary-box { background-color: #f3f4f6; padding: 20px; border-radius: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; }
              .summary-item { text-align: center; }
              .summary-val { font-size: 24px; font-weight: bold; color: #1d4ed8; }
              .summary-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-top: 5px; }
              h2 { color: #4b5563; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
              th { background-color: #f9fafb; font-weight: bold; color: #374151; }
              .sem-header { background-color: #e0e7ff !important; font-weight: bold; }
              .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <h1>SmartGPA Academic Report</h1>
            <div class="header-sub">Student Name: ${appState.studentName || 'Not Provided'}<br>Date: ${new Date().toLocaleDateString()}</div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="summary-val">${cgpa.toFixed(2)} / ${(gradingSettings.maxGpa || 4.0).toFixed(1)}</div>
                <div class="summary-label">Cumulative GPA</div>
              </div>
              <div class="summary-item">
                <div class="summary-val">${completedCredits} / ${totalCredits || 0}</div>
                <div class="summary-label">Credits Completed</div>
              </div>
              <div class="summary-item">
                <div class="summary-val">${cls.label}</div>
                <div class="summary-label">Classification</div>
              </div>
            </div>

            <h2>Semester Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Course Code/Name</th>
                  <th>Credits</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                ${appState.semesters.map(sem => `
                  <tr>
                    <td colspan="3" class="sem-header">${sem.name} - GPA: ${sem.gpa ? sem.gpa.toFixed(2) : 'N/A'}</td>
                  </tr>
                  ${sem.courses && sem.courses.length > 0 ? sem.courses.map(c => `
                    <tr>
                      <td>${c.name || 'Unnamed Course'}</td>
                      <td>${c.credits}</td>
                      <td>${c.grade ? c.grade.grade : 'N/A'}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="3">No courses recorded</td></tr>'}
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              Generated by SmartGPA Calculator App
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF report.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Summary Cards Row */}
        <View style={styles.summaryRow}>
          <LinearGradient colors={['#2563eb', '#1d4ed8']} style={[styles.summaryCard, styles.cgpaCard]}>
            <Text style={styles.sumLabel}>CGPA</Text>
            <Text style={styles.sumValue}>{validSems.length > 0 ? cgpa.toFixed(2) : '--'}</Text>
            <Text style={styles.sumSub}>{validSems.length > 0 ? cls.label : 'No data'}</Text>
          </LinearGradient>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sumLabel, { color: theme.textMuted }]}>Credits</Text>
            <Text style={[styles.sumValue, { color: COLORS.secondary }]}>{completedCredits}</Text>
            <Text style={[styles.sumSub, { color: theme.textMuted }]}>of {totalCredits}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sumLabel, { color: theme.textMuted }]}>Semesters</Text>
            <Text style={[styles.sumValue, { color: COLORS.warning }]}>{appState.semesters.length}</Text>
            <Text style={[styles.sumSub, { color: theme.textMuted }]}>recorded</Text>
          </View>
        </View>

        {/* Generate PDF Button */}
        <TouchableOpacity onPress={generatePDF} style={{ marginBottom: SPACING.md }}>
          <LinearGradient colors={['#7c3aed', '#5b21b6']} style={{ padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, ...SHADOW.sm }}>
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' }}>Download PDF Report</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* GPA Trend Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>GPA Trend</Text>
          <Text style={[styles.chartSub, { color: theme.textMuted }]}>Semester-wise performance</Text>
          {chartData.length < 1 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="trending-up" size={36} color={theme.textMuted} style={styles.emptyChartIcon} />
              <Text style={[styles.emptyChartText, { color: theme.textMuted }]}>Add at least 2 semesters to see your GPA trend</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barChartScroll}>
              <View style={styles.barChart}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                  {[maxGpa, maxGpa * 0.75, maxGpa * 0.5, maxGpa * 0.25, 0].map((v, i) => (
                    <Text key={i} style={[styles.yLabel, { color: theme.textMuted }]}>{v.toFixed(1)}</Text>
                  ))}
                </View>
                {/* Bars */}
                <View style={styles.barsContainer}>
                  {chartData.map((d, i) => (
                    <View key={i} style={styles.barGroup}>
                      <View style={styles.barWrapper}>
                        {/* CGPA dot */}
                        <View style={[styles.cgpaDot, { bottom: `${d.cgpaPct}%`, backgroundColor: COLORS.secondary }]} />
                        {/* Bar */}
                        <View style={styles.barTrack}>
                          <View style={[styles.bar, { height: `${d.pct}%`, backgroundColor: d.color }]} />
                        </View>
                      </View>
                      <Text style={[styles.barLabel, { color: theme.textMuted }]}>{d.label}</Text>
                      <Text style={[styles.barValue, { color: d.color }]}>{d.gpa.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
          {chartData.length > 0 && (
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={[styles.legendText, { color: theme.textMuted }]}>Semester GPA</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
                <Text style={[styles.legendText, { color: theme.textMuted }]}>Cumulative CGPA</Text>
              </View>
            </View>
          )}
        </View>

        {/* Credit Progress */}
        <View style={[styles.creditCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Credit Completion</Text>
          <View style={styles.creditProgress}>
            <View style={styles.creditProgressBar}>
              <View style={[styles.creditProgressFill, { width: `${creditPct}%` }]} />
            </View>
            <Text style={[styles.creditPct, { color: COLORS.secondary }]}>{creditPct.toFixed(0)}%</Text>
          </View>
          <View style={styles.creditNumbers}>
            <View style={styles.creditNumItem}>
              <Text style={[styles.creditNumVal, { color: COLORS.secondary }]}>{completedCredits}</Text>
              <Text style={[styles.creditNumLabel, { color: theme.textMuted }]}>Completed</Text>
            </View>
            <View style={styles.creditNumItem}>
              <Text style={[styles.creditNumVal, { color: theme.textMuted }]}>{remaining}</Text>
              <Text style={[styles.creditNumLabel, { color: theme.textMuted }]}>Remaining</Text>
            </View>
            <View style={styles.creditNumItem}>
              <Text style={[styles.creditNumVal, { color: theme.text }]}>{totalCredits}</Text>
              <Text style={[styles.creditNumLabel, { color: theme.textMuted }]}>Total</Text>
            </View>
          </View>
        </View>

        {/* Performance Summary */}
        <View style={[styles.perfCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.chartTitle, { color: theme.text }]}>Performance Summary</Text>
          <View style={styles.perfGrid}>
            <View style={[styles.perfItem, { borderColor: COLORS.firstClass + '40', backgroundColor: COLORS.firstClass + '10' }]}>
              <Ionicons name="ribbon" size={28} color={COLORS.firstClass} style={styles.perfIcon} />
              <Text style={[styles.perfLabel, { color: theme.textMuted }]}>Best Semester</Text>
              <Text style={[styles.perfVal, { color: COLORS.firstClass }]}>{best ? best.gpa.toFixed(2) : '--'}</Text>
              <Text style={[styles.perfSub, { color: theme.textMuted }]}>{best ? best.name : 'No data'}</Text>
            </View>
            <View style={[styles.perfItem, { borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '10' }]}>
              <Ionicons name="trending-down" size={28} color={COLORS.danger} style={styles.perfIcon} />
              <Text style={[styles.perfLabel, { color: theme.textMuted }]}>Weakest Semester</Text>
              <Text style={[styles.perfVal, { color: COLORS.danger }]}>{weak ? weak.gpa.toFixed(2) : '--'}</Text>
              <Text style={[styles.perfSub, { color: theme.textMuted }]}>{weak ? weak.name : 'No data'}</Text>
            </View>
            <View style={[styles.perfItem, { borderColor: clsColor + '40', backgroundColor: clsColor + '10' }]}>
              <Ionicons name="stats-chart" size={28} color={trendColor} style={styles.perfIcon} />
              <Text style={[styles.perfLabel, { color: theme.textMuted }]}>Overall Trend</Text>
              <Text style={[styles.perfVal, { color: trendColor }]}>{trendLabel}</Text>
              <Text style={[styles.perfSub, { color: theme.textMuted }]}>{trendSub}</Text>
            </View>
            <View style={[styles.perfItem, { borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '10' }]}>
              <Ionicons name="locate" size={28} color={COLORS.primary} style={styles.perfIcon} />
              <Text style={[styles.perfLabel, { color: theme.textMuted }]}>Credit CGPA</Text>
              <Text style={[styles.perfVal, { color: COLORS.primary }]}>{validSems.length > 0 ? cgpa.toFixed(2) : '--'}</Text>
              <Text style={[styles.perfSub, { color: theme.textMuted }]}>{validSems.length > 0 ? cls.label : '--'}</Text>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const darkTheme = { bg: COLORS.bgDark, card: COLORS.bgDark2, text: COLORS.textDark, textMuted: COLORS.textMutedDark, border: COLORS.borderDark };
const lightTheme = { bg: COLORS.bgLight, card: COLORS.bgLight2, text: COLORS.textLight, textMuted: COLORS.textMutedLight, border: COLORS.borderLight };

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryCard: { flex: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOW.sm },
  cgpaCard: {},
  sumLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
  sumValue: { color: '#fff', fontSize: FONT_SIZE.xxl, fontWeight: '800', marginTop: 4 },
  sumSub: { color: 'rgba(255,255,255,0.6)', fontSize: FONT_SIZE.xs, marginTop: 2 },
  chartCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  chartTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  chartSub: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  emptyChart: { alignItems: 'center', padding: SPACING.xl },
  emptyChartIcon: { fontSize: 36, marginBottom: SPACING.sm },
  emptyChartText: { fontSize: FONT_SIZE.sm, textAlign: 'center' },
  barChartScroll: { marginTop: SPACING.sm },
  barChart: { flexDirection: 'row', height: CHART_HEIGHT + 60 },
  yAxis: { justifyContent: 'space-between', paddingVertical: 30, paddingRight: SPACING.xs },
  yLabel: { fontSize: FONT_SIZE.xs },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 30, gap: SPACING.sm },
  barGroup: { alignItems: 'center', width: 48 },
  barWrapper: { height: CHART_HEIGHT, width: 28, justifyContent: 'flex-end', position: 'relative' },
  cgpaDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', left: '50%', marginLeft: -4, zIndex: 2 },
  barTrack: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: FONT_SIZE.xs, marginTop: 4, textAlign: 'center' },
  barValue: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  chartLegend: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FONT_SIZE.xs },
  creditCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  creditProgress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  creditProgressBar: { flex: 1, height: 12, backgroundColor: 'rgba(16,185,129,0.2)', borderRadius: 6, overflow: 'hidden' },
  creditProgressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 6 },
  creditPct: { fontSize: FONT_SIZE.md, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  creditNumbers: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.md },
  creditNumItem: { alignItems: 'center' },
  creditNumVal: { fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  creditNumLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase' },
  perfCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  perfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  perfItem: { width: '47%', borderRadius: BORDER_RADIUS.md, borderWidth: 1, padding: SPACING.md, alignItems: 'center' },
  perfIcon: { marginBottom: SPACING.xs },
  perfLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase', textAlign: 'center' },
  perfVal: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginTop: 4 },
  perfSub: { fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: 2 },
});
