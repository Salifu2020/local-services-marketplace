# Firestore Indexes for Customer Dashboard

## Overview

The Customer Dashboard uses optimized queries that work without composite indexes by performing client-side filtering and sorting. However, if you want to improve performance, you can create the following indexes.

## Optional Indexes (for Performance)

### 1. Upcoming Bookings Index
**Collection**: `bookings`  
**Fields**:
- `userId` (Ascending)
- `status` (Ascending)
- `date` (Ascending)

**Purpose**: Optimize query for upcoming bookings (Pending/Confirmed status)

**Index URL**: Will be provided by Firebase when the query runs

### 2. Recent Bookings Index
**Collection**: `bookings`  
**Fields**:
- `userId` (Ascending)
- `createdAt` (Descending)

**Purpose**: Optimize query for recent bookings

**Index URL**: Will be provided by Firebase when the query runs

## Current Implementation

The Customer Dashboard currently uses client-side filtering and sorting to avoid requiring composite indexes:

1. **Upcoming Bookings**:
   - Queries all bookings for the user
   - Filters client-side for `status in ['Pending', 'Confirmed']` and `date >= today`
   - Sorts client-side by date ascending
   - Limits to 5 results

2. **Recent Bookings**:
   - Queries all bookings for the user
   - Sorts client-side by `createdAt` descending
   - Limits to 5 results

## Performance Considerations

- **Without Indexes**: Works but may be slower with many bookings (client-side processing)
- **With Indexes**: Faster queries, especially as the number of bookings grows

## Creating Indexes

If you want to create the indexes for better performance:

1. Click the index URL provided in the Firebase error message
2. Or manually create in Firebase Console:
   - Go to Firestore → Indexes
   - Click "Create Index"
   - Add the fields as specified above

## Fallback Behavior

The dashboard includes fallback logic:
- If the indexed query fails, it automatically falls back to a simpler query
- Client-side filtering ensures the same results
- No user-facing errors

