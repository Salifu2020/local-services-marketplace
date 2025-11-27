# Firestore Security Rules Documentation

This document outlines the minimum Firestore Security Rules required for the Local Services Marketplace application to function securely.

## Overview

The application uses a nested Firestore structure under `/artifacts/{appId}/`. Security rules must be configured to protect user data while allowing appropriate public access to professional listings.

## Rule Structure

All rules are scoped under the `artifacts/{appId}` path structure. The `appId` variable is extracted from the document path.

## 1. Public Collections: Professionals

**Path:** `/artifacts/{appId}/public/data/professionals/{professionalId}`

**Requirements:**
- **Read:** Public (anyone can read professional profiles)
- **Write:** Restricted to document owner only (professional can only update their own profile)

**Rule:**
```javascript
match /artifacts/{appId}/public/data/professionals/{professionalId} {
  // Allow public read access
  allow read: if true;
  
  // Only allow the professional to write to their own document
  allow write: if request.auth != null && 
                 request.auth.uid == professionalId;
  
  // Allow public read access to reviews subcollection
  allow read: if true;
  
  match /reviews/{reviewId} {
    // Anyone can read reviews
    allow read: if true;
    
    // Only authenticated users can create reviews
    // Users can only update/delete their own reviews
    allow create: if request.auth != null;
    allow update, delete: if request.auth != null && 
                            request.resource.data.userId == request.auth.uid;
  }
}
```

**Rationale:**
- Professional profiles need to be publicly searchable by customers
- Professionals should only be able to modify their own profiles to prevent unauthorized changes
- Reviews should be publicly readable but only the reviewer can modify their own review

---

## 2. Private Collections: User Notifications

**Path:** `/artifacts/{appId}/users/{userId}/notifications/{notificationId}`

**Requirements:**
- **Read:** Only the document owner (userId) can read
- **Write:** Only the document owner (userId) can write

**Rule:**
```javascript
match /artifacts/{appId}/users/{userId}/notifications/{notificationId} {
  // Only the user can read their own notifications
  allow read: if request.auth != null && 
                request.auth.uid == userId;
  
  // Only the user can write to their own notifications
  // Note: In production, notifications are typically created by server-side functions
  // This rule allows the user to mark notifications as read
  allow write: if request.auth != null && 
                 request.auth.uid == userId &&
                 // Only allow updating the 'read' field
                 (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['userId', 'message', 'type', 'timestamp']));
}
```

**Rationale:**
- Notifications are private user data
- Users should only see their own notifications
- Users can mark notifications as read, but cannot modify other fields

---

## 3. Shared Collections: Bookings

**Path:** `/artifacts/{appId}/public/data/bookings/{bookingId}`

**Requirements:**
- **Read:** Only participants (userId or professionalId) can read
- **Write:** Only participants can create/update (with restrictions)

**Rule:**
```javascript
match /artifacts/{appId}/public/data/bookings/{bookingId} {
  // Allow read if user is either the customer or the professional
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    resource.data.professionalId == request.auth.uid
  );
  
  // Allow create if user is the customer (userId)
  allow create: if request.auth != null && 
                  request.resource.data.userId == request.auth.uid;
  
  // Allow update if user is the professional (can confirm/decline/complete)
  // or if user is the customer (can cancel)
  allow update: if request.auth != null && (
    resource.data.professionalId == request.auth.uid ||
    (resource.data.userId == request.auth.uid && 
     request.resource.data.status == 'Cancelled')
  );
  
  // Only allow delete by the customer who created it (before confirmation)
  allow delete: if request.auth != null && 
                  resource.data.userId == request.auth.uid &&
                  resource.data.status == 'Pending';
}
```

**Rationale:**
- Bookings contain sensitive information (dates, times, customer details)
- Only the customer and professional involved should access the booking
- Customers can create bookings and cancel pending ones
- Professionals can update booking status (confirm, decline, complete)

---

## 4. Shared Collections: Chats

**Path:** `/artifacts/{appId}/public/data/chats/{bookingId}/messages/{messageId}`

**Requirements:**
- **Read:** Only participants (userId or proId from chat document) can read
- **Write:** Only participants can create messages

**Rule:**
```javascript
match /artifacts/{appId}/public/data/chats/{bookingId} {
  // Allow read if user is a participant
  allow read: if request.auth != null && (
    resource.data.participants.hasAny([request.auth.uid])
  );
  
  // Allow create if user is a participant
  allow create: if request.auth != null && 
                  request.resource.data.participants.hasAny([request.auth.uid]);
  
  // Allow update only to add participants (if needed)
  allow update: if request.auth != null && 
                 resource.data.participants.hasAny([request.auth.uid]);
  
  // Messages subcollection
  match /messages/{messageId} {
    // Allow read if user is a participant in the parent chat
    allow read: if request.auth != null && 
                  get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants.hasAny([request.auth.uid]);
    
    // Allow create if user is a participant and senderId matches
    allow create: if request.auth != null && 
                    request.resource.data.senderId == request.auth.uid &&
                    get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants.hasAny([request.auth.uid]);
    
    // Users can only update/delete their own messages
    allow update, delete: if request.auth != null && 
                           resource.data.senderId == request.auth.uid;
  }
}
```

