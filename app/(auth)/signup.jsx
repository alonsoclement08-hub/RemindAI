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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Champs manquants', 'Email et mot de passe requis');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Minimum 8 caractères requis');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      router.replace('/(auth)/onboarding');
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = 'Serveur inaccessible. Vérifiez que le backend tourne et que le téléphone est sur le même réseau.';
      } else if (err.response.status === 409) {
        msg = 'Cet email est déjà utilisé. Connecte-toi à la place.';
      } else if (err.response.status === 400) {
        msg = err.response.data?.error || 'Données invalides.';
      } else {
        msg = err.response.data?.error || 'Inscription impossible. Réessayez.';
      }
      Alert.alert('Inscription échouée', msg);
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = password.length >= 12 ? C.teal : password.length >= 8 ? C.amber : C.urgent;
  const strengthWidth = Math.min(100, (password.length / 12) * 100);

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
          <Text style={styles.title}>Créer un compte.</Text>
          <Text style={styles.lead}>Rejoins RemindAI — c'est gratuit.</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(180).duration(550)} style={styles.form}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Prénom <Text style={styles.optional}>(optionnel)</Text>
            </Text>
            <View style={[styles.inputWrap, focusedField === 'name' && styles.inputFocused]}>
              <Ionicons
                name="person-outline" size={18}
                color={focusedField === 'name' ? C.violet : C.text4}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ton prénom"
                placeholderTextColor={C.text4}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                testID="name-input"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
              <Ionicons
                name="mail-outline" size={18}
                color={focusedField === 'email' ? C.violet : C.text4}
                style={styles.inputIcon}
              />
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

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
              <Ionicons
                name="lock-closed-outline" size={18}
                color={focusedField === 'password' ? C.violet : C.text4}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="8 caractères minimum"
                placeholderTextColor={C.text4}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPwd}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                testID="password-input"
              />
              <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color={C.text4}
                />
              </Pressable>
            </View>
            {password.length > 0 && (
              <View style={styles.strengthBar}>
                <View style={[
                  styles.strengthFill,
                  { width: `${strengthWidth}%`, backgroundColor: strengthColor },
                ]} />
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              loading && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
            onPress={handleSignup}
            disabled={loading}
            testID="signup-button"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Créer mon compte</Text>
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
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLinkBold}> Se connecter</Text>
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

  form: { gap: SP.xl, marginBottom: SP['2xl'] },
  fieldGroup: { gap: SP.sm },
  label: { fontSize: 13, fontWeight: '600', color: C.text2, letterSpacing: 0.1 },
  optional: { color: C.text4, fontWeight: '400' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.card,
    backgroundColor: C.surface, paddingHorizontal: SP.md, height: 52,
  },
  inputFocused: { borderColor: C.violet },
  inputIcon: { marginRight: SP.sm },
  input: { flex: 1, fontSize: 15, color: C.text },
  eyeBtn: { padding: SP.xs },

  strengthBar: {
    height: 3, backgroundColor: C.surface3,
    borderRadius: 2, overflow: 'hidden', marginTop: SP.xs,
  },
  strengthFill: { height: '100%', borderRadius: 2 },

  btn: {
    backgroundColor: C.violet, height: 54, borderRadius: RADIUS.btn,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  footer: { gap: SP.md, alignItems: 'center' },
  footerSmall: { fontSize: 12, color: C.text4, textAlign: 'center', lineHeight: 17 },
  footerLink: { color: C.violet },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: C.text3 },
  footerLinkBold: { fontSize: 14, color: C.violet, fontWeight: '700' },
});
