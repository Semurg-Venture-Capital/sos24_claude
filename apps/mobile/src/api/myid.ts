import { api } from './client';
import type { MeResponse } from './auth';

export interface MyIdSessionResponse {
  sessionId: string;
  clientHash: string;
  clientHashId: string;
  environment: 'debug' | 'production';
}

export async function createMyIdSession(pinfl?: string): Promise<MyIdSessionResponse> {
  const { data } = await api.post<MyIdSessionResponse>('/myid/session', pinfl ? { pinfl } : {});
  return data;
}

export async function verifyMyId(code: string): Promise<MeResponse> {
  const { data } = await api.post<MeResponse>('/myid/verify', { code });
  return data;
}
