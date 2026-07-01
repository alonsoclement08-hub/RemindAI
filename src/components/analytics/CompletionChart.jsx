import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const INNER_W = width - 48;

export default function CompletionChart({ data = [], period = 'week', color = '#7F77DD' }) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => d.total), 1);
  const CHART_H = 120;
  const BAR_W = period === 'week' ? Math.floor((INNER_W - 12) / 7) - 4
    : period === 'year' ? 22
    : 16;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={period !== 'week'}
        contentContainerStyle={styles.chart}
      >
        {data.map((d, i) => {
          const completedH = maxVal > 0 ? Math.round((d.completed / maxVal) * CHART_H) : 0;
          const totalH = maxVal > 0 ? Math.round((d.total / maxVal) * CHART_H) : 0;
          const showLabel = period === 'week' || period === 'year' || i % 5 === 0 || i === data.length - 1;

          return (
            <View key={i} style={[styles.barGroup, { width: BAR_W + 6 }]}>
              {d.completed > 0 && (
                <Text style={[styles.countLabel, { color }]}>{d.completed}</Text>
              )}
              <View style={[styles.barWrap, { height: CHART_H }]}>
                {totalH > 0 && (
                  <View style={[styles.barTotal, { height: totalH, width: BAR_W }]} />
                )}
                {completedH > 0 && (
                  <View style={[styles.barCompleted, { height: completedH, width: BAR_W, backgroundColor: color }]} />
                )}
              </View>
              {showLabel && <Text style={styles.dayLabel}>{d.label}</Text>}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Complétés</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e8e8f0' }]} />
          <Text style={styles.legendText}>Total créés</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  barGroup: {
    alignItems: 'center',
    marginHorizontal: 3,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  barWrap: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  barTotal: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 5,
    backgroundColor: '#e8e8f0',
  },
  barCompleted: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 9,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#888',
  },
});
