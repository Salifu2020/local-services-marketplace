import { auth, db, appId } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { isCurrentUserAdmin } from './admin';

/**
 * Get the current user's role
 * Returns: 'customer', 'professional', or 'admin'
 */
export async function getUserRole() {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  // Check if user is admin first
  const isAdmin = await isCurrentUserAdmin();
  if (isAdmin) {
    return 'admin';
  }

  // Check if user has a professional profile
  try {
    const professionalDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      user.uid
    );
    const professionalDoc = await getDoc(professionalDocRef);
    
    if (professionalDoc.exists()) {
      return 'professional';
    }
  } catch (error) {
    console.error('Error checking professional profile:', error);
  }

  // Check user document for role
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
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // If role is explicitly set to professional, return it
      if (userData.role === 'professional') {
        return 'professional';
      }
    }
  } catch (error) {
    console.error('Error checking user document:', error);
  }

  // Default to customer
  return 'customer';
}

/**
 * Check if current user is a professional
 */
export async function isProfessional() {
  const role = await getUserRole();
  return role === 'professional' || role === 'admin';
}

/**
 * Check if current user is a customer (not professional or admin)
 */
export async function isCustomer() {
  const role = await getUserRole();
  return role === 'customer';
}

/**
 * Check if current user can access professional features
 * Professionals and admins can access professional features
 */
export async function canAccessProfessionalFeatures() {
  const role = await getUserRole();
  return role === 'professional' || role === 'admin';
}

/**
 * Check if current user can access customer features
 * Everyone (customers, professionals, admins) can access customer features
 * This allows professionals to hire other professionals
 */
export async function canAccessCustomerFeatures() {
  const user = auth.currentUser;
  return !!user; // Any authenticated user can access customer features
}

