export type AuthStackParamList = {
  Onboarding: undefined;
  AuthChoose: undefined;
  Phone: { mode: 'signIn' | 'signUp' };
  Otp: { phone: string };
  ProfileSetup: undefined;
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
  PolicyQrFullscreen: { id: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  Document: { kind: 'passport' | 'license' };
};

export type GarageStackParamList = {
  GarageList: undefined;
  GarageEdit: { id?: string };
};

export type PurchaseStackParamList = {
  Catalog: undefined;
  ProductDetail: { type: 'osago' | 'kasko' };
  CalcVehicle: undefined;
  CalcDrivers: undefined;
  CalcPeriod: undefined;
  CalcResult: undefined;
  Checkout: undefined;
  Payment: undefined;
  Success: undefined;
  MyCards: undefined;
};

// Корневой стек, оборачивающий tab-нав и модальные потоки.
export type MainStackParamList = {
  Tabs: undefined;
  Purchase:
    | undefined
    | {
        screen?: keyof PurchaseStackParamList;
        params?: PurchaseStackParamList[keyof PurchaseStackParamList];
      };
};
