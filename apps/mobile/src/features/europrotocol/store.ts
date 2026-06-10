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

  setScreening: (key: keyof EuroScreening, value: boolean) => void;
  captureNow: () => void;
  setLocation: (place: string, lat?: number, lng?: number) => void;
  setMyVehicle: (id: string) => void;
  setSelfVerified: (v: boolean) => void;
  setParticipant: (p: EuroParticipant | null) => void;
  setOtherField: (key: OtherTextField, value: string) => void;
  setOtherVehicle: (v: TechPassportInfo | null) => void;
  setOtherPolicyValid: (v: boolean | null) => void;
  reset: () => void;
}

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
  participant: null as EuroParticipant | null,
  otherTpSeria: '',
  otherTpNumber: '',
  otherGov: '',
  otherVehicle: null as TechPassportInfo | null,
  otherPolicySeria: '',
  otherPolicyNumber: '',
  otherPolicyValid: null as boolean | null,
  otherPhone: '',
};

export const useEuroStore = create<EuroState>((set) => ({
  ...INITIAL,
  setScreening: (key, value) => set((s) => ({ screening: { ...s.screening, [key]: value } })),
  captureNow: () => set({ date: todayISO(), time: nowHHMM() }),
  setLocation: (place, lat, lng) => set({ place, lat, lng }),
  setMyVehicle: (id) => set({ myVehicleId: id }),
  setSelfVerified: (v) => set({ selfVerified: v }),
  setParticipant: (p) => set({ participant: p }),
  setOtherField: (key, value) => set({ [key]: value } as Partial<EuroState>),
  setOtherVehicle: (v) => set({ otherVehicle: v }),
  setOtherPolicyValid: (v) => set({ otherPolicyValid: v }),
  reset: () => set({ ...INITIAL, screening: { ...INITIAL.screening } }),
}));

// Все 5 условий подтверждены?
export function screeningPassed(s: EuroScreening): boolean {
  return s.twoVehicles && s.noInjured && s.noThirdParty && s.agree && s.bothOsago;
}
