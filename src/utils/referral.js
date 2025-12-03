import { db, appId, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(userId) {
  // Use first 4 chars of userId + random 4 chars
  const userIdPart = userId.substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${userIdPart}${randomPart}`;
}

/**
 * Get or create referral code for a user
 */
export async function getOrCreateReferralCode(userId) {
  try {
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.referralCode) {
        return userData.referralCode;
      }
    }

    // Generate new referral code
    const newCode = generateReferralCode(userId);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        referralCode: newCode,
        referralCodeCreatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, {
        referralCode: newCode,
        referralCodeCreatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }

    return newCode;
  } catch (error) {
    console.error('Error getting/creating referral code:', error);
    throw error;
  }
}

/**
 * Process referral code when a new user signs up
 */
export async function processReferralCode(referredUserId, referralCode) {
  if (!referralCode || !referredUserId) return null;

  try {
    // Find the referrer by their referral code
    const usersRef = collection(db, 'artifacts', appId, 'users');
    const usersQuery = query(usersRef, where('referralCode', '==', referralCode));
    const querySnapshot = await getDocs(usersQuery);

    if (querySnapshot.empty) {
      console.log('Referral code not found:', referralCode);
      return null;
    }

    // Get the referrer's user ID
    const referrerDoc = querySnapshot.docs[0];
    const referrerId = referrerDoc.id;

    // Don't allow self-referral
    if (referrerId === referredUserId) {
      console.log('Self-referral not allowed');
      return null;
    }

    // Check if referral already exists
    const referralsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'referrals'
    );
    const existingRefQuery = query(
      referralsRef,
      where('referredUserId', '==', referredUserId)
    );
    const existingRefSnapshot = await getDocs(existingRefQuery);

    if (!existingRefSnapshot.empty) {
      console.log('Referral already exists for this user');
      return existingRefSnapshot.docs[0].id;
    }

    // Create referral record
    const referralData = {
      referrerId,
      referredUserId,
      referralCode,
      status: 'pending', // pending -> active (after first booking) -> completed
      rewardStatus: 'pending', // pending -> earned (after first booking completion)
      rewardAmount: 10.0, // $10 reward for referrer
      referredUserReward: 10.0, // $10 discount for referred user
      referredAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    const referralRef = await addDoc(referralsRef, referralData);

    // Update referrer's user document
    const referrerUserRef = doc(db, 'artifacts', appId, 'users', referrerId);
    await updateDoc(referrerUserRef, {
      totalReferrals: (referrerDoc.data().totalReferrals || 0) + 1,
      lastReferralAt: serverTimestamp(),
    });

    // Update referred user's document
    const referredUserRef = doc(db, 'artifacts', appId, 'users', referredUserId);
    const referredUserDoc = await getDoc(referredUserRef);
    if (referredUserDoc.exists()) {
      await updateDoc(referredUserRef, {
        referredBy: referrerId,
        referralCode: referralCode,
        referralDiscount: 10.0,
      });
    } else {
      await setDoc(referredUserRef, {
        referredBy: referrerId,
        referralCode: referralCode,
        referralDiscount: 10.0,
        createdAt: serverTimestamp(),
      });
    }

    return referralRef.id;
  } catch (error) {
    console.error('Error processing referral code:', error);
    throw error;
  }
}

/**
 * Check for referral code in URL and process it
 */
export function getReferralCodeFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || null;
}

/**
 * Apply referral discount to a booking
 */
export async function applyReferralDiscount(userId, bookingId) {
  try {
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists() || !userDoc.data().referralDiscount) {
      return 0; // No discount available
    }

    const discount = userDoc.data().referralDiscount || 0;

    // Mark referral discount as used
    await updateDoc(userRef, {
      referralDiscount: 0, // Reset to 0 after use
      referralDiscountUsed: true,
      referralDiscountUsedAt: serverTimestamp(),
    });

    return discount;
  } catch (error) {
    console.error('Error applying referral discount:', error);
    return 0;
  }
}

/**
 * Update referral status when a booking is completed
 */
export async function updateReferralOnBookingCompletion(booking) {
  try {
    const userId = booking.userId;
    if (!userId) return;

    // Check if user was referred
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists() || !userDoc.data().referredBy) {
      return; // User was not referred
    }

    const referrerId = userDoc.data().referredBy;

    // Find the referral record
    const referralsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'referrals'
    );
    const referralQuery = query(
      referralsRef,
      where('referredUserId', '==', userId),
      where('referrerId', '==', referrerId)
    );
    const referralSnapshot = await getDocs(referralQuery);

    if (referralSnapshot.empty) {
      return; // Referral record not found
    }

    const referralDoc = referralSnapshot.docs[0];
    const referralData = referralDoc.data();

    // Only process if status is still pending
    if (referralData.status !== 'pending') {
      return; // Already processed
    }

    // Update referral status to active
    await updateDoc(referralDoc.ref, {
      status: 'active',
      rewardStatus: 'earned',
      firstBookingId: booking.id,
      firstBookingCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update referrer's stats
    const referrerUserRef = doc(db, 'artifacts', appId, 'users', referrerId);
    const referrerUserDoc = await getDoc(referrerUserRef);
    if (referrerUserDoc.exists()) {
      const currentRewards = referrerUserDoc.data().totalRewards || 0;
      await updateDoc(referrerUserRef, {
        activeReferrals: (referrerUserDoc.data().activeReferrals || 0) + 1,
        totalRewards: currentRewards + (referralData.rewardAmount || 10.0),
        lastRewardEarnedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating referral on booking completion:', error);
  }
}

