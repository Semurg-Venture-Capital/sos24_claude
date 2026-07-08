import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import ViewShot from 'react-native-view-shot';
import Svg, { Circle, Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarTop } from '../components/CarTop';
import { tokens } from '../../../theme/colors';
import { useEuroStore } from '../store';
import type { EuroStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<EuroStackParamList, 'EuroSchemeMap'>;

const AnimatedLine = Animated.createAnimatedComponent(Line);

// Центр карты по умолчанию (Ташкент), если на шаге 1 не определились координаты.
const DEFAULT = { latitude: 41.311081, longitude: 69.240562 };

// Пропорция блока «15. Схема ДТП» в PDF (col-c 41.6mm × 24mm) — снимок делаем под неё,
// чтобы он полностью заполнял рамку без полей.
const SCHEME_ASPECT = 41.6 / 24;

type Tool = 'A' | 'B';

// Курс (deg) машины, чтобы её «нос» (вверх) смотрел из точки from в точку to.
function heading(from: { x: number; y: number }, to: { x: number; y: number }): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return 0;
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
}

// Перетаскиваемый узел поверх карты. Абсолютная позиция и границы — в refs (PanResponder
// создаётся один раз и должен читать СВЕЖИЕ значения). onEnd зовётся после отпускания.
function useDraggable(onSelect: () => void, onEnd: () => void) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pos = useRef({ x: 0, y: 0 });
  const bounds = useRef({ w: 0, h: 0 });
  const setPos = (x: number, y: number) => {
    pos.current = { x, y };
    pan.setOffset({ x: 0, y: 0 });
    pan.setValue({ x, y });
  };
  const setBounds = (w: number, h: number) => {
    bounds.current = { w, h };
  };
  const getPos = () => pos.current;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        onSelect();
        pan.setOffset({ x: pos.current.x, y: pos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const x = Math.max(0, Math.min(bounds.current.w, pos.current.x + g.dx));
        const y = Math.max(0, Math.min(bounds.current.h, pos.current.y + g.dy));
        pos.current = { x, y };
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x, y });
        onEnd();
      },
    }),
  ).current;
  return { pan, responder, setPos, setBounds, getPos };
}

