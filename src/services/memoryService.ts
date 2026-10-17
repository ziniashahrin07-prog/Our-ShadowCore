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
import { Memory } from '../types';

const COLLECTION_NAME = 'memories';

export function subscribeMemories(
  onSuccess: (memories: Memory[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_NAME), orderBy('memoryDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const memories: Memory[] = [];
      snapshot.forEach((docSnap) => {
        memories.push(docSnap.data() as Memory);
      });
      onSuccess(memories);
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

export async function createMemory(params: {
  title: string;
  memoryDate: string;
  description: string;
  location?: string;
  photoUrl?: string;
  photoCaption?: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `${COLLECTION_NAME}/${id}`;

  try {
    const memoryData = {
      id,
      title: params.title.trim(),
      memoryDate: params.memoryDate,
      description: params.description,
      location: params.location?.trim() || '',
      photoUrl: params.photoUrl || '',
      photoCaption: params.photoCaption?.trim() || '',
      authorUid: params.authorUid,
      authorEmail: params.authorEmail,
      authorName: params.authorName || 'Partner',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, id), memoryData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateMemory(
  id: string,
  params: {
    title: string;
    memoryDate: string;
    description: string;
    location?: string;
    photoUrl?: string;
    photoCaption?: string;
    authorName: string;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      title: params.title.trim(),
      memoryDate: params.memoryDate,
      description: params.description,
      location: params.location?.trim() || '',
      photoUrl: params.photoUrl !== undefined ? params.photoUrl : '',
      photoCaption: params.photoCaption?.trim() || '',
      authorName: params.authorName || 'Partner',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMemory(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
