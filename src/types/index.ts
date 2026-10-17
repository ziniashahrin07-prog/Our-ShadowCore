import { Timestamp } from 'firebase/firestore';

export interface DiaryEntry {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  text: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt: Timestamp | { seconds: number; nanoseconds: number };
}

export type PaperStyle = 'parchment' | 'vintage-rose' | 'midnight' | 'pressed-petals';

export interface Letter {
  id: string;
  title: string;
  letterDate: string; // YYYY-MM-DD
  content: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  recipientName: string;
  paperStyle: PaperStyle;
  isSealed: boolean;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt: Timestamp | { seconds: number; nanoseconds: number };
}

export interface Memory {
  id: string;
  title: string;
  memoryDate: string; // YYYY-MM-DD
  description: string;
  location: string;
  photoUrl: string; // Data URL or external image URL
  photoCaption: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt: Timestamp | { seconds: number; nanoseconds: number };
}

export type DreamPromiseType = 'dream' | 'promise';
export type DreamPromiseStatus = 'envisioned' | 'in_progress' | 'fulfilled';

export interface DreamPromise {
  id: string;
  type: DreamPromiseType;
  title: string;
  description: string;
  targetDate: string;
  status: DreamPromiseStatus;
  fulfilledDate: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt: Timestamp | { seconds: number; nanoseconds: number };
}

export type SpecialDateCategory =
  | 'anniversary'
  | 'birthday'
  | 'first_date'
  | 'milestone'
  | 'other';

export interface SpecialDate {
  id: string;
  title: string;
  category: SpecialDateCategory;
  eventDate: string; // YYYY-MM-DD
  notes: string;
  isRecurringAnnually: boolean;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  createdAt: Timestamp | { seconds: number; nanoseconds: number };
  updatedAt: Timestamp | { seconds: number; nanoseconds: number };
}

export type PageTab =
  | 'diary'
  | 'letters'
  | 'memories'
  | 'dreams'
  | 'dates'
  | 'privacy';
