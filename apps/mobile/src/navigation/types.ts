export type AuthStackParamList = {
  Onboarding: undefined;
  AuthChoose: undefined;
  Phone: { mode: 'signIn' | 'signUp' };
  Otp: { phone: string };
  ProfileSetup: undefined;
};

export type MainStackParamList = {
  Home: undefined;
};
