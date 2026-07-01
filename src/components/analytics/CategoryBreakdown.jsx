import { View, Text, StyleSheet } from 'react-native';

const BAR_W = 140;

export default function CategoryBreakdown({ data = [] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (!total) {
    return (
      <Text style={styles.empty}>
        Aucune donnée — complète des rappels pour voir la répartition par catégorie
      </Text>
    );
  }

  return (
    <View>
      {/* Segmented bar */}
      <View style={styles.segBar}>
        {data.map((d, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                flex: d.count,
                backgroundColor: d.color,
                borderTopLeftRadius: i === 0 ? 8 : 0,
                borderBottomLeftRadius: i === 0 ? 8 : 0,
                borderTopRightRadius: i === data.length - 1 ? 8 : 0,
                borderBottomRightRadius: i === data.length - 1 ? 8 : 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Rows */}
      <View style={styles.rows}>
        {data.map((d, i) => {
          const pct = Math.round((d.count / total) * 100);
          const fillW = Math.round((pct / 100) * BAR_W);
          return (
            <View key={i} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.dot, { backgroundColor: d.color }]} />
                <Text style={styles.catName}>{d.label}</Text>
              </View>
              <View style={styles.rowRight}>
                <View style={[styles.progressBg, { width: BAR_W }]}>
                  <View style={[styles.progressFill, { width: fillW, backgroundColor: d.color }]} />
                </View>
                <Text style={[styles.pct, { color: d.color }]}>{pct}%</Text>
                <Text style={styles.cnt}>({d.count})</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  segment: { height: '100%' },

  rows: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
  },
  catName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  pct: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  cnt: {
    fontSize: 11,
    color: '#bbb',
    minWidth: 28,
  },
  empty: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: 13,
    paddingVertical: 16,
    lineHeight: 20,
  },
});
