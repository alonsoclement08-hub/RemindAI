import { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, PanResponder,
} from 'react-native';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { C, CAT, RADIUS, SP, SHADOW } from '../theme';

const FREQ_LABELS = { daily: 'Quotidien', weekly: 'Hebdo', monthly: 'Mensuel', custom: 'Récurrent' };

export default function ReminderCard({ reminder, onComplete, onSnooze, onPress, isFirst = false }) {
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
      Animated.spring(checkScale, { toValue: 1.3, useNativeDriver: true, speed: 60, bounciness: 8 }),
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
        <View style={[styles.swipeSide, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
          <Text style={[styles.swipeText, { color: C.systemGreen }]}>✓ Terminer</Text>
        </View>
        <View style={[styles.swipeSide, { backgroundColor: 'rgba(255,149,0,0.15)', alignItems: 'flex-end' }]}>
          <Text style={[styles.swipeText, { color: C.systemOrange }]}>Reporter 💤</Text>
        </View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.row,
          !isFirst && styles.divider,
          isCompleted && styles.rowDone,
          { transform: [{ translateX: pan.x }] },
        ]}
      >
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
        <Pressable style={styles.body} onPress={onPress} disabled={!onPress || isCompleted}>
          <Text
            style={[styles.title, isCompleted && styles.titleDone]}
            numberOfLines={2}
          >
            {reminder.title}
          </Text>
          <View style={styles.meta}>
            {reminder.priority >= 4 && (
              <>
                <Text style={styles.urgent}>Urgent</Text>
                <View style={styles.dot} />
              </>
            )}
            {!!timeText && <Text style={styles.metaText}>{timeText}</Text>}
            {!!reminder.category && (
              <>
                {!!timeText && <View style={styles.dot} />}
                <Text style={[styles.metaText, { color: cat.color }]}>{cat.label}</Text>
              </>
            )}
            {FREQ_LABELS[reminder.frequency] && (
              <>
                <View style={styles.dot} />
                <Text style={[styles.metaText, { color: C.systemGreen }]}>
                  {FREQ_LABELS[reminder.frequency]}
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* Category color bar */}
        <View style={[styles.priorityBar, { backgroundColor: cat.color }]} />
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
  wrapper: { position: 'relative' },

  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  swipeSide: { flex: 1, justifyContent: 'center', paddingHorizontal: SP.xl },
  swipeText: { fontSize: 13, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: SP.lg,
    backgroundColor: C.surface,
    gap: SP.md,
    minHeight: 44,
  },
  rowDone: { opacity: 0.55 },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    marginLeft: 52,
  },

  checkWrap: {
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: C.systemGray3,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 11, color: '#fff', fontWeight: '800', lineHeight: 14 },

  body: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 17,
    letterSpacing: -0.43,
    color: C.text,
    lineHeight: 22,
    marginBottom: 2,
  },
  titleDone: {
    color: C.text3,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: C.text3,
    letterSpacing: -0.08,
    lineHeight: 17,
  },
  urgent: {
    fontSize: 13,
    color: C.systemRed,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: C.text4,
  },
  priorityBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginTop: 3,
  },

  snoozeRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  snoozeBtn: { flex: 1, padding: SP.md, alignItems: 'center' },
  snoozeBtnText: { fontSize: 13, color: C.brand, fontWeight: '600' },
  snoozeCancel: { padding: SP.md, paddingHorizontal: SP.lg },
  snoozeCancelText: { fontSize: 13, color: C.text3 },
});
