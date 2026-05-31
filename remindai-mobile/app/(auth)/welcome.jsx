import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { C, RADIUS, SP, SHADOW } from '../../src/theme';

const BULLETS = [
  {
    color: C.violet,
    soft: C.violetSoft,
    title: 'IA proactive',
    desc: 'Elle te suggère ce dont tu vas avoir besoin avant que tu n\'y penses.',
    glyph: '✦',
  },
  {
    color: C.teal,
    soft: C.tealSoft,
    title: 'Création vocale',
    desc: 'Dis-le, c\'est noté. La date, l\'heure et le lieu sont devinés.',
    glyph: '◎',
  },
  {
    color: C.amber,
    soft: C.amberSoft,
    title: 'Conscient du contexte',
    desc: 'Lieu, calendrier, météo — tout est pris en compte avant de te déranger.',
    glyph: '◈',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Decorative tint blobs */}
      <View style={styles.blobViolet} />
      <View style={styles.blobTeal} />

      <View style={styles.inner}>
        {/* Logo mark */}
        <Animated.View entering={FadeInDown.delay(80).duration(600)} style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoGlyph}>✦</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeInDown.delay(180).duration(600)}>
          <Text style={styles.headline}>
            Des rappels qui{'\n'}
            <Text style={styles.headlineAccent}>pensent pour toi.</Text>
          </Text>
          <Text style={styles.sub}>
            RemindAI anticipe ce qui compte, te le rappelle au bon moment, et au bon endroit.
          </Text>
        </Animated.View>

        {/* Bullets */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.bullet}>
              <View style={[styles.bulletIcon, { backgroundColor: b.soft }]}>
                <Text style={[styles.bulletGlyph, { color: b.color }]}>{b.glyph}</Text>
              </View>
              <View style={styles.bulletText}>
                <Text style={styles.bulletTitle}>{b.title}</Text>
                <Text style={styles.bulletDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* CTAs */}
      <Animated.View
        entering={FadeInUp.delay(420).duration(600)}
        style={[styles.cta, { paddingBottom: insets.bottom + SP.xl }]}
      >
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.btnPrimaryText}>Commencer gratuitement</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bgTint,
    paddingHorizontal: SP['3xl'],
  },

  /* Decorative blobs */
  blobViolet: {
    position: 'absolute', top: -60, right: -80,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(127,119,221,0.13)',
  },
  blobTeal: {
    position: 'absolute', bottom: 80, left: -100,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(29,158,117,0.09)',
  },

  inner: { flex: 1, justifyContent: 'center' },

  /* Logo */
  logoWrap: { marginBottom: SP['3xl'] },
  logoMark: {
    width: 76, height: 76, borderRadius: 22,
    backgroundColor: C.violet,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  logoGlyph: { fontSize: 32, color: '#fff', lineHeight: 38 },
  logoDot: {
    position: 'absolute', bottom: 14, right: 14,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  /* Headline */
  headline: {
    fontSize: 34, fontWeight: '800', color: C.text,
    letterSpacing: -0.8, lineHeight: 42, marginBottom: SP.md,
  },
  headlineAccent: { color: C.violet },
  sub: {
    fontSize: 15, color: C.text3, lineHeight: 22,
    marginBottom: SP['3xl'],
  },

  /* Bullets */
  bullets: { gap: SP.md },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.md },
  bulletIcon: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  bulletGlyph: { fontSize: 18, fontWeight: '700' },
  bulletText: { flex: 1, paddingTop: 2 },
  bulletTitle: {
    fontSize: 14, fontWeight: '700', color: C.text,
    letterSpacing: -0.1, marginBottom: 2,
  },
  bulletDesc: { fontSize: 13, color: C.text3, lineHeight: 18 },

  /* CTAs */
  cta: { gap: SP.md, paddingTop: SP.xl },
  btnPrimary: {
    backgroundColor: C.violet,
    height: 56, borderRadius: RADIUS.btn,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.md(C.violet),
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  btnSecondary: {
    height: 56, borderRadius: RADIUS.btn,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.borderStrong,
  },
  btnSecondaryPressed: { backgroundColor: C.surface3 },
  btnSecondaryText: { color: C.text2, fontSize: 16, fontWeight: '600' },
});
