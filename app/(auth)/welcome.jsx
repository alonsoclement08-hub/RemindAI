import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../../src/theme';
import { SFIcon } from '../../src/components/ui/SFIcon';

function Feature({ icon, color, title, desc }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <SFIcon name={icon} size={28} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <LinearGradient
          colors={['#5AC8FA', '#007AFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <SFIcon name="sparkles" size={36} color="white" />
        </LinearGradient>

        <Text style={styles.title}>Bienvenue dans RemindAI</Text>
        <Text style={styles.subtitle}>
          L'assistant qui anticipe ce qui compte et te le rappelle au bon moment.
        </Text>

        <View style={styles.features}>
          <Feature icon="sparkles" color={C.brandDeep} title="IA proactive" desc="Elle te suggère ce dont tu vas avoir besoin avant que tu n'y penses." />
          <Feature icon="mic.fill" color={C.catHabit} title="Création vocale" desc="Dis-le, c'est noté. La date, l'heure et le lieu sont devinés." />
          <Feature icon="location.fill" color={C.systemOrange} title="Conscient du contexte" desc="Lieu, calendrier, météo — tout est pris en compte avant de te déranger." />
        </View>

        <View style={styles.cta}>
          <Pressable
            style={({ pressed }) => [styles.btnFilled, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/(auth)/onboarding')}
          >
            <Text style={styles.btnFilledText}>Commencer</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnPlain, pressed && { opacity: 0.5 }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.btnPlainText}>J'ai déjà un compte</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, alignItems: 'stretch' },
  logo: {
    width: 80, height: 80, borderRadius: 18,
    alignSelf: 'center',
    marginTop: 24, marginBottom: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0050D0',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 30,
    elevation: 8,
  },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: 0.37, lineHeight: 41, textAlign: 'center', color: C.label, marginBottom: 12 },
  subtitle: {
    fontSize: 17, fontWeight: '400', letterSpacing: -0.43, lineHeight: 22,
    color: C.secondaryLabel,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  features: { gap: 22, flex: 1, paddingHorizontal: 8 },
  feature: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  featureIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  featureTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43, lineHeight: 22, color: C.label, marginBottom: 2 },
  featureDesc: { fontSize: 14, color: C.secondaryLabel, lineHeight: 19, letterSpacing: -0.15 },
  cta: { marginTop: 32, gap: 8 },
  btnFilled: {
    height: 52, borderRadius: 16, backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  btnFilledText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43, color: 'white' },
  btnPlain: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnPlainText: { fontSize: 17, fontWeight: '500', letterSpacing: -0.43, color: C.brand },
});
