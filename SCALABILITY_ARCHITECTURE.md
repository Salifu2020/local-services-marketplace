# Scalability Architecture & Decoupling Plan

This document outlines strategies to decouple critical platform functions from the frontend/Firestore layer to ensure scalability as the application grows to handle millions of users and complex operations.

## Overview

As the Local Services Marketplace scales, certain operations become bottlenecks when performed client-side:
- **Full-text search** across thousands of professionals
- **Geographic queries** with millions of location data points
- **Background processes** (notifications, payments, invoices)

This document provides architectural recommendations for moving these operations to scalable, server-side solutions.

---

## 1. Full-Text Search Integration

### Current Limitation

**Firestore Constraints:**
- No native full-text search
- Limited query operators (`==`, `>`, `<`, `array-contains`)
- Cannot search within text fields (bios, descriptions)
- Client-side filtering becomes slow with large datasets
- Expensive reads when fetching all documents for filtering

**Current Implementation:**
```javascript
// ❌ Inefficient: Fetches all professionals, filters client-side
const snapshot = await getDocs(professionalsRef);
const filtered = snapshot.docs.filter(doc => 
  doc.data().bio.toLowerCase().includes(searchQuery)
);
```

### Solution: Algolia Integration

**Why Algolia:**
- Purpose-built for search
- Sub-millisecond search response times
- Handles millions of records
- Typo tolerance, faceted search, ranking
- Free tier: 10,000 records, 10,000 searches/month

#### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │────────▶│  Algolia     │────────▶│  Firestore  │
│   Client    │  Search │  Search API  │  Sync   │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                              ▲
                              │
                        ┌─────┴─────┐
                        │ Cloud     │
                        │ Functions │
                        │ (Sync)    │
                        └───────────┘
```

#### Implementation Plan

**Step 1: Set Up Algolia**

1. Create Algolia account and application
2. Install Algolia JavaScript client:
   ```bash
   npm install algoliasearch
   ```

3. Create search index: `professionals`

**Step 2: Data Synchronization**

**Option A: Cloud Functions (Recommended)**

Create a Cloud Function that syncs Firestore → Algolia:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');

const ALGOLIA_APP_ID = 'your-app-id';
const ALGOLIA_API_KEY = 'your-admin-api-key';
const ALGOLIA_INDEX_NAME = 'professionals';

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

// Sync on document create/update
exports.syncProfessionalToAlgolia = functions.firestore
  .document('artifacts/{appId}/public/data/professionals/{professionalId}')
  .onWrite(async (change, context) => {
    const professionalData = change.after.data();
    
    if (!professionalData) {
      // Document deleted
      await index.deleteObject(context.params.professionalId);
      return;
    }

    // Prepare data for Algolia
    const algoliaObject = {
      objectID: context.params.professionalId,
      serviceType: professionalData.serviceType || '',
      bio: professionalData.bio || '',
      location: professionalData.location || '',
      locationText: professionalData.locationText || '',
      hourlyRate: professionalData.hourlyRate || 0,
      averageRating: professionalData.averageRating || 0,
      reviewCount: professionalData.reviewCount || 0,
      // Geo data for location-based search
      _geoloc: professionalData.lat && professionalData.lon ? {
        lat: professionalData.lat,
        lng: professionalData.lon,
      } : null,
    };

    // Save to Algolia
    await index.saveObject(algoliaObject);
  });
```

**Option B: Client-Side Sync (Development Only)**

For development/testing, sync manually:

```javascript
// src/utils/algoliaSync.js (Development only)
import algoliasearch from 'algoliasearch';
import { collection, getDocs } from 'firebase/firestore';
import { db, appId } from '../firebase';

const client = algoliasearch('YOUR_APP_ID', 'YOUR_SEARCH_API_KEY');
const index = client.initIndex('professionals');

export async function syncProfessionalsToAlgolia() {
  const professionalsRef = collection(
    db,
    'artifacts',
    appId,
    'public',
    'data',
    'professionals'
  );
  
  const snapshot = await getDocs(professionalsRef);
  const objects = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    objects.push({
      objectID: doc.id,
      serviceType: data.serviceType || '',
      bio: data.bio || '',
      location: data.location || '',
      hourlyRate: data.hourlyRate || 0,
      _geoloc: data.lat && data.lon ? {
        lat: data.lat,
        lng: data.lon,
      } : null,
    });
  });
  
  await index.saveObjects(objects);
}
```

