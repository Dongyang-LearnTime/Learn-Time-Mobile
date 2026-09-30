import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../constants/theme';
import { parsePlanContent } from '../utils/planContent';

export function PlanContent({ content }: { content: string }) {
  const { colors } = useTheme();
  const lines = parsePlanContent(content);
  return <View style={[styles.list, { borderColor: colors.border }]}>
    {lines.map((line, index) => <View key={index} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      <View style={styles.copy}>
        {line.isReview ? <Text style={[styles.review, { color: colors.success }]}>복습</Text> : null}
        <Text style={[styles.text, { color: colors.text }]}>{line.title}</Text>
      </View>
      {line.pages !== null ? <Text style={[styles.pages, { color: colors.primary, backgroundColor: colors.primarySoft }]}>{line.pages}p</Text> : null}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  list: { marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingVertical: 12 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  copy: { flex: 1 },
  text: { fontSize: 14, lineHeight: 23 },
  review: { fontSize: 10, fontWeight: '800', marginBottom: 3 },
  pages: { fontSize: 11, fontWeight: '800', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, marginTop: 2 },
});
