import { auth, db, appId } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Check if the current user is an admin
 * Checks in order:
 * 1. localStorage (for quick client-side checks)
 * 2. Firestore user document (isAdmin: true)
 * 3. Environment variable
 * 4. Hardcoded admin IDs
 */
export async function isCurrentUserAdmin() {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  // Check localStorage first (fastest)
  const storedAdminId = localStorage.getItem('adminUserId');
  if (storedAdminId === user.uid) {
    return true;
  }

  // Check Firestore user document for isAdmin flag
  try {
    const userDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'users',
      user.uid
    );
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists() && userDoc.data().isAdmin === true) {
      // Also save to localStorage for faster future checks
      localStorage.setItem('adminUserId', user.uid);
      return true;
    }
  } catch (error) {
    console.error('Error checking admin status in Firestore:', error);
  }

  // Check environment variable
  const envAdminId = import.meta.env.VITE_ADMIN_USER_ID;
  if (envAdminId && user.uid === envAdminId) {
    return true;
  }

  // Check hardcoded admin IDs
  const hardcodedAdminIds = [
    'admin-123',
    'SdPQVpbeqGUq7F78FBcZ72MZV2I2'
  ];
  
  if (hardcodedAdminIds.includes(user.uid)) {
    return true;
  }

  return false;
}

/**
 * Get admin user ID (for display purposes)
 * Returns the current user's ID if they are admin, or the configured admin ID
 */
export function getAdminUserId() {
  // Check localStorage first
  const storedAdminId = localStorage.getItem('adminUserId');
  if (storedAdminId) {
    return storedAdminId;
  }
  
  // Fallback to environment variable
  return import.meta.env.VITE_ADMIN_USER_ID || 'admin-123';
}

/**
 * Set current user as admin
 * Saves to both localStorage and Firestore
 */
export async function setCurrentUserAsAdmin() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Save to localStorage for quick access
  localStorage.setItem('adminUserId', user.uid);

  // Save to Firestore
  const { doc, setDoc } = await import('firebase/firestore');
  const userDocRef = doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'users',
    user.uid
  );
  
  await setDoc(
    userDocRef,
    {
      isAdmin: true,
      adminSince: new Date().toISOString(),
      userId: user.uid,
    },
    { merge: true }
  );

  return true;
}