**Step 3: Client-Side Search Integration**

```javascript
// src/hooks/useAlgoliaSearch.js
import { useState, useCallback } from 'react';
import algoliasearch from 'algoliasearch';

const client = algoliasearch('YOUR_APP_ID', 'YOUR_SEARCH_API_KEY');
const index = client.initIndex('professionals');

export function useAlgoliaSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        query: query || '',
        hitsPerPage: 20,
        attributesToRetrieve: [
          'objectID',
          'serviceType',
          'bio',
          'location',
          'hourlyRate',
          'averageRating',
          'reviewCount',
          '_geoloc',
        ],
      };

      // Add geo search if location provided
      if (filters.lat && filters.lon && filters.radius) {
        searchParams.aroundLatLng = `${filters.lat},${filters.lon}`;
        searchParams.aroundRadius = filters.radius * 1000; // Convert km to meters
      }

      // Add filters
      if (filters.serviceType) {
        searchParams.filters = `serviceType:${filters.serviceType}`;
      }

      const { hits } = await index.search(query, searchParams);
      setResults(hits);
    } catch (err) {
      console.error('Algolia search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, error };
}
```

**Step 4: Update HomePage to Use Algolia**

```javascript
// In HomePage component
import { useAlgoliaSearch } from '../hooks/useAlgoliaSearch';

function HomePage() {
  const { search, results, loading } = useAlgoliaSearch();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (query) => {
    await search(query, {
      lat: customerLocation.lat,
      lon: customerLocation.lon,
      radius: maxDistance === 'all' ? null : parseFloat(maxDistance),
    });
  };

  // Use Algolia results instead of Firestore snapshot
  // ...
}
```

#### Benefits

- ✅ **Performance:** Sub-millisecond search times
- ✅ **Scalability:** Handles millions of records
- ✅ **Features:** Typo tolerance, faceted search, ranking
- ✅ **Cost:** Pay-per-search model scales with usage
- ✅ **Reduced Firestore Reads:** No need to fetch all documents

#### Alternative: Elasticsearch

**When to Use:**
- Need more control over search infrastructure
- Already have Elasticsearch cluster
- Need advanced analytics/search features

**Architecture:**
- Similar to Algolia but self-hosted
- Requires server infrastructure
- More complex setup but more flexible

---

## 2. Complex Geo-Queries

### Current Limitation

**Client-Side Haversine Issues:**
- Fetches ALL professionals from Firestore
- Calculates distance for each in JavaScript
- Becomes slow with thousands of professionals
- Expensive Firestore reads
- No spatial indexing
- Cannot efficiently filter by radius before fetching

**Current Implementation:**
```javascript
// ❌ Inefficient: Fetches all, calculates distance client-side
const snapshot = await getDocs(professionalsRef);
snapshot.forEach((doc) => {
  const distance = haversineDistance(
    customerLat, customerLon,
    doc.data().lat, doc.data().lon
  );
  // Filter by distance...
});
```

### Solution A: GeoFirestore (Firestore Extension)

**Why GeoFirestore:**
- Native Firestore integration
- Server-side geo queries
- Efficient spatial indexing
- No additional infrastructure

#### Implementation

**Step 1: Install GeoFirestore**

```bash
npm install geofirestore
```

**Step 2: Store Geo Data**

```javascript
// When saving professional profile
import { GeoCollectionReference, GeoFirestore } from 'geofirestore';

const geofirestore = new GeoFirestore(db);
const geocollection = geofirestore.collection(
  'artifacts',
  appId,
  'public',
  'data',
  'professionals'
);

// Save with geo data
await geocollection.doc(userId).set({
  ...professionalData,
  coordinates: new admin.firestore.GeoPoint(lat, lon),
});
```

**Step 3: Query by Radius**

```javascript
// Server-side (Cloud Function) or client-side
import { GeoQuery, GeoQuerySnapshot } from 'geofirestore';

const center = [customerLat, customerLon];
const radiusInKm = maxDistance;

const query = geocollection.near({
  center: center,
  radius: radiusInKm,
});

// This only returns professionals within radius
const snapshot = await query.get();
```

