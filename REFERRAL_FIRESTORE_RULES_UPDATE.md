# Firestore Rules Update for Referral Program

## Changes Made

### 1. **User Documents Access** (`/artifacts/{appId}/users/{userId}`)
Added rules to allow users to read and write their own user documents:
- **Read**: Users can read their own document (to get referral code)
- **Create/Update**: Users can create/update their own document (to set referral code)
- **Delete**: Disabled (for data retention)

### 2. **Referrals Collection** (`/artifacts/{appId}/public/data/referrals/{referralId}`)
Added rules for the referrals collection:
- **Read**: Users can read referrals where they are the referrer OR the referred user
- **Create**: Users can create referrals when they are the referred user (processing referral code)
- **Update**: Users can update referrals where they are the referrer (for reward status)
- **Delete**: Disabled (for data retention)

### 3. **Professional Packages** (`/artifacts/{appId}/public/data/professionals/{professionalId}/packages/{packageId}`)
Added rules for service packages:
- **Read**: Public read access
- **Write**: Only the professional can create/update/delete their own packages

### 4. **Professional Portfolio** (`/artifacts/{appId}/public/data/professionals/{professionalId}/portfolio/{portfolioId}`)
Added rules for portfolio items:
- **Read**: Public read access
- **Write**: Only the professional can create/update/delete their own portfolio items

## Security Considerations

1. **User Documents**: Users can only access their own documents, preventing unauthorized access to other users' referral codes
2. **Referrals**: Users can only see referrals where they are involved (as referrer or referred user)
3. **Referral Creation**: Only the referred user can create the referral record (when processing their signup)
4. **Referral Updates**: Only the referrer can update referral records (for reward status)

## Deployment

To deploy these rules:

```bash
firebase deploy --only firestore:rules
```

Or if using Firebase CLI:

```bash
firebase deploy --only firestore
```

## Testing

After deploying, test the following:
1. User can read their own user document
2. User can create/update their own user document
3. User can read referrals where they are the referrer
4. User can read referrals where they are the referred user
5. User can create referral when processing signup
6. User can update referral where they are the referrer

