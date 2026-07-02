import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { classifyGpa, getClassificationColor } from '../utils/calculations';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, SHADOW } from '../utils/theme';

export default function SemestersScreen({ navigation }) {
  const { appState, gradingSettings, isDarkMode, editSemester, deleteSemester } = useApp();
  const theme = isDarkMode ? darkTheme : lightTheme;

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: null, name: '', gpa: '', credits: '' });
  const [editErrors, setEditErrors] = useState({});

  function openEdit(sem) {
    setEditData({
      id: sem.id,
      name: sem.name,
      gpa: sem.gpa !== null && sem.gpa !== undefined ? String(sem.gpa) : '',
      credits: String(sem.credits),
    });
    setEditErrors({});
    setEditModal(true);
  }

  async function handleSaveEdit() {
    const newErrors = {};
    const name = editData.name.trim();
    const gpaRaw = editData.gpa.trim();
    const gpa = gpaRaw === '' ? null : parseFloat(gpaRaw);
    const credits = parseInt(editData.credits, 10);
    const skipped = gpaRaw === '' || gpa === null;

    if (!name) newErrors.name = 'Name is required';
    if (!skipped && (isNaN(gpa) || gpa < 0 || gpa > 4)) newErrors.gpa = 'GPA must be 0.0 – 4.0';
    if (isNaN(credits) || credits < 1 || credits > 60) newErrors.credits = 'Credits: 1–60';

    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return; }

    await editSemester(editData.id, { name, gpa: skipped ? null : gpa, credits, skipped });
    setEditModal(false);
  }

  async function handleDelete(id, name) {
    Alert.alert('Delete Semester', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSemester(id); } },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {appState.semesters.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
              <Ionicons name="albums" size={48} color={theme.textMuted} style={{ marginBottom: SPACING.md }} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Semesters Yet</Text>
              <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>Add your first semester from the CGPA Calculator tab.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('CGPACalculator')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.emptyBtnText}>Go to CGPA Calculator</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            appState.semesters.map((sem, idx) => {
              const isSkipped = sem.skipped || sem.gpa === null || sem.gpa === undefined;
              const semCls = isSkipped ? null : classifyGpa(sem.gpa, gradingSettings);
              const semColor = isSkipped ? COLORS.skip : getClassificationColor(semCls.index);

              return (
                <View key={sem.id} style={[styles.semCard, { backgroundColor: theme.card, borderTopColor: semColor }]}>
                  <View style={styles.semHeader}>
                    <View style={styles.semHeaderLeft}>
                      <View style={[styles.semNumBadge, { backgroundColor: semColor + '20', borderColor: semColor + '40' }]}>
                        <Text style={[styles.semNumText, { color: semColor }]}>#{idx + 1}</Text>
                      </View>
                      <Text style={[styles.semName, { color: theme.text }]}>{sem.name}</Text>
                    </View>
                    <View style={styles.semActions}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary + '20' }]} onPress={() => openEdit(sem)}>
                        <Ionicons name="pencil" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger + '20' }]} onPress={() => handleDelete(sem.id, sem.name)}>
                        <Ionicons name="trash" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.semBody}>
                    <View style={styles.semStat}>
                      <Text style={[styles.semStatLabel, { color: theme.textMuted }]}>GPA</Text>
                      <Text style={[styles.semStatValue, { color: semColor }]}>
                        {isSkipped ? 'N/A' : sem.gpa.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.semStat}>
                      <Text style={[styles.semStatLabel, { color: theme.textMuted }]}>Credits</Text>
                      <Text style={[styles.semStatValue, { color: theme.text }]}>{sem.credits}</Text>
                    </View>
                    <View style={styles.semStat}>
                      <Text style={[styles.semStatLabel, { color: theme.textMuted }]}>Classification</Text>
                      <View style={[styles.clsBadge, { backgroundColor: semColor + '20', borderColor: semColor + '40' }]}>
                        <Text style={[styles.clsBadgeText, { color: semColor }]}>
                          {isSkipped ? (sem.skipReason || 'Non-GPA') : semCls.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Semester</Text>

            <Text style={[styles.label, { color: theme.textMuted }]}>Semester Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: editErrors.name ? COLORS.danger : theme.border }]}
              value={editData.name}
              onChangeText={t => setEditData(d => ({ ...d, name: t }))}
              placeholderTextColor={theme.textMuted}
            />
            {editErrors.name && <Text style={styles.errorText}>{editErrors.name}</Text>}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>GPA (0.0–4.0)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: editErrors.gpa ? COLORS.danger : theme.border }]}
                  value={editData.gpa}
                  onChangeText={t => setEditData(d => ({ ...d, gpa: t }))}
                  keyboardType="decimal-pad"
                  placeholderTextColor={theme.textMuted}
                />
                {editErrors.gpa && <Text style={styles.errorText}>{editErrors.gpa}</Text>}
              </View>
              <View style={{ width: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Credits</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: editErrors.credits ? COLORS.danger : theme.border }]}
                  value={editData.credits}
                  onChangeText={t => setEditData(d => ({ ...d, credits: t }))}
                  keyboardType="number-pad"
                  placeholderTextColor={theme.textMuted}
                />
                {editErrors.credits && <Text style={styles.errorText}>{editErrors.credits}</Text>}
              </View>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setEditModal(false)}>
                <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  content: { padding: SPACING.md },
  emptyCard: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', ...SHADOW.sm, marginTop: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.xs },
  emptyDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.lg },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  semCard: { borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md, borderTopWidth: 3, overflow: 'hidden', ...SHADOW.sm },
  semHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, paddingBottom: SPACING.sm },
  semHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  semNumBadge: { borderRadius: BORDER_RADIUS.sm, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  semNumText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  semName: { fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  semActions: { flexDirection: 'row', gap: SPACING.xs },
  actionBtn: { borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, justifyContent: 'center', alignItems: 'center' },
  semBody: { flexDirection: 'row', padding: SPACING.md, paddingTop: 0, gap: SPACING.md },
  semStat: { flex: 1, alignItems: 'center' },
  semStatLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  semStatValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  clsBadge: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  clsBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', marginBottom: SPACING.md, textAlign: 'center' },
  label: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row' },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZE.xs, marginTop: -SPACING.xs, marginBottom: SPACING.xs },
  modalBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: FONT_SIZE.md },
  saveBtn: { flex: 1, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  saveBtnGrad: { padding: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
});
