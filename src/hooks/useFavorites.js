import { useState, useEffect } from 'react';
import { auth, db, appId } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  // Load favorites from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      try {
        const userRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'users',
          user.uid
        );

        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFavorites(userData.favoritePros || []);
        } else {
          // Create user document if it doesn't exist
          await setDoc(userRef, {
            userId: user.uid,
            favoritePros: [],
            createdAt: new Date().toISOString(),
          });
          setFavorites([]);
        }
      } catch (err) {
        console.error('Error loading favorites:', err);
        showError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const toggleFavorite = async (proId) => {
    const user = auth.currentUser;
    if (!user) {
      showError('You must be logged in to add favorites');
      return;
    }

    if (!proId) {
      showError('Invalid professional ID');
      return;
    }

    try {
      const userRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'users',
        user.uid
      );

      const isFavorite = favorites.includes(proId);

      // Get current document state
      const userDoc = await getDoc(userRef);
      const currentFavorites = userDoc.exists() ? (userDoc.data().favoritePros || []) : [];
      
      // Calculate new favorites array
      const newFavorites = isFavorite
        ? currentFavorites.filter(id => id !== proId)
        : [...currentFavorites, proId];

      // Use setDoc with merge to handle both create and update
      // Security rules now allow setting userId on documents that don't have it yet
      await setDoc(userRef, {
        userId: user.uid, // Always ensure userId is set
        favoritePros: newFavorites,
        createdAt: userDoc.exists() && userDoc.data().createdAt 
          ? userDoc.data().createdAt 
          : serverTimestamp(),
      }, { merge: true });

      setFavorites(newFavorites);
      showSuccess(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showError('Failed to update favorites');
    }
  };

  const isFavorite = (proId) => {
    return favorites.includes(proId);
  };

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
  };
}

