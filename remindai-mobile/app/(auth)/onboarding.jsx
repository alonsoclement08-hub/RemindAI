import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🤖',
    title: "L'IA qui pense à ta place",
    description: "RemindAI détecte ce que tu dois faire et te le rappelle au bon moment — sans que tu aies à tout configurer.",
  },
  {
    emoji: '🎙️',
    title: 'Crée par la voix',
    description: '"Appelle Jean demain à 15h" → RemindAI comprend, planifie, et te rappelle.',
  },
  {
    emoji: '📍',
    title: 'Au bon endroit, au bon moment',
    description: 'Rappels géolocalisés, résumé quotidien, et suggestions proactives basées sur ton contexte.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else router.replace('/(app)/home');
  };

  const slide = SLIDES[step];

  return (
    <View style={styles.container}>
      <Pressable style={styles.skip} onPress={() => router.replace('/(app)/home')}>
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <View style={styles.slide}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <Pressable style={styles.btn} onPress={next} testID="onboarding-next">
        <Text style={styles.btnText}>
          {step === SLIDES.length - 1 ? "C'est parti !" : 'Suivant'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 60 },
  skip: { alignSelf: 'flex-end' },
  skipText: { color: '#999', fontSize: 14 },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 72, marginBottom: 32 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#7F77DD', width: 24 },
  btn: {
    backgroundColor: '#7F77DD', padding: 18, borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
