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
import { Letter, PaperStyle } from '../types';

const COLLECTION_NAME = 'letters';

export function subscribeLetters(
  onSuccess: (letters: Letter[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('letterDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const letters: Letter[] = [];
      snapshot.forEach((docSnap) => {
        letters.push(docSnap.data() as Letter);
      });
      onSuccess(letters);
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

export async function createLetter(params: {
  title: string;
  letterDate: string;
  content: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  recipientName: string;
  paperStyle: PaperStyle;
  isSealed: boolean;
}): Promise<string> {
  const id = `letter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${id}`;

  try {
    const letterData = {
      id,
      title: params.title.trim(),
      letterDate: params.letterDate,
      content: params.content,
      senderUid: params.senderUid,
      senderEmail: params.senderEmail,
      senderName: params.senderName || 'Partner',
      recipientName: params.recipientName.trim() || 'Partner',
      paperStyle: params.paperStyle,
      isSealed: params.isSealed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, id), letterData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLetter(
  id: string,
  params: {
    title: string;
    letterDate: string;
    content: string;
    senderName: string;
    recipientName: string;
    paperStyle: PaperStyle;
    isSealed: boolean;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: params.title.trim(),
      letterDate: params.letterDate,
      content: params.content,
      senderName: params.senderName || 'Partner',
      recipientName: params.recipientName.trim() || 'Partner',
      paperStyle: params.paperStyle,
      isSealed: params.isSealed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLetter(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
