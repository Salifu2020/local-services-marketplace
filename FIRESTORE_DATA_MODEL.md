# Firestore Data Model - Local Service Marketplace

This document defines the complete Firestore database structure for the Customer Portal application.

## Overview

The database consists of four main collections:
- **users** - Customer information
- **professionals** - Service provider information
- **services** - Available service types dictionary
- **bookings** - Appointment records linking customers to professionals

---

## Collection: `users`

Stores customer/user account information.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Firebase Auth UID | `"abc123xyz789"` |
| `name` | `string` | ✅ | Customer's full name | `"John Doe"` |
| `email` | `string` | ✅ | Customer's email address | `"john.doe@example.com"` |
| `createdAt` | `timestamp` | ✅ | Account creation timestamp | `2024-01-15T10:30:00Z` |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp | `2024-01-20T14:22:00Z` |
| `phone` | `string` | ❌ | Customer's phone number (optional) | `"+1-555-123-4567"` |
| `address` | `string` | ❌ | Customer's address (optional) | `"123 Main St, City, State"` |

### Example Document

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:22:00Z",
  "phone": "+1-555-123-4567",
  "address": "123 Main St, Anytown, ST 12345"
}
```

### Indexes Required
- None (using document ID for queries)

---

## Collection: `professionals`

Stores service provider/professional information.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Firebase Auth UID or custom ID | `"pro_abc123"` |
| `name` | `string` | ✅ | Professional's name or business name | `"ABC Plumbing Services"` |
| `serviceType` | `string` | ✅ | Type of service provided (references services collection) | `"Plumbing"` |
| `hourlyRate` | `number` | ✅ | Hourly rate in USD | `75.00` |
| `locationText` | `string` | ✅ | Service area/location description | `"Greater Seattle Area, WA"` |
| `availability` | `map/object` | ✅ | Detailed availability schedule (JSON structure) | See below |
| `email` | `string` | ✅ | Professional's email | `"contact@abcplumbing.com"` |
| `phone` | `string` | ❌ | Professional's phone number | `"+1-555-987-6543"` |
| `rating` | `number` | ❌ | Average rating (0-5) | `4.8` |
| `totalReviews` | `number` | ❌ | Total number of reviews | `127` |
| `isActive` | `boolean` | ✅ | Whether professional is currently accepting bookings | `true` |
| `createdAt` | `timestamp` | ✅ | Profile creation timestamp | `2024-01-10T08:00:00Z` |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp | `2024-01-25T16:45:00Z` |

### Availability Structure (JSON Field)

The `availability` field is a nested object with the following structure:

```json
{
  "monday": {
    "available": true,
    "startTime": "09:00",
    "endTime": "17:00",
    "breaks": [
      {"start": "12:00", "end": "13:00"}
    ]
  },
  "tuesday": {
    "available": true,
    "startTime": "09:00",
    "endTime": "17:00",
    "breaks": []
  },
  "wednesday": {
    "available": false,
    "startTime": null,
    "endTime": null,
    "breaks": []
  },
  "thursday": {
    "available": true,
    "startTime": "09:00",
    "endTime": "17:00",
    "breaks": []
  },
  "friday": {
    "available": true,
    "startTime": "09:00",
    "endTime": "15:00",
    "breaks": []
  },
  "saturday": {
    "available": true,
    "startTime": "10:00",
    "endTime": "14:00",
    "breaks": []
  },
  "sunday": {
    "available": false,
    "startTime": null,
    "endTime": null,
    "breaks": []
  },
  "timezone": "America/Los_Angeles",
  "specialDates": [
    {
      "date": "2024-12-25",
      "available": false,
      "reason": "Holiday"
    }
  ]
}
```

### Example Document

```json
{
  "name": "ABC Plumbing Services",
  "serviceType": "Plumbing",
  "hourlyRate": 75.00,
  "locationText": "Greater Seattle Area, WA",
  "availability": {
    "monday": {"available": true, "startTime": "09:00", "endTime": "17:00", "breaks": [{"start": "12:00", "end": "13:00"}]},
    "tuesday": {"available": true, "startTime": "09:00", "endTime": "17:00", "breaks": []},
    "wednesday": {"available": false, "startTime": null, "endTime": null, "breaks": []},
    "thursday": {"available": true, "startTime": "09:00", "endTime": "17:00", "breaks": []},
    "friday": {"available": true, "startTime": "09:00", "endTime": "15:00", "breaks": []},
    "saturday": {"available": true, "startTime": "10:00", "endTime": "14:00", "breaks": []},
    "sunday": {"available": false, "startTime": null, "endTime": null, "breaks": []},
    "timezone": "America/Los_Angeles"
  },
  "email": "contact@abcplumbing.com",
  "phone": "+1-555-987-6543",
  "rating": 4.8,
  "totalReviews": 127,
  "isActive": true,
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-25T16:45:00Z"
}
```

### Indexes Required
- `serviceType` (for filtering by service type)
- `locationText` (for location-based searches)
- `isActive` (for filtering active professionals)
- `hourlyRate` (for sorting by price)
- `rating` (for sorting by rating)

---

## Collection: `services`

A simple dictionary/reference collection of available service types.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Service type identifier (slug) | `"plumbing"` |
| `name` | `string` | ✅ | Display name of the service | `"Plumbing"` |
| `description` | `string` | ❌ | Service description | `"Plumbing repairs and installations"` |
| `icon` | `string` | ❌ | Icon identifier or URL | `"wrench"` |
| `isActive` | `boolean` | ✅ | Whether service type is available | `true` |
| `order` | `number` | ❌ | Display order for sorting | `1` |

### Example Documents

```json
// Document ID: "plumbing"
{
  "name": "Plumbing",
  "description": "Plumbing repairs and installations",
  "icon": "wrench",
  "isActive": true,
  "order": 1
}

