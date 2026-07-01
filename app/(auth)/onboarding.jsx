import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { C } from '../../src/theme';

const SLIDES = [
  {
    title: "L'IA pense avant toi",
    desc: "RemindAI lit ton agenda et tes habitudes pour te suggérer ce qui compte — au bon moment, sans que tu n'aies à y penser.",
    bg: ['#E1F0FE', '#B8DBF8'],
  },
  {
    title: "Dis-le. C'est créé.",
    desc: "« Rappelle-moi d'appeler maman demain à 18h » — la date, l'heure et le contexte sont compris, en français naturel.",
    bg: ['#E3F4EB', '#C3E5D2'],
  },
  {
    title: 'Au bon endroit, au bon moment',
    desc: 'Lieu, météo, trajets, calendrier — tout est pris en compte. Tu ne reçois un rappel que quand il est utile.',
    bg: ['#FCEFE0', '#F2D9B0'],
  },
];

export default function OnboardingScreen() {
  const [idx, setIdx] = useState(0);
  const { setOnboardingSeen } = useAuthStore();
  const router = useRouter();

  const next = async () => {
    if (idx < SLIDES.length - 1) {
      setIdx(idx + 1);
    } else {
      await setOnboardingSeen();
      router.replace('/(auth)/login');
    }
  };

  const skip = async () => {
    await setOnboardingSeen();
    router.replace('/(auth)/login');
  };

  const slide = SLIDES[idx];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topRow}>
        <View />
        <Pressable onPress={skip} hitSlop={10}>
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      <View style={styles.stage}>
        <View style={[styles.illus, { backgroundColor: slide.bg[0] }]} />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </View>

      <View style={styles.foot}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
          onPress={next}
          testID="onboarding-next"
        >
          <Text style={styles.btnText}>
            {idx < SLIDES.length - 1 ? 'Continuer' : 'Commencer'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  skip: { fontSize: 16, fontWeight: '400', letterSpacing: -0.32, color: C.brand, padding: 8 },
  stage: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  illus: { width: '100%', height: 320, borderRadius: 22, marginBottom: 36 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.36, lineHeight: 34, color: C.label, marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 17, fontWeight: '400', letterSpacing: -0.43, lineHeight: 22, color: C.secondaryLabel, textAlign: 'center' },
  foot: { paddingHorizontal: 16, paddingBottom: 16, gap: 18, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: C.systemGray4 },
  dotActive: { width: 21, backgroundColor: C.brand },
  btn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 17, fontWeight: '600', letterSpacing: -0.43, color: 'white' },
});
