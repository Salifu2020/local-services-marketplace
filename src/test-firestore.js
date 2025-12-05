/**
 * Test Firestore Connection
 * Run this in browser console to test Firestore
 */

import { db, auth, appId } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function testFirestore() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    console.log('Testing Firestore connection...');
    console.log('User ID:', user.uid);
    console.log('App ID:', appId);

    // Test 1: Simple write
    console.log('\nTest 1: Simple write to test collection');
    const testRef = doc(db, 'test', 'connection');
    await setDoc(testRef, { 
      timestamp: new Date().toISOString(),
      message: 'Firestore connection test'
    });
    console.log('✅ Simple write successful');

    // Test 2: Read back
    console.log('\nTest 2: Reading back test document');
    const testDoc = await getDoc(testRef);
    if (testDoc.exists()) {
      console.log('✅ Read successful:', testDoc.data());
    } else {
      console.log('⚠️ Document not found');
    }

    // Test 3: Nested path write
    console.log('\nTest 3: Nested path write');
    const nestedRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      user.uid
    );
    
    console.log('Path:', nestedRef.path);
    
    await setDoc(nestedRef, {
      test: true,
      timestamp: new Date().toISOString(),
      userId: user.uid
    }, { merge: true });
    
    console.log('✅ Nested path write successful');

    // Test 4: Read back nested
    console.log('\nTest 4: Reading back nested document');
    const nestedDoc = await getDoc(nestedRef);
    if (nestedDoc.exists()) {
      console.log('✅ Nested read successful:', nestedDoc.data());
    } else {
      console.log('⚠️ Nested document not found');
    }

    console.log('\n✅ All Firestore tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
}

// Auto-run if imported
if (typeof window !== 'undefined') {
  window.testFirestore = testFirestore;
}


