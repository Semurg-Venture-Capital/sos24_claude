# NAPP.md — Анализ интеграции с НАПП (e-osgo.uz API)

> **НАПП** — Национальное агентство перспективных проектов РУз, регулятор страхового рынка.
> **e-osgo.uz** — государственная платформа электронных страховых полисов.
>
> Sandbox: `https://sandboxerspapiv2.e-osgo.uz`
> API-документация: `https://sandboxerspapiv2.e-osgo.uz/api/documentation`
> OpenAPI JSON: `https://sandboxerspapiv2.e-osgo.uz/docs?api-docs.json`
>
> **Последнее обновление:** 2026-06-04

---

## 1. Что даёт этот API SOS24

НАПП API — это **единая государственная точка входа** для всего страхового рынка Узбекистана. Через него мы:

| Что делаем в SOS24 | Как это реализует НАПП |
|---|---|
| Автоматически заполняем данные авто по техпаспорту | `Provider: /api/provider/osago/vehicle` |
| Автоматически заполняем данные владельца по ПИНФЛ | `Provider: /api/provider/pinfl-v2` |
| Проверяем и заполняем данные водителей | `Provider: /api/provider/driver-summary-v2` |
| Рассчитываем КБМ (скидку/надбавку за безаварийность) | `Provider: /api/provider/driver-coefficient` |
| Регистрируем е-полис ОСАГО в государственном реестре | `OSAGO: POST /api/v3/osago/contract` |
| Подтверждаем оплату полиса | `OSAGO: POST /api/v3/osago/confirm-payed` |
| Открываем страховой случай (претензию) | `Claim: POST /api/claim` |
| Получаем данные о недвижимости (страхование имущества) | `Provider: /api/provider/cadaster` |
| Проверяем организацию по ИНН | `Provider: /api/provider/inn` |
| Проверяем пенсионный статус (скидка) | `Provider: /api/provider/is-pensioner` |

---

## 2. Аутентификация

```
POST /oauth/v2/token
```

**Тип:** OAuth 2.0 (password grant)

**Запрос:**
```json
{
  "client_id": "...",
  "client_secret": "...",
  "grant_type": "password",
  "username": "...",
  "password": "..."
}
```

**Ответ:**
```json
{
  "result": {
    "access_token": "eyJ...",
    "expires_in": 3600,
    "token_type": "Bearer",
    "scope": "...",
    "refresh_token": "..."
  }
}
```

**Важно:** `client_secret` хранить только на бэкенде. Никогда не передавать в мобильное приложение.

**Наш NestJS-модуль:** `NappModule` уже создан. Нужно подключить реальные credentials через `NAPP_CLIENT_ID`, `NAPP_CLIENT_SECRET`, `NAPP_USERNAME`, `NAPP_PASSWORD` в `.env`.

---

## 3. Provider endpoints — данные от государственных систем

Это самые важные эндпоинты для SOS24. Они позволяют **автоматически заполнять формы** вместо ручного ввода.

### 3.1 Данные об автомобиле по техпаспорту

```
POST /api/provider/osago/vehicle
```

**Запрос:**
```json
{
  "techPassportSeria": "AAE",
  "techPassportNumber": "3000221",
  "govNumber": "01Q009QA"
}
```

**Ответ (`TechPassportInfo`):**
| Поле | Описание | Используем в SOS24 |
|---|---|---|
| `techPassportIssueDate` | Дата выдачи техпаспорта | Заполняем поле ТП |
| `issueYear` | Год выпуска авто | Калькулятор КАСКО |
| `vehicleTypeId` | Тип ТС (ref vehicle-types) | Определяем тариф |
| `bodyNumber` | Номер кузова | Обязательное поле е-полиса |
| `engineNumber` | Номер двигателя | Обязательное поле е-полиса |
| `govNumber` | Госномер | Подтверждение |
| `modelName` | Модель ТС | Отображение в UI |
| `vehicleColor` | Цвет | Справочно |
| `fullWeight` | Полная масса (кг) | Тариф ОСАГО |
| `seats` | Количество мест | Тариф ОСАГО |
| `pinfl` | ПИНФЛ владельца | Автозаполнение владельца |
| `inn` | ИНН (если юрлицо) | Для корпоративного авто |
| `owner` | ФИО владельца | Автозаполнение |
| `horsePowers` | Лошадиные силы | Может влиять на тариф |

