import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { COLORS, FONT_SIZE } from '../utils/theme';
import { useApp } from '../context/AppContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { isDarkMode, continueAsGuest } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '72803003814-8aknc89cc4e2v13puj51sgqurc0tgtgs.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken || response.params?.id_token || null;
      const accessToken = response.authentication?.accessToken || response.params?.access_token || null;
      
      if (!idToken && !accessToken) {
        console.error('No tokens received in response:', response);
        alert('Failed to get authentication tokens. Please try again.');
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        setIsLoading(true);
        signInWithCredential(auth, credential)
          .catch(error => {
            console.error('Firebase Auth Error:', error);
            setIsLoading(false);
            alert('Failed to sign in: ' + error.message);
          });
      } catch (err) {
        console.error('Credential Creation Error:', err);
        alert('An error occurred during sign in.');
      }
    }
  }, [response]);

  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Ionicons name="school" size={80} color={COLORS.primary} />
        <Text style={[styles.title, { color: text }]}>SmartGPA</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight }]}>
          Your Ultimate Academic Companion
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: text }]}>
          Sign in to securely backup your grades and academic progress to the cloud.
        </Text>

        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={() => promptAsync()} 
          disabled={!request || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={continueAsGuest}
        >
          <Text style={[styles.guestButtonText, { color: text }]}>Skip & Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    marginTop: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  guestButton: {
    marginTop: 20,
    paddingVertical: 12,
  },
  guestButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    opacity: 0.7,
  },
});
