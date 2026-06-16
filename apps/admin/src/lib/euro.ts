// Общие константы/типы Европротокола для админки (список + детальная страница).

export type EuroStatus = 'SUBMITTED' | 'REVIEW' | 'NEED_INFO' | 'APPROVED' | 'REJECTED' | 'PAID';

export const STATUS_LABEL: Record<EuroStatus, string> = {
  SUBMITTED: 'Подано',
  REVIEW: 'На рассмотрении',
  NEED_INFO: 'Требуется информация',
  APPROVED: 'Одобрено',
  REJECTED: 'Отклонено',
  PAID: 'Выплачено',
};

export const STATUS_STYLE: Record<EuroStatus, string> = {
  SUBMITTED: 'bg-[rgba(20,20,20,0.06)] text-[#151515]',
  REVIEW: 'bg-[rgba(86,140,255,0.12)] text-[#3670d4]',
  NEED_INFO: 'bg-[rgba(245,200,80,0.18)] text-[#b07d00]',
  APPROVED: 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]',
  REJECTED: 'bg-[rgba(230,20,40,0.08)] text-[#c01020]',
  PAID: 'bg-[rgba(52,211,153,0.12)] text-[#0a9466]',
};

export const ALL_STATUSES: EuroStatus[] = ['SUBMITTED', 'REVIEW', 'NEED_INFO', 'APPROVED', 'REJECTED', 'PAID'];

export const SCHEME_LABEL: Record<string, string> = {
  rear: 'Наезд сзади',
  front: 'Лобовое',
  side: 'Боковое',
};

export const DRIVER_ROLE_LABEL: Record<string, string> = {
  owner: 'Владелец ТС',
  other: 'Не владелец (по доверенности/договору)',
};

// 22 обстоятельства ДТП (как в официальном бланке, узб.). Индекс = позиция чекбокса.
export const EURO_CIRCUMSTANCES: string[] = [
  'Т/в автотураргоҳ, тўхташ жойи, йўл чети ва бошқаларда ҳаракатсиз ҳолатда турган',
  'Ҳайдовчи ЙТҲ жойида бўлмаган',
  'Автотураргоҳда ҳаракатланган',
  'Автотураргоҳдан, тўхтаб туриш жойидан, тўхташ жойидан, ховлидан, иккинчи даражали йўлдан ҳаракатланиб чиққан',
  'Автотураргоҳга, тўхташ жойига, ховлига, иккинчи даражали йўлга ҳаракатланиб кирган',
  'Тўғрига ҳаракатланган (манёвр қилмаган)',
  'Чорраҳада ҳаракатланган',
  'Айланма ҳаракатли чорраҳага чиққан',
  'Айланма ҳаракатли чорраҳа бўйлаб ҳаракатланган',
  'Бир хил йўналишда бир қаторда ҳаракатланган т/в билан тўқнашган',
  'Бир йўналишда ҳаракатланиб бошқа бўлакдаги т/в билан тўқнашган (бошқа қаторда)',
  'Ҳаракат йўналишини ўзгартирган (бошқа бўлакка тизилиш)',
  'Қувиб ўтган',
  'Ўнгга бурилган',
  'Чапга бурилган',
  'Бурилишни амалга оширган (қайрилиб олиш)',
  'Орқага ҳаракатланган',
  'Йўлнинг қарама-қарши ҳаракатланиш бўлагига чиққан',
  'Иккинчи (тўқнашган) т/в чап томонимда бўлган',
  'Имтиёз белгиларга амал қилмаган',
  'Тўхтаган ёки тўхтаб турган т/вга тўқнашув содир этган (урилиш)',
  'Светофорнинг тақиқловчи ишорасига тўхтаган (турган) т/вга тўқнашув содир этган',
];

export function euroFullName(u?: { name?: string; surname?: string; patronymic?: string } | null): string {
  if (!u) return '—';
  return [u.surname, u.name, u.patronymic].filter(Boolean).join(' ') || '—';
}

export interface EuroMediaMeta {
  key: string;
  slot?: string;
  at?: string;
  type: 'image' | 'video';
}

export const PHOTO_SLOT_LABEL: Record<string, string> = {
  overview: 'Общий план',
  myCar: 'Авто заявителя',
  otherCar: 'Авто 2-го участника',
  scene: 'Место ДТП',
};
