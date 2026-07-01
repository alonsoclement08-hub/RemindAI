import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../src/store/auth.store';
import { notificationsService } from '../../src/services/notifications.service';
import { getGoogleAuthRequest, exchangeGoogleCode } from '../../src/services/googleWorkspace';
import { C } from '../../src/theme';
import { SFIcon } from '../../src/components/ui/SFIcon';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const { request: gAuthRequest, discovery: gDiscovery } = getGoogleAuthRequest();
  const [gRequest, gResponse, gPromptAsync] = AuthSession.useAuthRequest(gAuthRequest, gDiscovery);

  useEffect(() => {
    if (gResponse?.type === 'success') {
      const { code } = gResponse.params;
      setLoading(true);
      exchangeGoogleCode(code, gRequest.codeVerifier)
        .then(async (tokens) => {
          const { loginWithGoogle } = useAuthStore.getState();
          await loginWithGoogle(tokens.access_token);
          notificationsService.initAfterAuth().catch(() => {});
          const { onboardingSeen } = useAuthStore.getState();
          router.replace(onboardingSeen ? '/(app)/home' : '/(auth)/onboarding');
        })
        .catch((err) => {
          console.error('[Google Login Error]', err);
          Alert.alert('Erreur Google', err.message || 'La connexion avec Google a échoué.');
        })
        .finally(() => setLoading(false));
    }
  }, [gResponse]);

  const handleGoogleLogin = async () => {
    if (!gRequest) {
      Alert.alert(
        'Connexion Google non configurée',
        'Veuillez ajouter la variable d\'environnement EXPO_PUBLIC_GOOGLE_CLIENT_ID dans votre fichier .env client.'
      );
      return;
    }
    setLoading(true);
    try {
      await gPromptAsync();
    } catch (err) {
      Alert.alert('Erreur Google', err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async () => {
    if (!email.trim() || !pwd.trim()) {
      Alert.alert('Champs manquants', 'Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), pwd);
      notificationsService.initAfterAuth().catch(() => {});
      const { onboardingSeen } = useAuthStore.getState();
      router.replace(onboardingSeen ? '/(app)/home' : '/(auth)/onboarding');
    } catch (err) {
      if (!err.response) {
        // Backend injoignable — mode offline
        const { useAuthStore: store } = require('../../src/store/auth.store');
        store.setState({
          user: { id: 'offline', email: email.trim(), name: email.split('@')[0], tier: 'pro', role: 'user' },
          isSignedIn: true,
        });
        router.replace('/(app)/home');
      } else if (err.response.status === 401) {
        Alert.alert('Connexion échouée', 'Email ou mot de passe incorrect.');
      } else {
        Alert.alert('Connexion échouée', err.response?.data?.error || 'Connexion impossible.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <SFIcon name="chevron.left" size={20} color={C.brand} weight="medium" />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.title}>Bon retour.</Text>
            <Text style={styles.lead}>Connecte-toi pour retrouver tes rappels.</Text>
          </View>

          <View style={styles.authStack}>
            <Pressable style={[styles.authBtn, styles.appleBtn]}>
              <Text style={[styles.authBtnText, { color: 'white' }]}>Continuer avec Apple</Text>
            </Pressable>
            <Pressable style={styles.authBtn} onPress={handleGoogleLogin}>
              <Text style={styles.authBtnText}>Continuer avec Google</Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.list}>
            <View style={styles.field}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={C.tertiaryLabel}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                testID="email-input"
              />
            </View>
            <View style={[styles.field, styles.fieldBorder]}>
              <TextInput
                placeholder="Mot de passe"
                placeholderTextColor={C.tertiaryLabel}
                value={pwd}
                onChangeText={setPwd}
                style={styles.input}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                testID="password-input"
              />
            </View>
          </View>

          <View style={{ padding: 16 }}>
            <Pressable
              style={({ pressed }) => [styles.btnFilled, loading && { opacity: 0.6 }, pressed && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              testID="login-button"
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={styles.btnFilledText}>Se connecter</Text>
              }
            </Pressable>
          </View>

          <Text style={styles.foot}>
            En continuant, tu acceptes nos <Text style={styles.link}>Conditions</Text> et notre{' '}
            <Text style={styles.link}>Politique de confidentialité</Text>.
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={[styles.footerText, { color: C.brand, fontWeight: '700' }]}>
                Créer un compte
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navRow: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, height: 44, justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { fontSize: 17, fontWeight: '400', letterSpacing: -0.43, color: C.brand, marginLeft: 4 },
  scroll: { flexGrow: 1, paddingHorizontal: 0 },
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36, lineHeight: 34, color: C.label, marginBottom: 8, textAlign: 'center' },
  lead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.24, lineHeight: 20, color: C.secondaryLabel, textAlign: 'center' },
  authStack: { paddingHorizontal: 16, gap: 10 },
  authBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtn: { backgroundColor: C.label },
  authBtnText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43, color: C.label },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginVertical: 22 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: C.separator },
  dividerText: { fontSize: 13, color: C.secondaryLabel },
  list: {
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 10,
    overflow: 'hidden',
  },
  field: { paddingHorizontal: 16, paddingVertical: 13 },
  fieldBorder: { borderTopWidth: 0.5, borderTopColor: C.separator },
  input: { fontSize: 17, fontWeight: '400', letterSpacing: -0.43, color: C.label, padding: 0 },
  btnFilled: { height: 50, borderRadius: 14, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  btnFilledText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43, color: 'white' },
  foot: {
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 12,
    fontSize: 12,
    color: C.secondaryLabel,
    lineHeight: 18,
  },
  link: { color: C.brand },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  footerText: { fontSize: 14, color: C.secondaryLabel },
});
