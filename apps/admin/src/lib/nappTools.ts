// Реестр инструментов «Отдела NAPP» — конфиг-движок.
// Каждый инструмент = эндпоинт /admin/napp/lookup/<endpoint> + набор полей формы.
// Рендер результата — универсальный (см. napp/page.tsx).

export type NappFieldType = 'text' | 'date';

export interface NappField {
  name: string;
  label: string;
  placeholder?: string;
  type?: NappFieldType;
  upper?: boolean; // авто-uppercase
  optional?: boolean;
}

export type NappGroup = 'Человек' | 'Водитель' | 'Авто' | 'Компания и имущество';

export interface NappTool {
  key: string; // url-ключ (?tool=key)
  label: string;
  group: NappGroup;
  endpoint: string; // /admin/napp/lookup/<endpoint>
  hint?: string;
  fields: NappField[];
}

export const NAPP_TOOLS: NappTool[] = [
  // ── Человек ──
  {
    key: 'person-passport',
    label: 'Человек по паспорту',
    group: 'Человек',
    endpoint: 'passport',
    hint: 'Личные данные физлица по серии+номеру паспорта и дате рождения (ГБДФЛ).',
    fields: [
      { name: 'document', label: 'Серия + номер паспорта', placeholder: 'AC2523171', upper: true },
      { name: 'birthDate', label: 'Дата рождения', type: 'date' },
    ],
  },
  {
    key: 'person-pinfl',
    label: 'Человек по ПИНФЛ',
    group: 'Человек',
    endpoint: 'pinfl',
    hint: 'Личные данные по ПИНФЛ + любому документу субъекта.',
    fields: [
      { name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' },
      { name: 'document', label: 'Любой документ (серия+номер)', placeholder: 'AC2523171', upper: true },
    ],
  },
  // ── Водитель ──
  {
    key: 'driver',
    label: 'Водитель (ВУ + КБМ)',
    group: 'Водитель',
    endpoint: 'driver-summary',
    hint: 'Сводка: личные данные + водительское удостоверение + КБМ одним запросом.',
    fields: [
      { name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' },
      { name: 'document', label: 'Документ (серия+номер)', placeholder: 'AC2523171', upper: true },
    ],
  },
  {
    key: 'driver-license',
    label: 'Водительское удостоверение',
    group: 'Водитель',
    endpoint: 'driver-license',
    hint: 'Данные ВУ по ПИНФЛ (паспорт — опционально).',
    fields: [
      { name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' },
      { name: 'passportSeries', label: 'Серия паспорта', placeholder: 'AC', upper: true, optional: true },
      { name: 'passportNumber', label: 'Номер паспорта', placeholder: '2523171', optional: true },
    ],
  },
  {
    key: 'kbm',
    label: 'КБМ (бонус-малус)',
    group: 'Водитель',
    endpoint: 'coefficient',
    hint: 'Коэффициент скидки/надбавки за безаварийность по ПИНФЛ.',
    fields: [{ name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' }],
  },
  {
    key: 'pensioner',
    label: 'Пенсионный статус',
    group: 'Водитель',
    endpoint: 'pensioner',
    hint: 'Пенсионер ли (льгота на ОСАГО) — по ПИНФЛ + паспорту.',
    fields: [
      { name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' },
      { name: 'passportSeries', label: 'Серия паспорта', placeholder: 'AC', upper: true },
      { name: 'passportNumber', label: 'Номер паспорта', placeholder: '2523171' },
    ],
  },
  // ── Авто ──
  {
    key: 'vehicle',
    label: 'Авто по техпаспорту',
    group: 'Авто',
    endpoint: 'vehicle',
    hint: 'Данные ТС по серии+номеру техпаспорта и госномеру.',
    fields: [
      { name: 'techPassportSeria', label: 'Серия техпаспорта', placeholder: 'AAF', upper: true },
      { name: 'techPassportNumber', label: 'Номер техпаспорта', placeholder: '2949568' },
      { name: 'govNumber', label: 'Госномер', placeholder: '01357YHA', upper: true },
    ],
  },
  {
    key: 'foreign-vehicle',
    label: 'Иностранное авто',
    group: 'Авто',
    endpoint: 'foreign-vehicle',
    hint: 'Данные иностранного ТС по госномеру (гражданство, паспорт владельца).',
    fields: [{ name: 'govNumber', label: 'Госномер', placeholder: '01A010AA', upper: true }],
  },
  {
    key: 'passenger-license',
    label: 'Лицензия перевозчика',
    group: 'Авто',
    endpoint: 'passenger-license',
    hint: 'Лицензия пассажироперевозчика (такси/автобус) по госномеру.',
    fields: [{ name: 'govNumber', label: 'Госномер', placeholder: '01Q009QA', upper: true }],
  },
  {
    key: 'discounts',
    label: 'Скидки по авто',
    group: 'Авто',
    endpoint: 'discounts',
    hint: 'Применялась ли уже скидка по паре ПИНФЛ + госномер в этом году.',
    fields: [
      { name: 'pinfl', label: 'ПИНФЛ', placeholder: '50501015120024' },
      { name: 'govNumber', label: 'Госномер', placeholder: '01357YHA', upper: true },
    ],
  },
  // ── Компания и имущество ──
  {
    key: 'organization',
    label: 'Организация по ИНН',
    group: 'Компания и имущество',
    endpoint: 'inn',
    hint: 'Карточка юрлица: директор, банк, счёт, ОКЭД, адрес.',
    fields: [{ name: 'inn', label: 'ИНН', placeholder: '307281137' }],
  },
  {
    key: 'cadaster',
    label: 'Недвижимость (кадастр)',
    group: 'Компания и имущество',
    endpoint: 'cadaster',
    hint: 'Данные объекта недвижимости по кадастровому номеру.',
    fields: [{ name: 'cadasterNumber', label: 'Кадастровый номер', placeholder: '10:10:00:00:01:1121:0001:001' }],
  },
];

export const NAPP_GROUPS: NappGroup[] = ['Человек', 'Водитель', 'Авто', 'Компания и имущество'];

export function findTool(key: string | null | undefined): NappTool {
  return NAPP_TOOLS.find((t) => t.key === key) ?? NAPP_TOOLS[0];
}

// Русские подписи для ключей результата (для красивого вывода).
export const FIELD_LABELS: Record<string, string> = {
  currentPinfl: 'ПИНФЛ',
  pinfls: 'Все ПИНФЛ',
  currentDocument: 'Текущий документ',
  documents: 'Документы',
  lastNameLatin: 'Фамилия (лат)',
  firstNameLatin: 'Имя (лат)',
  middleNameLatin: 'Отчество (лат)',
  engName: 'Имя (eng)',
  engSurname: 'Фамилия (eng)',
  birthDate: 'Дата рождения',
  birthPlace: 'Место рождения',
  birthCountry: 'Страна рождения',
  gender: 'Пол',
  address: 'Адрес',
  regionId: 'Регион (код)',
  districtId: 'Район (код)',
  coefficient: 'КБМ (коэффициент)',
  isPensioner: 'Пенсионер',
  // ВУ
  licenseNumber: 'Номер ВУ',
  licenseSeria: 'Серия ВУ',
  issueDate: 'Дата выдачи',
  pOwner: 'Владелец',
  pOwnerDate: 'Дата',
  modelDLNew: 'Модель ВУ',
  // авто
  modelName: 'Модель',
  issueYear: 'Год выпуска',
  vehicleTypeId: 'Тип ТС (код)',
  bodyNumber: 'Номер кузова',
  engineNumber: 'Номер двигателя',
  vehicleColor: 'Цвет',
  fullWeight: 'Полная масса',
  emptyWeight: 'Снаряж. масса',
  fuelType: 'Топливо (код)',
  seats: 'Мест сидячих',
  stands: 'Мест стоячих',
  horsePowers: 'Мощность (л.с.)',
  division: 'Отдел регистрации',
  govNumber: 'Госномер',
  owner: 'Владелец',
  inn: 'ИНН',
  pinfl: 'ПИНФЛ',
  pVehicleId: 'ID в реестре',
  techPassportIssueDate: 'Дата выдачи ТП',
  // организация
  name: 'Название',
  nameShort: 'Кратко',
  gdFullName: 'Директор',
  oked: 'ОКЭД',
  okedTitle: 'ОКЭД (расшифровка)',
  fund: 'Уставный фонд',
  bankName: 'Банк',
  bankMfo: 'МФО',
  account: 'Расчётный счёт',
  okpo: 'ОКПО',
  regCertificate: 'Рег. номер',
  regCertificateIssueDate: 'Дата регистрации',
  phone: 'Телефон',
  email: 'Email',
  district: 'Район',
  // скидки
  result: 'Результат',
  discounts: 'Скидки',
  // иностранное авто
  citizenshipCode: 'Гражданство (код)',
  passportNumber: 'Номер паспорта',
  passportSeria: 'Серия паспорта',
  vehicleType: 'Тип ТС',
  firstName: 'Имя',
  lastName: 'Фамилия',
  // лицензия перевозчика
  pSery: 'Серия',
  pNumber: 'Номер',
  pBeginDate: 'Начало',
  pEndDate: 'Окончание',
  pTypeCode: 'Тип (код)',
  // кадастр
  shortAddress: 'Адрес (кратко)',
  region: 'Регион',
  objectArea: 'Площадь',
  cost: 'Стоимость',
};
