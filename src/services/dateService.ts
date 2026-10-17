import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { SpecialDate, SpecialDateCategory } from '../types';

const COLLECTION_NAME = 'special_dates';

export function subscribeSpecialDates(
  onSuccess: (dates: SpecialDate[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('eventDate', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const dates: SpecialDate[] = [];
      snapshot.forEach((docSnap) => {
        dates.push(docSnap.data() as SpecialDate);
      });
      onSuccess(dates);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function createSpecialDate(params: {
  title: string;
  category: SpecialDateCategory;
  eventDate: string;
  notes?: string;
  isRecurringAnnually: boolean;
  authorUid: string;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const id = `date_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${id}`;

  try {
    const dateData = {
      id,
      title: params.title.trim(),
      category: params.category,
      eventDate: params.eventDate,
      notes: params.notes?.trim() || '',
      isRecurringAnnually: params.isRecurringAnnually,
      authorUid: params.authorUid,
      authorEmail: params.authorEmail,
      authorName: params.authorName || 'Partner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, id), dateData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSpecialDate(
  id: string,
  params: {
    title: string;
    category: SpecialDateCategory;
    eventDate: string;
    notes?: string;
    isRecurringAnnually: boolean;
    authorName: string;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: params.title.trim(),
      category: params.category,
      eventDate: params.eventDate,
      notes: params.notes?.trim() || '',
      isRecurringAnnually: params.isRecurringAnnually,
      authorName: params.authorName || 'Partner',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSpecialDate(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
