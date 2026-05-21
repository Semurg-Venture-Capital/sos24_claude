import { api } from './client';
import type { MeResponse } from './auth';

export interface MyIdSessionResponse {
  sessionId: string;
}

export async function createMyIdSession(): Promise<MyIdSessionResponse> {
  const { data } = await api.post<MyIdSessionResponse>('/myid/session');
  return data;
}

export async function verifyMyId(code: string): Promise<MeResponse> {
  const { data } = await api.post<MeResponse>('/myid/verify', { code });
  return data;
}
