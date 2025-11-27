# Firestore Indexes Summary

## Required Indexes (3 Total)

You need to create **3 composite indexes** for the application to work properly. All are already configured in `firestore.indexes.json`.

---

## Index 1: Bookings by Professional ID + Date

**Collection:** `bookings`  
**Fields:**
- `professionalId` → Ascending
- `date` → Descending

**Used For:** Professional Dashboard (`ProDashboard.jsx`)  
**Query:** Get all bookings for a professional, ordered by date (newest first)

**Status:** ⚠️ **REQUIRED** - You've seen this error already

---

## Index 2: Bookings by User ID + Date

**Collection:** `bookings`  
**Fields:**
- `userId` → Ascending
- `date` → Descending

**Used For:** Customer Bookings Page (`MyBookings.jsx`)  
**Query:** Get all bookings for a customer, ordered by date (newest first)

**Status:** ⚠️ **REQUIRED** - Will error when accessing My Bookings page

---

## Index 3: Chats by Participants + Updated At

**Collection:** `chats`  
**Fields:**
- `participants` → Array Contains
- `updatedAt` → Descending

**Used For:** Messages List (`MyMessages.jsx`)  
**Query:** Get all chats where user is a participant, ordered by most recent update

**Status:** ⚠️ **REQUIRED** - You've seen this error already

---

## Optional Indexes (Auto-Created)

These single-field indexes are usually created automatically by Firestore, but listed here for reference:

### Index 4: Messages by Timestamp (Auto)
**Collection:** `messages` (subcollection)  
**Fields:** `timestamp` → Ascending  
**Used For:** Chat messages ordered by time

### Index 5: Notifications by Timestamp (Auto)
**Collection:** `notifications` (subcollection)  
**Fields:** `timestamp` → Descending  
**Used For:** User notifications ordered by time

### Index 6: Reviews by Created At (Auto)
**Collection:** `reviews` (subcollection)  
**Fields:** `createdAt` → Descending  
**Used For:** Professional reviews ordered by date

---

## How to Deploy All Indexes

### Option 1: Deploy via Firebase CLI (Recommended)

```bash
# Make sure you're authenticated
firebase login

# Deploy all indexes at once
firebase deploy --only firestore:indexes
```

This will create all 3 required indexes from `firestore.indexes.json`.

### Option 2: Create Manually (One by One)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index** for each:

**Index 1:**
- Collection: `bookings`
- Fields: `professionalId` (Ascending), `date` (Descending)

**Index 2:**
- Collection: `bookings`
- Fields: `userId` (Ascending), `date` (Descending)

**Index 3:**
- Collection: `chats`
- Fields: `participants` (Array), `updatedAt` (Descending)

### Option 3: Click Error Links (Quick Fix)

When you see an error like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Just click the link - Firebase will auto-create the index for you.

---

## Current Status

✅ **firestore.indexes.json** - Created and ready to deploy  
✅ **Documentation** - Complete in FIRESTORE_INDEXES.md  
⚠️ **Indexes** - Need to be deployed/created

---

## Verification

After creating indexes, test these pages:
1. ✅ **Pro Dashboard** (`/pro-dashboard`) - Should load bookings
2. ✅ **My Bookings** (`/my-bookings`) - Should load customer bookings
3. ✅ **My Messages** (`/my-messages`) - Should load chat list

If any page shows an index error, create that specific index.

---

## Index Building Time

- **Small datasets (< 1,000 docs):** Usually instant
- **Medium datasets (1K - 100K docs):** 1-5 minutes
- **Large datasets (> 100K docs):** 5-30 minutes

You'll receive an email when each index is ready.

---

**Last Updated:** 2024

