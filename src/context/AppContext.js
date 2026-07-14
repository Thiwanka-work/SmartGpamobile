import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { DEFAULT_GRADING_SETTINGS, UNI_PRESETS } from '../utils/gradingData';

const AppContext = createContext(null);

const STORAGE_KEY = 'smartGpa_v2';
const SETTINGS_KEY = 'smartGpa_gradingSettings';
const THEME_KEY = 'smartGpa_theme';
const GUEST_KEY = 'smartGpa_guest';

const defaultAppState = {
  studentName: '',
  totalCredits: 0,
  totalSemesters: 8,
  completedSemesters: 0,
  semesters: [],
  profileSetup: false,
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [appState, setAppState] = useState(defaultAppState);
  const [gradingSettings, setGradingSettings] = useState(DEFAULT_GRADING_SETTINGS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadData(currentUser.uid);
      } else {
        await loadLocalSettingsOnly();
        setAppState(defaultAppState);
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function loadData(uid) {
    try {
      await loadLocalSettingsOnly();
      
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const parsed = docSnap.data();
        if (parsed.totalSemesters === undefined) parsed.totalSemesters = 8;
        if (parsed.completedSemesters === undefined) parsed.completedSemesters = 0;
        if (!Array.isArray(parsed.semesters)) parsed.semesters = [];
        setAppState(parsed);
      }
    } catch (e) {
      console.warn('Error loading from Firestore:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLocalSettingsOnly() {
    try {
      const [rawSettings, rawTheme, rawGuest, rawState] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(GUEST_KEY),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);

      if (rawGuest === 'true') {
        setIsGuest(true);
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (parsed.totalSemesters === undefined) parsed.totalSemesters = 8;
          if (parsed.completedSemesters === undefined) parsed.completedSemesters = 0;
          if (!Array.isArray(parsed.semesters)) parsed.semesters = [];
          setAppState(parsed);
        }
      }

      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        setGradingSettings({
          preset: parsed.preset || 'sliit',
          grades: parsed.grades || DEFAULT_GRADING_SETTINGS.grades,
          classifications: parsed.classifications || DEFAULT_GRADING_SETTINGS.classifications,
          maxGpa: parsed.maxGpa || 4.0,
        });
      }

      if (rawTheme) {
        setIsDarkMode(rawTheme === 'dark');
      }
    } catch (e) {
      console.warn('Error loading settings from storage:', e);
    }
  }

  async function saveAppState(newState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      
      if (user) {
        await setDoc(doc(db, 'users', user.uid), newState);
      }
    } catch (e) {
      console.warn('Error saving app state to Firestore:', e);
    }
  }

  const continueAsGuest = useCallback(async () => {
    try {
      setIsGuest(true);
      await AsyncStorage.setItem(GUEST_KEY, 'true');
    } catch (e) {
      console.warn('Error saving guest state:', e);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user) {
        await signOut(auth);
      } else {
        setIsGuest(false);
        await AsyncStorage.removeItem(GUEST_KEY);
        setAppState(defaultAppState);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [user]);

  async function saveGradingSettings(newSettings) {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Error saving grading settings:', e);
    }
  }

  // ── Profile Setup ─────────────────────────────────────────────
  const setupProfile = useCallback(async ({ studentName, totalCredits, totalSemesters, completedSemesters }) => {
    const newState = {
      ...appState,
      studentName,
      totalCredits,
      totalSemesters,
      completedSemesters,
      profileSetup: true,
    };
    setAppState(newState);
    await saveAppState(newState);
  }, [appState]);

  // ── Semester CRUD ─────────────────────────────────────────────
  const addSemester = useCallback(async (semester) => {
    const newSemester = {
      id: Date.now(),
      semNumber: appState.semesters.length + 1,
      ...semester,
    };
    const newState = {
      ...appState,
      semesters: [...appState.semesters, newSemester],
    };
    setAppState(newState);
    await saveAppState(newState);
    return newSemester;
  }, [appState]);

  const editSemester = useCallback(async (id, updates) => {
    const newSemesters = appState.semesters.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    const newState = { ...appState, semesters: newSemesters };
    setAppState(newState);
    await saveAppState(newState);
  }, [appState]);

  const deleteSemester = useCallback(async (id) => {
    const newSemesters = appState.semesters.filter(s => s.id !== id);
    const newState = { ...appState, semesters: newSemesters };
    setAppState(newState);
    await saveAppState(newState);
  }, [appState]);

  // ── Grading Settings ──────────────────────────────────────────
  const applyGradingPreset = useCallback(async (presetKey) => {
    const preset = UNI_PRESETS[presetKey];
    if (!preset) return;
    const newSettings = {
      preset: presetKey,
      grades: JSON.parse(JSON.stringify(preset.grades)),
      classifications: JSON.parse(JSON.stringify(preset.classifications)),
      maxGpa: preset.maxGpa,
    };
    setGradingSettings(newSettings);
    await saveGradingSettings(newSettings);
  }, []);

  const updateGradingSettings = useCallback(async (newSettings) => {
    setGradingSettings(newSettings);
    await saveGradingSettings(newSettings);
  }, []);

  // ── Theme ─────────────────────────────────────────────────────
  const toggleTheme = useCallback(async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // ── Reset All ─────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    const freshState = {
      ...defaultAppState,
      semesters: [],
    };
    setAppState(freshState);
    await saveAppState(freshState);
  }, []);

  const value = {
    user,
    isGuest,
    appState,
    gradingSettings,
    isDarkMode,
    isLoading,
    setupProfile,
    addSemester,
    editSemester,
    deleteSemester,
    applyGradingPreset,
    updateGradingSettings,
    toggleTheme,
    resetAll,
    logout,
    continueAsGuest,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
