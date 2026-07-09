import { create } from 'zustand';
import type { TechPassportInfo } from '../../api/vehicles';
import type { EuroParticipant } from '../../api/europrotocol';

// Состояние визарда европротокола (M9.3). Накапливается между шагами,
// сбрасывается при старте нового оформления (reset).

// 5 условий применимости европротокола (УЗ). Медосвидетельствование (4 ч) —
// это последующее действие, не скрининг, поэтому здесь не гейтится.
export interface EuroScreening {
  twoVehicles: boolean; // ровно 2 ТС
  noInjured: boolean; // нет пострадавших и погибших
  noThirdParty: boolean; // нет ущерба имуществу третьих лиц
  agree: boolean; // оба согласны, один признаёт вину
  bothOsago: boolean; // у обоих действующий ОСАГО
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Текстовые поля второго участника (авто + полис) — для setOtherField.
type OtherTextField =
  | 'otherTpSeria'
  | 'otherTpNumber'
  | 'otherGov'
  | 'otherPolicySeria'
  | 'otherPolicyNumber'
  | 'otherPhone';

interface EuroState {
  // Шаг скрининга
  screening: EuroScreening;
  // Шаг 1 — обстоятельства (фиксируются автоматически, read-only в UI)
  date: string; // YYYY-MM-DD — момент оформления
  time: string; // HH:MM
  place: string; // адрес из геолокации
  lat?: number;
  lng?: number;
  vehicleCount: string; // фиксировано "2" для европротокола

  // Шаг 2 — участники
  // Сторона A — инициатор
  selfVerified: boolean; // прошёл шаг-ап MyID (присутствие подтверждено)
  myVehicleId?: string; // выбранное авто из гаража
  myPolicyId?: string; // выбранный ОСАГО-полис стороны A (по выбранному авто)
  // ВУ стороны A — заполняется в шаге 2, ТОЛЬКО если в профиле нет водительского.
  myDlSeria: string;
  myDlNumber: string;
  myDlCategories: string;
  myDlIssue: string; // YYYY-MM-DD

  // Сторона B — второй участник (MyID + НАПП)
  participant: EuroParticipant | null; // личность из MyID
  otherTpSeria: string; // серия техпаспорта
  otherTpNumber: string; // номер техпаспорта
  otherGov: string; // госномер
  otherVehicle: TechPassportInfo | null; // данные авто из НАПП
  otherPolicySeria: string;
  otherPolicyNumber: string;
  otherPolicyValid: boolean | null; // null = не проверяли
  otherPhone: string;

  // Шаг 3 — схема + описание
  schemeType: SchemeType | null;
  schemeImageUri: string | null; // локальный URI готового рисунка схемы (карта + машины), заливается на шаге 5
  description: string;

  // Шаг 4 — фотофиксация (только камера, антифрод). uri + метка времени.
  photos: Record<PhotoKey, EuroPhoto | null>;
  videos: EuroPhoto[]; // видео (доп. к фото)

  // --- Общая часть бланка (пп.4–6) ---
  medCheck: boolean | null; // медосвидетельствование пройдено
  witnesses: string; // свидетели (ФИО, телефон)
  officialRegistered: boolean | null; // оформлено сотрудником ГАИ
  officerBadgeNo: string; // № нагрудного знака (если оформлял сотрудник)

  // --- Обстоятельства ДТП (22 чекбокса на сторону) ---
  circumstancesA: boolean[];
  circumstancesB: boolean[];

  // --- Сторона A: доп. поля ---
  damagePartsA: string[]; // повреждённые детали (коды, мультивыбор по схеме)
  damageDescA: string; // доп. описание повреждений (свободный текст)
  objectionsA: string;
  impactZoneA: string[]; // зоны первого удара (коды, мультивыбор)
  ownershipDocA: string; // док. о праве владения (если водитель ≠ владелец)
  otherOwnershipDoc: string; // док. владения стороны B

  // --- Сторона B: ручной ввод (НАПП/MyID не покрывают) ---
  otherOwnerAddr: string;
  otherDlSeria: string;
  otherDlNumber: string;
  otherDlCategories: string;
  otherDlIssue: string; // YYYY-MM-DD
  otherInsurer: string;
  otherPolicyValidUntil: string; // YYYY-MM-DD
  damagePartsB: string[]; // повреждённые детали стороны B
  damageDescB: string;
  objectionsB: string;
  impactZoneB: string[]; // зоны первого удара стороны B (коды, мультивыбор)
  otherSigned: boolean; // сторона B подписала по OTP

  // --- Оборот (стр.2) ---
  driverRole: 'owner' | 'other' | null;
  canMove: boolean | null;
  cannotMovePlace: string;
  remarks: string;
  remarksAudioKey: string | null; // голос «Изоҳ» в MinIO
  remarksRaw: string | null; // сырой транскрипт (до правок пользователя)

  // Шаг 5 — отправка
  submittedNumber: string | null; // присвоенный № извещения после отправки