**Применение в SOS24:** При вводе пользователем номера техпаспорта в CalcVehicle/GarageEdit → автоматически заполняем все поля авто.

> **Сейчас:** `NappModule` использует детерминированный мок. Подключим реальный эндпоинт.

---

### 3.2 Данные физического лица по ПИНФЛ

```
POST /api/provider/pinfl-v2
```

**Запрос:**
```json
{
  "transactionId": "unique-id",
  "isConsent": "Y",
  "senderPinfl": "ПИНФЛ_страховой_компании",
  "document": "AA1234567",
  "pinfl": "12345678901234"
}
```

**Ответ (`PersonInfoV2`):**
| Поле | Описание | Используем |
|---|---|---|
| `currentPinfl` | Актуальный ПИНФЛ | Сверка |
| `lastNameLatin` | Фамилия (латиница) | Автозаполнение |
| `firstNameLatin` | Имя (латиница) | Автозаполнение |
| `middleNameLatin` | Отчество (латиница) | Автозаполнение |
| `birthDate` | Дата рождения | Автозаполнение |
| `birthPlace` | Место рождения | Справочно |
| `gender` | Пол (1=муж, 2=жен) | Тариф |
| `address` | Прописка | Адрес страхователя |
| `regionId` | Регион | Автозаполнение |
| `districtId` | Район | Автозаполнение |
| `documents` | Все документы (история) | Паспортные данные |

**Применение:** Пользователь уже верифицирован через MyID — у нас есть его ПИНФЛ. При оформлении полиса автоматически подтягиваем актуальные данные из НАПП (данные могут обновиться после MyID верификации).

---

### 3.3 Данные по паспорту + дата рождения

```
POST /api/provider/passport-birth-date-v2
```

**Запрос:**
```json
{
  "transactionId": "123",
  "isConsent": "Y",
  "senderPinfl": "...",
  "document": "AA1111111",
  "birthDate": "1970-01-01"
}
```

**Применение:** Резервный способ получения данных если ПИНФЛ неизвестен. Например, для вписанных водителей которые не пользователи SOS24.

---

### 3.4 Данные водительского удостоверения

```
POST /api/provider/driver-license
```

**Запрос:**
```json
{
  "pinfl": "12345678901234"
}
```

**Ответ (`DriverInfo`):**
| Поле | Описание | Используем |
|---|---|---|
| `licenseNumber` | Номер ВУ | Автозаполнение |
| `licenseSeria` | Серия ВУ | Автозаполнение |
| `issueDate` | Дата выдачи ВУ | Стаж водителя |
| `pOwner` | ФИО | Подтверждение |
| `pOwnerDate` | Дата рождения | Подтверждение |
| `modelDLNew` | Кем/когда выдано + срок | Валидность ВУ |

**Применение:** При добавлении водителя в CalcDrivers → автозаполнение ВУ по ПИНФЛ.

---

### 3.5 Комплексные данные водителя (ПИНФЛ + ВУ + КБМ)

```
POST /api/provider/driver-summary-v2
```

**Ответ (`DriverInfoSummaryV2`):**
- `DriverInfo` — данные ВУ
- `DriverPersonInfo` — персональные данные
- `DiscountInfo` — пенсионный статус
- `coefficient` — КБМ коэффициент!

**Применение:** Основной эндпоинт при добавлении водителя. Один запрос даёт всё.

---

### 3.6 КБМ (коэффициент бонус-малус) — скидка за безаварийность

```
POST /api/provider/driver-coefficient
```

**Запрос:**
```json
{
  "pinfl": "12345678901234"
}
```

**Ответ:** Числовой коэффициент (например, 0.85 = скидка 15%).

