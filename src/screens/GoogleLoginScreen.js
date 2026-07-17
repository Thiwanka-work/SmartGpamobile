import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { COLORS, FONT_SIZE, BORDER_RADIUS, SPACING, SHADOW } from '../utils/theme';
import { useApp } from '../context/AppContext';

// Configure Google Sign-In outside the component
GoogleSignin.configure({
  webClientId: '72803003814-8aknc89cc4e2v13puj51sgqurc0tgtgs.apps.googleusercontent.com',
  // offlineAccess: true,
});

export default function GoogleLoginScreen({ navigation }) {
  const { isDarkMode } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setGoogleError(null);
      
      // Check if your device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // signIn() will:
      // - Show the account chooser on FIRST login (no cached account)
      // - Auto-select the previously used account on subsequent manual logins
      // Auto-login on app open is handled by Firebase Auth + AsyncStorage (no Google call needed)
      const signInResult = await GoogleSignin.signIn();
      // the new api (v13+) returns signInResult.data.idToken
      let idToken = signInResult.data?.idToken || signInResult.idToken;

      if (!idToken) {
        setGoogleError('Could not retrieve sign-in tokens. Please use Guest mode.');
        setIsLoading(false);
        return;
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      await signInWithCredential(auth, googleCredential);
      
      // We don't need to setIsLoading(false) because the auth state listener will navigate us away
    } catch (error) {
      setIsLoading(false);
      console.error('Google Auth Error:', error);
      
      if (error.code === statusCodes?.SIGN_IN_CANCELLED || (error.message && error.message.includes('CANCELLED'))) {
        // user cancelled the login flow
      } else if (error.code === statusCodes?.IN_PROGRESS || (error.message && error.message.includes('IN_PROGRESS'))) {
        // operation (e.g. sign in) is in progress already
        setGoogleError('Sign-in is already in progress.');
      } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE || (error.message && error.message.includes('NOT_AVAILABLE'))) {
        // play services not available or outdated
        setGoogleError('Google Play Services is not available. Please continue as Guest.');
      } else {
        // some other error happened
        setGoogleError('Sign-in failed: ' + error.message);
      }
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
