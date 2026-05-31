import { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, PanResponder,
} from 'react-native';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { C, CAT, RADIUS, SP, SHADOW } from '../theme';

const FREQ_LABELS = { daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel', custom: 'Récurrent' };

export default function ReminderCard({ reminder, onComplete, onSnooze, onPress }) {
  const [showSnooze, setShowSnooze] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const isCompleted = !!reminder.completed_at;

  const cat = CAT[reminder.category] || CAT.personal;

  const slideOut = (callback) => {
    Animated.timing(pan.x, { toValue: 400, duration: 220, useNativeDriver: false }).start(callback);
  };

  const handleCheckPress = () => {
    if (isCompleted) return;
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 8 }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 60 }),
    ]).start();
    slideOut(onComplete);
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 5,
    onMoveShouldSetPanResponder: (_, { dx }) => Math.abs(dx) > 5,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (_, { dx }) => {
      if (dx > 80) {
        slideOut(onComplete);
      } else if (dx < -80) {
        setShowSnooze(true);
        Animated.spring(pan.x, { toValue: 0, useNativeDriver: false }).start();
      } else {
        Animated.spring(pan.x, { toValue: 0, useNativeDriver: false }).start();
      }
    },
  })).current;

  const handleSnooze = (minutes) => {
    setShowSnooze(false);
    onSnooze(minutes);
  };

  let timeText = '';
  if (reminder.scheduled_at) {
    const d = new Date(reminder.scheduled_at);
    if (isValid(d)) timeText = format(d, "HH'h'mm", { locale: fr });
  }

  return (
    <View style={styles.wrapper} testID={`reminder-${reminder.id}`}>
      {/* Swipe hint background */}
      <View style={styles.swipeBg}>
        <View style={[styles.swipeSide, { backgroundColor: C.tealSoft }]}>
          <Text style={[styles.swipeText, { color: C.teal }]}>✓ Terminer</Text>
        </View>
        <View style={[styles.swipeSide, { backgroundColor: C.violetSoft, alignItems: 'flex-end' }]}>
          <Text style={[styles.swipeText, { color: C.violet }]}>Reporter 💤</Text>
        </View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          isCompleted && styles.cardDone,
          { transform: [{ translateX: pan.x }] },
        ]}
      >
        {/* Category accent bar */}
        <View style={[styles.accentBar, { backgroundColor: cat.color }]} />

        {/* Checkbox */}
        <Pressable
          onPress={handleCheckPress}
          style={styles.checkWrap}
          testID={`complete-${reminder.id}`}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
        >
          <Animated.View
            style={[
              styles.checkCircle,
              isCompleted && { borderColor: cat.color, backgroundColor: cat.color },
              { transform: [{ scale: checkScale }] },
            ]}
          >
            {isCompleted && <Text style={styles.checkMark}>✓</Text>}
          </Animated.View>
        </Pressable>

        {/* Content */}
        <Pressable style={styles.content} onPress={onPress} disabled={!onPress || isCompleted}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>
              {reminder.title}
            </Text>
            {!isCompleted && onPress && (
              <Text style={styles.chevron}>›</Text>
            )}
          </View>

          {reminder.context_ai ? (
            <View style={styles.aiRow}>
              <Text style={[styles.aiDot, { color: cat.color }]}>✦</Text>
              <Text style={styles.aiText} numberOfLines={1}>{reminder.context_ai}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            {timeText ? (
              <View style={[styles.chip, { backgroundColor: cat.soft }]}>
                <Text style={[styles.chipText, { color: cat.deep }]}>{timeText}</Text>
              </View>
            ) : null}
            <View style={[styles.chip, { backgroundColor: cat.soft }]}>
              <Text style={[styles.chipText, { color: cat.deep }]}>{cat.label}</Text>
            </View>
            {FREQ_LABELS[reminder.frequency] ? (
              <View style={[styles.chip, { backgroundColor: C.tealSoft }]}>
                <Text style={[styles.chipText, { color: C.tealDeep }]}>
                  {FREQ_LABELS[reminder.frequency]}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>

      {showSnooze && (
        <View style={styles.snoozeRow}>
          {[
            { mins: 15, label: '+15 min' },
            { mins: 60, label: '+1 heure' },
            { mins: 1440, label: 'Demain' },
          ].map(({ mins, label }) => (
            <Pressable key={mins} style={styles.snoozeBtn} onPress={() => handleSnooze(mins)}>
              <Text style={styles.snoozeBtnText}>{label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.snoozeCancel} onPress={() => setShowSnooze(false)}>
            <Text style={styles.snoozeCancelText}>✕</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SP.sm, position: 'relative' },

  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  swipeSide: { flex: 1, justifyContent: 'center', paddingHorizontal: SP.xl },
  swipeText: { fontSize: 13, fontWeight: '700' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: RADIUS.card,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  cardDone: { opacity: 0.55 },

  accentBar: { width: 4, alignSelf: 'stretch' },

  checkWrap: {
    width: 44, alignItems: 'center', justifyContent: 'center',
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkMark: { fontSize: 11, color: '#fff', fontWeight: '800', lineHeight: 14 },

  content: { flex: 1, paddingVertical: SP.md, paddingRight: SP.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.xs },
  title: {
    flex: 1, fontSize: 14, fontWeight: '600', color: C.text,
    letterSpacing: -0.1, lineHeight: 20,
  },
  titleDone: { color: C.text4, textDecorationLine: 'line-through' },
  chevron: { fontSize: 18, color: C.text4, marginTop: -1 },

  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  aiDot: { fontSize: 9 },
  aiText: { fontSize: 12, color: C.text3, flex: 1 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.xs, marginTop: SP.sm },
  chip: {
    paddingHorizontal: SP.sm, paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  chipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },

  snoozeRow: {
    flexDirection: 'row', backgroundColor: C.surface2,
    borderRadius: RADIUS.md, marginTop: 4, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  snoozeBtn: { flex: 1, padding: SP.md, alignItems: 'center' },
  snoozeBtnText: { fontSize: 13, color: C.violet, fontWeight: '600' },
  snoozeCancel: { padding: SP.md, paddingHorizontal: SP.lg },
  snoozeCancelText: { fontSize: 13, color: C.text3 },
});
