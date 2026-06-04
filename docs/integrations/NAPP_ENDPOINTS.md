# NAPP_ENDPOINTS.md — Справочник эндпоинтов НАПП для SOS24

> Быстрый справочник всех **полезных для SOS24** эндпоинтов API e-osgo.uz.
> Полный архитектурный анализ и флоу — в [`NAPP.md`](./NAPP.md).
>
> **Sandbox:** `https://sandboxerspapiv2.e-osgo.uz`
> **Prod (уточнить):** предположительно `https://erspapiv2.e-osgo.uz`
> **OpenAPI:** `https://sandboxerspapiv2.e-osgo.uz/docs?api-docs.json`
>
> **Последнее обновление:** 2026-06-04
>
> **Легенда приоритета:**
> 🔴 P1 — нужно для ОСАГО (блокирует релиз) · 🟡 P2 — претензии/аджастер · 🟢 P3 — добровольное страхование (фаза 2) · ⚪ — справочно / не используем сейчас

---

## 1. Authentication

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/oauth/v2/token` | OAuth2 токен (password grant). Возвращает `access_token`, `refresh_token`, `expires_in`. Кешировать и авто-обновлять. | 🔴 P1 |

**Запрос:** `client_id`, `client_secret`, `grant_type`, `username`, `password`
**Важно:** `client_secret` — только на бэкенде, никогда в мобильное приложение.

---

## 2. Provider — автозаполнение данных (самое ценное)

Эти эндпоинты избавляют пользователя от ручного ввода. Все требуют `isConsent: "Y"` + `senderPinfl` (ПИНФЛ страховой компании) + уникальный `transactionId`.

| Метод | Путь | Назначение | Что возвращает | Приоритет |
|---|---|---|---|---|
| POST | `/api/provider/osago/vehicle` | Данные авто по техпаспорту + госномеру | Модель, год, кузов, двигатель, масса, места, ПИНФЛ владельца, тип ТС (18 полей) | 🔴 P1 |
| POST | `/api/provider/vehicle` | Данные ТС (общий, не только ОСАГО) | То же, для договоров | 🟢 P3 |
| POST | `/api/provider/pinfl-v2` | Личные данные физлица по ПИНФЛ | ФИО (лат), дата/место рожд., пол, адрес, регион, район, все документы | 🔴 P1 |
| POST | `/api/provider/passport-birth-date-v2` | Личные данные по паспорту + дате рождения | То же (когда ПИНФЛ неизвестен) | 🟡 P2 |
| POST | `/api/provider/driver-license` | Данные ВУ по ПИНФЛ | Серия/номер ВУ, дата выдачи, ФИО, срок действия | 🔴 P1 |
| POST | `/api/provider/driver-summary-v2` | Водитель + ВУ + КБМ одним запросом | DriverInfo + PersonInfo + пенсионный статус + `coefficient` (КБМ) | 🔴 P1 |
| POST | `/api/provider/driver-coefficient` | КБМ (бонус-малус) по ПИНФЛ | Коэффициент скидки/надбавки за безаварийность | 🔴 P1 |
| POST | `/api/provider/provided-discounts` | Уже применённые скидки | Применена ли скидка для пары ПИНФЛ+госномер в этом году | 🔴 P1 |
| POST | `/api/provider/is-pensioner` | Пенсионный статус | true/false (пенсионеры → скидка на ОСАГО) | 🔴 P1 |
| POST | `/api/provider/inn` | Данные организации по ИНН | Название, адрес, ОКЭД, форма собственности | 🟢 P3 (B2B) |
| POST | `/api/provider/cadaster` | Данные недвижимости по кадастру | Адрес, площадь, стоимость, владельцы (страхование имущества) | 🟢 P3 |
| POST | `/api/provider/gtk-vehicle` | Данные иностранного ТС по номеру | Гражданство, паспорт, тип авто (иностранные водители) | 🟢 P3 |
| POST | `/api/provider/passenger-license` | Лицензия пассажироперевозчика | Для ОСГОП (такси, автобусы) | ⚪ |
| POST | `/api/provider/mehnat/n1-osgor` | Данные ОСГОР (труд) | Не используем | ⚪ |
| POST | `/api/provider/opo/object-info-v2` | Объекты ОПО по ИНН | Не используем | ⚪ |

---

## 3. ОСАГО — е-полис (приоритет 1)

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/v3/osago/contract` | Регистрация е-полиса ОСАГО в гос. реестре. Тело — `EpolicyCreate` (applicant + owner + details + cost + vehicle + drivers). Возвращает `uuid`, `seria`, `number` | 🔴 P1 |
| POST | `/api/v3/osago/confirm-payed` | Подтверждение оплаты → полис активируется в реестре. Вызываем после успешной оплаты | 🔴 P1 |
| POST | `/api/v3/osago/drivers` | Добавление/обновление водителей в существующий полис | 🔴 P1 |
| GET | `/api/v3/osago/insurance-form-show?uuid=` | Полис по UUID | 🔴 P1 |
| GET | `/api/v3/osago/insurance-form-show-by-seria-number` | Полис по серии+номеру | 🔴 P1 |
| GET | `/api/v3/osago/insurance-form-show-by-seria-number-and-vehicle-number` | Полис по серии+номеру+госномеру (проверка ГАИ) | 🔴 P1 |
| GET | `/api/v3/osago/insurance-form-list?page=&dateStart=&dateEnd=` | Список полисов с фильтром по датам | 🟡 P2 |

