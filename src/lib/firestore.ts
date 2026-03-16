import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { Presentation } from './types';

const COLLECTION = 'presentations';

export interface SavedPresentation {
  id: string;
  presentation: Presentation;
  config: {
    topic: string;
    subject: string;
    depth: string;
    duration: number;
    language: string;
    scriptProvider: string;
    designProvider: string;
    ttsProvider?: 'browser' | 'openai' | 'elevenlabs';
  };
  cost?: {
    totalCost: number;
    costs: { phase: string; provider: string; total: number; inputTokens: number; outputTokens: number }[];
  };
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export async function savePresentation(
  presentation: Presentation,
  config: SavedPresentation['config'],
  cost?: SavedPresentation['cost'],
): Promise<string> {
  const id = `pres_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ref = doc(db, COLLECTION, id);

  await setDoc(ref, {
    id,
    presentation,
    config,
    cost: cost ?? null,
    createdAt: serverTimestamp(),
  });

  return id;
}

export async function listPresentations(max = 50): Promise<SavedPresentation[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as SavedPresentation);
}