**Limitations:**
- Still requires fetching from Firestore
- Limited to Firestore's query capabilities
- May hit read limits at scale

---

### Solution B: PostGIS + Backend API (Recommended for Scale)

**Why PostGIS:**
- Industry-standard spatial database
- Efficient spatial indexing (R-tree)
- Complex geo queries (polygons, routes, etc.)
- Handles millions of points efficiently
- Can combine with full-text search

#### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │────────▶│  Backend API │────────▶│   PostGIS   │
│   Client    │  Query  │  (Node.js)   │  Query  │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ Sync
                              ▼
                        ┌─────────────┐
                        │  Firestore  │
                        │  (Metadata) │
                        └─────────────┘
```

#### Implementation Plan

**Step 1: Database Schema**

```sql
-- PostgreSQL with PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE professionals (
  id VARCHAR(255) PRIMARY KEY,
  service_type VARCHAR(100),
  bio TEXT,
  location_text VARCHAR(255),
  hourly_rate DECIMAL(10, 2),
  average_rating DECIMAL(3, 2),
  review_count INTEGER,
  location GEOGRAPHY(POINT, 4326), -- Spatial column
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create spatial index for fast queries
CREATE INDEX idx_professionals_location ON professionals 
USING GIST (location);

-- Create text search index
CREATE INDEX idx_professionals_search ON professionals 
USING GIN (to_tsvector('english', service_type || ' ' || bio));
```

**Step 2: Sync Firestore → PostGIS**

**Cloud Function or Scheduled Job:**

```javascript
// functions/syncToPostGIS.js
const { Pool } = require('pg');
const admin = require('firebase-admin');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

exports.syncProfessionalToPostGIS = functions.firestore
  .document('artifacts/{appId}/public/data/professionals/{professionalId}')
  .onWrite(async (change, context) => {
    const professionalData = change.after.data();
    const professionalId = context.params.professionalId;

    if (!professionalData) {
      // Delete from PostGIS
      await pool.query(
        'DELETE FROM professionals WHERE id = $1',
        [professionalId]
      );
      return;
    }

    // Insert or update in PostGIS
    const query = `
      INSERT INTO professionals (
        id, service_type, bio, location_text, hourly_rate,
        average_rating, review_count, location, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326), NOW())
      ON CONFLICT (id) DO UPDATE SET
        service_type = EXCLUDED.service_type,
        bio = EXCLUDED.bio,
        location_text = EXCLUDED.location_text,
        hourly_rate = EXCLUDED.hourly_rate,
        average_rating = EXCLUDED.average_rating,
        review_count = EXCLUDED.review_count,
        location = EXCLUDED.location,
        updated_at = NOW()
    `;

    await pool.query(query, [
      professionalId,
      professionalData.serviceType,
      professionalData.bio,
      professionalData.location,
      professionalData.hourlyRate,
      professionalData.averageRating || 0,
      professionalData.reviewCount || 0,
      professionalData.lon, // Longitude first for PostGIS
      professionalData.lat, // Latitude second
    ]);
  });
```

**Step 3: Backend API Endpoint**

```javascript
// backend/routes/professionals.js
const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  // PostgreSQL connection config
});

