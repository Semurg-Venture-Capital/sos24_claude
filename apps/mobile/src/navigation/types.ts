export type AuthStackParamList = {
  Onboarding: undefined;
  AuthChoose: undefined;
  Phone: { mode: 'signIn' | 'signUp' };
  Otp: { phone: string };
  ProfileSetup: undefined;
};

export type MyIdStackParamList = {
  MyIdOnboarding: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Policies: undefined;
  Garage: undefined;
  Profile: undefined;
};

export type PoliciesStackParamList = {
  PoliciesList: undefined;
  PolicyDetail: { id: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  Document: { kind: 'passport' | 'license' };
  Finance: undefined;
};

export type GarageStackParamList = {
  GarageList: undefined;
  VehicleDetail: { id: string };
  GarageEdit: { id?: string };
};

export type ProductType = 'osago' | 'kasko' | 'health' | 'home' | 'finance';

export type PurchaseStackParamList = {
  // Новый флоу: выбор компании → её продукты → карточка продукта
  CompanySelect: undefined;
  CompanyProducts: { companyId: string; companyName: string };
  ProductDetail: { productId: string };
  CalcVehicle: undefined;
  CalcDrivers: undefined;
  CalcPeriod: undefined;
  CalcResult: undefined;
  Checkout: undefined;
  Payment: undefined;
  Success: undefined;
  MyCards: undefined;
  // Добавление авто прямо в флоу покупки (возврат на CalcVehicle после сохранения)
  GarageEdit: { id?: string };
};

export type AdjusterStackParamList = {
  AdjusterRequest: undefined;
  AdjusterSent: { requestId: string };
  AdjusterStatus: { requestId: string };
};

// Европротокол (M9) — модальный поток оформления ДТП.
export type EuroStackParamList = {
  EuroStart: undefined; // M9.1 — выбор формата (европротокол / инспектор / обычное)
  EuroCheck: undefined; // M9.2 — скрининг условий применимости европротокола
  EuroStep1: undefined; // M9.3 шаг 1 — обстоятельства (когда и где)
  EuroStep2: undefined; // M9.3 шаг 2 — транспортные средства / второй участник
  EuroStep3: undefined; // M9.3 шаг 3 — схема ДТП + описание обстоятельств
  EuroStep4: undefined; // M9.3 шаг 4 — фотофиксация (только камера)
  EuroStep5: undefined; // M9.3 шаг 5 — итог + подтверждение + отправка
  EuroSuccess: undefined; // экран успеха (№ извещения)
  EuroList: undefined; // M10.1 — список оформленных европротоколов
  EuroDetail: { id: string }; // M10.2 — деталь + трекер статуса
};

// Поддержка (M13) — hub + список обращений + чат.
export type SupportStackParamList = {
  SupportHub: undefined; // M13.1 — экран поддержки (hero, звонок, FAQ)
  SupportTickets: undefined; // список моих обращений
  SupportNewTicket: undefined; // создание обращения (тема + категория + первое сообщение)
  SupportChat: { ticketId: string; subject?: string }; // M13.2 — чат по обращению
};

// Партнёры (M16) — каталог, деталь, запись, мои записи.
export type PartnersStackParamList = {
  PartnersCatalog: undefined; // M16.1 — каталог (список/карта)
  PartnerDetail: { id: string }; // M16.2 — карточка партнёра
  PartnerBooking: { partnerId: string; partnerName: string }; // M16.3 — запись
  PartnerBookingSuccess: { partnerName: string; scheduledAt: string };
  MyBookings: undefined; // мои записи
};

// Корневой стек, оборачивающий tab-нав и модальные потоки.
export type MainStackParamList = {
  Tabs: undefined;
  Notifications: undefined;
  PolicyQrFullscreen: { id: string }; // QR полиса на весь экран — корневой модал

  Purchase:
    | undefined
    | {
        screen?: keyof PurchaseStackParamList;
        params?: PurchaseStackParamList[keyof PurchaseStackParamList];
      };
  Adjuster:
    | undefined
    | {
        screen: keyof AdjusterStackParamList;
        params?: AdjusterStackParamList[keyof AdjusterStackParamList];
      };
  EuroProtocol:
    | undefined
    | {
        screen: keyof EuroStackParamList;
        params?: EuroStackParamList[keyof EuroStackParamList];
      };
  Support:
    | undefined
    | {
        screen: keyof SupportStackParamList;
        params?: SupportStackParamList[keyof SupportStackParamList];
      };
  Partners:
    | undefined
    | {
        screen: keyof PartnersStackParamList;
        params?: PartnersStackParamList[keyof PartnersStackParamList];
      };
};