// Полноэкранный редактор схемы ДТП: карта + по 2 точки на авто (старт-призрак → финиш-удар)
// со стрелкой направления. «Готово» снимает карту с машинами и сохраняет рисунок в стор.
export function EuroSchemeMapScreen() {
  const nav = useNavigation<Nav>();
  const s = useEuroStore();
  const mapRef = useRef<MapView>(null);
  const shotRef = useRef<ViewShot>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>('A');
  const [rotA, setRotA] = useState(0); // поворот финиша А (ручная доводка)
  const [rotB, setRotB] = useState(0);
  const [ghostA, setGhostA] = useState(0); // поворот старта А (авто по стрелке)
  const [ghostB, setGhostB] = useState(0);
  const [mapShot, setMapShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapLoaded = useRef<(() => void) | null>(null);

  const center = s.lat != null && s.lng != null ? { latitude: s.lat, longitude: s.lng } : DEFAULT;
  const initialRegion = { ...center, latitudeDelta: 0.002, longitudeDelta: 0.002 };
  const regionRef = useRef(initialRegion);
  const clampingRef = useRef(false);
  type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  // Во время жеста только запоминаем регион (нужен для снимка). НЕ трогаем карту здесь —
  // иначе animateToRegion борется с активным жестом и панорама зависает.
  const onRegionChange = (r: Region) => {
    regionRef.current = r;
  };
  // Ограничиваем зум-аут ТОЛЬКО после завершения жеста, с допуском (дельты «дрожат» при
  // панораме из-за смены широты) и защитой от повторного входа (animate → снова complete).
  const onRegionSettled = (r: Region) => {
    regionRef.current = r;
    if (mapShot || clampingRef.current) return;
    const maxLat = initialRegion.latitudeDelta * 1.15;
    const maxLng = initialRegion.longitudeDelta * 1.15;
    if (r.latitudeDelta > maxLat || r.longitudeDelta > maxLng) {
      const target = { ...r, latitudeDelta: initialRegion.latitudeDelta, longitudeDelta: initialRegion.longitudeDelta };
      regionRef.current = target;
      clampingRef.current = true;
      mapRef.current?.animateToRegion(target, 150);
      setTimeout(() => {
        clampingRef.current = false;
      }, 300);
    }
  };

  // 4 узла: старт (призрак) и финиш (удар) для каждой машины.
  const recomputeRef = useRef<() => void>(() => {});
  const aStart = useDraggable(() => setTool('A'), () => recomputeRef.current());
  const aEnd = useDraggable(() => setTool('A'), () => recomputeRef.current());
  const bStart = useDraggable(() => setTool('B'), () => recomputeRef.current());
  const bEnd = useDraggable(() => setTool('B'), () => recomputeRef.current());
  // Призрак (старт) смотрит по направлению движения старт→финиш.
  recomputeRef.current = () => {
    setGhostA(heading(aStart.getPos(), aEnd.getPos()));
    setGhostB(heading(bStart.getPos(), bEnd.getPos()));
  };
  const placed = useRef(false);

  const onLayout = (w: number, h: number) => {
    if (placed.current || w === 0) return;
    placed.current = true;
    setSize({ w, h });
    for (const d of [aStart, aEnd, bStart, bEnd]) d.setBounds(w, h);
    // А едет из верх-лево к центру, В — из низ-право к центру; финиши сходятся по центру.
    aStart.setPos(w * 0.18, h * 0.22);
    aEnd.setPos(w * 0.45, h * 0.5);
    bStart.setPos(w * 0.82, h * 0.8);
    bEnd.setPos(w * 0.55, h * 0.5);
    recomputeRef.current();
  };

  const rotate = (delta: number) => {
    if (tool === 'A') setRotA((d) => (d + delta + 360) % 360);
    else setRotB((d) => (d + delta + 360) % 360);
  };

  const done = async () => {
    if (!mapRef.current || busy) return;
    setBusy(true);
    try {
      // Снимок карты (тайлы). Регион = текущий, поэтому машины совпадают с экраном (WYSIWYG).
      const shot = await mapRef.current.takeSnapshot({
        width: size.w,
        height: size.h,
        region: regionRef.current,
        format: 'png',
        result: 'file',
      });
      const uri = shot.startsWith('file://') || shot.startsWith('http') ? shot : `file://${shot}`;
      // Ждём прорисовки статичной картинки карты (onLoad), затем снимаем контейнер с машинами.
      await new Promise<void>((resolve) => {
        mapLoaded.current = resolve;
        setMapShot(uri);
        setTimeout(resolve, 1500);
      });
      await new Promise((r) => setTimeout(r, 80));
      const out = await shotRef.current?.capture?.();
      if (!out) throw new Error('capture failed');
      s.setSchemeImage(out);
      nav.goBack();
    } catch {
      Alert.alert('Не получилось', 'Не удалось снять схему. Попробуйте ещё раз.');
      setMapShot(null);
    } finally {
      mapLoaded.current = null;
      setBusy(false);
    }
  };

  // Центрирует карту на реальном текущем местоположении устройства (запрашивает доступ при
  // необходимости). Нужно, когда GPS с шага 1 неточный/пустой и карта открылась не там.
  const goToMyLocation = async () => {
    if (locating || capturing) return;
    setLocating(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'undetermined') {
        status = (await Location.requestForegroundPermissionsAsync()).status;
      }
      if (status !== 'granted') {
        Alert.alert(
          'Нет доступа к геолокации',
          'Разрешите доступ к местоположению, чтобы отметить место ДТП на карте.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Открыть Настройки', onPress: () => void Linking.openURL('app-settings:') },
          ],
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const region = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: initialRegion.latitudeDelta,
        longitudeDelta: initialRegion.longitudeDelta,
      };
      regionRef.current = region;
      mapRef.current?.animateToRegion(region, 500);
    } catch {
      Alert.alert('Ошибка', 'Не удалось определить местоположение. Попробуйте ещё раз.');
    } finally {
      setLocating(false);
    }
  };

  const capturing = !!mapShot;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.inkDark }} edges={['top']}>
      {/* Заголовок */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 18, color: '#fff' }}>Схема ДТП</Text>
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          Прозрачная машина — откуда ехали, сплошная — место удара. Стрелка показывает направление.
        </Text>
      </View>

      {/* Предупреждение о точности */}
      <View
        style={{
          marginHorizontal: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          backgroundColor: 'rgba(230,20,40,0.16)',
          borderWidth: 1,
          borderColor: 'rgba(230,20,40,0.5)',
        }}
      >
        <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: '#fff', lineHeight: 17 }}>
          ⚠️ Укажите место ДТП и положение машин точно. При неверных данных страховая компания может отказать в выплате.
        </Text>
      </View>

      {/* Карта + машины (всё внутри ViewShot). Область — под пропорцию блока 15 PDF (≈1.73:1). */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 12 }}>
        <View style={{ width: '100%', aspectRatio: SCHEME_ASPECT, borderRadius: 20, overflow: 'hidden' }}>
          <ViewShot ref={shotRef} style={{ flex: 1 }} options={{ format: 'png', quality: 1 }}>
            <View
              style={{ flex: 1, backgroundColor: '#fff' }}
              onLayout={(e) => onLayout(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}
            >
              <MapView
                ref={mapRef}
                style={[{ flex: 1 }, capturing ? { opacity: 0 } : null]}
                initialRegion={initialRegion}
                onMapReady={() => setReady(true)}
                onRegionChange={onRegionChange}
                onRegionChangeComplete={onRegionSettled}
                minZoomLevel={16}
                scrollEnabled={!capturing}
                zoomEnabled={!capturing}
                rotateEnabled={false}
                pitchEnabled={false}
              />

              {capturing ? (
                <Image
                  source={{ uri: mapShot! }}
                  style={{ position: 'absolute', width: size.w, height: size.h }}
                  onLoad={() => mapLoaded.current?.()}
                  onError={() => mapLoaded.current?.()}
                />
              ) : null}

              {/* Стрелки направления (старт → финиш), под машинами */}
              {size.w > 0 ? (
                <Svg style={{ position: 'absolute' }} width={size.w} height={size.h} pointerEvents="none">
                  <AnimatedLine
                    x1={aStart.pan.x}
                    y1={aStart.pan.y}
                    x2={aEnd.pan.x}
                    y2={aEnd.pan.y}
                    stroke={tokens.red}
                    strokeWidth={2.5}
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                  />
                  <AnimatedLine
                    x1={bStart.pan.x}
                    y1={bStart.pan.y}
                    x2={bEnd.pan.x}
                    y2={bEnd.pan.y}
                    stroke="#1f2430"
                    strokeWidth={2.5}
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                  />
                </Svg>
              ) : null}

              {/* Машины: по 2 точки. Старт — призрак (по стрелке), финиш — сплошной (ручной поворот) */}
              {size.w > 0 ? (
                <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
                  <DragCar drag={aStart} side="A" rot={ghostA} ghost />
                  <DragCar drag={bStart} side="B" rot={ghostB} ghost />
                  <DragCar drag={aEnd} side="A" rot={rotA} selected={tool === 'A' && !capturing} />
                  <DragCar drag={bEnd} side="B" rot={rotB} selected={tool === 'B' && !capturing} />
                </View>
              ) : null}

              {!ready ? (
                <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={tokens.red} />
                </View>
              ) : null}
            </View>
          </ViewShot>

          {/* Кнопка «моё местоположение» — вне ViewShot, в PDF-снимок не попадает */}
          {!capturing ? (
            <Pressable
              onPress={goToMyLocation}
              disabled={locating}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.95)',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              {locating ? <ActivityIndicator size="small" color={tokens.inkDark} /> : <LocateIcon />}
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Панель инструментов */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ToolTab label="Машина А" active={tool === 'A'} dot={tokens.red} onPress={() => setTool('A')} />
          <ToolTab label="Машина В" active={tool === 'B'} dot="#1f2430" onPress={() => setTool('B')} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Text style={{ flex: 1, fontFamily: 'Manrope_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 16 }}>
            Перетащите обе точки. Доверните машину «{tool}» в положение после удара:
          </Text>
          <RoundBtn label="↺ 15°" onPress={() => rotate(-15)} />
          <RoundBtn label="15° ↻" onPress={() => rotate(15)} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => nav.goBack()}
            style={{ flex: 1, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 15, color: '#fff' }}>Отмена</Text>
          </Pressable>
          <Pressable
            onPress={done}
            disabled={busy || !ready}
            style={{ flex: 1.4, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.red, opacity: busy || !ready ? 0.6 : 1 }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 15, color: '#fff' }}>Готово</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Машина-оверлей. Внешняя Animated.View двигает (translate), внутренняя — поворачивает.
// ghost=true → полупрозрачная (точка старта).
function DragCar({
  drag,
  side,
  rot,
  selected,
  ghost,
}: {
  drag: ReturnType<typeof useDraggable>;
  side: 'A' | 'B';
  rot: number;
  selected?: boolean;
  ghost?: boolean;
}) {
  return (
    <Animated.View
      {...drag.responder.panHandlers}
      style={{ position: 'absolute', transform: drag.pan.getTranslateTransform(), marginLeft: -16, marginTop: -25, opacity: ghost ? 0.4 : 1 }}
    >
      <View
        style={{
          transform: [{ rotate: `${rot}deg` }],
          borderRadius: 11,
          padding: 2,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? '#fff' : 'transparent',
        }}
      >
        <CarTop side={side} size={50} />
      </View>
    </Animated.View>
  );
}

// Иконка-«прицел» для кнопки центрирования на текущей геопозиции.
function LocateIcon() {
  const c = tokens.inkDark;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={6} stroke={c} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={1.8} fill={c} />
      <Line x1={12} y1={1.5} x2={12} y2={5} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={19} x2={12} y2={22.5} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={1.5} y1={12} x2={5} y2={12} stroke={c} strokeWidth={2} strokeLinecap="round" />
      <Line x1={19} y1={12} x2={22.5} y2={12} stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ToolTab({ label, active, dot, onPress }: { label: string; active: boolean; dot: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 40,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.12)',
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, color: active ? tokens.inkDark : '#fff' }}>{label}</Text>
    </Pressable>
  );
}

function RoundBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ height: 40, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }}
    >
      <Text style={{ fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}