// Search professionals by location and text
router.get('/search', async (req, res) => {
  const { query, lat, lon, radius, serviceType } = req.query;

  let sqlQuery = `
    SELECT 
      id,
      service_type,
      bio,
      location_text,
      hourly_rate,
      average_rating,
      review_count,
      ST_X(location::geometry) as lon,
      ST_Y(location::geometry) as lat,
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      ) / 1000 as distance_km
    FROM professionals
    WHERE 
      ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326),
        $3 * 1000
      )
  `;

  const params = [lon, lat, radius || 50]; // Default 50km radius
  let paramIndex = 4;

  // Add text search
  if (query) {
    sqlQuery += ` AND (
      to_tsvector('english', service_type || ' ' || bio) @@ plainto_tsquery('english', $${paramIndex})
      OR service_type ILIKE $${paramIndex + 1}
      OR bio ILIKE $${paramIndex + 1}
    )`;
    params.push(query, `%${query}%`);
    paramIndex += 2;
  }

  // Add service type filter
  if (serviceType) {
    sqlQuery += ` AND service_type = $${paramIndex}`;
    params.push(serviceType);
    paramIndex++;
  }

  // Order by distance
  sqlQuery += ` ORDER BY distance_km ASC LIMIT 50`;

  try {
    const result = await pool.query(sqlQuery, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
```

**Step 4: Client-Side Integration**

```javascript
// src/services/professionalSearch.js
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api.yourapp.com';

export async function searchProfessionals(filters) {
  const params = new URLSearchParams({
    lat: filters.lat,
    lon: filters.lon,
    radius: filters.radius || 50,
  });

  if (filters.query) params.append('query', filters.query);
  if (filters.serviceType) params.append('serviceType', filters.serviceType);

  const response = await fetch(`${API_BASE_URL}/professionals/search?${params}`);
  return response.json();
}
```

#### Benefits

- ✅ **Performance:** Spatial indexes enable fast radius queries
- ✅ **Scalability:** Handles millions of location points
- ✅ **Efficiency:** Only returns results within radius (no client-side filtering)
- ✅ **Flexibility:** Can combine with full-text search, complex queries
- ✅ **Cost:** Reduced Firestore reads

#### Alternative: Google Cloud SQL with PostGIS

- Managed PostgreSQL with PostGIS
- Integrated with Firebase/Google Cloud
- Automatic backups and scaling
- Pay-per-use pricing

---

## 3. Monolithic Decoupling

### Current Issues

**Client-Side Problems:**
- Browser limitations (memory, processing)
- Secrets exposed in client code
- No background processing
- User must be online
- Can't handle long-running tasks
- Rate limiting issues

### Processes to Decouple

#### A. Email/SMS Notifications

**Current:** Client-side notification creation in Firestore

**Recommended:** Cloud Functions + Email/SMS Service

**Architecture:**
```
Firestore Change → Cloud Function Trigger → Send Email/SMS → Update Notification
```

**Implementation:**

```javascript
// functions/sendBookingNotification.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter (using Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password, // Stored securely
  },
});

// Twilio client
const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);

