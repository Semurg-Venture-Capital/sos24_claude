import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { DocumentKind, DocumentStatus } from './types';

export interface DocumentApi {
  id: string;
  userId: string;
  kind: DocumentKind;
  series: string;
  number: string;
  issuedAt: string;
  issuedBy: string | null;
  pinfl: string | null;
  expiresAt: string | null;
  categories: string | null;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDocumentInput {
  series: string;
  number: string;
  issuedAt: string;
  issuedBy?: string;
  pinfl?: string;
  expiresAt?: string;
  categories?: string;
}

// На бэке kind через URL — 'passport' | 'license'.
export type DocumentSlug = 'passport' | 'license';

const KEYS = {
  all: ['documents'] as const,
  one: (kind: DocumentSlug) => ['documents', kind] as const,
};

export async function listDocuments() {
  const { data } = await api.get<DocumentApi[]>('/me/documents');
  return data;
}
export async function getDocument(kind: DocumentSlug) {
  const { data } = await api.get<DocumentApi>(`/me/documents/${kind}`);
  return data;
}
export async function upsertDocument(kind: DocumentSlug, input: UpsertDocumentInput) {
  const { data } = await api.put<DocumentApi>(`/me/documents/${kind}`, input);
  return data;
}

export function useDocuments() {
  return useQuery({ queryKey: KEYS.all, queryFn: listDocuments });
}

export function useDocument(kind: DocumentSlug) {
  return useQuery({
    queryKey: KEYS.one(kind),
    queryFn: () => getDocument(kind),
    retry: false,
  });
}

export function useUpsertDocument(kind: DocumentSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertDocumentInput) => upsertDocument(kind, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(kind) });
    },
  });
}
