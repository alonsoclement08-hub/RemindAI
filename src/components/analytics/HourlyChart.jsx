import { View, Text, StyleSheet, ScrollView } from 'react-native';

const CHART_H = 72;

export default function HourlyChart({ data = [], color = '#7F77DD' }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const hasData = data.some(d => d.count > 0);
  const bestHour = data.reduce((best, d) => (d.count > (best?.count || 0) ? d : best), null);

  return (
    <View>
      {bestHour && bestHour.count > 0 && (
        <Text style={styles.peak}>
          🏆 Pic d'activité : <Text style={[styles.peakHour, { color }]}>{bestHour.hour}h–{bestHour.hour + 1}h</Text>
          {'  '}({bestHour.count} complété{bestHour.count > 1 ? 's' : ''})
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {data.map((d, i) => {
            const barH = maxVal > 0 ? Math.max(Math.round((d.count / maxVal) * CHART_H), d.count > 0 ? 5 : 2) : 2;
            const isBest = d.count > 0 && d.count === maxVal;
            const showLabel = i % 6 === 0 || i === 23;

            return (
              <View key={i} style={styles.col}>
                {d.count > 0 && (
                  <Text style={[styles.countLabel, { color: isBest ? color : '#aaa' }]}>{d.count}</Text>
                )}
                <View style={[styles.barWrap, { height: CHART_H }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barH,
                        backgroundColor: isBest ? color : d.count > 0 ? `${color}70` : '#eee',
                      },
                    ]}
                  />
                </View>
                {showLabel && <Text style={styles.hourLabel}>{i}h</Text>}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {!hasData && (
        <Text style={styles.empty}>Pas encore de données — complète des rappels pour voir ton activité par heure</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  peak: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  peakHour: {
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  col: {
    alignItems: 'center',
    width: 18,
    marginHorizontal: 1,
  },
  countLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  barWrap: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 12,
    borderRadius: 3,
  },
  hourLabel: {
    fontSize: 8,
    color: '#bbb',
    marginTop: 3,
  },
  empty: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
    paddingVertical: 16,
    lineHeight: 20,
  },
});
