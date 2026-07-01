import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C, SP, RADIUS } from '../../theme';

export default function Row({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  chevron = true,
  checkmark = false,
  onPress,
  isFirst = false,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isFirst && styles.divider,
        pressed && { backgroundColor: C.systemGray5 },
        style,
      ]}
    >
      {icon != null && (
        <View style={[styles.iconWrap, { backgroundColor: iconColor || C.systemGray }]}>
          {typeof icon === 'string'
            ? <Text style={styles.iconText}>{icon}</Text>
            : icon
          }
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {!!value && <Text style={styles.value}>{value}</Text>}
        {checkmark && <Text style={[styles.chevronText, { color: C.brand }]}>✓</Text>}
        {chevron && !checkmark && <Text style={styles.chevronText}>›</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: SP.lg,
    paddingVertical: 11,
    backgroundColor: C.surface,
  },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  iconWrap: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.md,
  },
  iconText: { fontSize: 14, color: '#fff' },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 17,
    letterSpacing: -0.43,
    color: C.text,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: -0.08,
    color: C.text3,
    lineHeight: 17,
    marginTop: 2,
  },
  value: {
    fontSize: 17,
    letterSpacing: -0.43,
    color: C.text3,
  },
  chevronText: {
    fontSize: 18,
    color: C.systemGray3,
    fontWeight: '400',
  },
});