exports.sendBookingConfirmation = functions.firestore
  .document('artifacts/{appId}/public/data/bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only send if status changed to 'Confirmed'
    if (before.status !== 'Confirmed' && after.status === 'Confirmed') {
      const userId = after.userId;
      
      // Get user data
      const userDoc = await admin.firestore()
        .doc(`artifacts/${context.params.appId}/public/data/users/${userId}`)
        .get();
      
      const userData = userDoc.data();
      const userEmail = userData.email;
      const userPhone = userData.phone;

      // Send email
      if (userEmail) {
        await transporter.sendMail({
          from: 'noreply@yourapp.com',
          to: userEmail,
          subject: 'Booking Confirmed!',
          html: `
            <h2>Your booking has been confirmed!</h2>
            <p>Date: ${formatDate(after.date)}</p>
            <p>Time: ${after.time}</p>
            <p>Professional: ${after.serviceType}</p>
          `,
        });
      }

      // Send SMS
      if (userPhone) {
        await twilioClient.messages.create({
          body: `Your booking on ${formatDate(after.date)} at ${after.time} has been confirmed!`,
          from: '+1234567890',
          to: userPhone,
        });
      }

      // Create notification in Firestore
      await admin.firestore()
        .collection(`artifacts/${context.params.appId}/users/${userId}/notifications`)
        .add({
          type: 'BOOKING_CONFIRMED',
          message: `Your booking has been confirmed for ${formatDate(after.date)}`,
          read: false,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  });
```

**Benefits:**
- ✅ Secrets stored securely in Cloud Functions config
- ✅ Background processing (doesn't block user)
- ✅ Reliable delivery (retry logic)
- ✅ Can send even if user is offline
- ✅ No client-side code exposure

---

#### B. Payment Processing

**Current:** Mock payment in client

**Recommended:** Backend API + Payment Gateway

**Architecture:**
```
Client → Backend API → Payment Gateway (Stripe/PayPal) → Webhook → Update Firestore
```

**Implementation:**

```javascript
// backend/routes/payments.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create payment intent
router.post('/create-intent', async (req, res) => {
  const { bookingId, amount, currency } = req.body;
  const userId = req.user.uid; // From auth middleware

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency || 'usd',
      metadata: {
        bookingId,
        userId,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler (Stripe calls this)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { bookingId, userId } = paymentIntent.metadata;

    // Update Firestore
    await admin.firestore()
      .doc(`artifacts/${appId}/public/data/bookings/${bookingId}`)
      .update({
        paymentStatus: 'Paid',
        paymentIntentId: paymentIntent.id,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Send notification
    // ... notification logic
  }

  res.json({ received: true });
});

module.exports = router;
```

**Client-Side Integration:**

```javascript
// src/services/paymentService.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);

export async function processPayment(bookingId, amount) {
  // Create payment intent via backend
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId, amount }),
  });

  const { clientSecret } = await response.json();

  // Confirm payment with Stripe
  const stripe = await stripePromise;
  const { error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}
```

**Benefits:**
- ✅ PCI compliance (no card data in client)
- ✅ Secure secret key storage
- ✅ Webhook reliability
- ✅ Payment reconciliation
- ✅ Fraud detection

---

#### C. Invoice Generation

**Current:** Not implemented

**Recommended:** Cloud Function + PDF Generation

**Implementation:**

```javascript
// functions/generateInvoice.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const { Storage } = require('@google-cloud/storage');

exports.generateInvoice = functions.firestore
  .document('artifacts/{appId}/public/data/bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const after = change.after.data();

    // Generate invoice when booking is completed
    if (after.status === 'Completed' && after.paymentStatus === 'Paid') {
      const bookingId = context.params.bookingId;
      
      // Get booking and professional data
      const [bookingDoc, professionalDoc] = await Promise.all([
        change.after.ref.get(),
        admin.firestore()
          .doc(`artifacts/${context.params.appId}/public/data/professionals/${after.professionalId}`)
          .get(),
      ]);

      // Generate PDF
      const doc = new PDFDocument();
      const pdfBuffer = await new Promise((resolve) => {
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        // PDF content
        doc.fontSize(20).text('Invoice', 100, 100);
        doc.fontSize(12).text(`Booking ID: ${bookingId}`, 100, 150);
        doc.text(`Date: ${formatDate(after.date)}`, 100, 170);
        doc.text(`Amount: $${calculateAmount(after)}`, 100, 190);
        
        doc.end();
      });

      // Upload to Cloud Storage
      const storage = new Storage();
      const bucket = storage.bucket('your-invoice-bucket');
      const file = bucket.file(`invoices/${bookingId}.pdf`);
      
      await file.save(pdfBuffer, {
        metadata: { contentType: 'application/pdf' },
      });

      // Update booking with invoice URL
      await change.after.ref.update({
        invoiceUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
      });
    }
  });
```

**Benefits:**
- ✅ Server-side PDF generation (no browser limitations)
- ✅ Stored securely in Cloud Storage
- ✅ Can be emailed automatically
- ✅ Professional invoice format

---

#### D. Background Jobs & Scheduled Tasks

**Examples:**
- Send booking reminders (24 hours before)
- Clean up expired sessions
- Generate daily/weekly reports
- Update average ratings
- Sync data between services

**Implementation: Cloud Scheduler + Cloud Functions**

```javascript
// functions/scheduledJobs.js
const functions = require('firebase-functions');

// Run daily at 9 AM
exports.sendBookingReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find bookings tomorrow
    const bookingsRef = admin.firestore()
      .collection('artifacts')
      .doc(appId)
      .collection('public')
      .doc('data')
      .collection('bookings');

    const snapshot = await bookingsRef
      .where('date', '>=', admin.firestore.Timestamp.fromDate(tomorrow))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(tomorrowEnd))
      .where('status', '==', 'Confirmed')
      .get();

    // Send reminders
    for (const doc of snapshot.docs) {
      const booking = doc.data();
      // Send email/SMS reminder
      await sendReminder(booking);
    }
  });
