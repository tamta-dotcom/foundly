import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

function conversationIdFor(userA, userB, listingId) {
  return [userA, userB].sort().join('_') + '_' + listingId;
}

export async function startConversation({
  currentUser,
  otherUserId,
  listingId,
  listingTitle,
}) {
  if (!currentUser) throw new Error('Please sign in first.');

  if (!otherUserId || otherUserId === currentUser.uid) {
    throw new Error('Choose another user to contact.');
  }

  const id = conversationIdFor(
    currentUser.uid,
    otherUserId,
    listingId
  );

  const conversationRef = doc(db, 'conversations', id);

  const existing = await getDocs(
    query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    )
  );

  const found = existing.docs.find((item) => item.id === id);

  if (!found) {
    const { setDoc } = await import('firebase/firestore');

    await setDoc(conversationRef, {
      participants: [currentUser.uid, otherUserId],
      listingId,
      listingTitle,
      lastMessage: '',
      updatedAt: serverTimestamp(),
    });
  }

  return id;
}

export function subscribeToConversations(userId, callback, onError) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      conversations.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() || 0;
        const bTime = b.updatedAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      callback(conversations);
    },
    onError
  );
}

export function subscribeToMessages(conversationId, callback, onError) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    onError
  );
}

export async function sendMessage(conversation, user, text) {
  const messageText = text.trim();

  if (!messageText) return;
  if (!user) throw new Error('Please sign in first.');

  if (!conversation.participants?.includes(user.uid)) {
    throw new Error('You are not a participant in this conversation.');
  }

  const conversationRef = doc(db, 'conversations', conversation.id);

  await addDoc(
    collection(conversationRef, 'messages'),
    {
      text: messageText,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    }
  );

  const { updateDoc } = await import('firebase/firestore');

  await updateDoc(conversationRef, {
    lastMessage: messageText,
    updatedAt: serverTimestamp(),
  });
}