**Ключевые поля `EpolicyCreate`** (см. `NAPP.md` раздел 4 для полного примера):
- `applicant` — заявитель (ПИНФЛ, ФИО, телефон, регион/район)
- `owner.applicantIsOwner` — заявитель = собственник?
- `details` — даты (issue/start/end) + `driverNumberRestriction`
- `cost` — `discountId`, `insurancePremium`, `sumInsured`, `useTerritoryId`, `contractTermConclusionId`, `commission`
- `vehicle` — техпаспорт, модель, двигатель, год, госномер, кузов, `typeId`, `regionId`
- `drivers[]` — ПИНФЛ, ФИО, серия/номер ВУ, дата выдачи ВУ, `residentOfUzb`

---

## 4. Добровольное страхование — КАСКО, имущество, жизнь (фаза 2)

Все добровольные виды идут через общий контракт `/api/v3/contract` с нужным `insuranceTypeId`.

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/v3/contract` | Договор «прочее» (КАСКО, имущество, жизнь, здоровье, путешествия). Тело `CreateOtherContractV3` | 🟢 P3 |
| POST | `/api/v3/add-polis` | Добавить полис в существующий договор. Тело `AddPolisOtherV3` | 🟢 P3 |
| POST | `/api/v3/confirm-payed` | Подтверждение оплаты добровольного полиса | 🟢 P3 |
| POST | `/api/contract` | Договор (legacy v1). Тело `CreateContract` | ⚪ |
| PUT | `/api/additional-agreement` | Доп. соглашение к договору | 🟢 P3 |

---

## 5. Оплаты

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/add-payment` | Добавить оплату к объекту полиса (`objectUuid`, `paidSum`, `paidAt`, `comission`) | 🟢 P3 |

---

## 6. Страховые случаи (Claims) — для аджастера

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/claim` | Создать претензию. Тело `AddClaim` (полис, регион, событие, заявитель + ≥1 тип ущерба) | 🟡 P2 |
| GET | `/api/v3/get-claims/list?page=&dateStart=&dateEnd=` | Список претензий | 🟡 P2 |
| GET | `/api/v3/get-claims/show?uuid=` | Детали претензии | 🟡 P2 |
| POST | `/api/v3/claim/add-decision` | Добавить решение по претензии (один раз!) | 🟡 P2 |
| POST | `/api/v3/claim/add-payout` | Добавить выплату по решению | 🟡 P2 |
| POST | `/api/v3/claim/change-claimed-damage` | Изменить заявленный ущерб (один раз!) | 🟡 P2 |
| POST | `/api/v3/claim/upload-application-file` | Загрузить файл заявления | 🟡 P2 |
| POST | `/api/v3/claim/upload-decision-file` | Загрузить файл решения | 🟡 P2 |
| POST | `/api/v3/claim/upload-decision-fatv-justification-file` | Загрузить обоснование фатв | 🟡 P2 |
| POST | `/api/v3/claim/upload-payout-file` | Загрузить файл выплаты | 🟡 P2 |

**4 типа ущерба в `AddClaim` (минимум один):** `lifeDamage`, `healthDamage`, `vehicleDamage`, `otherPropertyDamage`.

---

## 7. Движение договора и полиса (расторжение / аннулирование)

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/v3/contract-motion/annul` | Аннулировать договор (как будто не было). Причина обязательна | 🟡 P2 |
| POST | `/api/v3/contract-motion/terminate` | Досрочно расторгнуть (возврат части премии). Дата + причина + полисы | 🟡 P2 |
| POST | `/api/motion/polis-motion-annul` | Расторжение отдельного полиса | 🟡 P2 |
| POST | `/api/motion/polis-motion-annulment` | Аннулирование отдельного полиса | 🟡 P2 |

---

## 8. Объекты полиса

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| POST | `/api/polis-object/add` | Добавить объекты в полис (лимит 100 за раз) | 🟢 P3 |
| POST | `/api/polis-object/update` | Редактировать объект полиса | 🟢 P3 |

---

## 9. Получение договоров и полисов

| Метод | Путь | Назначение | Приоритет |
|---|---|---|---|
| GET | `/api/v3/get-policies/policies-list?page=&dateStart=&dateEnd=` | Список полисов с фильтром | 🟡 P2 |
| GET | `/api/v3/get-policies/policy-show?uuid=` | Полис по UUID | 🟡 P2 |
| GET | `/api/v3/get-policies/show-policy-uuid-by-seria-number` | UUID полиса по серии+номеру | 🟡 P2 |
| GET | `/api/v3/get-policies/contracts-list?page=&dateStart=&dateEnd=` | Список договоров | 🟢 P3 |
| GET | `/api/v3/get-policies/contract-show?uuid=` | Договор по UUID | 🟢 P3 |

