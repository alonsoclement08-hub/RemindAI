import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  RefreshControl, ActivityIndicator, Animated, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRemindersStore } from '../../src/store/reminders.store';
import { useAuthStore } from '../../src/store/auth.store';
import { notificationsService } from '../../src/services/notifications.service';
import { analyticsAPI } from '../../src/api/analytics';
import { aiAPI } from '../../src/api/ai';
import { getAiHint } from '../../src/utils/aiHints';
import { SFIcon } from '../../src/components/ui/SFIcon';
import { useColors } from '../../src/theme';

const CAT_COLOR = (C) => ({
  work: C.catWork,
  health: C.catHealth,
  errand: C.catErrand,
  habit: C.catHabit,
  personal: C.catWork,
  call: C.catHabit,
});

const CAT_LABEL = {
  work: 'Travail',
  health: 'Santé',
  errand: 'Courses',
  habit: 'Habitudes',
  personal: 'Personnel',
  call: 'Appels',
};

const CAT_ICON = {
  work: 'briefcase.fill',
  health: 'heart.fill',
  errand: 'cart.fill',
  habit: 'leaf.fill',
  personal: 'briefcase.fill',
  call: 'phone.fill',
};

function groupByCategory(reminders) {
  const groups = {};
  for (const r of reminders) {
    const cat = r.category || 'personal';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(r);
  }
  return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
}

function fmtTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const FREQ_LABEL = {
  daily: 'Tous les jours',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  custom: 'Personnalisé',
};

function fmtFreq(reminder) {
  if (!reminder.frequency || reminder.frequency === 'once') return null;
  return FREQ_LABEL[reminder.frequency] || reminder.frequency;
}

function getAiMessage(progress, urgent, remaining) {
  if (remaining === 0) return 'Toutes les tâches sont terminées — belle journée !';
  if (urgent > 1) return `${urgent} choses urgentes en attente — prends-les en priorité.`;
  if (urgent === 1) return '1 tâche urgente à traiter en premier.';
  if (progress >= 75) return 'Excellent avancement, tu approches du but !';
  if (progress >= 50) return 'Mi-chemin parcouru — reste concentré pour finir fort.';
  if (progress > 0) return 'Bon début ! Continue sur cette lancée.';
  const h = new Date().getHours();
  if (h < 10) return "Nouvelle journée, nouvelles opportunités. C'est parti !";
  if (h < 14) return 'La matinée avance — prends une tâche et commence.';
  if (h < 18) return "Après-midi en cours, reste productif jusqu'au soir.";
  return 'Soirée pour boucler les derniers rappels.';
}