**Rationale:**
- Chat messages are private conversations
- Only participants in the chat should access messages
- Users can only send messages as themselves (senderId must match auth.uid)
- Users can edit/delete their own messages

---

## 5. User Data Collection

**Path:** `/artifacts/{appId}/public/data/users/{userId}`

**Requirements:**
- **Read:** Public read (for basic user info like name)
- **Write:** Only the document owner can write

**Rule:**
```javascript
match /artifacts/{appId}/public/data/users/{userId} {
  // Allow public read access (for displaying user names)
  allow read: if true;
  
  // Only the user can write to their own document
  allow write: if request.auth != null && 
                 request.auth.uid == userId;
}
```

**Rationale:**
- Basic user information (name, email) may need to be publicly readable for display purposes
- Users should only be able to modify their own data

---

## 6. Admin Access

**Path:** All collections

**Requirements:**
- Hardcoded admin user ID can read any collection
- Admin can write to specific collections for management purposes

**Rule:**
```javascript
// Hardcoded admin user ID
function isAdmin() {
  return request.auth != null && 
         request.auth.uid == 'admin-123';
}

// Apply admin access to all rules
match /artifacts/{appId}/{document=**} {
  // Admin can read everything
  allow read: if isAdmin();
  
  // Admin can write to specific collections (add as needed)
  allow write: if isAdmin() && 
                 (document.path.matches('/artifacts/{appId}/public/data/professionals/{professionalId}') ||
                  document.path.matches('/artifacts/{appId}/public/data/bookings/{bookingId}'));
}
```

**Alternative Approach (More Granular):**
```javascript
// Add admin check to each collection rule
function isAdmin() {
  return request.auth != null && 
         request.auth.uid == 'admin-123';
}

// Example: Professionals with admin override
match /artifacts/{appId}/public/data/professionals/{professionalId} {
  allow read: if true || isAdmin();
  allow write: if (request.auth != null && 
                    request.auth.uid == professionalId) || 
                 isAdmin();
}
```

**Rationale:**
- Admin needs read access to all collections for analytics and management
- Admin write access should be limited to specific use cases (e.g., moderation, data fixes)
- Hardcoded admin ID matches the client-side access control in `/admin-dashboard`

---

## Complete Rules Template

Here is a complete Firestore Security Rules template combining all the above rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid == 'admin-123';
    }
    
    // Helper function to get appId from path
    function getAppId() {
      return request.path.split('/')[2];
    }
    
    // ============================================
    // PUBLIC DATA COLLECTIONS
    // ============================================
    
    // Professionals Collection
    match /artifacts/{appId}/public/data/professionals/{professionalId} {
      // Public read, owner write (or admin)
      allow read: if true || isAdmin();
      allow write: if (request.auth != null && 
                        request.auth.uid == professionalId) || 
                     isAdmin();
      
      // Reviews Subcollection
      match /reviews/{reviewId} {
        allow read: if true || isAdmin();
        allow create: if request.auth != null || isAdmin();
        allow update, delete: if (request.auth != null && 
                                    resource.data.userId == request.auth.uid) || 
                                 isAdmin();
      }
    }
    
    // Users Collection
    match /artifacts/{appId}/public/data/users/{userId} {
      allow read: if true || isAdmin();
      allow write: if (request.auth != null && 
                        request.auth.uid == userId) || 
                     isAdmin();
    }
    
    // Bookings Collection
    match /artifacts/{appId}/public/data/bookings/{bookingId} {
      allow read: if isAdmin() || 
                    (request.auth != null && (
                      resource.data.userId == request.auth.uid ||
                      resource.data.professionalId == request.auth.uid
                    ));
      
      allow create: if (request.auth != null && 
                         request.resource.data.userId == request.auth.uid) || 
                      isAdmin();
      
      allow update: if isAdmin() || 
                     (request.auth != null && (
                       resource.data.professionalId == request.auth.uid ||
                       (resource.data.userId == request.auth.uid && 
                        request.resource.data.status == 'Cancelled')
                     ));
      
      allow delete: if isAdmin() || 
                     (request.auth != null && 
                      resource.data.userId == request.auth.uid &&
                      resource.data.status == 'Pending');
    }
    
    // Chats Collection
    match /artifacts/{appId}/public/data/chats/{bookingId} {
      allow read: if isAdmin() || 
                    (request.auth != null && 
                     resource.data.participants.hasAny([request.auth.uid]));
      
      allow create: if isAdmin() || 
                      (request.auth != null && 
                       request.resource.data.participants.hasAny([request.auth.uid]));
      
      allow update: if isAdmin() || 
                     (request.auth != null && 
                      resource.data.participants.hasAny([request.auth.uid]));
      
      // Messages Subcollection
      match /messages/{messageId} {
        allow read: if isAdmin() || 
                      (request.auth != null && 
                       get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants.hasAny([request.auth.uid]));
        
        allow create: if isAdmin() || 
                        (request.auth != null && 
                         request.resource.data.senderId == request.auth.uid &&
                         get(/databases/$(database)/documents/artifacts/$(appId)/public/data/chats/$(bookingId)).data.participants.hasAny([request.auth.uid]));
        
        allow update, delete: if isAdmin() || 
                                (request.auth != null && 
                                 resource.data.senderId == request.auth.uid);
      }
    }
    
    // ============================================
    // PRIVATE USER COLLECTIONS
    // ============================================
    
    // User Notifications
    match /artifacts/{appId}/users/{userId}/notifications/{notificationId} {
      allow read: if isAdmin() || 
                    (request.auth != null && 
                     request.auth.uid == userId);
      
      allow write: if isAdmin() || 
                     (request.auth != null && 
                      request.auth.uid == userId &&
                      // Only allow updating the 'read' field
                      (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['userId', 'message', 'type', 'timestamp'])));
    }
    
    // ============================================
    // DEFAULT DENY
    // ============================================
    
    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Security Best Practices