**Применение:** Влияет на финальную стоимость ОСАГО. Показываем пользователю скидку/надбавку при расчёте. **Важный UX-момент** — клиент видит что система знает его историю вождения.

---

### 3.7 Уже предоставленные скидки

```
POST /api/provider/provided-discounts
```

**Запрос:**
```json
{
  "pinfl": "12345678901234",
  "govNumber": "01A001AA"
}
```

**Применение:** Проверка перед оформлением — уже применена ли скидка для этой связки водитель + авто в текущем году.

---

### 3.8 Проверка пенсионного статуса

```
POST /api/provider/is-pensioner
```

**Применение:** Пенсионеры имеют скидку на ОСАГО по законодательству РУз. Автоматически применяем скидку.

---

### 3.9 Данные об организации по ИНН

```
POST /api/provider/inn
```

**Ответ (`OrganizationInfo` / `InnType`):**
- Наименование организации
- Юридический адрес
- ОКЭД (вид деятельности)
- Форма собственности

**Применение:** При страховании корпоративного автопарка (B2B). Автозаполнение данных организации-страхователя.

---

### 3.10 Данные о недвижимости по кадастру

```
POST /api/provider/cadaster
```

**Ответ (`CadasterResponse`):**
| Поле | Описание |
|---|---|
| `shortAddress` | Короткий адрес |
| `address` | Полный адрес |
| `objectArea` | Общая площадь (м²) |
| `objectAreaL` | Жилая площадь |
| `regionId` | Регион |
| `districtId` | Район |
| `neighborhood` | Махалля |
| `cost` | Кадастровая стоимость |
| `subjects` | Владельцы (тип, ФИО/название, паспорт, ИНН, ПИНФЛ, процент доли) |

**Применение:** Страхование имущества (квартиры, дома). Автозаполнение объекта страхования по кадастровому номеру. Получаем кадастровую стоимость → основа для расчёта страховой суммы.

---

### 3.11 Иностранные ТС

```
POST /api/provider/gtk-vehicle
```

**Ответ (`GtkVehicleInfo`):**
- Гражданство владельца
- Серия/номер паспорта
- Тип авто
- Имя/фамилия владельца

**Применение:** Иностранные водители с иностранными авто — отдельный тариф в ОСАГО.

---

### 3.12 Лицензия пассажирского транспорта

```
POST /api/provider/passenger-license
```

**Применение:** Страхование ОСГОП (ответственность перевозчика). Для таксистов, автобусов, маршруток.

---

## 4. ОСАГО — полный флоу оформления

### Шаг 1: Получить данные авто и водителя

```
GET /api/references/vehicle-types-osago   → типы ТС
GET /api/references/discounts              → доступные скидки
GET /api/references/use-territory-regions → территория использования
GET /api/references/contract-term-conclusions → сроки заключения

POST /api/provider/osago/vehicle          → данные авто
POST /api/provider/driver-summary-v2      → данные водителя + КБМ
POST /api/provider/provided-discounts     → уже применённые скидки
```

### Шаг 2: Рассчитать стоимость

Расчёт на нашей стороне по алгоритму:

```
Базовая ставка × vehicleTypeKoeff × useTerritoryKoeff × kbmKoeff × periodKoeff
```

Параметры берём из справочников НАПП + коэффициент КБМ из `/api/provider/driver-coefficient`.

### Шаг 3: Зарегистрировать е-полис

```
POST /api/v3/osago/contract
```

