import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SP, RADIUS, SHADOW } from '../../theme';

export default function NextUpCard({ reminder, onPress }) {
  if (!reminder) return null;
  const [hour, min] = (reminder.time || reminder.scheduled_at
    ? new Date(reminder.scheduled_at).toTimeString().slice(0, 5)
    : '??:??'
  ).split(':');

  const isUrgent = reminder.urgent || reminder.priority >= 4;
  const sub = isUrgent ? 'Urgent · ' : '';
  const extra = reminder.dueIn || reminder.place || 'Programmé';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      <LinearGradient
        colors={['#1F8AFF', '#0050D0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.time}
      >
        <Text style={styles.hour}>{hour || '--'}</Text>
        <Text style={styles.min}>{min || '00'}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.label}>PROCHAIN</Text>
        <Text style={styles.title} numberOfLines={1}>{reminder.title}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sub}{extra}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
    marginHorizontal: SP.lg,
    marginBottom: SP['2xl'],
    padding: 14,
    paddingRight: SP.lg,
    backgroundColor: C.surface,
    borderRadius: RADIUS.btn,
    borderWidth: 0.5,
    borderColor: C.border,
    ...SHADOW.sm,
  },
  time: {
    width: 44,
    paddingVertical: 6,
    paddingBottom: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050D0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 4,
  },
  hour: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: -0.32, lineHeight: 16 },
  min: { fontSize: 11, fontWeight: '500', color: 'white', opacity: 0.9, lineHeight: 11, marginTop: 2 },
  body: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: C.brandDeep,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.24,
    color: C.text,
    marginBottom: 2,
  },
  sub: { fontSize: 12.5, color: C.text3, letterSpacing: -0.08 },
  chevron: { fontSize: 18, color: C.text4 },
});
