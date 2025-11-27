# Local Services Marketplace - Customer Portal

A modern, full-stack React application for connecting customers with local service professionals. Built with React, Firebase, and Tailwind CSS.

## 🚀 Technology Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router DOM 6.21.1** - Client-side routing
- **Vite 5.0.8** - Build tool and dev server
- **Tailwind CSS 3.4.0** - Utility-first CSS framework

### Backend & Services
- **Firebase Authentication** - User authentication (anonymous & custom tokens)
- **Cloud Firestore** - NoSQL database for real-time data
- **Firebase Analytics** - Usage analytics

### Development Tools
- **TypeScript Types** - Type definitions for React
- **PostCSS & Autoprefixer** - CSS processing
- **ESLint** - Code linting (if configured)

## ✨ Key Features

### For Customers

1. **Professional Search**
   - Search by service type, keywords, or location
   - Location-based filtering with distance calculation
   - Max distance filter (5km, 10km, 25km, All)
   - Results sorted by proximity
   - Real-time professional listings

2. **Professional Profiles**
   - Detailed professional information
   - Average ratings and reviews
   - Service type and hourly rates
   - Location and service area
   - Professional bio and availability

3. **Booking System**
   - Interactive calendar for date selection
   - Time slot selection based on professional availability
   - Real-time availability checking
   - Booking status tracking (Pending, Confirmed, Completed, Cancelled)
   - Rebook functionality for past completed bookings

4. **Reviews & Ratings**
   - 5-star rating system
   - Written reviews with comments
   - Average rating calculation
   - Review sorting (newest first)
   - Public review display

5. **Favorites**
   - Heart icon to favorite professionals
   - Dedicated favorites page
   - Quick access to favorite professionals

6. **Messaging**
   - Real-time chat with professionals
   - Chat history per booking
   - Message notifications
   - Organized chat list

7. **Bookings Management**
   - View all bookings (Upcoming & Past Jobs)
   - Payment processing for completed jobs
   - Booking status updates
   - Direct messaging from bookings

### For Professionals

1. **Onboarding**
   - Multi-step profile creation
   - Service type selection
   - Hourly rate setting
   - Location and service area
   - Professional bio (50-500 characters)
   - External calendar link integration (mock)
   - Weekly availability schedule

2. **Dashboard**
   - View all bookings
   - Confirm/decline pending bookings
   - Mark bookings as completed
   - Real-time booking updates
   - Payment status tracking

3. **Availability Management**
   - Weekly schedule (Monday-Sunday)
   - Per-day availability toggle
   - Start and end time selection
   - Real-time schedule updates
   - External calendar integration display

### Additional Features

1. **Notifications**
   - Real-time notification system
   - Bell icon with unread count badge
   - Notification dropdown
   - Mark as read functionality
   - Notification types: Booking confirmations, cancellations, messages, reminders

2. **Admin Dashboard**
   - Access-controlled admin view
   - User and professional counts
   - Booking analytics by status
   - Mock revenue tracking
   - Platform overview

3. **Responsive Design**
   - Mobile-first approach
   - Fully responsive layouts
   - Touch-friendly interfaces
   - Optimized for all screen sizes

4. **Performance Optimizations**
   - Global data caching
   - Professional profile caching
   - Optimized Firestore queries
   - Code splitting with React.lazy
   - Efficient real-time listeners

## 📁 Project Structure

```
localServicesApp/
├── src/
│   ├── components/          # Reusable components
│   │   ├── AvailabilitySchedule.jsx
│   │   ├── NotificationBell.jsx
│   │   └── ProfessionalCard.jsx
│   ├── context/             # React Context providers
│   │   ├── ToastContext.jsx
│   │   └── LoadingContext.jsx
│   ├── hooks/                # Custom React hooks
│   │   └── useFavorites.js
│   ├── pages/                # Page components
│   │   ├── AdminDashboard.jsx
│   │   ├── BookingPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── MyBookings.jsx
│   │   ├── MyFavorites.jsx
│   │   ├── MyMessages.jsx
│   │   ├── ProfessionalDetails.jsx
│   │   └── ProDashboard.jsx
│   ├── utils/                # Utility functions
│   │   ├── geocoding.js      # Mock geocoding
│   │   └── notifications.js   # Notification helpers
│   ├── App.jsx               # Main app component
│   ├── ProOnboarding.jsx     # Professional onboarding
│   ├── firebase.js           # Firebase configuration
│   ├── main.jsx              # App entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── package.json              # Dependencies
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Firebase Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd localServicesApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/firebase.js` with your Firebase configuration
   - Ensure Firestore is enabled in Firebase Console
   - Set up Firestore Security Rules (see `FIRESTORE_SECURITY_RULES.md`)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3001` (or port shown in terminal)

## 🏗️ Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## 📚 Documentation

- **FIRESTORE_DATA_MODEL.md** - Complete Firestore database structure
- **FIRESTORE_SECURITY_RULES.md** - Security rules documentation
- **FIRESTORE_PERFORMANCE_OPTIMIZATION.md** - Performance optimization strategies
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment review checklist
- **FIREBASE_SETUP.md** - Firebase setup instructions
- **PRO_ONBOARDING_GUIDE.md** - Professional onboarding guide

## 🔒 Security

- Firestore Security Rules enforce data access controls
- Authentication required for write operations
- Owner-only access for private data
- Participant-only access for shared data (bookings, chats)
- Admin access restricted to hardcoded admin ID

See `FIRESTORE_SECURITY_RULES.md` for complete security rules documentation.

## 🎨 Styling

The application uses Tailwind CSS for styling:
- Custom color palette
- Responsive breakpoints
- Component classes
- Dark mode support (if configured)
- Custom animations

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🧪 Testing

Before deployment, ensure:
- All features are tested
- Error handling is comprehensive
- Responsive design works on all devices
- Accessibility standards are met
- Security rules are deployed

See `DEPLOYMENT_CHECKLIST.md` for complete testing checklist.

## 📊 Performance

The application implements several performance optimizations:
- Global data caching for static content
- Professional profile caching
- Optimized Firestore queries with indexes
- Code splitting with React.lazy
- Efficient real-time listeners

Expected read reduction: ~77% compared to non-optimized implementation.

## 🚀 Deployment

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy --only hosting`

### Other Platforms

The `dist/` folder can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

## 📝 Environment Variables

If using environment variables, create a `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

## 🤝 Contributing

1. Follow the existing code style
2. Ensure all features are tested
3. Update documentation as needed
4. Follow the deployment checklist before submitting

## 📄 License

[Add your license information here]

## 🆘 Support

For issues or questions:
- Check the documentation files
- Review Firebase Console for errors
- Check browser console for client-side errors
- Verify Firestore Security Rules are deployed

---

**Version:** 1.0  
**Last Updated:** 2024
