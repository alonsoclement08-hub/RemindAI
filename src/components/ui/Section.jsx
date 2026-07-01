import { View, Text, StyleSheet } from 'react-native';
import { C, SP, RADIUS } from '../../theme';

export default function Section({ header, footer, children }) {
  return (
    <View style={styles.section}>
      {!!header && <Text style={styles.header}>{header}</Text>}
      <View style={styles.list}>{children}</View>
      {!!footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SP['2xl'] },
  header: {
    paddingHorizontal: 32,
    paddingBottom: 7,
    fontSize: 13,
    letterSpacing: -0.08,
    color: C.text3,
    textTransform: 'uppercase',
    fontWeight: '400',
  },
  list: {
    marginHorizontal: SP.lg,
    backgroundColor: C.surface,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 32,
    paddingTop: 7,
    fontSize: 13,
    letterSpacing: -0.08,
    color: C.text3,
    lineHeight: 18,
  },
});