// Document ID: "electrical"
{
  "name": "Electrical",
  "description": "Electrical work and repairs",
  "icon": "bolt",
  "isActive": true,
  "order": 2
}

// Document ID: "hvac"
{
  "name": "HVAC",
  "description": "Heating, ventilation, and air conditioning",
  "icon": "thermometer",
  "isActive": true,
  "order": 3
}
```

### Indexes Required
- `isActive` (for filtering active services)
- `order` (for sorting)

---

## Collection: `bookings`

Stores appointment records linking customers to professionals.

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Auto-generated booking ID | `"booking_abc123xyz"` |
| `userId` | `string` | ✅ | Reference to users collection (Firebase Auth UID) | `"user_abc123"` |
| `professionalId` | `string` | ✅ | Reference to professionals collection | `"pro_xyz789"` |
| `date` | `timestamp` | ✅ | Booking date and time | `2024-02-15T14:00:00Z` |
| `duration` | `number` | ✅ | Duration in hours | `2` |
| `status` | `string` | ✅ | Booking status (enum) | `"Confirmed"` |
| `serviceType` | `string` | ✅ | Type of service (for quick reference) | `"Plumbing"` |
| `totalCost` | `number` | ✅ | Total cost in USD (hourlyRate × duration) | `150.00` |
| `address` | `string` | ❌ | Service address | `"123 Main St, Anytown"` |
| `notes` | `string` | ❌ | Customer notes or special requests | `"Please call before arrival"` |
| `createdAt` | `timestamp` | ✅ | Booking creation timestamp | `2024-01-20T10:00:00Z` |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp | `2024-01-25T14:30:00Z` |
| `cancelledAt` | `timestamp` | ❌ | Cancellation timestamp (if cancelled) | `null` |
| `cancelledBy` | `string` | ❌ | Who cancelled: "user" or "professional" | `null` |
| `completedAt` | `timestamp` | ❌ | Completion timestamp (if completed) | `null` |

### Status Enum Values

The `status` field must be one of:
- `"Pending"` - Booking created, awaiting confirmation
- `"Confirmed"` - Booking confirmed by professional
- `"Completed"` - Service has been completed
- `"Cancelled"` - Booking has been cancelled

### Example Documents

```json
// Active booking
{
  "userId": "user_abc123",
  "professionalId": "pro_xyz789",
  "date": "2024-02-15T14:00:00Z",
  "duration": 2,
  "status": "Confirmed",
  "serviceType": "Plumbing",
  "totalCost": 150.00,
  "address": "123 Main St, Anytown, ST 12345",
  "notes": "Please call before arrival",
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-25T14:30:00Z",
  "cancelledAt": null,
  "cancelledBy": null,
  "completedAt": null
}

