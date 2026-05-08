import { useState, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, PanResponder,
} from 'react-native';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

const PRIORITY_COLORS = { 1: '#b0b0b0', 2: '#FFB800', 3: '#FF8C42', 4: '#E0654A' };
const CATEGORY_ICONS = { work: '💼', personal: '👤', health: '💪', errand: '🛒', habit: '🔄' };

export default function ReminderCard({ reminder, onComplete, onSnooze }) {
  const [showSnooze, setShowSnooze] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const isCompleted = !!reminder.completed_at;

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

  const priorityColor = PRIORITY_COLORS[reminder.priority] || PRIORITY_COLORS[2];
  const icon = CATEGORY_ICONS[reminder.category] || '📌';

  let timeText = '';
  if (reminder.scheduled_at) {
    const d = new Date(reminder.scheduled_at);
    if (isValid(d)) timeText = format(d, "HH'h'mm", { locale: fr });
  }

  return (
    <View style={styles.wrapper} testID={`reminder-${reminder.id}`}>
      {/* Swipe hint background */}
      <View style={styles.swipeBg}>
        <Text style={styles.swipeBgLeft}>✓</Text>
        <Text style={styles.swipeBgRight}>💤</Text>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.card, { transform: [{ translateX: pan.x }] }]}
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
              isCompleted && styles.checkCircleDone,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            {isCompleted && <Text style={styles.checkMark}>✓</Text>}
          </Animated.View>
        </Pressable>

        <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.content}>
          <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>
            {reminder.title}
          </Text>
          {reminder.context_ai ? (
            <Text style={styles.context} numberOfLines={1}>{reminder.context_ai}</Text>
          ) : null}
          {timeText ? <Text style={styles.time}>{timeText}</Text> : null}
        </View>
      </Animated.View>

      {showSnooze && (
        <View style={styles.snoozeRow}>
          {[15, 60, 1440].map((mins) => (
            <Pressable key={mins} style={styles.snoozeBtn} onPress={() => handleSnooze(mins)}>
              <Text style={styles.snoozeBtnText}>
                {mins === 15 ? '+15min' : mins === 60 ? '+1h' : 'Demain'}
              </Text>
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
  wrapper: { marginBottom: 10, position: 'relative' },
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, borderRadius: 14,
  },
  swipeBgLeft: { fontSize: 20, color: '#1D9E75' },
  swipeBgRight: { fontSize: 20, color: '#7F77DD' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  checkWrap: { marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkCircleDone: { borderColor: '#1D9E75', backgroundColor: '#1D9E75' },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '700', lineHeight: 16 },
  priorityBar: { width: 3, height: 36, borderRadius: 2, marginRight: 10 },
  icon: { fontSize: 20, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  titleDone: { color: '#aaa', textDecorationLine: 'line-through' },
  context: { fontSize: 12, color: '#999', marginTop: 2 },
  time: { fontSize: 12, color: '#7F77DD', marginTop: 3, fontWeight: '500' },
  snoozeRow: {
    flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10,
    marginTop: 4, overflow: 'hidden',
  },
  snoozeBtn: { flex: 1, padding: 10, alignItems: 'center' },
  snoozeBtnText: { fontSize: 13, color: '#7F77DD', fontWeight: '600' },
  snoozeCancel: { padding: 10, paddingHorizontal: 14 },
  snoozeCancelText: { fontSize: 13, color: '#999' },
});
