// ================================================================
// SmartGPA - Core Calculation Utilities
// ================================================================

/**
 * Calculate CGPA from a list of semesters (credit-weighted average)
 */
export function calcCGPA(semesters) {
  const validSems = semesters.filter(
    s => !s.skipped && s.gpa !== null && s.gpa !== undefined
  );
  if (validSems.length === 0) return 0;
  const totalWeighted = validSems.reduce((acc, s) => acc + s.gpa * s.credits, 0);
  const totalCredits = validSems.reduce((acc, s) => acc + s.credits, 0);
  return totalCredits > 0 ? totalWeighted / totalCredits : 0;
}

/**
 * Calculate total completed credits (including skipped semesters)
 */
export function calcCompletedCredits(semesters) {
  return semesters.reduce((acc, s) => acc + (s.credits || 0), 0);
}

/**
 * Classify a GPA value based on grading settings
 */
export function classifyGpa(gpa, gradingSettings) {
  const classes = [...gradingSettings.classifications].sort(
    (a, b) => b.minGpa - a.minGpa
  );
  for (let i = 0; i < classes.length; i++) {
    if (gpa >= classes[i].minGpa) {
      return { ...classes[i], index: i };
    }
  }
  return { label: 'Fail', minGpa: 0, index: classes.length };
}

/**
 * Get badge color for classification
 */
export function getClassificationColor(index) {
  const colors = ['#059669', '#2563eb', '#d97706', '#64748b', '#94a3b8'];
  return colors[index] || '#94a3b8';
}

/**
 * Get badge gradient for classification
 */
export function getClassificationGradient(index) {
  const gradients = [
    ['#059669', '#10b981'],   // First Class - Green
    ['#1d4ed8', '#3b82f6'],   // Second Upper - Blue
    ['#b45309', '#f59e0b'],   // Second Lower - Amber
    ['#475569', '#94a3b8'],   // General Pass - Slate
    ['#6b7280', '#9ca3af'],   // Fail
  ];
  return gradients[index] || gradients[4];
}

/**
 * Calculate semester GPA from courses
 */
export function calcSemesterGPA(courses) {
  const valid = courses.filter(c => c.grade && c.credits > 0);
  if (valid.length === 0) return 0;
  const totalPoints = valid.reduce((acc, c) => acc + c.grade.points * c.credits, 0);
  const totalCredits = valid.reduce((acc, c) => acc + c.credits, 0);
  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

/**
 * Predict required GPA for next semester
 */
export function predictNextSemester(cgpa, completedCredits, targetCGPA, nextCredits) {
  const needed = (targetCGPA * (completedCredits + nextCredits) - cgpa * completedCredits) / nextCredits;
  return needed;
}

/**
 * Predict required GPA per semester across remaining semesters
 */
export function predictMultiSemester(cgpa, completedCredits, targetCGPA, semesterWeights) {
  const totalFutureCredits = semesterWeights.reduce((acc, sw) => acc + sw.credits, 0);
  if (totalFutureCredits <= 0) return null;
  const neededAverage =
    (targetCGPA * (completedCredits + totalFutureCredits) - cgpa * completedCredits) /
    totalFutureCredits;
  return neededAverage;
}

/**
 * Build running CGPA line for analytics chart
 */
export function buildCgpaLine(validSems) {
  let runningSum = 0;
  let runningCredits = 0;
  return validSems.map(s => {
    runningSum += s.gpa * s.credits;
    runningCredits += s.credits;
    return parseFloat((runningSum / runningCredits).toFixed(2));
  });
}

/**
 * Determine difficulty label/color from target GPA
 */
export function getDifficultyInfo(targetGpa) {
  if (targetGpa >= 3.7) return { label: 'Hard', color: '#ef4444', emoji: '🔴' };
  if (targetGpa >= 3.2) return { label: 'Moderate', color: '#f59e0b', emoji: '🟡' };
  return { label: 'Easy', color: '#10b981', emoji: '🟢' };
}
