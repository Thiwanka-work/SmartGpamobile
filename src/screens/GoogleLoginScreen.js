import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOW } from '../utils/theme';
import { useApp } from '../context/AppContext';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginScreen({ navigation }) {
  const { isDarkMode } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '72803003814-8aknc89cc4e2v13puj51sgqurc0tgtgs.apps.googleusercontent.com',
    webClientId: '72803003814-8aknc89cc4e2v13puj51sgqurc0tgtgs.apps.googleusercontent.com',
    androidClientId: '72803003814-kok41g1eupj32mk7oll29er7fhua9c0k.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({
      scheme: 'smartgpacalapp'
    }),
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      setGoogleError(null);
      const idToken =
        response.authentication?.idToken || response.params?.id_token || null;
      const accessToken =
        response.authentication?.accessToken ||
        response.params?.access_token ||
        null;

      if (!idToken && !accessToken) {
        setGoogleError('Could not retrieve sign-in tokens. Please use Guest mode.');
        setIsLoading(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        setIsLoading(true);
        signInWithCredential(auth, credential).catch((error) => {
          console.error('Firebase Auth Error:', error);
          setIsLoading(false);
          setGoogleError('Sign-in failed: ' + error.message);
        });
      } catch (err) {
        console.error('Credential Error:', err);
        setGoogleError('An error occurred. Please use Guest mode instead.');
        setIsLoading(false);
      }
    } else if (response.type === 'error') {
      console.error('Google Auth Error:', response.error);
      setIsLoading(false);
      setGoogleError(
        'Google Sign-In is not configured for this device. Please continue as Guest.'
      );
    } else if (response.type === 'cancel') {
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    if (!request) {
      Alert.alert(
        'Not Available',
        'Google Sign-In is not available on this device. Please continue as Guest.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      setIsLoading(true);
      setGoogleError(null);
      await promptAsync();
    } catch (err) {
      console.error('promptAsync error:', err);
      setGoogleError('Google Sign-In failed. Please continue as Guest.');
      setIsLoading(false);
    }
  };

  const bg = isDarkMode ? COLORS.bgDark : COLORS.bgLight;
  const card = isDarkMode ? COLORS.bgDark2 : '#fff';
  const text = isDarkMode ? COLORS.textDark : COLORS.textLight;
  const textMuted = isDarkMode ? COLORS.textMutedDark : COLORS.textMutedLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: '#4285F420' }]}>
          <Ionicons name="logo-google" size={56} color="#4285F4" />
        </View>
        <Text style={[styles.title, { color: text }]}>Google Sign-In</Text>
        <Text style={[styles.description, { color: textMuted }]}>
          Securely back up your GPA, semesters, and prediction data to the cloud using your Google account.
        </Text>

        {googleError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{googleError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.googleButton,
            { backgroundColor: card, borderColor: isDarkMode ? COLORS.borderDark : COLORS.borderLight },
            (isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#4285F4" style={styles.btnIcon} />
              <Text style={[styles.googleButtonText, { color: text }]}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {googleError && (
          <TouchableOpacity 
            style={styles.guestLink} 
            onPress={() => navigation.navigate('GuestLogin')}
          >
            <Text style={[styles.guestLinkText, { color: COLORS.primary }]}>Try Guest Mode instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  description: {
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    width: '100%',
    ...SHADOW.sm,
    marginTop: SPACING.md,
  },
  googleButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.danger + '15',
    borderColor: COLORS.danger + '40',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    width: '100%',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 20,
    marginLeft: 10,
  },
  guestLink: {
    marginTop: SPACING.xl,
    padding: SPACING.sm,
  },
  guestLinkText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textDecorationLine: 'underline',
  }
});
