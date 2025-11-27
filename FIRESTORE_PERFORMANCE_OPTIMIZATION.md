# Firestore Performance Optimization Guide

This document outlines client-side strategies to reduce repetitive Firestore reads and improve perceived performance in the Local Services Marketplace application.

## Overview

Firestore charges per read operation, and excessive reads can:
- Increase costs
- Slow down application performance
- Create poor user experience
- Hit rate limits

This guide provides strategies to minimize reads through intelligent caching and data management.

---

## 1. Global Data Caching

### Strategy: React Context for Static Data

**Use Case:** Services list, service types, and other rarely-changing reference data.

**Implementation Approach:**

#### Option A: React Context Provider

```javascript
// src/context/StaticDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase';

const StaticDataContext = createContext(null);

export function StaticDataProvider({ children }) {
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Cache duration: 1 hour (3600000 ms)
  const CACHE_DURATION = 60 * 60 * 1000;

  useEffect(() => {
    const loadServices = async () => {
      // Check if cache is still valid
      if (lastFetchTime && Date.now() - lastFetchTime < CACHE_DURATION) {
        setServicesLoading(false);
        return; // Use cached data
      }

      try {
        setServicesLoading(true);
        const servicesRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'services'
        );
        
        const snapshot = await getDocs(servicesRef);
        const servicesList = [];
        snapshot.forEach((doc) => {
          servicesList.push({ id: doc.id, ...doc.data() });
        });
        
        setServices(servicesList);
        setLastFetchTime(Date.now());
        setServicesError(null);
      } catch (err) {
        console.error('Error loading services:', err);
        setServicesError(err.message);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, [lastFetchTime]);

  const value = {
    services,
    servicesLoading,
    servicesError,
    refreshServices: () => setLastFetchTime(null), // Force refresh
  };

  return (
    <StaticDataContext.Provider value={value}>
      {children}
    </StaticDataContext.Provider>
  );
}

export function useStaticData() {
  const context = useContext(StaticDataContext);
  if (!context) {
    throw new Error('useStaticData must be used within StaticDataProvider');
  }
  return context;
}
```

**Usage:**
```javascript
// In App.jsx
<StaticDataProvider>
  <Router>
    {/* Routes */}
  </Router>
</StaticDataProvider>

// In any component
const { services, servicesLoading } = useStaticData();
```

#### Option B: Simple In-Memory Cache Module

```javascript
// src/utils/staticDataCache.js
let servicesCache = null;
let servicesCacheTime = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getServices() {
  // Check if cache is valid
  if (servicesCache && servicesCacheTime && 
      Date.now() - servicesCacheTime < CACHE_DURATION) {
    return servicesCache; // Return cached data
  }

  // Fetch fresh data
  const servicesRef = collection(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'services'
  );
  
  const snapshot = await getDocs(servicesRef);
  const servicesList = [];
  snapshot.forEach((doc) => {
    servicesList.push({ id: doc.id, ...doc.data() });
  });
  
  // Update cache
  servicesCache = servicesList;
  servicesCacheTime = Date.now();
  
  return servicesList;
}

export function clearServicesCache() {
  servicesCache = null;
  servicesCacheTime = null;
}
```

**Benefits:**
- ✅ Single read per cache duration (e.g., once per hour)
- ✅ Instant access after first load
- ✅ Reduces Firestore read operations by ~99% for static data
- ✅ Works across all components without prop drilling

**Cache Invalidation:**
- Time-based: Refresh after X minutes/hours
- Manual: Provide refresh function for admin updates
- Event-based: Clear cache on app version change

---

## 2. Professional Profile Caching

### Strategy: Session Storage + In-Memory Cache

**Use Case:** Professional profiles accessed multiple times during a session (search → detail → back → detail).

**Implementation Approach:**

#### Option A: Session Storage with TTL

```javascript
// src/utils/professionalCache.js
const CACHE_KEY_PREFIX = 'pro_cache_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getProfessionalProfile(proId) {
  // Check session storage first
  const cacheKey = `${CACHE_KEY_PREFIX}${proId}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data; // Return cached data
    } else {
      // Cache expired, remove it
      sessionStorage.removeItem(cacheKey);
    }
  }

  // Fetch from Firestore
  const professionalRef = doc(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'professionals',
    proId
  );
  
  const professionalDoc = await getDoc(professionalRef);
  
  if (!professionalDoc.exists()) {
    throw new Error('Professional not found');
  }
  
  const data = {
    id: professionalDoc.id,
    ...professionalDoc.data(),
  };
  
  // Cache in session storage
  sessionStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
  
  return data;
}

