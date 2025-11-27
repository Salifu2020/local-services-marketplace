# Firestore Indexes Required

This document lists all the Firestore composite indexes required for the application to function properly.

## What are Firestore Indexes?

Firestore requires **composite indexes** when you:
- Filter by one field AND order by another field
- Filter by multiple fields
- Use range queries on different fields

## How to Create Indexes

### Option 1: Click the Link in the Error Message

When you see an error like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Simply click the link in the error message, and Firebase will automatically create the index for you.

### Option 2: Create Manually in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Fill in the collection and fields as specified below
6. Click **Create**

### Option 3: Use firestore.indexes.json (Recommended for Production)

Create a `firestore.indexes.json` file in your project root (see below), then deploy:

```bash
firebase deploy --only firestore:indexes
```

---

## Required Indexes

### 1. Bookings Collection - Professional Dashboard Query

**Collection:** `bookings`  
**Fields:**
- `professionalId` (Ascending)
- `date` (Descending)

**Used in:** `ProDashboard.jsx`

**Query:**
```javascript
query(
  bookingsRef,
  where('professionalId', '==', proId),
  orderBy('date', 'desc')
)
```

**Create Index Link:**
Click the link in the error message, or use:
```
https://console.firebase.google.com/v1/r/project/neighborly-52673/firestore/indexes?create_composite=...
```

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "professionalId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

---

### 2. Bookings Collection - Customer Bookings Query

**Collection:** `bookings`  
**Fields:**
- `userId` (Ascending)
- `date` (Descending)

**Used in:** `MyBookings.jsx`

**Query:**
```javascript
query(
  bookingsRef,
  where('userId', '==', userId),
  orderBy('date', 'desc')
)
```

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

---

### 3. Chats Collection - Messages Query

**Collection:** `chats`  
**Fields:**
- `participants` (Array Contains)
- `updatedAt` (Descending)

**Used in:** `MyMessages.jsx`

**Query:**
```javascript
query(
  chatsRef,
  where('participants', 'array-contains', userId),
  orderBy('updatedAt', 'desc')
)
```

**firestore.indexes.json:**
```json
{
  "indexes": [
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```

---

### 4. Messages Subcollection - Chat Messages Query

**Collection:** `messages` (subcollection of `chats`)  
**Fields:**
- `timestamp` (Ascending)

**Used in:** `ChatPage.jsx`

**Query:**
```javascript
query(
  messagesRef,
  orderBy('timestamp', 'asc')
)
```

**Note:** Single-field indexes are usually created automatically, but if you see an error, create this index.

---

### 5. Notifications Subcollection - User Notifications Query

**Collection:** `notifications` (subcollection of `users`)  
**Fields:**
- `timestamp` (Descending)

**Used in:** `NotificationBell.jsx`

**Query:**
```javascript
query(
  notificationsRef,
  orderBy('timestamp', 'desc')
)
```

**Note:** Single-field indexes are usually created automatically.

---

### 6. Reviews Subcollection - Professional Reviews Query

**Collection:** `reviews` (subcollection of `professionals`)  
**Fields:**
- `createdAt` (Descending)

**Used in:** `ProfessionalDetails.jsx`

**Query:**
```javascript
query(
  reviewsRef,
  orderBy('createdAt', 'desc')
)
```

**Note:** Single-field indexes are usually created automatically.

---

## Complete firestore.indexes.json

Create this file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "professionalId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Deployment

### Deploy Indexes via Firebase CLI

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firestore** (if not already done):
   ```bash
   firebase init firestore
   ```

4. **Create firestore.indexes.json** in your project root with the content above

5. **Deploy indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

---

## Index Building Time

- **Small datasets (< 1000 documents):** Usually instant
- **Medium datasets (1K - 100K documents):** 1-5 minutes
- **Large datasets (> 100K documents):** 5-30 minutes

You'll receive an email when the index is ready.

---

## Troubleshooting

### Index Still Building

If you see "Index is building" errors:
1. Wait for the index to finish building (check Firebase Console)
2. You'll receive an email when it's ready
3. The query will work automatically once the index is built

### Index Creation Failed

If index creation fails:
1. Check Firebase Console for error messages
2. Verify the collection name matches exactly
3. Verify field names match exactly (case-sensitive)
4. Check that the collection exists and has data

### Multiple Indexes Needed

If you have multiple queries with different field combinations, you'll need separate indexes for each combination.

---

## Best Practices

1. **Create indexes proactively** - Don't wait for errors in production
2. **Use firestore.indexes.json** - Version control your indexes
3. **Monitor index usage** - Check Firebase Console for unused indexes
4. **Test queries** - Ensure all queries work before deploying

---

## Quick Fix for Current Error

**For the immediate error you're seeing:**

1. **Click the link** in the error message - it will take you directly to the index creation page
2. **Click "Create Index"** - Firebase will create it automatically
3. **Wait for the index to build** - Usually takes 1-5 minutes
4. **Refresh your app** - The query should work once the index is ready

**Or create manually:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **neighborly-52673**
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Set:
   - Collection ID: `bookings`
   - Fields:
     - `professionalId` - Ascending
     - `date` - Descending
6. Click **Create**

---

**Last Updated:** 2024  
**Version:** 1.0

