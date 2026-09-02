import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { createSchedule, deleteSchedule, getMonthlySchedules } from '../../src/api/calendarApi';
import { MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/constants/theme';
import type { CalendarResponse } from '../../src/types/calendar';
import { getApiError } from '../../src/utils/getApiError';

const today = new Date();
const initialDate = today.toISOString().slice(0, 10);

export default function ScheduleScreen() {
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [items, setItems] = useState<CalendarResponse[]>([]);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState('09:00');
  const [important, setImportant] = useState(false);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await getMonthlySchedules(month.getFullYear(), month.getMonth() + 1)); }
    catch (error) { setMessage(getApiError(error)); }
  }, [month]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!content.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      setMessage('일정 내용과 날짜(YYYY-MM-DD), 시간(HH:mm)을 확인해주세요.'); return;
    }
    setIsSaving(true); setMessage('');
    try {
      await createSchedule({ content: content.trim(), targetDate: `${date}T${time}:00`, isImportant: important });
      setContent(''); setImportant(false); setMessage('일정을 등록했습니다.'); await load();
    } catch (error) { setMessage(getApiError(error)); }
    finally { setIsSaving(false); }
  };

  const remove = (item: CalendarResponse) => Alert.alert('일정 삭제', `'${item.content}' 일정을 삭제할까요?`, [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: async () => { try { await deleteSchedule(item.calendarRecordId); await load(); } catch (error) { setMessage(getApiError(error)); } } },
  ]);

  const moveMonth = (offset: number) => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + offset, 1));

  return (
    <Screen>
      <View style={styles.heading}><Text style={styles.eyebrow}>SCHEDULE</Text><Text style={styles.title}>일정 관리</Text></View>
      <View style={styles.monthRow}>
        <Pressable onPress={() => moveMonth(-1)}><Text style={styles.arrow}>‹</Text></Pressable>
        <Text style={styles.month}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text>
        <Pressable onPress={() => moveMonth(1)}><Text style={styles.arrow}>›</Text></Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>새 일정</Text>
        <TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="일정 내용" maxLength={200} />
        <View style={styles.row}><TextInput style={[styles.input, styles.flex]} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" /><TextInput style={[styles.input, styles.time]} value={time} onChangeText={setTime} placeholder="HH:mm" /></View>
        <View style={styles.importantRow}><Text style={styles.label}>중요 일정</Text><Switch value={important} onValueChange={setImportant} trackColor={{ true: colors.primary }} /></View>
        <Pressable style={[styles.button, isSaving && styles.disabled]} disabled={isSaving} onPress={() => void save()}><Text style={styles.buttonText}>{isSaving ? '등록 중...' : '일정 등록'}</Text></Pressable>
      </View>
      {message ? <MessageBox message={message} /> : null}
      <View style={styles.list}>
        {items.length === 0 ? <MessageBox message="이 달에 등록된 일정이 없습니다." /> : [...items].sort((a, b) => a.targetDate.localeCompare(b.targetDate)).map((item) => (
          <Pressable key={item.calendarRecordId} style={[styles.item, item.isImportant && styles.important]} onLongPress={() => remove(item)}>
            <Text style={styles.itemDate}>{item.targetDate.slice(5, 10)} · {item.targetDate.slice(11, 16)}</Text>
            <Text style={styles.itemContent}>{item.isImportant ? '★ ' : ''}{item.content}</Text>
            <Text style={styles.deleteHint}>길게 눌러 삭제</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { paddingVertical: 10, gap: 7 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 18 },
  month: { color: colors.text, fontSize: 17, fontWeight: '800' }, arrow: { color: colors.primary, fontSize: 34, padding: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 11 }, cardTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 11, padding: 13, color: colors.text }, row: { flexDirection: 'row', gap: 9 }, flex: { flex: 1 }, time: { width: 90 },
  importantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { color: colors.text, fontWeight: '700' },
  button: { minHeight: 49, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFF', fontWeight: '800' }, disabled: { opacity: 0.55 },
  list: { gap: 9 }, item: { backgroundColor: colors.surface, borderRadius: 14, padding: 15, borderLeftWidth: 4, borderLeftColor: colors.border }, important: { borderLeftColor: '#F79009' },
  itemDate: { color: colors.primary, fontSize: 12, fontWeight: '800' }, itemContent: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 5 }, deleteHint: { color: colors.muted, fontSize: 10, marginTop: 7 },
});