  patch: (p: Partial<EuroState>) => void;
  toggleCircumstance: (side: 'a' | 'b', index: number) => void;
  addVideo: (v: EuroPhoto) => void;
  removeVideo: (index: number) => void;
  setScreening: (key: keyof EuroScreening, value: boolean) => void;
  captureNow: () => void;
  setLocation: (place: string, lat?: number, lng?: number) => void;
  setMyVehicle: (id: string) => void;
  setSelfVerified: (v: boolean) => void;
  setParticipant: (p: EuroParticipant | null) => void;
  setOtherField: (key: OtherTextField, value: string) => void;
  setOtherVehicle: (v: TechPassportInfo | null) => void;
  setOtherPolicyValid: (v: boolean | null) => void;
  setScheme: (v: SchemeType) => void;
  setSchemeImage: (uri: string | null) => void;
  setDescription: (v: string) => void;
  setPhoto: (key: PhotoKey, photo: EuroPhoto | null) => void;
  setSubmittedNumber: (n: string) => void;
  reset: () => void;
}

// Тип схемы столкновения (готовые шаблоны).
export type SchemeType = 'rear' | 'front' | 'side';

// Слоты фотофиксации. overview/myCar/otherCar — обязательные, scene — опционально.
export type PhotoKey = 'overview' | 'myCar' | 'otherCar' | 'scene';
export interface EuroPhoto {
  uri: string;
  at: string; // время съёмки HH:MM
}
export const REQUIRED_PHOTOS: PhotoKey[] = ['overview', 'myCar', 'otherCar'];

const INITIAL = {
  screening: {
    twoVehicles: false,
    noInjured: false,
    noThirdParty: false,
    agree: false,
    bothOsago: false,
  } as EuroScreening,
  date: todayISO(),
  time: nowHHMM(),
  place: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  vehicleCount: '2',
  selfVerified: false,
  myVehicleId: undefined as string | undefined,
  myPolicyId: undefined as string | undefined,
  myDlSeria: '',
  myDlNumber: '',
  myDlCategories: '',
  myDlIssue: '',
  participant: null as EuroParticipant | null,
  otherTpSeria: '',
  otherTpNumber: '',
  otherGov: '',
  otherVehicle: null as TechPassportInfo | null,
  otherPolicySeria: '',
  otherPolicyNumber: '',
  otherPolicyValid: null as boolean | null,
  otherPhone: '',
  schemeType: null as SchemeType | null,
  schemeImageUri: null as string | null,
  description: '',
  photos: { overview: null, myCar: null, otherCar: null, scene: null } as Record<PhotoKey, EuroPhoto | null>,
  videos: [] as EuroPhoto[],
  medCheck: null as boolean | null,
  witnesses: '',
  officialRegistered: null as boolean | null,
  officerBadgeNo: '',
  circumstancesA: Array(22).fill(false) as boolean[],
  circumstancesB: Array(22).fill(false) as boolean[],
  damagePartsA: [] as string[],
  damageDescA: '',
  objectionsA: '',
  impactZoneA: [] as string[],
  ownershipDocA: '',
  otherOwnershipDoc: '',
  otherOwnerAddr: '',
  otherDlSeria: '',
  otherDlNumber: '',
  otherDlCategories: '',
  otherDlIssue: '',
  otherInsurer: '',
  otherPolicyValidUntil: '',
  damagePartsB: [] as string[],
  damageDescB: '',
  objectionsB: '',
  impactZoneB: [] as string[],
  otherSigned: false,
  driverRole: null as 'owner' | 'other' | null,
  canMove: null as boolean | null,
  cannotMovePlace: '',
  remarks: '',
  remarksAudioKey: null,
  remarksRaw: null,
  submittedNumber: null as string | null,
};

export const useEuroStore = create<EuroState>((set) => ({
  ...INITIAL,
  patch: (p) => set(p),
  toggleCircumstance: (side, index) =>
    set((st) => {
      const arr = [...(side === 'a' ? st.circumstancesA : st.circumstancesB)];
      arr[index] = !arr[index];
      return side === 'a' ? { circumstancesA: arr } : { circumstancesB: arr };
    }),
  addVideo: (v) => set((st) => ({ videos: [...st.videos, v] })),
  removeVideo: (index) => set((st) => ({ videos: st.videos.filter((_, i) => i !== index) })),
  setScreening: (key, value) => set((s) => ({ screening: { ...s.screening, [key]: value } })),
  captureNow: () => set({ date: todayISO(), time: nowHHMM() }),
  setLocation: (place, lat, lng) => set({ place, lat, lng }),
  setMyVehicle: (id) => set({ myVehicleId: id }),
  setSelfVerified: (v) => set({ selfVerified: v }),
  setParticipant: (p) => set({ participant: p }),
  setOtherField: (key, value) => set({ [key]: value } as Partial<EuroState>),
  setOtherVehicle: (v) => set({ otherVehicle: v }),
  setOtherPolicyValid: (v) => set({ otherPolicyValid: v }),
  setScheme: (v) => set({ schemeType: v }),
  setSchemeImage: (uri) => set({ schemeImageUri: uri }),
  setDescription: (v) => set({ description: v }),
  setPhoto: (key, photo) => set((st) => ({ photos: { ...st.photos, [key]: photo } })),
  setSubmittedNumber: (n) => set({ submittedNumber: n }),
  reset: () =>
    set({
      ...INITIAL,
      screening: { ...INITIAL.screening },
      photos: { ...INITIAL.photos },
      videos: [],
      circumstancesA: Array(22).fill(false),
      circumstancesB: Array(22).fill(false),
    }),
}));

// Все 5 условий подтверждены?
export function screeningPassed(s: EuroScreening): boolean {
  return s.twoVehicles && s.noInjured && s.noThirdParty && s.agree && s.bothOsago;
}
