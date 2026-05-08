import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Email et mot de passe requis');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Mot de passe trop court (8 caractères minimum)');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      router.replace('/(auth)/onboarding');
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = 'Serveur inaccessible.\nVérifiez que le backend tourne et que le téléphone est sur le même réseau.';
      } else if (err.response.status === 409) {
        msg = 'Cet email est déjà utilisé.';
      } else if (err.response.status === 400) {
        msg = err.response.data?.error || 'Données invalides.';
      } else {
        msg = err.response.data?.error || 'Inscription impossible. Réessayez.';
      }
      Alert.alert('Erreur inscription', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          style={styles.input}
          placeholder="Prénom (optionnel)"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          testID="name-input"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          testID="email-input"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe (8+ caractères)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          testID="password-input"
        />

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
          testID="signup-button"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon compte</Text>}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.link}>
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#222', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 12, color: '#222',
  },
  btn: {
    backgroundColor: '#7F77DD', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#7F77DD', fontSize: 14 },
});
