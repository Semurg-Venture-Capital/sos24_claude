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
  // Скан документа (для паспорта обязателен — нужен в европротоколе).
  frontImageKey: string | null;
  backImageKey: string | null;
  frontImageUrl: string | null; // presigned GET (TTL ~10 мин)
  backImageUrl: string | null;
  isComplete: boolean; // паспорт: данные + оба скана; ВУ: данные
}

export interface UpsertDocumentInput {
  series: string;
  number: string;
  issuedAt: string;
  issuedBy?: string;
  pinfl?: string;
  expiresAt?: string;
  categories?: string;
  frontImageKey?: string;
  backImageKey?: string;
}

export interface UpdateScansInput {
  frontImageKey?: string;
  backImageKey?: string;
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
export async function updateDocumentScans(kind: DocumentSlug, input: UpdateScansInput) {
  const { data } = await api.patch<DocumentApi>(`/me/documents/${kind}/scans`, input);
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

export function useUpdateDocumentScans(kind: DocumentSlug) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateScansInput) => updateDocumentScans(kind, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.one(kind) });
    },
  });
}
