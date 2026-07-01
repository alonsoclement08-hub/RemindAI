import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { C } from '../../src/theme';

const FEATURES = [
  { icon: 'sparkles', color: C.brand, title: 'Suggestions IA illimitées', desc: "L'IA tourne 24/7 et anticipe ce qui compte." },
  { icon: 'mic.fill', color: C.catHabit, title: 'Voix illimitée', desc: 'Dictée en français, anglais, espagnol et 8 autres.' },
  { icon: 'location.fill', color: C.systemOrange, title: 'Géo-rappels précis', desc: 'Rappels déclenchés au mètre près.' },
  { icon: 'link', color: C.systemIndigo, title: 'Notion, Calendar, Slack', desc: 'Synchro bidirectionnelle avec tes outils.' },
  { icon: 'leaf.fill', color: C.systemGreen, title: 'Mode focus + stats', desc: 'Mesure tes habitudes et ta charge mentale.' },
];

export default function PaywallScreen() {
  const [plan, setPlan] = useState('yearly');
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Pressable style={styles.close} onPress={() => router.back()} hitSlop={10}>
        <SFIcon name="xmark.circle.fill" size={30} color={C.systemGray2} />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <LinearGradient colors={['#FFD58A', '#E89C2A']} style={styles.crown}>
            <SFIcon name="crown.fill" size={32} color="white" />
          </LinearGradient>
          <Text style={styles.heroTitle}>
            Passe à <Text style={{ color: C.brand }}>RemindAI Pro.</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Une IA qui ne dort jamais : suggestions illimitées, voix, et contexte avancé.
          </Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionHeader}>TOUT EST INCLUS</Text>
        <View style={styles.list}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i > 0 && styles.featureBorder]}>
              <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                <SFIcon name={f.icon} size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>CHOISIS TON PLAN</Text>
        <View style={styles.plans}>
          <Pressable
            style={[styles.plan, plan === 'monthly' && styles.planSelected]}
            onPress={() => setPlan('monthly')}
          >
            <Text style={[styles.planName, plan === 'monthly' && { color: C.brand }]}>MENSUEL</Text>
            <Text style={styles.planPrice}>4,99€<Text style={styles.planPer}>/mois</Text></Text>
          </Pressable>
          <Pressable
            style={[styles.plan, plan === 'yearly' && styles.planSelected]}
            onPress={() => setPlan('yearly')}
          >
            <View style={styles.badge}><Text style={styles.badgeText}>-40%</Text></View>
            <Text style={[styles.planName, plan === 'yearly' && { color: C.brand }]}>ANNUEL</Text>
            <Text style={styles.planPrice}>35,99€<Text style={styles.planPer}>/an</Text></Text>
          </Pressable>
        </View>

        {/* Social proof */}
        <View style={styles.proof}>
          <View style={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <SFIcon key={i} name="star.fill" size={14} color="#FFB800" />
            ))}
          </View>
          <Text style={styles.proofText}>
            <Text style={{ color: C.label, fontWeight: '600' }}>4,8</Text> · 240 000 utilisateurs · 12 400 avis
          </Text>
        </View>

        {/* Testimonial */}
        <View style={styles.testiWrap}>
          <View style={styles.testi}>
            <Text style={styles.testiText}>
              « L'IA m'a rappelé d'appeler ma mère pile au bon moment. Elle pense vraiment à ma place. »
            </Text>
            <View style={styles.testiFoot}>
              <LinearGradient colors={['#FFB68A', '#FF9500']} style={styles.avatar}>
                <Text style={styles.avatarText}>C</Text>
              </LinearGradient>
              <View>
                <Text style={styles.testiName}>Claire B.</Text>
                <Text style={styles.testiRole}>Designer · Paris</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}>
          <Text style={styles.ctaText}>Essayer 7 jours gratuits</Text>
        </Pressable>
        <Text style={styles.meta}>
          Puis {plan === 'yearly' ? '35,99€/an' : '4,99€/mois'} · Annulable à tout moment ·{' '}
          <Text style={{ color: C.brand }}>Restaurer</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  close: { position: 'absolute', top: 16, right: 16, zIndex: 5 },
  hero: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, alignItems: 'center' },
  crown: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: C.label, textAlign: 'center', marginBottom: 8, letterSpacing: 0.36 },
  heroDesc: { fontSize: 15, color: C.secondaryLabel, textAlign: 'center', lineHeight: 20 },
  sectionHeader: { fontSize: 13, letterSpacing: -0.08, color: C.secondaryLabel, paddingHorizontal: 32, paddingBottom: 7 },
  list: { marginHorizontal: 16, backgroundColor: C.surface, borderRadius: 10, overflow: 'hidden' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, minHeight: 44 },
  featureBorder: { borderTopWidth: 0.5, borderTopColor: C.separator, marginLeft: 60 },
  featureIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: C.label, marginBottom: 2, letterSpacing: -0.24 },
  featureDesc: { fontSize: 13, color: C.secondaryLabel, lineHeight: 18, letterSpacing: -0.08 },
  plans: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  plan: {
    flex: 1, borderRadius: 14, padding: 14,
    backgroundColor: C.surface,
    borderWidth: 2, borderColor: 'transparent', alignItems: 'center',
  },
  planSelected: { borderColor: C.brand },
  planName: { fontSize: 13, fontWeight: '600', color: C.secondaryLabel, letterSpacing: 0.5, marginBottom: 4 },
  planPrice: { fontSize: 24, fontWeight: '700', color: C.label, letterSpacing: 0.4 },
  planPer: { fontSize: 13, fontWeight: '500', color: C.secondaryLabel },
  badge: { position: 'absolute', top: -8, right: 8, backgroundColor: C.brand, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'white', letterSpacing: 0.4 },
  proof: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 20, paddingBottom: 12 },
  stars: { flexDirection: 'row', gap: 1 },
  proofText: { fontSize: 13, color: C.secondaryLabel, letterSpacing: -0.08 },
  testiWrap: { paddingHorizontal: 16 },
  testi: { backgroundColor: C.surface, borderRadius: 10, padding: 16 },
  testiText: { fontSize: 15, color: C.label, lineHeight: 20, letterSpacing: -0.24, fontStyle: 'italic', marginBottom: 12 },
  testiFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700', color: 'white' },
  testiName: { fontSize: 13, fontWeight: '600', color: C.label, letterSpacing: -0.08 },
  testiRole: { fontSize: 11, color: C.secondaryLabel },
  ctaArea: { padding: 16, borderTopWidth: 0.5, borderTopColor: C.separator, backgroundColor: C.bg },
  cta: { height: 50, borderRadius: 14, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '600', color: 'white' },
  meta: { textAlign: 'center', fontSize: 12, color: C.secondaryLabel, marginTop: 10, lineHeight: 18 },
});