**Тело запроса (`EpolicyCreate`):**
```json
{
  "applicant": {
    "person": {
      "passportData": { "pinfl": "...", "seria": "AA", "number": "1234567" },
      "fullName": { "firstname": "Азиз", "lastname": "Каримов", "middlename": "Эркинович" },
      "phoneNumber": "998901234567",
      "birthDate": "1990-05-14",
      "regionId": 1,
      "districtId": 5
    }
  },
  "owner": {
    "applicantIsOwner": true
  },
  "details": {
    "issueDate": "2026-06-04",
    "startDate": "2026-06-05",
    "endDate": "2027-06-04",
    "driverNumberRestriction": false
  },
  "cost": {
    "discountId": 1,
    "discountSum": "28000",
    "insurancePremium": "280000",
    "sumInsured": "40000000",
    "contractTermConclusionId": 1,
    "useTerritoryId": 1,
    "commission": "28000",
    "insurancePremiumPaidToInsurer": "252000"
  },
  "vehicle": {
    "techPassport": { "number": "3000221", "seria": "AAE" },
    "modelCustomName": "Cobalt",
    "engineNumber": "df32rfafh98sa",
    "typeId": 1,
    "issueYear": "2021",
    "govNumber": "01A123BB",
    "bodyNumber": "jk543kj453k4",
    "regionId": 1
  },
  "drivers": [
    {
      "passportData": { "pinfl": "...", "seria": "AA", "number": "1234567" },
      "fullName": { "firstname": "Азиз", "lastname": "Каримов", "middlename": "ХХХ" },
      "licenseNumber": "1234567",
      "licenseSeria": "AAC",
      "birthDate": "1990-05-14",
      "licenseIssueDate": "2015-05-30",
      "residentOfUzb": 1
    }
  ]
}
```

**Ответ:**
```json
{
  "error": 0,
  "result": {
    "uuid": "6b4e1638-7d92-45c2-be8c-c1d650820d9c",
    "seria": "OSG",
    "number": "1234567",
    "status": 1
  }
}
```

> **Критично:** `uuid` сохраняем в нашей БД в `Policy.nappUuid`. Он нужен для всех последующих операций.

### Шаг 4: Подтвердить оплату

```
POST /api/v3/osago/confirm-payed
```

```json
{
  "polisUuid": "6b4e1638-7d92-45c2-be8c-c1d650820d9c",
  "paidAt": "2026-06-04 14:23:00",
  "insurancePremium": "280000",
  "startDate": "2026-06-05",
  "endDate": "2027-06-04",
  "agencyId": 123
}
```

**Ответ:**
```json
{
  "error": 0,
  "result": {
    "seria": "OSG",
    "number": "1234567"
  }
}
```

> **Это финальный шаг.** После него е-полис появляется в государственном реестре. ГАИ может проверить QR.

### Шаг 5: Добавить водителей (если нужно)

```
POST /api/v3/osago/drivers
```

Если водителей несколько или нужно добавить позже.

---

## 5. Получение информации о полисе

```
GET /api/v3/osago/insurance-form-show?uuid=...
GET /api/v3/osago/insurance-form-show-by-seria-number?seria=OSG&number=1234567
GET /api/v3/osago/insurance-form-show-by-seria-number-and-vehicle-number?seria=OSG&number=1234567&vehicleNumber=01A123BB
GET /api/v3/osago/insurance-form-list?page=1&dateStart=2026-01-01&dateEnd=2026-12-31
```

**Применение в SOS24:**
- Проверка полиса при вводе ГАИ-инспектором (через QR)
- Синхронизация статуса полиса из реестра НАПП
- Поиск полиса для аджастера при ДТП

---

## 6. Страховые случаи (Claims)

### Подать претензию

```
POST /api/claim
```

**Запрос (`AddClaim`):**
```json
{
  "polisUuid": "...",
  "regionId": 1,
  "areaTypeId": 1,
  "claimNumber": "CLM-SOS24-2026-001",
  "claimDate": "2026-06-04",
  "insuranceCompensationSum": "3500000",
  "applicant": {
    "person": { ... }
  },
  "responsibleVehicleInfo": {
    "govNumber": "01A456CC",
    "modelCustomName": "Nexia 3",
    "isForeign": false,
    "vehicleTypeId": 1
  },
  "eventCircumstances": {
    "eventDateTime": "2026-06-04 10:30:00",
    "regionId": 1,
    "districtId": 5,
    "place": "ул. Амира Темура, 107",
    "eventInfo": "ДТП при движении задним ходом"
  },
  "vehicleDamage": [
    {
      "claimedDamage": "3500000",
      "vehicle": { ... }
    }
  ]
}
```

