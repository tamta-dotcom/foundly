import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';

const listingsCollection = collection(db, 'listings');

export const LISTINGS_PAGE_SIZE = 12;

function mapListingDocuments(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function createListing(data, user) {
  if (!user) throw new Error('Please sign in first.');

  const listing = {
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category.trim(),
    type: data.type,
    location: data.location.trim(),
    imageUrl: data.imageUrl || '',
    ownerId: user.uid,
    ownerName: user.displayName || 'Community member',
    status: 'active',
    savedBy: [],
    createdAt: serverTimestamp(),
  };

  const result = await addDoc(listingsCollection, listing);
  return result.id;
}

/**
 * Loads one page of listings.
 * Pass the lastDocument returned by the previous request to load the next page.
 */
export async function getListingsPage({
  pageSize = LISTINGS_PAGE_SIZE,
  lastDocument = null,
} = {}) {
  const constraints = [
    orderBy('createdAt', 'desc'),
    ...(lastDocument ? [startAfter(lastDocument)] : []),
    limit(pageSize),
  ];

  const q = query(listingsCollection, ...constraints);
  const snapshot = await getDocs(q);

  return {
    items: mapListingDocuments(snapshot),
    lastDocument: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

/**
 * Retained for screens that need the complete live listings collection.
 * The Home feed uses getListingsPage instead.
 */
export function subscribeToListings(callback, onError) {
  const q = query(
    listingsCollection,
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => callback(mapListingDocuments(snapshot)),
    onError
  );
}

export async function getListing(id) {
  const snapshot = await getDoc(doc(db, 'listings', id));

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getMyListings(userId) {
  const q = query(
    listingsCollection,
    where('ownerId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return mapListingDocuments(snapshot);
}

export async function toggleSavedListing(listing, userId) {
  if (!userId) throw new Error('Please sign in first.');

  const currentSavedBy = listing.savedBy || [];
  const alreadySaved = currentSavedBy.includes(userId);

  const nextSavedBy = alreadySaved
    ? currentSavedBy.filter((id) => id !== userId)
    : [...currentSavedBy, userId];

  await updateDoc(doc(db, 'listings', listing.id), {
    savedBy: nextSavedBy,
  });

  return !alreadySaved;
}

export async function markListingResolved(listingId) {
  await updateDoc(doc(db, 'listings', listingId), {
    status: 'resolved',
  });
}