// Completed booking
{
  "userId": "user_def456",
  "professionalId": "pro_abc123",
  "date": "2024-01-10T09:00:00Z",
  "duration": 3,
  "status": "Completed",
  "serviceType": "Electrical",
  "totalCost": 225.00,
  "address": "456 Oak Ave, City, ST 67890",
  "notes": "",
  "createdAt": "2024-01-05T08:00:00Z",
  "updatedAt": "2024-01-10T12:00:00Z",
  "cancelledAt": null,
  "cancelledBy": null,
  "completedAt": "2024-01-10T12:00:00Z"
}

// Cancelled booking
{
  "userId": "user_ghi789",
  "professionalId": "pro_def456",
  "date": "2024-02-20T10:00:00Z",
  "duration": 1,
  "status": "Cancelled",
  "serviceType": "HVAC",
  "totalCost": 80.00,
  "address": "789 Pine Rd, Town, ST 11111",
  "notes": "",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-18T15:00:00Z",
  "cancelledAt": "2024-01-18T15:00:00Z",
  "cancelledBy": "user",
  "completedAt": null
}
```

### Indexes Required
- `userId` (for user's booking history)
- `professionalId` (for professional's schedule)
- `date` (for date-based queries)
- `status` (for filtering by status)
- `serviceType` (for service-based queries)
- Composite: `userId` + `status` (for user's bookings by status)
- Composite: `professionalId` + `date` (for professional's schedule)
- Composite: `status` + `date` (for upcoming bookings)

---

## Data Relationships

```
users (1) ──────< (many) bookings (many) >────── (1) professionals
                                                         │
                                                         │ references
                                                         ▼
                                                    services
```

### Relationship Rules

1. **users ↔ bookings**: One-to-many
   - One user can have many bookings
   - Each booking belongs to one user

2. **professionals ↔ bookings**: One-to-many
   - One professional can have many bookings
   - Each booking belongs to one professional

3. **services ↔ professionals**: One-to-many (via reference)
   - One service type can have many professionals
   - Each professional provides one service type (referenced by `serviceType` field)

---

## Security Rules Considerations

When implementing Firestore security rules, consider:

1. **users**: Users can read/write their own document
2. **professionals**: Public read, write by owner
3. **services**: Public read, admin write
4. **bookings**: Users can read their own bookings, professionals can read their bookings, write requires authentication

---

## Query Patterns

### Common Queries

1. **Get user's bookings:**
   ```javascript
   db.collection('bookings')
     .where('userId', '==', currentUserId)
     .orderBy('date', 'desc')
   ```

2. **Get professionals by service type:**
   ```javascript
   db.collection('professionals')
     .where('serviceType', '==', 'Plumbing')
     .where('isActive', '==', true)
   ```

3. **Get upcoming bookings for professional:**
   ```javascript
   db.collection('bookings')
     .where('professionalId', '==', professionalId)
     .where('date', '>=', new Date())
     .where('status', 'in', ['Pending', 'Confirmed'])
     .orderBy('date', 'asc')
   ```

4. **Get all active services:**
   ```javascript
   db.collection('services')
     .where('isActive', '==', true)
     .orderBy('order', 'asc')
   ```

---

## Migration Notes

- All timestamps should use Firestore's `Timestamp` type
- Document IDs can be auto-generated or custom (recommend auto-generated for bookings)
- Consider adding soft delete fields (`deletedAt`) if needed
- Add version field for schema migrations if required

