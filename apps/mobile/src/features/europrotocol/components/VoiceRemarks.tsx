import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { tokens } from '../../../theme/colors';
import { uploadEuroAudio, transcribeEuroRemarks } from '../../../api/europrotocol';

type Phase = 'idle' | 'recording' | 'processing';

function MicIcon({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Запись голосового «Изоҳ»: запись → загрузка в MinIO → транскрипция+нормализация (Gemini).
// Результат отдаётся наверх; текст остаётся редактируемым в поле ниже.
export function VoiceRemarks({
  audioAttached,
  onResult,
}: {
  audioAttached: boolean;
  onResult: (r: { normalized: string; transcript: string; audioKey: string }) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const [phase, setPhase] = useState<Phase>('idle');
  const [secs, setSecs] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const start = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Нет доступа к микрофону', 'Разрешите доступ к микрофону в настройках, чтобы записать замечание голосом.');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSecs(0);
      setPhase('recording');
      timer.current = setInterval(() => setSecs((v) => v + 1), 1000);
    } catch {
      Alert.alert('Ошибка', 'Не удалось начать запись.');
    }
  };

  const stop = async () => {
    if (timer.current) clearInterval(timer.current);
    setPhase('processing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('no uri');
      const media = await uploadEuroAudio(uri);
      const r = await transcribeEuroRemarks(media.key, media.contentType);
      onResult({ normalized: r.normalized || r.transcript, transcript: r.transcript, audioKey: media.key });
    } catch {
      Alert.alert('Не удалось распознать', 'Попробуйте записать ещё раз или введите замечание вручную.');
    } finally {
      setPhase('idle');
    }
  };

  // Пульсация индикатора записи через recState (isRecording) — простая точка.
  const recording = phase === 'recording' || recState.isRecording;

  if (phase === 'processing') {
    return (
      <View style={styles.processing}>
        <ActivityIndicator color={tokens.red} />
        <Text style={styles.processingText}>Распознаём голос…</Text>
      </View>
    );
  }

  if (recording) {
    return (
      <Pressable onPress={stop} style={[styles.bar, { backgroundColor: tokens.red }]}>
        <View style={styles.recDot} />
        <Text style={styles.recText}>Идёт запись · {mmss(secs)}</Text>
        <View style={styles.stopBtn}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Rect x={6} y={6} width={12} height={12} rx={2} fill="#fff" />
          </Svg>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={start} style={[styles.bar, { backgroundColor: tokens.inkDark }]}>
      <MicIcon />
      <Text style={styles.idleText}>{audioAttached ? 'Записать заново голосом' : 'Записать голосом (узб/рус)'}</Text>
      {audioAttached ? <Text style={styles.attached}>🎙 прикреплено</Text> : null}
    </Pressable>
  );
}

const styles = {
  bar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  idleText: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' },
  attached: { fontFamily: 'Manrope_500Medium', fontSize: 11.5, color: 'rgba(255,255,255,0.7)' },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  recText: { flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' },
  stopBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: 'rgba(255,255,255,0.2)' },
  processing: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.hairline,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  processingText: { fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: tokens.inkMuted },
};
