import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { createSchedule, deleteSchedule, getMonthlySchedules } from '../../src/api/calendarApi';
import { MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { useTheme, type ThemeColors, shadows } from '../../src/constants/theme';
import type { CalendarResponse } from '../../src/types/calendar';
import { getApiError } from '../../src/utils/getApiError';
import { getMonthCells, isValidDate, localDateKey } from '../../src/utils/calendar';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const today = localDateKey(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [items, setItems] = useState<CalendarResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [important, setImportant] = useState(false);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true); setLoadError('');
    try {
      const result = await getMonthlySchedules(month.getFullYear(), month.getMonth() + 1);
      if (id === requestId.current) setItems(result);
    } catch (error) {
      if (id === requestId.current) { setItems([]); setLoadError(getApiError(error)); }
    } finally { if (id === requestId.current) setIsLoading(false); }
  }, [month]);
  useFocusEffect(useCallback(() => { void load(); return () => { ++requestId.current; }; }, [load]));
  useEffect(() => { setItems([]); }, [month]);

  const chooseDate = (value: string) => { setSelectedDate(value); setDate(value); };
  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    if (next.getFullYear() < 1970 || next.getFullYear() > 9999) return;
    ++requestId.current;
    setMonth(next); chooseDate(localDateKey(next)); setMessage('');
  };
  const goToday = () => {
    const now = new Date();
    ++requestId.current;
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); chooseDate(localDateKey(now));
  };

  const save = async () => {
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
    if (!content.trim() || content.trim().length > 200 || !isValidDate(date)
      || !timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) {
      setMessage('일정 내용과 날짜(YYYY-MM-DD), 시간(HH:mm)을 확인해주세요.'); return;
    }
    setIsSaving(true); setMessage('');
    try {
      await createSchedule({ content: content.trim(), targetDate: `${date}T${time}:00`, isImportant: important });
      setContent(''); setImportant(false); setShowForm(false); setMessage('일정을 등록했습니다.');
      setSelectedDate(date);
      const target = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, 1);
      if (target.getTime() === month.getTime()) await load();
      else setMonth(target);
    } catch (error) { setMessage(getApiError(error)); }
    finally { setIsSaving(false); }
  };
  const remove = (item: CalendarResponse) => Alert.alert('일정 삭제', `'${item.content}' 일정을 삭제할까요?`, [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: async () => {
      try {
        await deleteSchedule(item.calendarRecordId);
        setItems((current) => current.filter((event) => event.calendarRecordId !== item.calendarRecordId));
      }
      catch (error) { setMessage(getApiError(error)); }
    } },
  ]);

  const cells = getMonthCells(month);
  const daysWithEvents = new Map<string, CalendarResponse[]>();
  for (const item of items) {
    const key = item.targetDate.slice(0, 10);
    daysWithEvents.set(key, [...(daysWithEvents.get(key) ?? []), item]);
  }
  const selectedItems = [...(daysWithEvents.get(selectedDate) ?? [])].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  return <Screen refreshing={isLoading} onRefresh={() => void load()}>
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>SCHEDULE</Text><Text style={styles.title}>일정 관리</Text>
      <Text style={styles.subtitle}>한 달을 살펴보고 날짜를 눌러 일정을 확인해요.</Text>
    </View>
    <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <Pressable style={styles.arrowButton} disabled={isSaving} onPress={() => moveMonth(-1)} accessibilityLabel="이전 달"><Ionicons name="chevron-back" color={colors.primary} size={22} /></Pressable>
        <Text style={styles.month}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text>
        <Pressable style={styles.arrowButton} disabled={isSaving} onPress={() => moveMonth(1)} accessibilityLabel="다음 달"><Ionicons name="chevron-forward" color={colors.primary} size={22} /></Pressable>
      </View>
      <View style={styles.weekRow}>{['일', '월', '화', '수', '목', '금', '토'].map((day, index) => <Text key={day} style={[styles.weekLabel, index === 0 && styles.sunday, index === 6 && styles.saturday]}>{day}</Text>)}</View>
      {Array.from({ length: cells.length / 7 }, (_, week) => <View key={week} style={styles.weekRow}>
        {cells.slice(week * 7, week * 7 + 7).map((key, weekday) => {
          if (!key) return <View key={`blank-${weekday}`} style={styles.dayCell} />;
          const events = daysWithEvents.get(key) ?? [];
          const selected = selectedDate === key;
          return <Pressable key={key} style={[styles.dayCell, key === today && styles.todayCell, selected && styles.selectedCell]} disabled={isSaving} onPress={() => chooseDate(key)} accessibilityRole="button" accessibilityLabel={`${key}, ${events.length}개 일정${key === today ? ', 오늘' : ''}`} accessibilityState={{ selected, disabled: isSaving }}>
            <Text style={[styles.dayNumber, weekday === 0 && styles.sunday, weekday === 6 && styles.saturday, selected && styles.selectedText]}>{Number(key.slice(8))}</Text>
            <View style={styles.dots}>{events.slice(0, 3).map((event) => <View key={event.calendarRecordId} style={[styles.eventDot, { backgroundColor: selected ? '#FFFFFF' : event.isImportant ? colors.warning : colors.primary }]} />)}</View>
          </Pressable>;
        })}
      </View>)}
      <View style={styles.calendarFooter}><Text style={styles.hint}>{isLoading ? '일정 불러오는 중…' : `이번 달 ${items.length}개 일정 · 노란 점은 중요 일정`}</Text><Pressable style={styles.todayButton} onPress={goToday} disabled={isSaving}><Text style={styles.todayText}>오늘</Text></Pressable></View>
    </View>
    {loadError ? <MessageBox message={loadError} error /> : null}
    {message ? <MessageBox message={message} /> : null}
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>{Number(selectedDate.slice(5, 7))}월 {Number(selectedDate.slice(8))}일 일정</Text><Text style={styles.hint}>{selectedDate === today ? '오늘' : selectedDate} · {selectedItems.length}개</Text></View><Pressable style={styles.addButton} disabled={isSaving} onPress={() => { setDate(selectedDate); setShowForm(!showForm); }} accessibilityLabel={showForm ? '일정 입력 닫기' : '선택한 날짜에 일정 추가'}><Ionicons name={showForm ? 'close' : 'add'} color="#FFFFFF" size={22} /></Pressable></View>
    {!isLoading && !loadError && selectedItems.length === 0 ? <MessageBox message="선택한 날짜에 일정이 없습니다. + 버튼으로 추가해보세요." /> : null}
    {selectedItems.map((item) => <View key={item.calendarRecordId} style={[styles.item, item.isImportant && styles.important]}>
      <View style={styles.itemTop}><Text style={styles.itemTime}>{item.targetDate.slice(11, 16)}</Text>{item.isImportant ? <Text style={styles.importantLabel}>중요</Text> : null}<Pressable style={styles.deleteButton} onPress={() => remove(item)} accessibilityLabel={`${item.content} 일정 삭제`}><Ionicons name="trash-outline" color={colors.muted} size={18} /></Pressable></View>
      <Text style={styles.itemContent}>{item.content}</Text>
    </View>)}
    {showForm ? <View style={styles.card}>
      <Text style={styles.sectionTitle}>새 일정</Text>
      <Text style={styles.inputLabel}>일정 내용</Text><TextInput style={styles.input} value={content} onChangeText={setContent} placeholder="무엇을 할 예정인가요?" placeholderTextColor={colors.muted} maxLength={200} editable={!isSaving} />
      <Text style={styles.inputLabel}>날짜</Text><TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} editable={!isSaving} />
      <Text style={styles.inputLabel}>시간</Text><TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:mm" placeholderTextColor={colors.muted} editable={!isSaving} />
      <View style={styles.importantRow}><Text style={styles.label}>중요 일정</Text><Switch value={important} onValueChange={setImportant} disabled={isSaving} trackColor={{ false: colors.border, true: colors.primaryDark }} /></View>
      <Pressable style={[styles.button, isSaving && styles.disabled]} disabled={isSaving} onPress={() => void save()}><Text style={styles.buttonText}>{isSaving ? '등록 중...' : '일정 등록'}</Text></Pressable>
    </View> : null}
  </Screen>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  heading: { paddingTop: 6, gap: 7 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 27, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  calendar: { backgroundColor: colors.surface, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, month: { color: colors.text, fontSize: 18, fontWeight: '900' }, arrowButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  weekRow: { flexDirection: 'row' }, weekLabel: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: 12, fontWeight: '700', paddingBottom: 10 },
  dayCell: { flex: 1, minHeight: 46, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginVertical: 2, borderWidth: 1, borderColor: 'transparent' }, dayNumber: { color: colors.text, fontSize: 14, fontWeight: '700' }, todayCell: { borderColor: colors.primary }, selectedCell: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }, selectedText: { color: '#FFFFFF' }, sunday: { color: colors.danger }, saturday: { color: colors.primary },
  dots: { flexDirection: 'row', height: 9, alignItems: 'center', gap: 3, marginTop: 3 }, eventDot: { width: 4, height: 4, borderRadius: 2 },
  calendarFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }, hint: { flexShrink: 1, color: colors.muted, fontSize: 11, lineHeight: 18 }, todayButton: { paddingHorizontal: 12, minHeight: 36, justifyContent: 'center', borderRadius: 10, backgroundColor: colors.primarySoft }, todayText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, addButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primaryDark },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 11, borderWidth: 1, borderColor: colors.border }, inputLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' }, input: { minHeight: 50, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 13, paddingHorizontal: 14, color: colors.text, fontSize: 15 }, importantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { color: colors.text, fontWeight: '700' },
  button: { minHeight: 49, backgroundColor: colors.primaryDark, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, buttonText: { color: '#FFFFFF', fontWeight: '800' }, disabled: { opacity: 0.55 },
  item: { backgroundColor: colors.surface, borderRadius: 17, padding: 16, borderWidth: 1, borderColor: colors.border }, important: { borderColor: colors.warningBorder, backgroundColor: colors.warningSoft }, itemTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, itemTime: { color: colors.primary, fontSize: 14, fontWeight: '800' }, importantLabel: { color: colors.warning, fontSize: 11, fontWeight: '800' }, deleteButton: { marginLeft: 'auto', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, itemContent: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
});
