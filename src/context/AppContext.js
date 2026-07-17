import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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

  // Use a ref to always have the latest user in callbacks without re-creating them
  const userRef = useRef(null);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      userRef.current = currentUser;
      if (currentUser) {
        await loadData(currentUser.uid);
      } else {
        const local = await loadLocalSettingsOnly();
        if (!local.isGuest) {
          setAppState(defaultAppState);
        }
        setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function loadData(uid) {
    try {
      // ── STEP 1: Load from LOCAL CACHE first (fast ~50ms) ──────────
      // This makes the app appear instantly — no waiting for the network
      const [rawSettings, rawTheme, rawGuest, rawState] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(GUEST_KEY),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);

      // IMPORTANT: remember if this was a guest login BEFORE we clear the flag
      const wasGuest = rawGuest === 'true';

      // Apply cached theme immediately
      if (rawTheme) setIsDarkMode(rawTheme === 'dark');

      // Apply cached grading settings
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        setGradingSettings({
          preset: parsed.preset || 'sliit',
          grades: parsed.grades || DEFAULT_GRADING_SETTINGS.grades,
          classifications: parsed.classifications || DEFAULT_GRADING_SETTINGS.classifications,
          maxGpa: parsed.maxGpa || 4.0,
        });
      }

      // Apply cached app data (semesters, profile, etc.)
      if (rawState) {
        const parsed = JSON.parse(rawState);
        if (parsed.totalSemesters === undefined) parsed.totalSemesters = 8;
        if (parsed.completedSemesters === undefined) parsed.completedSemesters = 0;
        if (!Array.isArray(parsed.semesters)) parsed.semesters = [];
        setAppState(parsed);
      }

      // ── SHOW THE APP NOW — don't wait for Firestore ────────────────
      setIsGuest(false);
      AsyncStorage.removeItem(GUEST_KEY).catch(() => {});
      setIsLoading(false);

      // ── STEP 2: Sync from FIRESTORE in the background ──────────────
      // Pass wasGuest so we know to PUSH local data instead of pulling from cloud
      syncFromFirestore(uid, rawState, wasGuest);

    } catch (e) {
      console.warn('Error loading from cache:', e);
      setIsLoading(false);
    }
  }

  async function syncFromFirestore(uid, cachedRaw, wasGuest) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (wasGuest) {
        // ── GUEST LOGIN: Always push local data to cloud ──────────────
        // The local guest data is always more up-to-date than the cloud.
        // Never overwrite local data with cloud data during guest→login transition.
        if (cachedRaw) {
          const localParsed = JSON.parse(cachedRaw);
          setDoc(docRef, localParsed).catch((e) => {
            console.warn('Error uploading guest data to Firestore:', e);
          });
        }
      } else if (docSnap.exists()) {
        // ── RETURNING USER: Pull cloud data only if different from cache ──
        const cloudData = docSnap.data();
        if (cloudData.totalSemesters === undefined) cloudData.totalSemesters = 8;
        if (cloudData.completedSemesters === undefined) cloudData.completedSemesters = 0;
        if (!Array.isArray(cloudData.semesters)) cloudData.semesters = [];

        const cloudJson = JSON.stringify(cloudData);
        if (cloudJson !== cachedRaw) {
          // Cloud has newer data (e.g. user logged in on another device)
          setAppState(cloudData);
          AsyncStorage.setItem(STORAGE_KEY, cloudJson).catch(() => {});
        }
      } else {
        // ── NEW USER (no guest data, no cloud doc) ──────────────────────
        if (cachedRaw) {
          const localParsed = JSON.parse(cachedRaw);
          setDoc(docRef, localParsed).catch((e) => {
            console.warn('Error uploading data to Firestore:', e);
          });
        }
      }
    } catch (e) {
      // Network error — app already running from cache, so this is fine
      console.warn('Background Firestore sync failed (offline?):', e);
    }
  }

  async function loadLocalSettingsOnly() {
    let isGuestUser = false;
    try {
      const [rawSettings, rawTheme, rawGuest, rawState] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(GUEST_KEY),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);

      if (rawGuest === 'true') {
        isGuestUser = true;
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
    return { isGuest: isGuestUser };
  }

  // FIX: Save locally first (instant), then sync to Firestore in background (non-blocking)
  async function saveAppState(newState) {
    try {
      // Save to local cache immediately — this makes UI feel instant
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Error saving to AsyncStorage:', e);
    }

    // Fire-and-forget Firestore sync — does NOT block the UI
    const currentUser = userRef.current;
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid), newState).catch((e) => {
        console.warn('Error syncing to Firestore (will retry on next save):', e);
      });
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
      if (userRef.current) {
        await signOut(auth);
      } else {
        setIsGuest(false);
        await AsyncStorage.removeItem(GUEST_KEY);
        setAppState(defaultAppState);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  async function saveGradingSettings(newSettings) {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Error saving grading settings:', e);
    }
  }

  // ── Profile Setup ─────────────────────────────────────────────
  const setupProfile = useCallback(async ({ studentName, totalCredits, totalSemesters, completedSemesters }) => {
    setAppState(prev => {
      const newState = {
        ...prev,
        studentName,
        totalCredits,
        totalSemesters,
        completedSemesters,
        profileSetup: true,
      };
      saveAppState(newState);
      return newState;
    });
  }, []);

  // ── Semester CRUD ─────────────────────────────────────────────
  // FIX: Use functional setState to always operate on the latest state,
  // avoiding stale closure issues entirely.
  const addSemester = useCallback(async (semester) => {
    return new Promise((resolve) => {
      setAppState(prev => {
        const newSemester = {
          id: Date.now(),
          semNumber: prev.semesters.length + 1,
          ...semester,
        };
        const newState = {
          ...prev,
          semesters: [...prev.semesters, newSemester],
        };
        saveAppState(newState);
        resolve(newSemester);
        return newState;
      });
    });
  }, []);

  const editSemester = useCallback(async (id, updates) => {
    setAppState(prev => {
      const newSemesters = prev.semesters.map(s =>
        s.id === id ? { ...s, ...updates } : s
      );
      const newState = { ...prev, semesters: newSemesters };
      saveAppState(newState);
      return newState;
    });
  }, []);

  const deleteSemester = useCallback(async (id) => {
    setAppState(prev => {
      const newSemesters = prev.semesters.filter(s => s.id !== id);
      const newState = { ...prev, semesters: newSemesters };
      saveAppState(newState);
      return newState;
    });
  }, []);

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
    setIsDarkMode(prev => {
      const newMode = !prev;
      AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light').catch(() => {});
      return newMode;
    });
  }, []);

  // ── Reset All / Delete Account ──────────────────────────────
  const resetAll = useCallback(async () => {
    const freshState = {
      ...defaultAppState,
      semesters: [],
    };
    setAppState(freshState);
    await saveAppState(freshState);
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      if (userRef.current) {
        await deleteDoc(doc(db, 'users', userRef.current.uid));
      }
      const freshState = {
        ...defaultAppState,
        semesters: [],
      };
      setAppState(freshState);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
      
      if (userRef.current) {
        await signOut(auth);
      } else {
        setIsGuest(false);
        await AsyncStorage.removeItem(GUEST_KEY);
      }
    } catch (e) {
      console.warn('Error deleting account:', e);
      throw e;
    }
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
    deleteAccount,
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
