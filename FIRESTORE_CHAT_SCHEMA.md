# Firestore Chat Data Model

This document defines the Firestore database structure for the chat/messaging feature.

## Overview

The chat system is designed to facilitate communication between customers and professionals within the context of a specific booking. Each chat conversation is tied to a booking ID to maintain context.

---

## Collection: `chats`

Root-level collection storing chat conversations linked to bookings.

### Document Structure

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Booking ID (links chat to booking) | `"booking_abc123xyz"` |
| `participants` | `array` | ✅ | Array containing userId and proId | `["user_123", "pro_456"]` |
| `createdAt` | `timestamp` | ✅ | Chat creation timestamp | `2024-01-20T10:00:00Z` |
| `updatedAt` | `timestamp` | ✅ | Last message timestamp | `2024-01-20T14:30:00Z` |

### Example Document

```json
{
  "participants": ["user_abc123", "pro_xyz789"],
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-20T14:30:00Z"
}
```

### Document ID Pattern

- **Format**: `{bookingId}`
- **Example**: If booking ID is `"booking_abc123xyz"`, the chat document ID is `"booking_abc123xyz"`

---

## Subcollection: `chats/{bookingId}/messages`

Stores individual messages within a chat conversation.

### Document Structure

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| **Document ID** | `string` | ✅ | Auto-generated message ID | `"msg_abc123"` |
| `senderId` | `string` | ✅ | User ID of message sender (userId or proId) | `"user_abc123"` |
| `text` | `string` | ✅ | Message text content | `"Hello, when can you arrive?"` |
| `timestamp` | `timestamp` | ✅ | Message timestamp (serverTimestamp preferred) | `2024-01-20T14:30:00Z` |

### Example Document

```json
{
  "senderId": "user_abc123",
  "text": "Hello, when can you arrive?",
  "timestamp": "2024-01-20T14:30:00Z"
}
```

---

## Collection Paths

### Chat Document
```
/artifacts/{appId}/public/data/chats/{bookingId}
```

### Messages Subcollection
```
/artifacts/{appId}/public/data/chats/{bookingId}/messages/{messageId}
```

---

## Indexes Required

### For Chat Queries
- None required for basic queries (using document ID)

### For Messages Queries
- Composite index on `timestamp` (for ordering messages chronologically)
  - Collection: `chats/{bookingId}/messages`
  - Fields: `timestamp` (Ascending)

---

## Query Patterns

### Get Chat by Booking ID
```javascript
const chatRef = doc(db, 'artifacts', appId, 'public', 'data', 'chats', bookingId);
const chatDoc = await getDoc(chatRef);
```

### Get All Messages for a Chat (Ordered by Time)
```javascript
const messagesRef = collection(
  db,
  'artifacts',
  appId,
  'public',
  'data',
  'chats',
  bookingId,
  'messages'
);
const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
const snapshot = await getDocs(messagesQuery);
```

### Listen to Messages in Real-Time
```javascript
const messagesRef = collection(
  db,
  'artifacts',
  appId,
  'public',
  'data',
  'chats',
  bookingId,
  'messages'
);
const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
onSnapshot(messagesQuery, (snapshot) => {
  // Handle real-time updates
});
```

---

## Security Rules Considerations

### Chat Document Access
- Users can read/write if they are in the `participants` array
- Example rule:
```javascript
match /artifacts/{appId}/public/data/chats/{bookingId} {
  allow read, write: if request.auth != null && 
    request.auth.uid in resource.data.participants;
}
```

### Messages Access
- Users can read if they are in the parent chat's participants
- Users can write if they are in the parent chat's participants and senderId matches their auth.uid
- Example rule:
```javascript
match /artifacts/{appId}/public/data/chats/{bookingId}/messages/{messageId} {
  allow read: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants;
  allow create: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants &&
    request.resource.data.senderId == request.auth.uid;
}
```

---

## Relationships

### Chat → Booking
- **One-to-One**: Each chat is linked to exactly one booking via document ID
- **Foreign Key**: Chat document ID = Booking document ID

### Chat → Messages
- **One-to-Many**: Each chat can have multiple messages
- **Relationship**: Subcollection relationship

### Participants
- **Many-to-Many**: Users can participate in multiple chats
- **Constraint**: Each chat has exactly 2 participants (userId and proId)

---

## Data Flow

1. **Chat Creation**: When a user clicks "Message" on a booking:
   - Check if chat document exists for bookingId
   - If not, create chat document with participants array
   - Navigate to chat route

2. **Message Sending**: When user sends a message:
   - Create message document in `chats/{bookingId}/messages` subcollection
   - Set senderId, text, and timestamp
   - Update chat document's `updatedAt` field

3. **Message Retrieval**: When loading chat:
   - Fetch chat document to verify access
   - Query messages subcollection ordered by timestamp
   - Use `onSnapshot` for real-time updates

---

## Notes

- Chat documents are created lazily (on first message or when "Message" is clicked)
- Messages are ordered chronologically (oldest first) for display
- Server timestamps are preferred for consistency across timezones
- Chat document `updatedAt` is updated whenever a new message is sent

