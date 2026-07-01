import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SP, RADIUS } from '../../theme';

export default function HeroSummary({ urgent, remaining, progress, updatedAgo = 'il y a 2 min' }) {
  return (
    <LinearGradient
      colors={['#1F8AFF', '#0050D0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.head}>
        <View style={styles.pill}>
          <View style={styles.pulse} />
          <Text style={styles.pillText}>RÉSUMÉ IA</Text>
        </View>
        <Text style={styles.timeText}>{updatedAgo}</Text>
      </View>

      <Text style={styles.text}>
        Tu as{' '}
        <Text style={styles.bold}>{urgent} chose{urgent > 1 ? 's' : ''} urgente{urgent > 1 ? 's' : ''}</Text>
        {' '}aujourd'hui. Consulte tes rappels pour voir les priorités.
      </Text>

      <View style={styles.stats}>
        <Stat num={urgent} label="Urgents" />
        <Stat num={remaining} label="À faire" />
        <Stat num={`${progress}%`} label="Avancé" />
      </View>
    </LinearGradient>
  );
}

function Stat({ num, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SP.lg,
    marginBottom: SP['2xl'],
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0050D0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.30,
    shadowRadius: 32,
    elevation: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SP.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pulse: { width: 5, height: 5, borderRadius: RADIUS.pill, backgroundColor: 'white' },
  pillText: { fontSize: 11, fontWeight: '700', color: 'white', letterSpacing: 0.6 },
  timeText: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
  },
  text: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.24,
    color: 'white',
    marginBottom: 14,
  },
  bold: { fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SP.md,
    paddingVertical: 10,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: -0.08,
  },
});