export default function HomeScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const catColors = useMemo(() => CAT_COLOR(C), [C]);

  const store = useRemindersStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const deleteTimers = useRef({});

  const [streak, setStreak] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const scrollRef = useRef(null);

  useFocusEffect(useCallback(() => {
    store.load();
    notificationsService.scheduleDailySummaryIfNeeded();
    analyticsAPI.getSummary('week').then((s) => { if (s?.streak) setStreak(s.streak); }).catch(() => {});
    aiAPI.getHabits().then((h) => {
      if (h?.patterns?.worstCategory) {
        setSuggestion({ category: h.patterns.worstCategory, tip: h.recommendation });
      }
    }).catch(() => {});
  }, []));

  const active = store.reminders.filter((r) => !r.completed_at && !r.archived_at && !r.deleted_at);
  const done = store.reminders.filter((r) => !!r.completed_at && !r.archived_at && !r.deleted_at);
  const urgent = active.filter((r) => r.priority >= 3).length;
  const total = active.length + done.length;
  const progress = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const userName = user?.name || 'toi';

  const openDetail = (r) => router.push({ pathname: '/(app)/detail', params: { id: r.id } });

  const completeAndRemove = useCallback((r) => {
    if (!r.completed_at) {
      store.complete(r.id);
      deleteTimers.current[r.id] = setTimeout(() => {
        store.archive(r.id);
        delete deleteTimers.current[r.id];
      }, 5000);
    } else {
      store.restore(r.id);
      if (deleteTimers.current[r.id]) {
        clearTimeout(deleteTimers.current[r.id]);
        delete deleteTimers.current[r.id];
      }
    }
  }, [store]);

  if (store.isLoading && store.reminders.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.navBar}>
        <View style={{ flex: 1 }} />
        <View style={styles.navTrailing}>
          <Pressable onPress={() => router.push('/(app)/create')} hitSlop={10}>
            <SFIcon name="square.and.pencil" size={22} color={C.brand} weight="medium" />
          </Pressable>
          <Pressable onPress={() => router.push('/(app)/paywall')} hitSlop={10}>
            <SFIcon name="crown.fill" size={20} color={C.catErrand} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={store.isLoading}
            onRefresh={() => { setSearchVisible(true); store.sync(); }}
            tintColor={C.brand}
          />
        }
      >
        {/* Barre de recherche — apparaît au pull-to-refresh */}
        {searchVisible && (
          <View style={styles.searchWrap}>
            <SFIcon name="magnifyingglass" size={15} color={C.secondaryLabel} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un rappel…"
              placeholderTextColor={C.tertiaryLabel}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoFocus
            />
            <Pressable
              hitSlop={8}
              onPress={() => { setSearchVisible(false); setSearchQuery(''); }}
            >
              <SFIcon name="xmark.circle.fill" size={17} color={C.tertiaryLabel} />
            </Pressable>
          </View>
        )}

        <Text style={styles.subTitle}>{dateStr} · Bonjour {userName}</Text>
        <Text style={styles.largeTitle}>Aujourd'hui</Text>

        {/* AI summary hero with progress bar */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <View style={styles.heroDot} />
              <Text style={styles.heroBadgeText}>RÉSUMÉ IA</Text>
            </View>
            <Text style={styles.heroProgress}>{progress}%</Text>
          </View>

          <Text style={styles.heroText}>
            {getAiMessage(progress, urgent, active.length)}
          </Text>

          <View style={styles.progressBg}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Streak card — visible dès 2 jours consécutifs */}
        {streak >= 2 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>{streak} jours de suite !</Text>
              <Text style={styles.streakSub}>
                {streak >= 7
                  ? 'Incroyable, tu es en feu ! Continue comme ça 💪'
                  : streak >= 3
                  ? 'Belle série, tkt relâche pas maintenant !'
                  : 'C\'est parti, garde le rythme 👊'}
              </Text>
            </View>
            <Text style={styles.streakBadge}>×{streak}</Text>
          </View>
        )}

        {/* Suggestion proactive de Rem */}
        {suggestion && !searchQuery && (
          <Pressable style={styles.suggestionCard} onPress={() => router.push('/(app)/create')}>
            <View style={styles.suggestionAvatar}><Text style={styles.suggestionAvatarText}>Rem</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestionText}>{suggestion.tip || `Hé, tu n'as pas de rappel ${CAT_LABELS[suggestion.category] || suggestion.category} en cours — on en crée un ?`}</Text>
            </View>
            <SFIcon name="plus.circle.fill" size={22} color="#7F77DD" />
          </Pressable>
        )}

        {active.length > 0 && groupByCategory(
          searchQuery.trim()
            ? active.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
            : active
        ).map(([cat, items]) => (
          <CategoryFolder
            key={cat}
            cat={cat}
            items={items}
            catColors={catColors}
            onOpen={openDetail}
            onComplete={completeAndRemove}
            onSnooze={(id, minutes) => store.snooze(id, minutes)}
          />
        ))}

        {searchQuery.trim() && active.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySub}>Aucun rappel ne correspond à « {searchQuery} »</Text>
          </View>
        )}

        {active.length === 0 && !searchQuery && (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark}>
              <SFIcon name="checkmark" size={28} color={C.brandTeal} weight="bold" />
            </View>
            <Text style={styles.emptyTitle}>Journée libre !</Text>
            <Text style={styles.emptySub}>Appuie sur + pour créer ton premier rappel.</Text>
          </View>
        )}

        {done.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>TERMINÉ · {done.length}</Text>
            <View style={styles.stack}>
              {done.map((r) => (
                <Pressable key={r.id} style={[styles.card, styles.cardDone]} onPress={() => openDetail(r)}>
                  <Pressable style={[styles.check, styles.checkDone]} onPress={() => completeAndRemove(r)}>
                    <SFIcon name="checkmark.bold" size={12} color="white" />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, styles.cardTitleDone]}>{r.title}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryFolder({ cat, items, catColors, onOpen, onComplete, onSnooze }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [open, setOpen] = useState(true);
  const color = catColors[cat] || C.brand;
  const label = CAT_LABEL[cat] || cat;
  const icon = CAT_ICON[cat] || 'briefcase.fill';

  return (
    <View style={styles.section}>
      <Pressable style={styles.folderHeader} onPress={() => setOpen(!open)}>
        <View style={[styles.folderIcon, { backgroundColor: color }]}>
          <SFIcon name={icon} size={14} color="white" />
        </View>
        <Text style={styles.folderLabel}>{label}</Text>
        <View style={styles.folderCount}>
          <Text style={styles.folderCountText}>{items.length}</Text>
        </View>
        <SFIcon name={open ? 'chevron.right' : 'chevron.right.small'} size={12} color={C.secondaryLabel} />
      </Pressable>
      {open && (
        <View style={styles.stack}>
          {items.map((r) => (
            <SwipeableCard
              key={r.id}
              reminder={r}
              catColors={catColors}
              onOpen={onOpen}
              onComplete={() => onComplete(r)}
              onSnooze={(minutes) => onSnooze(r.id, minutes)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SwipeableCard({ reminder, catColors, onOpen, onComplete, onSnooze }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const ref = useRef(null);

  const slideX = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

  const animateOut = useCallback((cb) => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 420, duration: 260, useNativeDriver: true }),
      Animated.timing(slideOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => cb?.());
  }, [slideX, slideOpacity]);

  const handleComplete = useCallback(() => {
    animateOut(onComplete);
  }, [animateOut, onComplete]);

  const catColor = catColors[reminder.category] || C.brand;
  const isUrgent = reminder.priority >= 3;
  const time = fmtTime(reminder.scheduled_at);
  const freq = fmtFreq(reminder);
  const hint = getAiHint(reminder);

  const renderRight = () => (
    <View style={{ flexDirection: 'row' }}>
      <Pressable style={[styles.swipeTier, { backgroundColor: '#9089E0' }]} onPress={() => { onSnooze(15); ref.current?.close(); }}>
        <SFIcon name="clock" size={16} color="white" />
        <Text style={styles.swipeText}>+15m</Text>
      </Pressable>
      <Pressable style={[styles.swipeTier, { backgroundColor: '#7F77DD' }]} onPress={() => { onSnooze(60); ref.current?.close(); }}>
        <SFIcon name="clock" size={16} color="white" />
        <Text style={styles.swipeText}>+1h</Text>
      </Pressable>
      <Pressable style={[styles.swipeTier, { backgroundColor: '#5B53B8' }]} onPress={() => { onSnooze(1440); ref.current?.close(); }}>
        <SFIcon name="clock" size={16} color="white" />
        <Text style={styles.swipeText}>+1j</Text>
      </Pressable>
    </View>
  );

  const renderLeft = () => (
    <View style={[styles.swipeAction, styles.swipeDone]}>
      <SFIcon name="checkmark" size={20} color="white" weight="medium" />
      <Text style={styles.swipeText}>Terminer</Text>
    </View>
  );

  return (
    <Animated.View style={{ transform: [{ translateX: slideX }], opacity: slideOpacity }}>
      <Swipeable
        ref={ref}
        friction={2}
        leftThreshold={80}
        rightThreshold={40}
        overshootRight={false}
        renderLeftActions={renderLeft}
        renderRightActions={renderRight}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            animateOut(onComplete);
          } else {
            ref.current?.close();
          }
        }}
      >
        <Pressable style={[styles.card, { borderLeftColor: catColor }]} onPress={() => onOpen(reminder)}>
          <Pressable style={[styles.check, { borderColor: catColor }]} onPress={handleComplete} hitSlop={8}>
            <View />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{reminder.title}</Text>
            <Text style={styles.aiHint} numberOfLines={2}>{hint}</Text>
            <View style={styles.cardMeta}>
              {isUrgent && <Text style={styles.metaUrgent}>Urgent</Text>}
              {isUrgent && <Text style={styles.metaSep}>·</Text>}
              {!!time && <Text style={styles.metaText}>{time}</Text>}
              {!!freq && <Text style={styles.metaSep}>·</Text>}
              {!!freq && (
                <View style={styles.freqBadge}>
                  <SFIcon name="arrow.clockwise" size={10} color={C.brand} />
                  <Text style={styles.freqText}>{freq}</Text>
                </View>
              )}
            </View>
          </View>
          <SFIcon name="chevron.right.small" size={14} color={C.tertiaryLabel} />
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

const makeStyles = (C) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navBar: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  navTrailing: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  subTitle: { fontSize: 13, color: C.secondaryLabel, letterSpacing: -0.08, paddingHorizontal: 16, marginBottom: 4 },
  largeTitle: { fontSize: 34, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12, color: C.label },

  hero: {
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 18, padding: 16,
    backgroundColor: C.brand,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, height: 24, borderRadius: 999,
  },
  heroDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: 'white' },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: 'white', letterSpacing: 0.3 },
  heroProgress: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  heroText: {
    fontSize: 15, fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 21, letterSpacing: -0.2,
    marginBottom: 14,
  },
  progressBg: {
    height: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 6, borderRadius: 999,
    backgroundColor: 'white',
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: C.secondaryLabel,
    letterSpacing: 0.5, paddingHorizontal: 32, paddingBottom: 10,
  },
  folderHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 10,
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: C.surface, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  folderIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  folderLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.label, letterSpacing: -0.3 },
  folderCount: { backgroundColor: C.brandSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  folderCountText: { fontSize: 13, fontWeight: '700', color: C.brand },
  stack: { gap: 10, paddingHorizontal: 16 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 16, borderRadius: 16,
    backgroundColor: C.surface,
    borderLeftWidth: 4, borderLeftColor: C.brand,
    shadowColor: C.brandDeep, shadowOpacity: 0.06,
    shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardDone: { opacity: 0.6, borderLeftColor: C.systemGray3 },
  check: {
    width: 24, height: 24, borderRadius: 999,
    borderWidth: 1.5, borderColor: C.tertiaryLabel,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: C.brandTeal, borderColor: C.brandTeal },
  cardTitle: { fontSize: 16, fontWeight: '500', color: C.label, letterSpacing: -0.3, marginBottom: 4 },
  cardTitleDone: { color: C.secondaryLabel, textDecorationLine: 'line-through', marginBottom: 0 },
  aiHint: { fontSize: 12, color: C.brand, fontStyle: 'italic', marginBottom: 4, opacity: 0.8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: C.secondaryLabel },
  metaUrgent: { fontSize: 13, color: C.urgent, fontWeight: '600' },
  metaSep: { fontSize: 13, color: C.tertiaryLabel },
  freqBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.brandSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  freqText: { fontSize: 11, fontWeight: '600', color: C.brand },

  swipeAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: 120, borderRadius: 16,
  },
  swipeDone: { backgroundColor: C.brand },
  swipeTier: {
    alignItems: 'center', justifyContent: 'center',
    gap: 4, width: 70, borderRadius: 12, marginLeft: 4,
  },
  swipeText: { color: 'white', fontWeight: '600', fontSize: 13, letterSpacing: -0.2 },

  emptyState: { alignItems: 'center', marginTop: 48, marginBottom: 24 },
  emptyMark: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(29,158,117,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.label, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.secondaryLabel, textAlign: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 4, marginTop: 4,
    backgroundColor: C.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.separator,
    height: 44,
  },
  searchInput: {
    flex: 1, fontSize: 15, color: C.label,
  },

  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 14, padding: 14,
    backgroundColor: 'rgba(127,119,221,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(127,119,221,0.15)',
  },
  suggestionAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#1D9E75',
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionAvatarText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  suggestionText: { fontSize: 13, color: '#4A4376', lineHeight: 19, fontStyle: 'italic' },

  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12, padding: 14,
    backgroundColor: '#FFF8EE', borderRadius: 14,
    borderWidth: 1, borderColor: '#FFD580',
  },
  streakEmoji: { fontSize: 28 },
  streakTitle: { fontSize: 15, fontWeight: '700', color: '#B35C00', marginBottom: 2 },
  streakSub: { fontSize: 13, color: '#8A4A00', lineHeight: 18 },
  streakBadge: { fontSize: 22, fontWeight: '900', color: '#FF8C00' },


});