---

## 10. Справочники (References) — кешировать в Redis на 24ч

Все `GET`, без тела. Относительно статичны.

| Путь | Содержание | Нужен для |
|---|---|---|
| `/api/references/regions` | 14 регионов РУз | везде |
| `/api/references/districts` | Районы | адреса |
| `/api/references/vehicle-types-osago` | Типы ТС для ОСАГО | калькулятор ОСАГО 🔴 |
| `/api/references/vehicle-types` | Типы ТС (полный) | договоры |
| `/api/references/discounts` | Скидки | расчёт стоимости 🔴 |
| `/api/references/contract-term-conclusions` | Сроки заключения ОСАГО | выбор периода 🔴 |
| `/api/references/use-territory-regions` | Территория управления ТС | коэф. территории 🔴 |
| `/api/references/seasonal-insurances` | Сезонное страхование | сезонный полис |
| `/api/references/foreign-vehicles-policy-duration` | Сроки для иностранных ТС | иностранцы |
| `/api/references/payment-conditions` | Условия оплаты | договоры |
| `/api/references/forms-of-insurance` | Форма (обяз./добров.) | классификация |
| `/api/references/insurance-types` | Виды обяз. страхования | тип договора |
| `/api/references/insurance-terms` | Сроки страхования | договоры |
| `/api/references/area-types` | Город/село | коэффициент |
| `/api/references/countries` | Страны | иностранцы |
| `/api/references/resident-types` | Резидент/нерезидент | иностранцы |
| `/api/references/genders` | Полы | формы |
| `/api/references/insurance-orgs` | Список СК | UI |
| `/api/references/currencies` | Валюты | валютные договоры |
| `/api/references/ownership-forms` | Формы собственности | юрлица |
| `/api/references/okeds` | ОКЭД (виды деятельности) | юрлица |
| `/api/references/road-security-state-agency` | УБДД (ГАИ) | страховые случаи |
| `/api/references/building-types` | Типы недвижимости | страхование имущества |
| `/api/references/right-to-land-types` | Право на землю | имущество |
| `/api/references/insurance-object-types` | Типы объектов страхования | договоры |
| `/api/references/risks` | Риски | договоры |
| `/api/references/agencies` | Агенты/филиалы | админка СК |

---

## 11. Не используем сейчас (другие виды обязательного страхования)

Эти виды НАПП поддерживает, но они не входят в продукты SOS24 на текущем этапе:

| Тег | Что | Эндпоинты |
|---|---|---|
| OSGOR | Ответственность работодателя | `/api/v3/osgor/contract`, `/api/osgor/confirm-payed` |
| OSGOP | Ответственность перевозчика пассажиров | `/api/v3/osgop/contract`, `/api/osgop/confirm-payed` |
| OSGON | Ответственность нотариусов | `/api/v3/osgon/*` |
| OSGOCE | Ответственность СЭЗ | `/api/v3/osgoce/*` |
| OPO | Опасные производственные объекты | `/api/v3/opo/*` |
| SMR | Строительно-монтажные работы | `/api/v3/smr/*` |
| SRGOTP | — | `/api/v3/srgotp/*` |
| Agricultural | Сельхозстрахование | `/api/v3/agricultural/*` |
| Annuitet | ОСГОР аннуитет | `/api/v3/annuitet/*` |
| Reinsurance | Перестрахование | `/api/v3/reinsurance/*` |
| REClaim | Перестраховочные претензии | `/api/v3/reclaim/*` |
| SellingModule | Модуль продаж НАПП | `/api/*/confirm-payed` v2 |
| E-Claim | Е-претензии (внешний хост) | `erspadmin.e-osgo.uz/...` |

---

## 12. Переменные окружения

```bash
# apps/api/.env
NAPP_BASE_URL=https://sandboxerspapiv2.e-osgo.uz   # prod: https://erspapiv2.e-osgo.uz
NAPP_CLIENT_ID=<client_id>
NAPP_CLIENT_SECRET=<client_secret>
NAPP_USERNAME=<username>
NAPP_PASSWORD=<password>
NAPP_SENDER_PINFL=<пинфл_страховой_компании>   # для Provider запросов
NAPP_AGENCY_ID=<agency_id>                      # ID агента в системе НАПП
```

---

## 13. Сводный план интеграции

| Этап | Эндпоинты | Когда |
|---|---|---|
| **P1 — ОСАГО** | auth → references → provider (vehicle, driver-summary, coefficient) → osago/contract → osago/confirm-payed → insurance-form-show | Первым, блокирует релиз |
| **P2 — Претензии** | claim → upload-*-file → add-decision → add-payout · contract-motion/terminate | Для AdjusterModule |
| **P3 — Добровольное** | v3/contract → add-polis → confirm-payed · provider/cadaster (имущество) · provider/inn (B2B) | Фаза 2 |

> Все типы запросов, форматы полей и ограничения (60 дней на оплату, форматы серий/номеров) — в [`NAPP.md`](./NAPP.md) разделы 4 и 14.
