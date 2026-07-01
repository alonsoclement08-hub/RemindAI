import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, Linking,
} from 'react-native';
import { productsAPI } from '../api/products';

// Store URLs — deeplinks to search pages (no affiliate, keeps things simple)
const STORE_URLS = {
  Amazon:    (q) => `https://www.amazon.fr/s?k=${encodeURIComponent(q)}`,
  Carrefour: (q) => `https://www.carrefour.fr/s?q=${encodeURIComponent(q)}`,
  Leclerc:   (q) => `https://www.e.leclerc/recherche?q=${encodeURIComponent(q)}`,
  Auchan:    (q) => `https://www.auchan.fr/recherche?q=${encodeURIComponent(q)}`,
  Lidl:      (q) => `https://www.lidl.fr/q/${encodeURIComponent(q)}`,
};

function PriceRow({ item, productName, isCheapest }) {
  const url = STORE_URLS[item.store]?.(productName);
  return (
    <Pressable
      style={[styles.priceRow, isCheapest && styles.priceRowBest]}
      onPress={() => url && Linking.openURL(url)}
      disabled={!url}
    >
      <Text style={styles.priceIcon}>{item.logo}</Text>
      <View style={styles.priceInfo}>
        <Text style={styles.storeName}>{item.store}</Text>
        {isCheapest && <Text style={styles.bestBadge}>Meilleur prix</Text>}
      </View>
      <Text style={[styles.priceValue, isCheapest && styles.priceValueBest]}>
        {item.price.toFixed(2)} €
      </Text>
      {url && <Text style={styles.arrow}>›</Text>}
    </Pressable>
  );
}

export default function PriceComparison({ productName, style }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!productName?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await productsAPI.getPriceComparison(productName);
      setData(result);
    } catch {
      setError("Comparaison indisponible");
    } finally {
      setLoading(false);
    }
  }, [productName]);

  useEffect(() => { fetch(); }, [fetch]);

  if (!productName?.trim()) return null;

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#1D9E75" />
          <Text style={styles.loadingText}>Comparaison des prix...</Text>
        </View>
      </View>
    );
  }

  if (error || !data || data.prices.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.errorText}>{error || "Aucun prix trouvé"}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Comparaison de prix</Text>
        {data.unit ? <Text style={styles.unit}>{data.unit}</Text> : null}
      </View>

      {/* Price rows */}
      {data.prices.map((item, i) => (
        <PriceRow
          key={item.store}
          item={item}
          productName={data.productName}
          isCheapest={i === 0}
        />
      ))}

      {/* Savings banner */}
      {data.savings > 0 && (
        <View style={styles.savingsBanner}>
          <Text style={styles.savingsText}>
            💰 Économies possibles : {data.savings.toFixed(2)} € chez {data.cheapest.store}
          </Text>
        </View>
      )}

      {/* Tip from AI */}
      {data.priceNote ? (
        <Text style={styles.priceNote}>{data.priceNote}</Text>
      ) : null}

      {/* Estimated disclaimer */}
      <Text style={styles.disclaimer}>
        Prix estimés · Mis à jour toutes les 6h
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#999' },
  errorText: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingVertical: 8 },

  header: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  unit: { fontSize: 12, color: '#999' },

  priceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 10, marginBottom: 6,
    backgroundColor: '#f8f8fc', gap: 10,
  },
  priceRowBest: {
    backgroundColor: '#F0FFF8',
    borderWidth: 1.5, borderColor: '#1D9E75',
  },
  priceIcon: { fontSize: 20 },
  priceInfo: { flex: 1 },
  storeName: { fontSize: 14, fontWeight: '600', color: '#222' },
  bestBadge: {
    fontSize: 10, fontWeight: '700', color: '#1D9E75',
    marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#555' },
  priceValueBest: { color: '#1D9E75' },
  arrow: { fontSize: 18, color: '#ccc' },

  savingsBanner: {
    marginTop: 8, marginBottom: 4,
    backgroundColor: '#FFF9E6',
    borderRadius: 10, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#FFB800',
  },
  savingsText: { fontSize: 13, color: '#B37800', fontWeight: '600' },

  priceNote: {
    marginTop: 8, fontSize: 12, color: '#888',
    fontStyle: 'italic', lineHeight: 16,
  },
  disclaimer: {
    marginTop: 8, fontSize: 10, color: '#ccc',
    textAlign: 'center',
  },
});