**Типы ущерба (минимум один обязателен):**
- `lifeDamage` — вред жизни (смерть, свидетельство о смерти)
- `healthDamage` — вред здоровью (мед. заключение)
- `vehicleDamage` — повреждение ТС (оценщик, акт)
- `otherPropertyDamage` — иное имущество

### Загрузка документов претензии

```
POST /api/v3/claim/upload-application-file    → заявление
POST /api/v3/claim/upload-decision-file       → решение СК
POST /api/v3/claim/upload-payout-file         → документ выплаты
```

**Применение в SOS24:** Аджастер фотографирует документы прямо в мобильном приложении → загружаем в НАПП. Пользователь видит прогресс по делу в реальном времени.

### Список и статус претензий

```
GET /api/v3/get-claims/list?page=1&dateStart=...&dateEnd=...
GET /api/v3/get-claims/show?uuid=...
```

---

## 7. Расторжение и аннулирование договора

```
POST /api/v3/contract-motion/annul      → аннулирование (как будто не было)
POST /api/v3/contract-motion/terminate  → досрочное расторжение (возврат части премии)
```

**Применение в SOS24:** Возврат при отмене полиса. Нужно передать причину и дату расторжения.

---

## 8. Другие виды страхования через НАПП

НАПП поддерживает регистрацию е-полисов для всех видов обязательного страхования РУз:

| Вид | Эндпоинт | Актуально для SOS24 |
|---|---|---|
| **ОСАГО** | `/api/v3/osago/contract` | ✅ Приоритет 1 |
| **ОСГОР** (опасные объекты) | `/api/v3/osgor/contract` | Нет пока |
| **ОСГОП** (пассажироперевозки) | `/api/v3/osgop/contract` | Такси — фаза 2 |
| **ОСГОН** (нотариусы) | `/api/v3/osgon/contract` | Нет |
| **ОСГО СЭ** (свободные экономические зоны) | `/api/v3/osgoce/contract` | Нет |
| **СМР** (строительно-монтажные работы) | `/api/v3/smr/contract` | Нет |
| **ОПО** (опасные производственные объекты) | `/api/v3/opo/contract` | Нет |
| **Сельхоз** | `/api/v3/agricultural/contract` | Нет |
| **Прочие** (КАСКО, имущество, жизнь, здоровье, путешествия) | `/api/v3/contract` | ✅ Фаза 2 |

> **Важно:** КАСКО и добровольное страхование (имущество, жизнь) идут через `POST /api/v3/contract` с `insuranceTypeId` соответствующего типа.

---

## 9. Справочники (References) — кешируем при старте

Все справочники получаются через `GET /api/references/*`. Они относительно статичны — можно кешировать в Redis на 24 часа.

| Эндпоинт | Содержание | Когда нужен |
|---|---|---|
| `/api/references/regions` | 14 регионов РУз | Везде |
| `/api/references/districts` | Районы | Адреса страхователей |
| `/api/references/vehicle-types-osago` | Типы ТС для ОСАГО (мотоцикл, легковой, грузовой...) | Калькулятор ОСАГО |
| `/api/references/vehicle-types` | Типы ТС (полный список) | Договоры |
| `/api/references/discounts` | Скидки (по видам) | Расчёт стоимости |
| `/api/references/contract-term-conclusions` | Сроки заключения ОСАГО | Выбор периода |
| `/api/references/use-territory-regions` | Территория управления ТС | Коэффициент территории |
| `/api/references/seasonal-insurances` | Сезонное страхование | Сезонный полис |
| `/api/references/foreign-vehicles-policy-duration` | Сроки для иностранных ТС | Иностранные авто |
| `/api/references/payment-conditions` | Условия оплаты | Договоры |
| `/api/references/forms-of-insurance` | Форма (обязательное/добровольное) | Классификация |
| `/api/references/insurance-types` | Вид обязательного (ОСАГО/ОСГОР/...) | Тип договора |
| `/api/references/area-types` | Городская/сельская местность | Коэффициент |
| `/api/references/countries` | Страны | Иностранцы |
| `/api/references/resident-types` | Резидент/нерезидент | Иностранцы |
| `/api/references/insurance-orgs` | Список СК | Отображение в UI |
| `/api/references/road-security-state-agencies` | УБДД (ГАИ) справочник | Страховые случаи |