```

---

## 4. Recommended Architecture

### Microservices Structure

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Client-side routing, UI, user interactions)           │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─────────────────────────────────────┐
               │                                     │
    ┌──────────▼──────────┐              ┌──────────▼──────────┐
    │   Backend API       │              │  Cloud Functions    │
    │   (Node.js/Express) │              │  (Event-driven)     │
    │                     │              │                     │
    │ - Search API        │              │ - Firestore Triggers│
    │ - Payment API       │              │ - Scheduled Jobs    │
    │ - Auth Middleware   │              │ - Notifications     │
    └──────────┬──────────┘              └──────────┬──────────┘
               │                                     │
    ┌──────────▼──────────┐              ┌──────────▼──────────┐
    │   PostGIS Database  │              │     Firestore       │
    │   (Spatial Search)  │              │  (Real-time Data)   │
    └─────────────────────┘              └─────────────────────┘
               │                                     │
    ┌──────────▼──────────┐              ┌──────────▼──────────┐
    │   Algolia          │              │  Cloud Storage      │
    │   (Full-text)      │              │  (Files/Invoices)   │
    └─────────────────────┘              └─────────────────────┘
```

### Data Flow

1. **User Search:**
   - Client → Backend API → PostGIS + Algolia → Results → Client

2. **Booking Creation:**
   - Client → Firestore → Cloud Function → Email/SMS → Notification

3. **Payment:**
   - Client → Backend API → Stripe → Webhook → Firestore Update

4. **Real-time Updates:**
   - Firestore Change → Cloud Function → External Service → Firestore Update

---

## 5. Migration Strategy

### Phase 1: Search Migration (Week 1-2)

1. Set up Algolia account
2. Create Cloud Function to sync Firestore → Algolia
3. Update client to use Algolia search
4. Monitor and compare performance
5. Gradually migrate users

### Phase 2: Geo-Query Migration (Week 3-4)

1. Set up PostGIS database (Cloud SQL)
2. Create sync function (Firestore → PostGIS)
3. Build backend API endpoint
4. Update client to use API
5. Test with production data subset

### Phase 3: Background Jobs (Week 5-6)

1. Move notifications to Cloud Functions
2. Set up payment processing backend
3. Implement invoice generation
4. Create scheduled jobs
5. Monitor and optimize

### Phase 4: Optimization (Ongoing)

1. Monitor performance metrics
2. Optimize database queries
3. Cache frequently accessed data
4. Scale infrastructure as needed

---

## 6. Cost Considerations

### Current (Client-Side)

- **Firestore Reads:** ~150 reads/user/day = $0.36/day for 1,000 users
- **Total:** ~$10.80/month for 1,000 active users

### After Migration

- **Algolia:** $0.50 per 1,000 searches = ~$15/month for 30,000 searches
- **PostGIS (Cloud SQL):** ~$25/month for small instance
- **Cloud Functions:** ~$5/month for notifications
- **Firestore Reads:** Reduced to ~34 reads/user/day = $2.40/month
- **Total:** ~$47/month for 1,000 active users

**Trade-off:** Higher infrastructure cost but:
- Better performance
- Better scalability
- More features
- Professional-grade architecture

---

## 7. Implementation Priority

### High Priority (Immediate)
1. ✅ **Search:** Algolia integration (biggest performance gain)
2. ✅ **Notifications:** Move to Cloud Functions (security, reliability)

### Medium Priority (3-6 months)
3. ✅ **Geo-Queries:** PostGIS migration (when > 10,000 professionals)
4. ✅ **Payments:** Backend API (when going live with real payments)

### Low Priority (6+ months)
5. ✅ **Invoices:** PDF generation (when needed for tax/compliance)
6. ✅ **Analytics:** Data warehouse (when need advanced analytics)

---

## 8. Monitoring & Maintenance

### Key Metrics

- **Search Performance:** Average response time, queries per second
- **Geo-Query Performance:** Query execution time, results accuracy
- **Background Jobs:** Success rate, execution time, error rate
- **Cost:** Monthly spend per service, cost per user

### Tools

- **Algolia:** Built-in analytics dashboard
- **PostGIS:** Query performance monitoring, slow query logs
- **Cloud Functions:** Firebase Console, Cloud Monitoring
- **Backend API:** Application Performance Monitoring (APM) tools

---

**Last Updated:** 2024  
**Version:** 1.0

