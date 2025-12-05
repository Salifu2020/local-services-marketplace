import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';

/**
 * Sign in with Google
 * Creates or updates user document in Firestore
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Request additional scopes if needed
  provider.addScope('profile');
  provider.addScope('email');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Create or update user document in Firestore
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
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userDocRef, {
        userId: user.uid,
        email: user.email,
        name: user.displayName || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || null,
        provider: 'google',
        createdAt: new Date().toISOString(),
        role: 'customer', // Default role
      });
    } else {
      // Update existing user document with latest info
      await setDoc(
        userDocRef,
        {
          email: user.email,
          displayName: user.displayName || userDoc.data().displayName,
          photoURL: user.photoURL || userDoc.data().photoURL,
          provider: 'google',
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    
    return user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

