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
import { DreamPromise, DreamPromiseType, DreamPromiseStatus } from '../types';

const COLLECTION_NAME = 'dreams_promises';

export function subscribeDreamsPromises(
  onSuccess: (items: DreamPromise[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: DreamPromise[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DreamPromise);
      });
      onSuccess(items);
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

export async function createDreamPromise(params: {
  type: DreamPromiseType;
  title: string;
  description: string;
  targetDate?: string;
  status: DreamPromiseStatus;
  authorUid: string;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const id = `dream_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${id}`;

  try {
    const itemData = {
      id,
      type: params.type,
      title: params.title.trim(),
      description: params.description,
      targetDate: params.targetDate || '',
      status: params.status,
      fulfilledDate: params.status === 'fulfilled' ? new Date().toISOString().split('T')[0] : '',
      authorUid: params.authorUid,
      authorEmail: params.authorEmail,
      authorName: params.authorName || 'Partner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, id), itemData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDreamPromise(
  id: string,
  params: {
    type: DreamPromiseType;
    title: string;
    description: string;
    targetDate?: string;
    status: DreamPromiseStatus;
    fulfilledDate?: string;
    authorName: string;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      type: params.type,
      title: params.title.trim(),
      description: params.description,
      targetDate: params.targetDate || '',
      status: params.status,
      fulfilledDate: params.fulfilledDate || '',
      authorName: params.authorName || 'Partner',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDreamPromise(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
