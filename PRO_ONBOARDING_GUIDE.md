# Professional Onboarding Guide

## Overview

The `/pro-onboarding` route provides a multi-step form for professionals to set up their profile.

## Features

- ✅ 4-step form with progress indicator
- ✅ Service Type dropdown (based on mock data)
- ✅ Hourly Rate input ($/hr)
- ✅ Location/Service Area text input
- ✅ Short Bio textarea
- ✅ Form validation
- ✅ Saves to Firestore at: `/artifacts/{appId}/public/data/professionals/{userId}`

## Form Steps

### Step 1: Service Type
- Dropdown selection
- Options: Plumber, Electrician, HVAC, Carpenter, Painter, etc.

### Step 2: Hourly Rate
- Number input with $ prefix
- Validates: must be > 0

### Step 3: Location/Service Area
- Text input
- Example: "Greater Seattle Area, WA"

### Step 4: Short Bio
- Textarea (6 rows)
- Character counter
- Required field

## Firestore Path

The `saveProfessionalProfile` function saves data to:
```
/artifacts/{appId}/public/data/professionals/{userId}
```

Where:
- `appId` = Firebase app ID from config (e.g., "1:530737726016:web:2ddee802c22c31c1d055a5")
- `userId` = Current authenticated user's UID

## Data Structure Saved

```json
{
  "serviceType": "Plumber",
  "hourlyRate": 75.00,
  "location": "Greater Seattle Area, WA",
  "bio": "Experienced plumber with 10+ years...",
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-20T10:00:00Z",
  "userId": "abc123xyz789"
}
```

## Navigation

- Access via: `/pro-onboarding`
- "Become a Pro" button in navigation bar
- Back button to return home
- Redirects to home after successful submission

## Testing

1. Navigate to `/pro-onboarding`
2. Fill out all 4 steps
3. Click "Complete Profile"
4. Check Firestore console for saved data
5. Verify path: `artifacts/{appId}/public/data/professionals/{userId}`