### 1. Authentication Required
- All write operations require authentication (`request.auth != null`)
- Public read access is limited to non-sensitive collections (professionals, users)

### 2. Owner-Only Writes
- Users can only modify their own documents
- Professionals can only update their own profiles
- Participants can only modify their own messages

### 3. Data Validation
- Validate that `userId` matches `request.auth.uid` on create
- Validate that `senderId` matches `request.auth.uid` for messages
- Prevent unauthorized field modifications (e.g., notifications)

### 4. Admin Access
- Hardcoded admin ID for management access
- Admin can read all collections for analytics
- Admin write access should be limited and audited

### 5. Testing Rules
Before deploying, test rules using the Firestore Rules Playground:
1. Go to Firebase Console → Firestore Database → Rules
2. Use the Rules Playground to simulate read/write operations
3. Test with different user IDs and scenarios

---

## Common Issues and Solutions

### Issue: "Permission Denied" Errors

**Possible Causes:**
1. User not authenticated
2. User trying to access another user's data
3. User trying to write to a collection they don't own
4. Missing or incorrect security rules

**Solutions:**
- Verify user is authenticated: `request.auth != null`
- Check that user ID matches document owner
- Ensure rules are deployed and active
- Check browser console for specific error codes

### Issue: Admin Cannot Access Data

**Solution:**
- Verify admin user ID matches hardcoded value in rules
- Ensure admin is authenticated
- Check that admin rules are properly scoped

### Issue: Public Read Not Working

**Solution:**
- Verify `allow read: if true;` is present
- Check that path matches exactly
- Ensure no parent rule is denying access

---

## Deployment Instructions

1. **Access Firestore Rules:**
   - Go to Firebase Console
   - Navigate to Firestore Database → Rules

2. **Copy Rules:**
   - Copy the complete rules template above
   - Paste into the Rules editor

3. **Update Admin ID:**
   - Replace `'admin-123'` with your actual admin user ID
   - Ensure it matches the client-side admin check

4. **Test Rules:**
   - Use the Rules Playground to test various scenarios
   - Verify read/write permissions work as expected

5. **Publish:**
   - Click "Publish" to deploy rules
   - Rules take effect immediately

---

## Notes

- **Production Considerations:**
  - Replace hardcoded admin ID with a more secure method (e.g., custom claims)
  - Consider rate limiting for write operations
  - Add logging for security rule violations
  - Regularly audit and update rules as features evolve

- **Development:**
  - Use Firebase Emulator Suite to test rules locally
  - Test with different user scenarios
  - Verify edge cases (deleted users, missing data, etc.)

- **Monitoring:**
  - Monitor Firestore usage in Firebase Console
  - Set up alerts for permission denied errors
  - Review security rules regularly

---

## Rule Testing Checklist

Before deploying to production, verify:

- [ ] Public can read professional profiles
- [ ] Professionals can only update their own profiles
- [ ] Users can only read their own notifications
- [ ] Only booking participants can read bookings
- [ ] Only chat participants can read messages
- [ ] Admin can read all collections
- [ ] Unauthenticated users cannot write
- [ ] Users cannot access other users' private data
- [ ] Review creation/editing works correctly
- [ ] Booking status updates are restricted appropriately

---

**Last Updated:** 2024
**Version:** 1.0