---

## 10. Маппинг на нашу БД (Prisma)

### Что добавляем в `Policy` модель

```prisma
model Policy {
  // ... существующие поля ...

  // НАПП интеграция
  nappUuid          String?   // UUID е-полиса в системе НАПП
  nappSeria         String?   // Серия е-полиса (например: OSG)
  nappNumber        String?   // Номер е-полиса (например: 1234567)
  nappContractUuid  String?   // UUID договора в НАПП
  nappStatus        Int?      // Статус в системе НАПП
  nappRegisteredAt  DateTime? // Дата регистрации в реестре НАПП
  nappConfirmedAt   DateTime? // Дата подтверждения оплаты в НАПП
}
```

### Что добавляем в `Vehicle` модель

```prisma
model Vehicle {
  // ... существующие поля ...

  // Данные из НАПП /api/provider/osago/vehicle
  nappVehicleId   String?   // pVehicleId из НАПП
  bodyNumber      String?   // Номер кузова
  engineNumber    String?   // Номер двигателя
  fullWeight      String?   // Полная масса
  seats           Int?      // Количество мест
  vehicleTypeId   Int?      // ID типа ТС по справочнику НАПП
  nappOwnerPinfl  String?   // ПИНФЛ владельца из НАПП
}
```

### Что добавляем в `Policy`-related claim

```prisma
model InsuranceClaim {
  // ... поля ...
  nappClaimUuid  String?  // UUID претензии в системе НАПП
  nappClaimDate  DateTime?
  nappDecisionAt DateTime?
  nappPayoutAt   DateTime?
}
```

---

## 11. Архитектура NappModule в NestJS

### Структура

```
apps/api/src/napp/
├── napp.module.ts
├── napp.service.ts          ← основной сервис
├── napp-auth.service.ts     ← получение/обновление токена OAuth
├── napp-provider.service.ts ← Provider эндпоинты (vehicle, pinfl, driver)
├── napp-osago.service.ts    ← ОСАГО эндпоинты (contract, confirm)
├── napp-claims.service.ts   ← Claims эндпоинты
├── napp-refs.service.ts     ← Справочники (с кешированием Redis)
├── napp-refs.controller.ts  ← GET /napp/refs/* для мобильного
└── dto/
    ├── osago-contract.dto.ts
    ├── provider-vehicle.dto.ts
    └── ...
```

### Ключевые методы

```typescript
// Провайдеры (автозаполнение)
nappProvider.getVehicleByTechPassport(seria, number, govNumber)
nappProvider.getPersonByPinfl(pinfl, document)
nappProvider.getDriverSummary(pinfl)
nappProvider.getKbmCoefficient(pinfl)
nappProvider.checkProvidedDiscount(pinfl, govNumber)
nappProvider.getPropertyByCadaster(cadastralNumber)
nappProvider.isPensioner(pinfl, passportSeria, passportNumber)

// ОСАГО
nappOsago.createContract(data: EpolicyCreate)
nappOsago.confirmPaid(polisUuid, paidAt, premium, startDate, endDate)
nappOsago.getPolicy(uuid)
nappOsago.getPolicyBySeriaNumber(seria, number)
nappOsago.addDrivers(uuid, drivers[])

// Претензии
nappClaims.createClaim(data: AddClaim)
nappClaims.uploadFile(claimUuid, fileType, file)
nappClaims.getClaim(uuid)
nappClaims.getClaims(page, dateStart, dateEnd)
nappClaims.addDecision(claimUuid, decision)
nappClaims.addPayout(decisionUuid, payouts)

// Справочники (с Redis-кешем)
nappRefs.getRegions()
nappRefs.getVehicleTypes()
nappRefs.getDiscounts()
nappRefs.getContractTermConclusions()
nappRefs.getUseTerritoryRegions()
```

