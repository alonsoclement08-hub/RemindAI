import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/auth.store';
import { C, RADIUS, SP, SHADOW } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs manquants', 'Email et mot de passe requis');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      const { onboardingSeen } = useAuthStore.getState();
      router.replace(onboardingSeen ? '/(app)/home' : '/(auth)/onboarding');
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = 'Serveur inaccessible. Vérifiez que le backend tourne et que le téléphone est sur le même réseau.';
      } else if (err.response.status === 401) {
        msg = 'Email ou mot de passe incorrect.';
      } else {
        msg = err.response.data?.error || 'Connexion impossible. Réessayez.';
      }
      Alert.alert('Connexion échouée', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={C.text2} />
          </Pressable>
        </View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(80).duration(550)} style={styles.titleBlock}>
          <Text style={styles.title}>Bon retour.</Text>
          <Text style={styles.lead}>
            Connecte-toi pour retrouver tes rappels et ton assistant IA.
          </Text>
        </Animated.View>

        {/* Social auth */}
        <Animated.View entering={FadeInDown.delay(160).duration(550)} style={styles.authBtns}>
          <Pressable style={[styles.authBtn, styles.authBtnDark]}>
            <Text style={styles.appleIcon}></Text>
            <Text style={styles.authBtnTextLight}>Continuer avec Apple</Text>
          </Pressable>
          <Pressable style={[styles.authBtn, styles.authBtnLight]}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.authBtnTextDark}>Continuer avec Google</Text>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(220).duration(550)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(280).duration(550)} style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputWrap,
              focusedField === 'email' && styles.inputFocused,
            ]}>
              <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? C.violet : C.text4} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ton@email.com"
                placeholderTextColor={C.text4}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                testID="email-input"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[
              styles.inputWrap,
              focusedField === 'password' && styles.inputFocused,
            ]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? C.violet : C.text4} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={C.text4}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                testID="password-input"
              />
              <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.text4}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              loading && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-button"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Se connecter</Text>
            }
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSmall}>
            En continuant, tu acceptes nos{' '}
            <Text style={styles.footerLink}>Conditions</Text>
            {' '}et notre{' '}
            <Text style={styles.footerLink}>Politique de confidentialité</Text>.
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLinkBold}> Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bgTint },
  scroll: { flexGrow: 1, paddingHorizontal: SP['2xl'] },

  topBar: { marginBottom: SP.md },
  backBtn: {
    width: 36, height: 36, borderRadius: RADIUS.sm,
    backgroundColor: C.surface3,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  titleBlock: { marginBottom: SP['2xl'] },
  title: {
    fontSize: 30, fontWeight: '800', color: C.text,
    letterSpacing: -0.6, marginBottom: SP.sm,
  },
  lead: { fontSize: 15, color: C.text3, lineHeight: 22 },

  /* Social auth */
  authBtns: { gap: SP.md, marginBottom: SP.xl },
  authBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, borderRadius: RADIUS.btn, gap: SP.md,
  },
  authBtnDark: { backgroundColor: '#1A1A1F' },
  authBtnLight: {
    backgroundColor: C.surface,
    borderWidth: 1.5, borderColor: C.border,
    ...SHADOW.sm,
  },
  appleIcon: { fontSize: 18, color: '#fff' },
  googleG: {
    fontSize: 17, fontWeight: '700',
    color: '#4285F4',
  },
  authBtnTextLight: { fontSize: 15, fontWeight: '600', color: '#fff' },
  authBtnTextDark: { fontSize: 15, fontWeight: '600', color: C.text },

  /* Divider */
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 13, color: C.text4, fontWeight: '500' },

  /* Form */
  form: { gap: SP.xl, marginBottom: SP['2xl'] },
  fieldGroup: { gap: SP.sm },
  label: { fontSize: 13, fontWeight: '600', color: C.text2, letterSpacing: 0.1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.card,
    backgroundColor: C.surface, paddingHorizontal: SP.md, height: 52,
  },
  inputFocused: { borderColor: C.violet },
  inputIcon: { marginRight: SP.sm },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { padding: SP.xs },

  btn: {
    backgroundColor: C.violet, height: 54, borderRadius: RADIUS.btn,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  /* Footer */
  footer: { gap: SP.md, alignItems: 'center' },
  footerSmall: { fontSize: 12, color: C.text4, textAlign: 'center', lineHeight: 17 },
  footerLink: { color: C.violet },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: C.text3 },
  footerLinkBold: { fontSize: 14, color: C.violet, fontWeight: '700' },
});
