import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { tokens } from '../../../theme/colors';
import { uploadEuroAudio, transcribeEuroRemarks } from '../../../api/europrotocol';

type Phase = 'idle' | 'recording' | 'recorded' | 'processing' | 'done';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function MicIcon({ color = '#fff', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Запись голосового «Изоҳ». Флоу: запись → (послушать / перезаписать) → «Распознать»
// → распознано: можно снова послушать или перезаписать (с подтверждением).
// Загрузка в MinIO + транскрипция (Gemini) — только по кнопке «Распознать».
export function VoiceRemarks({
  audioAttached,
  onResult,
  maxReRecords = 3,
}: {
  audioAttached: boolean;
  onResult: (r: { normalized: string; transcript: string; audioKey: string }) => void;
  maxReRecords?: number; // лимит перезаписей — защита от лишних запросов к ИИ
}) {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);
  const player = useAudioPlayer();
  const playStatus = useAudioPlayerStatus(player);

  const [phase, setPhase] = useState<Phase>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [reRecords, setReRecords] = useState(0);
  const [secs, setSecs] = useState(0);
  const canReRecord = reRecords < maxReRecords;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => () => clearTimer(), []);

  const start = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('euroDocs.voice.micDeniedTitle'), t('euroDocs.voice.micDeniedMsg'));
        return;
      }
      if (playStatus.playing) player.pause();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSecs(0);
      setPhase('recording');
      clearTimer();
      timer.current = setInterval(() => setSecs((v) => v + 1), 1000);
    } catch {
      Alert.alert(t('euroDocs.common.error'), t('euroDocs.voice.startFailMsg'));
    }
  };

  const stopRecording = async () => {
    clearTimer();
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('no uri');
      player.replace({ uri });
      setAudioUri(uri);
      setPhase('recorded');
    } catch {
      Alert.alert(t('euroDocs.common.error'), t('euroDocs.voice.saveFailMsg'));
      setPhase('idle');
    }
  };

  const togglePlay = () => {
    if (playStatus.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  // Перезаписать — с подтверждением (удаляет текущую запись). Лимит перезаписей.
  const confirmReRecord = () => {
    if (!canReRecord) return;
    Alert.alert(t('euroDocs.voice.reRecordTitle'), t('euroDocs.voice.reRecordMsg', { left: maxReRecords - reRecords }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('euroDocs.voice.reRecord'),
        style: 'destructive',
        onPress: () => {
          setReRecords((n) => n + 1);
          void start();
        },
      },
    ]);
  };

  const process = async () => {
    if (!audioUri) return;
    if (playStatus.playing) player.pause();
    setPhase('processing');
    try {
      const media = await uploadEuroAudio(audioUri);
      const r = await transcribeEuroRemarks(media.key, media.contentType);
      onResult({ normalized: r.normalized || r.transcript, transcript: r.transcript, audioKey: media.key });
      setPhase('done'); // запись оставляем — чтобы можно было переслушать
    } catch {
      Alert.alert(t('euroDocs.voice.recognizeFailTitle'), t('euroDocs.voice.recognizeFailMsg'));
      setPhase('recorded');
    }
  };

  // Кнопка «Послушать / Пауза».
  const PlayBtn = () => (
    <Pressable onPress={togglePlay} hitSlop={6} style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.inkDark }}>
      {playStatus.playing ? (
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Rect x={6} y={5} width={4} height={14} rx={1} fill="#fff" />
          <Rect x={14} y={5} width={4} height={14} rx={1} fill="#fff" />
        </Svg>
      ) : (
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Path d="M7 5l12 7-12 7V5z" fill="#fff" />
        </Svg>
      )}
    </Pressable>
  );

  const ReRecordBtn = () => (
    <Pressable
      onPress={canReRecord ? confirmReRecord : undefined}
      disabled={!canReRecord}
      hitSlop={6}
      style={{ paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.06)', opacity: canReRecord ? 1 : 0.4 }}
    >
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: tokens.inkDark }}>
        {canReRecord ? t('euroDocs.voice.reRecord') : t('euroDocs.voice.reRecordLimit')}
      </Text>
    </Pressable>
  );

  // ── Распознаём ──
  if (phase === 'processing') {
    return (
      <View style={row(tokens.hairline, 'rgba(255,255,255,0.5)')}>
        <ActivityIndicator color={tokens.red} />
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: tokens.inkMuted }}>{t('euroDocs.voice.processing')}</Text>
      </View>
    );
  }

  // ── Идёт запись ──
  if (phase === 'recording' || recState.isRecording) {
    return (
      <Pressable onPress={stopRecording} style={bar(tokens.red)}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />
        <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' }}>{t('euroDocs.voice.recordingTime', { time: mmss(secs) })}</Text>
        <View style={{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Rect x={6} y={6} width={12} height={12} rx={2} fill="#fff" />
          </Svg>
        </View>
      </Pressable>
    );
  }

  // ── Запись готова (ещё не распознана): послушать / перезаписать / распознать ──
  if (phase === 'recorded') {
    return (
      <View style={{ gap: 8 }}>
        <View style={row(tokens.hairline, 'rgba(255,255,255,0.5)')}>
          <PlayBtn />
          <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>
            {playStatus.playing ? t('euroDocs.voice.playing') : t('euroDocs.voice.recordedHint')}
          </Text>
          <ReRecordBtn />
        </View>
        <Pressable onPress={process} style={bar(tokens.red)}>
          <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope_700Bold', fontSize: 14, color: '#fff' }}>{t('euroDocs.voice.recognize')}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Распознано: две кнопки — послушать и перезаписать (с подтверждением) ──
  if (phase === 'done') {
    return (
      <View style={row('rgba(22,163,74,0.35)', 'rgba(22,163,74,0.08)')}>
        <PlayBtn />
        <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.inkDark }}>
          {playStatus.playing ? t('euroDocs.voice.playing') : t('euroDocs.voice.doneOk')}
        </Text>
        <ReRecordBtn />
      </View>
    );
  }

  // ── idle ──
  return (
    <Pressable onPress={start} style={bar(tokens.inkDark)}>
      <MicIcon />
      <Text style={{ flex: 1, fontFamily: 'Manrope_600SemiBold', fontSize: 13.5, color: '#fff' }}>
        {audioAttached ? t('euroDocs.voice.startAgain') : t('euroDocs.voice.startIdle')}
      </Text>
      {audioAttached ? <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>{t('euroDocs.voice.attached')}</Text> : null}
    </Pressable>
  );
}

const bar = (bg: string) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  minHeight: 46,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 14,
  backgroundColor: bg,
});

const row = (border: string, bg: string) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 10,
  minHeight: 46,
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: border,
  backgroundColor: bg,
});
