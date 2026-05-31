import { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions,
  ScrollView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth.store';
import { C, RADIUS, SP, SHADOW } from '../../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'proactive',
    title: 'L\'IA pense\navant toi.',
    desc: 'RemindAI lit ton agenda et tes habitudes pour te suggérer ce qui compte — au bon moment, sans que tu n\'aies à y penser.',
    bg: 'rgba(127,119,221,0.08)',
    accent: C.violet,
    cards: [
      { dot: C.urgent,  label: 'Appeler médecin' },
      { dot: C.violet,  label: 'Brief board 9h30' },
      { dot: C.teal,    label: 'Méditer 10 min' },
      { dot: C.amber,   label: 'Colis avant 18h' },
    ],
  },
  {
    key: 'voice',
    title: 'Dis-le.\nC\'est créé.',
    desc: '"Rappelle-moi d\'appeler maman demain à 18h." — la date, l\'heure et le contexte sont compris, en français naturel.',
    bg: 'rgba(29,158,117,0.07)',
    accent: C.teal,
    cards: null,
  },
  {
    key: 'context',
    title: 'Au bon endroit,\nau bon moment.',
    desc: 'Lieu, météo, trajets, calendrier — tout est pris en compte. Tu ne reçois un rappel que quand il est utile.',
    bg: 'rgba(217,164,65,0.10)',
    accent: C.amber,
    cards: null,
  },
];

function ProactiveIllus({ cards }) {
  return (
    <View style={illus.proactiveWrap}>
      {cards.map((c, i) => (
        <View key={i} style={[illus.floatCard, { marginLeft: i % 2 === 1 ? 32 : 0, marginTop: i > 0 ? -4 : 0 }]}>
          <View style={[illus.dot, { backgroundColor: c.dot }]} />
          <Text style={illus.floatCardText}>{c.label}</Text>
        </View>
      ))}
      <View style={illus.orb} />
    </View>
  );
}

function VoiceIllus({ accent }) {
  return (
    <View style={illus.voiceWrap}>
      <View style={[illus.quoteBubble, { borderColor: accent }]}>
        <Text style={[illus.quoteText, { color: accent }]}>
          "Rappelle-moi d'appeler maman demain à 18h"
        </Text>
      </View>
      <View style={[illus.micWrap, { backgroundColor: accent }]}>
        <Text style={illus.micIcon}>◎</Text>
      </View>
      <View style={illus.barsRow}>
        {[16, 28, 22, 36, 20, 32, 18, 26, 14].map((h, i) => (
          <View key={i} style={[illus.bar, { height: h, backgroundColor: accent }]} />
        ))}
      </View>
    </View>
  );
}

function ContextIllus({ accent }) {
  return (
    <View style={illus.contextWrap}>
      <View style={illus.mapBg} />
      <View style={[illus.pin, { left: '30%', top: '25%', backgroundColor: C.violet }]}>
        <Text style={illus.pinDot}>◆</Text>
      </View>
      <View style={[illus.pin, { right: '20%', top: '40%', backgroundColor: C.amber }]}>
        <Text style={illus.pinDot}>◆</Text>
      </View>
      <View style={[illus.pin, { left: '45%', bottom: '20%', backgroundColor: C.teal }]}>
        <Text style={illus.pinDot}>◆</Text>
      </View>
      <View style={[illus.bubble, { borderColor: accent }]}>
        <View style={[illus.bubbleDot, { backgroundColor: accent }]} />
        <Text style={illus.bubbleText}>Tu approches du Point Relais</Text>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef(null);
  const { setOnboardingSeen } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goTo = (i) => {
    setIdx(i);
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
  };

  const next = () => {
    if (idx < SLIDES.length - 1) goTo(idx + 1);
    else finish();
  };

  const finish = async () => {
    await setOnboardingSeen();
    router.replace('/(app)/home');
  };

  const slide = SLIDES[idx];

  return (
    <View style={[styles.root, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={finish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.slide, { width }]}>
            {/* Illustration */}
            <View style={styles.illustWrap}>
              {s.key === 'proactive' && <ProactiveIllus cards={s.cards} />}
              {s.key === 'voice' && <VoiceIllus accent={s.accent} />}
              {s.key === 'context' && <ContextIllus accent={s.accent} />}
            </View>

            {/* Text */}
            <Text style={[styles.slideTitle, { color: C.text }]}>{s.title}</Text>
            <Text style={styles.slideDesc}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SP.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)}>
              <View style={[
                styles.dot,
                i === idx
                  ? { backgroundColor: slide.accent, width: 28 }
                  : styles.dotInactive,
              ]} />
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.nextBtn, { backgroundColor: slide.accent, ...SHADOW.md(slide.accent) }]}
          onPress={next}
          testID="onboarding-next"
        >
          <Text style={styles.nextIcon}>
            {idx < SLIDES.length - 1 ? '→' : '✓'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const illus = StyleSheet.create({
  proactiveWrap: { alignItems: 'center', width: '100%', height: 220, justifyContent: 'center' },
  floatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    marginVertical: 4,
    ...SHADOW.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  floatCardText: { fontSize: 13, fontWeight: '600', color: C.text },
  orb: {
    position: 'absolute', right: 16, bottom: 10,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.violetSoft,
  },

  voiceWrap: { alignItems: 'center', width: '100%', height: 220, justifyContent: 'center', gap: SP.lg },
  quoteBubble: {
    borderWidth: 1.5, borderRadius: RADIUS.card,
    paddingHorizontal: SP.xl, paddingVertical: SP.md,
    backgroundColor: '#fff',
    maxWidth: 280,
  },
  quoteText: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  micWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  micIcon: { fontSize: 24, color: '#fff' },
  barsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 4, borderRadius: 2, opacity: 0.7 },

  contextWrap: { width: '100%', height: 220, position: 'relative' },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8EAF0',
    borderRadius: RADIUS.card,
    margin: 8,
  },
  pin: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  pinDot: { fontSize: 12, color: '#fff' },
  bubble: {
    position: 'absolute', bottom: 20, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderWidth: 1.5,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    ...SHADOW.sm,
  },
  bubbleDot: { width: 6, height: 6, borderRadius: 3 },
  bubbleText: { fontSize: 12, fontWeight: '600', color: C.text },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'absolute', top: 0, right: 0, left: 0,
    paddingHorizontal: SP['2xl'], alignItems: 'flex-end', zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: RADIUS.pill,
  },
  skipText: { fontSize: 13, fontWeight: '600', color: C.text2 },

  slide: {
    flex: 1, paddingTop: 100,
    paddingHorizontal: SP['3xl'],
    alignItems: 'center',
  },
  illustWrap: { width: '100%', marginBottom: SP['3xl'] },
  slideTitle: {
    fontSize: 32, fontWeight: '800', letterSpacing: -0.7,
    lineHeight: 40, textAlign: 'center', marginBottom: SP.md,
  },
  slideDesc: {
    fontSize: 15, color: C.text3, textAlign: 'center',
    lineHeight: 22,
  },

  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SP['2xl'], paddingTop: SP.xl,
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  dotInactive: { width: 8, backgroundColor: 'rgba(60,60,67,0.18)' },
  nextBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  nextIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },
});