export function clearProfessionalCache(proId = null) {
  if (proId) {
    sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${proId}`);
  } else {
    // Clear all professional caches
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}
```

#### Option B: React Context with LRU Cache

```javascript
// src/context/ProfessionalCacheContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

const ProfessionalCacheContext = createContext(null);

// Simple LRU cache implementation
class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export function ProfessionalCacheProvider({ children }) {
  const [cache] = useState(() => new LRUCache(50));
  const [loadingProfessionals, setLoadingProfessionals] = useState(new Set());

  const getProfessional = useCallback(async (proId) => {
    // Check cache first
    const cached = cache.get(proId);
    if (cached) {
      return cached;
    }

    // Check if already loading
    if (loadingProfessionals.has(proId)) {
      // Wait for existing request
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const result = cache.get(proId);
          if (result) {
            clearInterval(checkInterval);
            resolve(result);
          }
        }, 100);
      });
    }

    // Fetch from Firestore
    setLoadingProfessionals(prev => new Set(prev).add(proId));
    
    try {
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        proId
      );
      
      const professionalDoc = await getDoc(professionalRef);
      
      if (!professionalDoc.exists()) {
        throw new Error('Professional not found');
      }
      
      const data = {
        id: professionalDoc.id,
        ...professionalDoc.data(),
      };
      
      // Store in cache
      cache.set(proId, data);
      
      return data;
    } finally {
      setLoadingProfessionals(prev => {
        const newSet = new Set(prev);
        newSet.delete(proId);
        return newSet;
      });
    }
  }, [cache, loadingProfessionals]);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const value = {
    getProfessional,
    clearCache,
  };

  return (
    <ProfessionalCacheContext.Provider value={value}>
      {children}
    </ProfessionalCacheContext.Provider>
  );
}

export function useProfessionalCache() {
  const context = useContext(ProfessionalCacheContext);
  if (!context) {
    throw new Error('useProfessionalCache must be used within ProfessionalCacheProvider');
  }
  return context;
}
```

**Usage in ProfessionalDetails:**
```javascript
// Before (reads from Firestore every time)
const professionalDoc = await getDoc(professionalRef);

// After (uses cache)
const { getProfessional } = useProfessionalCache();
const professional = await getProfessional(id);
```

**Benefits:**
- ✅ Reduces reads when navigating back to previously viewed profiles
- ✅ Session storage persists across page refreshes
- ✅ LRU cache prevents memory bloat
- ✅ Deduplicates concurrent requests for same profile

**Cache Invalidation:**
- Time-based: 30-minute TTL for session storage
- Size-based: LRU evicts least recently used when limit reached
- Manual: Clear cache on profile update
- Event-based: Clear cache when professional updates their profile

---

## 3. Firestore Indexing Plan

### Overview

Firestore requires composite indexes for queries that:
- Filter on multiple fields
- Filter and order by different fields
- Use range filters on multiple fields

Without proper indexes, Firestore performs slow table scans.

### Required Indexes

#### Index 1: Bookings by Professional and Status

**Query Pattern:**
```javascript
query(
  bookingsRef,
  where('professionalId', '==', proId),
  where('status', 'in', ['Pending', 'Confirmed']),
  orderBy('date', 'desc')
)
```

**Index Configuration:**
```
Collection: bookings
Fields:
  - professionalId (Ascending)
  - status (Ascending)
  - date (Descending)
```

**Firestore Console Path:**
- Go to Firestore → Indexes → Create Index
- Collection ID: `bookings`
- Fields: `professionalId` (Ascending), `status` (Ascending), `date` (Descending)
- Query scope: Collection

**Usage:**
- Pro Dashboard: Filter bookings by professional and status
- Reduces reads by allowing efficient filtering

---

#### Index 2: Bookings by User and Date

**Query Pattern:**
```javascript
query(
  bookingsRef,
  where('userId', '==', userId),
  orderBy('date', 'desc')
)
```

**Index Configuration:**
```
Collection: bookings
Fields:
  - userId (Ascending)
  - date (Descending)
```

**Usage:**
- My Bookings: Get user's bookings ordered by date
- Essential for customer booking history

---

#### Index 3: Bookings by Professional and Date

**Query Pattern:**
```javascript
query(
  bookingsRef,
  where('professionalId', '==', proId),
  orderBy('date', 'desc')
)
```

**Index Configuration:**
```
Collection: bookings
Fields:
  - professionalId (Ascending)
  - date (Descending)
```

**Usage:**
- Pro Dashboard: Get all bookings for a professional
- Used when filtering by status is not needed

---

#### Index 4: Chats by Participants

**Query Pattern:**
```javascript
query(
  chatsRef,
  where('participants', 'array-contains', userId)
)
```

**Index Configuration:**
```
Collection: chats
Fields:
  - participants (Array)
```

**Note:** Array-contains queries require a special index type.

**Usage:**
- My Messages: Find all chats where user is a participant
- Critical for chat functionality

---

#### Index 5: Messages by Timestamp (within Chat)

**Query Pattern:**
```javascript
query(
  messagesRef,
  orderBy('timestamp', 'desc')
)
```

**Index Configuration:**
```
Collection: chats/{bookingId}/messages
Fields:
  - timestamp (Descending)
```

**Usage:**
- Chat Room: Display messages in chronological order
- Subcollection indexes are created automatically but should be verified

---

#### Index 6: Reviews by Professional (Optional)

**Query Pattern:**
```javascript
query(
  reviewsRef,
  orderBy('createdAt', 'desc')
)
```

**Index Configuration:**
```
Collection: professionals/{proId}/reviews
Fields:
  - createdAt (Descending)
```

**Usage:**
- Professional Details: Display reviews newest first
- Subcollection index (usually auto-created)

---

#### Index 7: Notifications by User and Timestamp

**Query Pattern:**
```javascript
query(
  notificationsRef,
  orderBy('timestamp', 'desc')
)
```

**Index Configuration:**
```
Collection: users/{userId}/notifications
Fields:
  - timestamp (Descending)
```

**Usage:**
- Notification Bell: Display notifications newest first
- Subcollection index (usually auto-created)

---

### Index Creation Methods

#### Method 1: Automatic (Recommended)

Firestore will automatically prompt you to create indexes when you run queries that require them:

1. Run the query in your application
2. Check browser console for index creation link
3. Click the link to create the index
4. Wait for index to build (can take minutes for large collections)

#### Method 2: Manual via Firebase Console

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Select collection
4. Add fields in correct order
5. Set sort order (Ascending/Descending)
6. Click "Create"

#### Method 3: firestore.indexes.json (Recommended for Production)

Create `firestore.indexes.json` in project root:

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
          "fieldPath": "status",
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
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy with:
```bash
firebase deploy --only firestore:indexes
```

---

### Index Performance Considerations

#### When Indexes Are Needed

**✅ Requires Index:**
- Multiple `where` clauses on different fields
- `where` + `orderBy` on different fields
- Range queries (`>`, `<`, `>=`, `<=`) on multiple fields
- `array-contains` queries

**❌ No Index Needed:**
- Single `where` clause
- `orderBy` on the same field as `where` (if `where` uses `==`)
- Document ID queries
- Simple collection reads

#### Index Building Time

- **Small collections (< 1,000 docs):** Seconds
- **Medium collections (1,000 - 100,000 docs):** Minutes
- **Large collections (> 100,000 docs):** Can take hours

**Best Practice:** Create indexes before production deployment.

#### Index Storage Costs

- Indexes consume storage space
- Each index stores a copy of indexed fields
- Monitor index size in Firebase Console
- Remove unused indexes to save storage

---

## 4. Additional Optimization Strategies

### A. Batch Reads with `getDocs` Instead of Multiple `getDoc` Calls

**Before (Multiple Reads):**
```javascript
// ❌ Bad: 10 reads for 10 professionals
const professionalPromises = proIds.map(proId => 
  getDoc(doc(db, 'professionals', proId))
);
const professionals = await Promise.all(professionalPromises);
```

**After (Single Query):**
```javascript
// ✅ Good: 1 read + filtering
const professionalsRef = collection(db, 'professionals');
const snapshot = await getDocs(professionalsRef);
const professionals = snapshot.docs
  .filter(doc => proIds.includes(doc.id))
  .map(doc => ({ id: doc.id, ...doc.data() }));
```

**Note:** Only efficient if you need most/all professionals. Otherwise, use caching.

---

### B. Use `onSnapshot` Wisely

**When to Use:**
- ✅ Real-time updates are critical (bookings, messages)
- ✅ Data changes frequently
- ✅ Multiple users need to see updates immediately

**When NOT to Use:**
- ❌ Static reference data (services list)
- ❌ One-time reads (professional profile on detail page)
- ❌ Data that rarely changes

**Cost Consideration:**
- `onSnapshot` counts as 1 read per document change
- Use for critical real-time features only
- Consider polling for less critical data

---

### C. Pagination for Large Result Sets

**Implementation:**
```javascript
const PROFESSIONALS_PER_PAGE = 20;

// First page
const firstPageQuery = query(
  professionalsRef,
  orderBy('createdAt', 'desc'),
  limit(PROFESSIONALS_PER_PAGE)
);

const firstSnapshot = await getDocs(firstPageQuery);
const lastDoc = firstSnapshot.docs[firstSnapshot.docs.length - 1];

// Next page
const nextPageQuery = query(
  professionalsRef,
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(PROFESSIONALS_PER_PAGE)
);
```

**Benefits:**
- Reduces initial load time
- Limits reads per page load
- Better user experience for large datasets

---

### D. Prefetching Strategy

**Implementation:**
```javascript
// Prefetch professional profiles when hovering over card
const handleCardHover = async (proId) => {
  // Prefetch in background
  getProfessionalProfile(proId).catch(() => {
    // Silently fail - user might not click
  });
};

// Prefetch next page of results
useEffect(() => {
  if (currentPage < totalPages) {
    // Prefetch next page in background
    prefetchNextPage(currentPage + 1);
  }
}, [currentPage]);
```

**Benefits:**
- Instant navigation when user clicks
- Better perceived performance
- Uses idle time effectively

---

## 5. Performance Monitoring

### Track Firestore Reads

**Add Read Counter:**
```javascript
let readCount = 0;

// Wrap Firestore operations
const trackedGetDoc = async (docRef) => {
  readCount++;
  console.log(`Firestore Read #${readCount}`);
  return getDoc(docRef);
};
```

**Monitor in Production:**
- Use Firebase Console → Usage tab
- Set up billing alerts
- Track reads per feature

### Performance Metrics

**Key Metrics to Monitor:**
- Average reads per user session
- Cache hit rate
- Time to first contentful paint
- Query execution time

---

## 6. Implementation Checklist

### Phase 1: Global Data Caching
- [ ] Create `StaticDataContext` or cache module
- [ ] Implement services list caching
- [ ] Add cache invalidation logic
- [ ] Test cache persistence across navigation

### Phase 2: Professional Profile Caching
- [ ] Implement session storage cache
- [ ] Add LRU cache for in-memory storage
- [ ] Update ProfessionalDetails to use cache
- [ ] Update search results to use cache
- [ ] Test cache invalidation on profile updates

### Phase 3: Firestore Indexing
- [ ] Create `firestore.indexes.json`
- [ ] Define all required indexes
- [ ] Deploy indexes to Firebase
- [ ] Verify indexes are building/active
- [ ] Test queries with indexes

### Phase 4: Optimization
- [ ] Replace multiple `getDoc` with batch `getDocs`
- [ ] Review `onSnapshot` usage
- [ ] Implement pagination where needed
- [ ] Add prefetching for critical paths

### Phase 5: Monitoring
- [ ] Add read tracking in development
- [ ] Set up Firebase usage alerts
- [ ] Monitor cache hit rates
- [ ] Review and optimize based on metrics

---

## 7. Expected Performance Improvements

### Before Optimization:
- **Services List:** 1 read per page load = ~100 reads/day per user
- **Professional Profiles:** 1 read per view = ~50 reads/day per user
- **Total:** ~150 reads/day per active user

### After Optimization:
- **Services List:** 1 read per hour (cached) = ~24 reads/day per user
- **Professional Profiles:** 1 read per unique profile (cached) = ~10 reads/day per user
- **Total:** ~34 reads/day per active user

**Improvement:** ~77% reduction in reads

### Cost Savings Example:
- **1,000 active users/day**
- **Before:** 150,000 reads/day = $0.36/day = $10.80/month
- **After:** 34,000 reads/day = $0.08/day = $2.40/month
- **Savings:** $8.40/month (78% reduction)

---

## 8. Best Practices Summary

1. **Cache Static Data:** Services, service types, reference data
2. **Cache User-Generated Content:** Professional profiles, user data
3. **Use Appropriate Cache Duration:** 
   - Static data: 1+ hours
   - User data: 30 minutes
   - Real-time data: No cache
4. **Create Required Indexes:** Before production deployment
5. **Monitor Read Usage:** Track and optimize continuously
6. **Batch Operations:** Combine multiple reads when possible
7. **Use Real-time Sparingly:** Only for critical features
8. **Implement Pagination:** For large result sets
9. **Prefetch Strategically:** Improve perceived performance
10. **Test Cache Invalidation:** Ensure data freshness

---

**Last Updated:** 2024
**Version:** 1.0

