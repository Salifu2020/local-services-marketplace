# Firestore Notifications Data Model

This document defines the Firestore database structure for the notifications/messaging system.

## Overview

The notifications system provides real-time alerts to users about important events in the app, such as booking confirmations, reminders, and new messages.

---

## Collection: `notifications`

Subcollection under each user document storing their notifications.

### Collection Path

```
/artifacts/{appId}/users/{userId}/notifications/{notificationId}
```

### Document Structure

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Auto-generated notification ID | `"notif_abc123"` |
| `userId` | `string` | ✅ | User ID of the notification recipient | `"user_abc123"` |
| `message` | `string` | ✅ | Notification message text | `"Your booking has been confirmed!"` |
| `type` | `string` | ✅ | Notification type (enum) | `"BOOKING_CONFIRMED"` |
| `read` | `boolean` | ✅ | Whether notification has been read | `false` |
| `timestamp` | `timestamp` | ✅ | When notification was created | `2024-01-20T14:30:00Z` |
| `relatedId` | `string` | ❌ | Related entity ID (e.g., bookingId) | `"booking_xyz789"` |
| `metadata` | `object` | ❌ | Additional data (optional) | `{ bookingDate: "2024-01-25" }` |

### Notification Types

| Type | Description | When Sent |
|------|-------------|-----------|
| `BOOKING_CONFIRMED` | Booking has been confirmed by professional | When professional confirms a booking |
| `BOOKING_CANCELLED` | Booking has been cancelled | When booking is declined or cancelled |
| `BOOKING_COMPLETED` | Service has been completed | When professional marks booking as completed |
| `PAYMENT_RECEIVED` | Payment has been received | When customer pays for completed service |
| `PAYMENT_REMINDER` | Payment reminder for completed service | When payment is overdue |
| `NEW_MESSAGE` | New message in chat | When new message is sent in chat |
| `REMINDER_24HR` | 24-hour booking reminder | 24 hours before scheduled booking |
| `REVIEW_REQUEST` | Request to leave a review | After service completion |

### Example Documents

```json
// Booking Confirmed Notification
{
  "userId": "user_abc123",
  "message": "Your booking with John's Plumbing has been confirmed for Jan 25, 2024 at 2:00 PM",
  "type": "BOOKING_CONFIRMED",
  "read": false,
  "timestamp": "2024-01-20T14:30:00Z",
  "relatedId": "booking_xyz789",
  "metadata": {
    "bookingDate": "2024-01-25",
    "professionalName": "John's Plumbing"
  }
}

// New Message Notification
{
  "userId": "user_abc123",
  "message": "You have a new message from John's Plumbing",
  "type": "NEW_MESSAGE",
  "read": false,
  "timestamp": "2024-01-20T15:45:00Z",
  "relatedId": "booking_xyz789"
}

// Payment Reminder
{
  "userId": "user_abc123",
  "message": "Payment pending for your completed service on Jan 25, 2024",
  "type": "PAYMENT_REMINDER",
  "read": false,
  "timestamp": "2024-01-26T10:00:00Z",
  "relatedId": "booking_xyz789"
}
```

---

## Indexes Required

### For Notification Queries

- Composite index on `timestamp` (for ordering notifications)
  - Collection: `users/{userId}/notifications`
  - Fields: `timestamp` (Descending)

- Composite index on `read` and `timestamp` (for unread notifications)
  - Collection: `users/{userId}/notifications`
  - Fields: `read` (Ascending), `timestamp` (Descending)

---

## Query Patterns

### Get All Notifications for User (Ordered by Time)
```javascript
const notificationsRef = collection(
  db,
  'artifacts',
  appId,
  'users',
  userId,
  'notifications'
);
const notificationsQuery = query(
  notificationsRef,
  orderBy('timestamp', 'desc')
);
const snapshot = await getDocs(notificationsQuery);
```

### Get Unread Notifications
```javascript
const notificationsQuery = query(
  notificationsRef,
  where('read', '==', false),
  orderBy('timestamp', 'desc')
);
```

### Listen to Notifications in Real-Time
```javascript
const notificationsQuery = query(
  notificationsRef,
  orderBy('timestamp', 'desc')
);
onSnapshot(notificationsQuery, (snapshot) => {
  // Handle real-time updates
});
```

---

## Security Rules Considerations

### Notification Access
- Users can only read their own notifications
- System can write notifications to any user's collection
- Users can update `read` status of their notifications

Example rules:
```javascript
match /artifacts/{appId}/users/{userId}/notifications/{notificationId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null; // System can create for any user
  allow update: if request.auth != null && 
    request.auth.uid == userId &&
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['read']);
}
```

---

## Notification Lifecycle

1. **Creation**: Notification created when event occurs
2. **Delivery**: User sees notification in real-time via `onSnapshot`
3. **Read**: User marks notification as read
4. **Archive**: Old notifications can be archived or deleted

---

## Integration Points

### Booking Status Changes
- `BOOKING_CONFIRMED`: Sent to customer when professional confirms
- `BOOKING_CANCELLED`: Sent to customer when booking is declined/cancelled
- `BOOKING_COMPLETED`: Sent to customer when professional marks as completed

### Payment Events
- `PAYMENT_RECEIVED`: Sent to professional when customer pays
- `PAYMENT_REMINDER`: Sent to customer if payment overdue

### Messaging
- `NEW_MESSAGE`: Sent when new message arrives in chat

### Reminders
- `REMINDER_24HR`: Sent 24 hours before scheduled booking

---

## Notes

- Notifications are stored per-user for privacy and scalability
- Real-time updates via `onSnapshot` provide instant delivery
- `read` field allows tracking of unread notifications
- `relatedId` links notification to relevant entity (booking, chat, etc.)
- `metadata` field allows storing additional context without schema changes

