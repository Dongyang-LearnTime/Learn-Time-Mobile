import { StyleSheet, Text, View } from 'react-native';

import { useTheme, type ThemeColors } from '../constants/theme';

interface ChartItem {
  label: string;
  value: number;
}

export function MiniBarChart({ data, unit }: { data: ChartItem[]; unit: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const max = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) return <Text style={styles.empty}>표시할 통계가 없습니다.</Text>;

  return <View>
    <View style={styles.chart} accessibilityLabel={data.map((item) => `${item.label} ${item.value}${unit}`).join(', ')}>
      {data.map((item) => {
        const height = item.value === 0 ? 3 : Math.max(10, Math.round((item.value / max) * 86));
        return <View key={item.label} style={styles.column}>
          <Text style={styles.value} numberOfLines={1}>{item.value > 0 ? Math.round(item.value).toLocaleString() : '-'}</Text>
          <View style={styles.track}><View style={[styles.bar, { height }]} /></View>
          <Text style={styles.label}>{item.label}</Text>
        </View>;
      })}
    </View>
    <Text style={styles.unit}>단위: {unit}</Text>
  </View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chart: { minHeight: 130, flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 12 },
  column: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5 },
  track: { height: 88, width: '72%', maxWidth: 30, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: colors.surfaceMuted },
  bar: { width: '100%', borderRadius: 8, backgroundColor: colors.primary },
  value: { width: '100%', color: colors.text, fontSize: 9, fontWeight: '800', textAlign: 'center' },
  label: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  unit: { color: colors.muted, fontSize: 10, textAlign: 'right', marginTop: 8 },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 20, textAlign: 'center' },
});
