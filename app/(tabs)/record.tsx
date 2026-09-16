import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getExercises, getRecentWeights, saveExercise, saveWeight } from '../../src/api/exerciseApi';
import { MessageBox } from '../../src/components/Feedback';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/constants/theme';
import type { ExerciseResponse, WeightResponse } from '../../src/types/exercise';
import { getApiError } from '../../src/utils/getApiError';

interface WeightForm {
  weight: string;
  bodyFat: string;
}

const BODY_PARTS = ['가슴', '등', '어깨', '팔', '하체', '복근', '유산소'];

export default function RecordScreen() {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WeightForm>({
    defaultValues: { weight: '', bodyFat: '' },
  });
  const [recent, setRecent] = useState<WeightResponse[]>([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [exercises, setExercises] = useState<ExerciseResponse[]>([]);
  const [duration, setDuration] = useState('');
  const [exerciseWeight, setExerciseWeight] = useState('');
  const [content, setContent] = useState('');
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [isExerciseSaving, setIsExerciseSaving] = useState(false);

  const loadRecent = useCallback(async () => {
    try {
      const records = await getRecentWeights();
      setRecent(records.slice(0, 5));
    } catch {
      // 최근 목록 실패는 기록 폼 사용을 막지 않는다.
    }
  }, []);

  useEffect(() => { void loadRecent(); }, [loadRecent]);
  useEffect(() => { getExercises().then((items) => setExercises(items.slice(0, 5))).catch(() => undefined); }, []);

  const submitExercise = async () => {
    const minutes = Number(duration);
    const liftedWeight = exerciseWeight ? Number(exerciseWeight) : null;
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 1440 || bodyParts.length === 0 || (liftedWeight !== null && (!Number.isFinite(liftedWeight) || liftedWeight < 0))) {
      setIsError(true); setMessage('운동 부위와 올바른 운동 시간을 입력해주세요.'); return;
    }
    setIsExerciseSaving(true); setMessage('');
    try {
      const trimmedContent = content.trim();
      if (trimmedContent.length > 1000) {
        setIsError(true); setMessage('운동 메모는 1000자 이하로 입력해주세요.'); return;
      }
      const saved = await saveExercise({ bodyParts, duration: minutes, content: trimmedContent, weight: liftedWeight });
      setExercises((items) => [saved, ...items].slice(0, 5));
      setDuration(''); setExerciseWeight(''); setContent(''); setBodyParts([]);
      setIsError(false); setMessage('운동 기록을 저장했습니다.');
    } catch (requestError) { setIsError(true); setMessage(getApiError(requestError)); }
    finally { setIsExerciseSaving(false); }
  };

  const submit = async (values: WeightForm) => {
    setMessage('');
    const weight = Number(values.weight);
    const bodyFat = Number(values.bodyFat);
    try {
      await saveWeight({ weight, bodyFat });
      setIsError(false);
      setMessage('체중 기록을 저장했습니다. 웹 운동 페이지에서도 확인할 수 있습니다.');
      reset();
      await loadRecent();
    } catch (requestError) {
      setIsError(true);
      setMessage(getApiError(requestError));
    }
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>QUICK RECORD</Text>
        <Text style={styles.title}>오늘의 신체 기록</Text>
        <Text style={styles.subtitle}>간단히 기록하고 웹에서 변화 추이를 확인하세요.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>운동 내용 기록</Text>
        <Text style={styles.label}>운동 부위</Text>
        <View style={styles.chips}>{BODY_PARTS.map((part) => {
          const selected = bodyParts.includes(part);
          return <Pressable key={part} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setBodyParts((items) => selected ? items.filter((item) => item !== part) : [...items, part])}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{part}</Text></Pressable>;
        })}</View>
        <Text style={styles.label}>운동 시간 (분)</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="예: 40" />
        <Text style={styles.label}>운동 중량 (kg, 선택)</Text>
        <TextInput style={styles.input} value={exerciseWeight} onChangeText={setExerciseWeight} keyboardType="decimal-pad" placeholder="예: 20" />
        <Text style={styles.label}>운동 메모</Text>
        <TextInput style={[styles.input, styles.multiline]} value={content} onChangeText={setContent} maxLength={1000} multiline placeholder="세트 구성이나 오늘의 컨디션" />
        <Pressable style={[styles.button, isExerciseSaving && styles.disabled]} disabled={isExerciseSaving} onPress={() => void submitExercise()}><Text style={styles.buttonText}>{isExerciseSaving ? '저장 중...' : '운동 기록 저장'}</Text></Pressable>
        {exercises.map((item) => <View key={item.id} style={styles.exerciseRow}><Text style={styles.recordValue}>{item.bodyParts.join(', ')} · {item.duration}분</Text><Text style={styles.recordDate}>{item.content || '메모 없음'}</Text></View>)}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>체중 (kg)</Text>
        <Controller
          control={control}
          name="weight"
          rules={{
            required: '체중을 입력해주세요.',
            validate: (value) => {
              const parsed = Number(value);
              return (Number.isFinite(parsed) && parsed > 0 && parsed <= 500) || '0보다 크고 500 이하의 숫자를 입력해주세요.';
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="예: 70.5" />
          )}
        />
        {errors.weight ? <Text style={styles.error}>{errors.weight.message}</Text> : null}

        <Text style={styles.label}>체지방률 (%)</Text>
        <Controller
          control={control}
          name="bodyFat"
          rules={{
            required: '체지방률을 입력해주세요.',
            validate: (value) => {
              const parsed = Number(value);
              return (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) || '0에서 100 사이의 숫자를 입력해주세요.';
            },
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} keyboardType="decimal-pad" placeholder="예: 18.2" />
          )}
        />
        {errors.bodyFat ? <Text style={styles.error}>{errors.bodyFat.message}</Text> : null}

        <Pressable style={[styles.button, isSubmitting && styles.disabled]} disabled={isSubmitting} onPress={handleSubmit(submit)}>
          <Text style={styles.buttonText}>{isSubmitting ? '저장 중...' : '기록 저장'}</Text>
        </Pressable>
      </View>

      {message ? <MessageBox message={message} error={isError} /> : null}

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>최근 기록</Text>
        {recent.length === 0 ? <Text style={styles.empty}>표시할 기록이 없습니다.</Text> : recent.map((item) => (
          <View key={item.id} style={styles.recordRow}>
            <View>
              <Text style={styles.recordValue}>{item.weight} kg</Text>
              <Text style={styles.recordDate}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
            </View>
            <Text style={styles.bodyFat}>체지방 {item.bodyFat}%</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { paddingVertical: 10, gap: 7 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 25, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14 },
  card: { backgroundColor: colors.surface, padding: 20, borderRadius: 20, gap: 10 },
  label: { color: colors.text, fontWeight: '700', marginTop: 3 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.text, fontSize: 16 },
  error: { color: colors.danger, fontSize: 12 },
  button: { backgroundColor: colors.primary, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginTop: 8 },
  buttonText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.55 },
  listSection: { gap: 10 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
  empty: { color: colors.muted, paddingVertical: 18, textAlign: 'center' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  recordValue: { color: colors.text, fontSize: 17, fontWeight: '800' },
  recordDate: { color: colors.muted, marginTop: 4, fontSize: 12 },
  bodyFat: { color: colors.primary, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.muted, fontWeight: '700' },
  chipTextSelected: { color: '#FFF' },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  exerciseRow: { backgroundColor: colors.background, borderRadius: 11, padding: 12, gap: 3 },
});