---

## 12. Порядок интеграции (приоритеты)

### Приоритет 1 — ОСАГО (делаем первым, блокирует релиз)

1. `NappAuthService` — OAuth2 токен + auto-refresh
2. `NappRefsService` — справочники в Redis
3. `NappProviderService.getVehicleByTechPassport` → CalcVehicle автозаполнение
4. `NappProviderService.getDriverSummary` → CalcDrivers автозаполнение + КБМ
5. `NappOsagoService.createContract` → регистрация е-полиса
6. `NappOsagoService.confirmPaid` → вызывается после успешной оплаты (PaymentsService)
7. QR-код полиса → `nappSeria + nappNumber` для отображения в PolicyDetail

### Приоритет 2 — Страховые случаи (для аджастера)

8. `NappClaimsService.createClaim` → из AdjusterModule при оформлении ДТП
9. `NappClaimsService.uploadFile` → фото с места ДТП
10. `NappClaimsService.addDecision` + `addPayout` → завершение дела

### Приоритет 3 — КАСКО и другие добровольные

11. `POST /api/v3/contract` с `insuranceTypeId` для КАСКО/имущества/здоровья

---

## 13. Переменные окружения

Добавить в `apps/api/.env`:

```bash
# НАПП (e-osgo.uz)
NAPP_BASE_URL=https://sandboxerspapiv2.e-osgo.uz   # sandbox; prod: https://erspapiv2.e-osgo.uz
NAPP_CLIENT_ID=<client_id>
NAPP_CLIENT_SECRET=<client_secret>
NAPP_USERNAME=<username>
NAPP_PASSWORD=<password>
NAPP_SENDER_PINFL=<pinfl_страховой_компании>        # нужен для provider запросов
NAPP_AGENCY_ID=<agency_id>                          # ID нашего агента в системе НАПП
```

> **Production URL:** вероятно `https://erspapiv2.e-osgo.uz` (без `sandbox` и `test`). Уточнить у НАПП при переходе на прод.

---

## 14. Особенности и ограничения API

| Ограничение | Описание |
|---|---|
| **60 дней на подтверждение оплаты** | Созданный полис нужно подтвердить оплатой в течение 60 дней, иначе аннулируется |
| **Одно решение на претензию** | `add-decision` можно вызвать только один раз |
| **Одно изменение ущерба** | `change-claimed-damage` только один раз |
| **Претензия требует минимум 1 тип ущерба** | lifeDamage OR healthDamage OR vehicleDamage OR otherPropertyDamage |
| **`isConsent: "Y"` обязателен** | Для всех provider запросов — согласие клиента на запрос данных |
| **`senderPinfl`** | ПИНФЛ страховой компании (SOS24/партнёра) нужен для provider запросов |
| **`transactionId` уникальный** | Для каждого provider запроса — иначе дубль |
| **Техпаспорт РУз = 3 символа серия + 7 символов номер** | Строгая валидация длины |
| **Серия паспорта РУз = 2 символа** | Строгая валидация |
| **ПИНФЛ = 14 цифр** | Строгая валидация |
| **`middlename: "ХХХ"`** | Если отчество отсутствует — обязательно передавать "ХХХ" |

---

## 15. Что закрывает этот API из QUESTIONS.md

| Вопрос | Закрыт? |
|---|---|
| Q2.1 — Договор и API-документация НАПП | **✅ Да** — API получен и задокументирован |
| Q2.3 — Какие именно сервисы даёт НАПП | **✅ Да** — данные авто, ВУ, реестр е-полисов через Provider |
| Q2.4 — Поведение при недоступности НАПП | **Частично** — нужно решение бизнеса: блокировать или разрешить ручной ввод |
| Q5.2 — Гос. база ОСАГО | **✅ Да** — тарифы и коэффициенты через справочники НАПП |
| Q3.4 — Европротокол: как подписывают | **Частично** — НАПП принимает претензии, но подпись через OTP/MyID решаем сами |
