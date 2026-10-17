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
import { DiaryEntry } from '../types';

const COLLECTION_NAME = 'diary_entries';

export function subscribeDiaryEntries(
  onSuccess: (entries: DiaryEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: DiaryEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as DiaryEntry);
      });
      onSuccess(entries);
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

export async function createDiaryEntry(params: {
  title: string;
  date: string;
  text: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const id = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${id}`;

  try {
    const entryData = {
      id,
      title: params.title.trim(),
      date: params.date,
      text: params.text, // Verbatim user-written text without alterations
      authorUid: params.authorUid,
      authorEmail: params.authorEmail,
      authorName: params.authorName || 'Partner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, id), entryData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDiaryEntry(
  id: string,
  params: {
    title: string;
    date: string;
    text: string;
    authorName: string;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: params.title.trim(),
      date: params.date,
      text: params.text, // Verbatim text preserved
      authorName: params.authorName || 'Partner',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
