'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * @fileOverview Robust Firebase Initialization with explicit browserLocalPersistence.
 * Ensures the Hunter's session survives browser closure as per high-priority directive.
 */

export function initializeFirebase() {
  let app: FirebaseApp;
  
  const apps = getApps();
  if (apps.length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = apps[0];
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // CRITICAL PERSISTENCE PROTOCOL
  // Setting persistence to LOCAL explicitly to ensure login survival
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence)
      .catch((err) => {
        console.error("Nexus: Failure establishing Rank-S persistence:", err);
      });
  }

  return {
    firebaseApp: app,
    auth,
    firestore
  };
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
