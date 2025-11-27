import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, appId } from './firebase';
import { setDoc, doc } from 'firebase/firestore';
import AvailabilitySchedule from './components/AvailabilitySchedule';
import { mockGeocode } from './utils/geocoding';
import { useToast } from './context/ToastContext';
import { useLoading } from './context/LoadingContext';

// Mock service types data
const SERVICE_TYPES = [
  'Plumber',
  'Electrician',
  'HVAC',
  'Carpenter',
  'Painter',
  'Landscaper',
  'Roofer',
  'Handyman',
  'Locksmith',
  'Appliance Repair',
  'Flooring',
];

function ProOnboarding() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    serviceType: '',
    hourlyRate: '',
    location: '',
    bio: '',
  });
  const [formData, setFormData] = useState({
    serviceType: '',
    hourlyRate: '',
    location: '',
    bio: '',
    calendarLink: '',
  });

    // Test Firestore connection on mount (removed debug logs)

  const totalSteps = 6;

  // Validation functions for each field
  const validateServiceType = (value) => {
    if (!value || value.trim() === '') {
      return 'Service Type is required. Please select a service type.';
    }
    return '';
  };

  const validateHourlyRate = (value) => {
    if (!value || value.trim() === '') {
      return 'Hourly Rate is required. Please enter your hourly rate.';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Hourly Rate must be a valid number.';
    }
    if (numValue <= 0) {
      return 'Hourly Rate must be greater than 0.';
    }
    return '';
  };

  const validateLocation = (value) => {
    if (!value || value.trim() === '') {
      return 'Location/Service Area is required. Please enter your service area.';
    }
    return '';
  };

  const validateBio = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '') {
      return 'Short Bio is required. Please tell customers about yourself.';
    }
    if (trimmedValue.length < 50) {
      return `Bio must be at least 50 characters. You have ${trimmedValue.length} characters.`;
    }
    if (trimmedValue.length > 500) {
      return `Bio must not exceed 500 characters. You have ${trimmedValue.length} characters.`;
    }
    return '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate the field in real-time and clear error if valid
    let errorMessage = '';
    switch (name) {
      case 'serviceType':
        errorMessage = validateServiceType(value);
        break;
      case 'hourlyRate':
        errorMessage = validateHourlyRate(value);
        break;
      case 'location':
        errorMessage = validateLocation(value);
        break;
      case 'bio':
        errorMessage = validateBio(value);
        break;
      default:
        break;
    }

    // Update field errors
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    const newFieldErrors = { ...fieldErrors };

    switch (step) {
      case 1: {
        const error = validateServiceType(formData.serviceType);
        newFieldErrors.serviceType = error;
        isValid = error === '';
        break;
      }
      case 2: {
        const error = validateHourlyRate(formData.hourlyRate);
        newFieldErrors.hourlyRate = error;
        isValid = error === '';
        break;
      }
      case 3: {
        const error = validateLocation(formData.location);
        newFieldErrors.location = error;
        isValid = error === '';
        break;
      }
      case 4: {
        const error = validateBio(formData.bio);
        newFieldErrors.bio = error;
        isValid = error === '';
        break;
      }
      case 5:
        return true; // Calendar link step is optional, no validation needed
      case 6:
        return true; // Availability step doesn't require validation
      default:
        return true;
    }

    // Update field errors
    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setError(null);
      }
    } else {
      setError('Please correct the errors below before continuing.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const saveProfessionalProfile = async (data) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.uid;
      
      // Geocode the location before saving
      let coordinates = null;
      if (data.location && data.location.trim()) {
        setGeocoding(true);
        try {
          coordinates = await mockGeocode(data.location);
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Continue with save even if geocoding fails
        } finally {
          setGeocoding(false);
        }
      }
      
      // Construct the Firestore path: /artifacts/{appId}/public/data/professionals/{userId}
      // Using the exact path structure requested
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        userId
      );


      // Prepare the data to save
      const professionalData = {
        serviceType: data.serviceType,
        hourlyRate: parseFloat(data.hourlyRate),
        location: data.location, // Keep the original location text
        locationText: data.location, // Also save as locationText for consistency
        bio: data.bio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId,
      };

      // Add calendar link if provided
      if (data.calendarLink && data.calendarLink.trim()) {
        professionalData.calendarLink = data.calendarLink.trim();
      }

      // Add coordinates if geocoding was successful
      if (coordinates) {
        professionalData.lat = coordinates.lat;
        professionalData.lon = coordinates.lon;
      }

      // Save to Firestore with shorter timeout and better error handling
      const startTime = Date.now();
      
      try {
        // Try the save with a 5 second timeout
        const savePromise = setDoc(professionalRef, professionalData, { merge: true });
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT: Save operation timed out. This usually means Firestore security rules are blocking the write. Check browser console and Firestore rules.')), 5000)
        );

        await Promise.race([savePromise, timeoutPromise]);
        
        showSuccess('Profile saved successfully!');
        return { success: true };
      } catch (saveError) {
        const duration = Date.now() - startTime;
        console.error(`❌ Save failed after ${duration}ms`);
        console.error('Save error:', saveError);
        
        // If timeout, provide helpful message
        if (saveError.message.includes('TIMEOUT')) {
          throw new Error(
            'Save timed out. Most likely causes:\n' +
            '1. Firestore security rules are blocking writes\n' +
            '2. Firestore database is not enabled\n' +
            '3. Check browser console for "permission-denied" errors\n' +
            'See QUICK_FIX_SAVE_ISSUE.md for instructions'
          );
        }
        throw saveError;
      }
    } catch (error) {
      console.error('=== Error in saveProfessionalProfile ===');
      console.error('Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide user-friendly error message
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please update Firestore security rules to allow writes. See QUICK_FIX_SAVE_ISSUE.md');
      } else if (error.code === 'unavailable') {
        throw new Error('Firestore is unavailable. Please check your internet connection and ensure Firestore is enabled.');
      } else if (error.message.includes('TIMEOUT')) {
        throw error; // Already has helpful message
      }
      
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If we're on step 4, save and go to step 5 (availability)
    if (currentStep === 4) {
      if (!validateStep(currentStep)) {
        setError('Please correct the errors below before continuing.');
        return;
      }

        setLoading(true);
        try {
          await withLoading(
            () => saveProfessionalProfile(formData),
            'Saving profile...'
          );
        // Move to step 5 (availability) instead of redirecting
        setCurrentStep(5);
        setError(null);
      } catch (err) {
        console.error('Save failed:', err);
        let errorMessage = 'Failed to save profile. ';
        
        if (err.code === 'permission-denied') {
          errorMessage += 'Permission denied. Check Firestore security rules.';
        } else if (err.code === 'unavailable') {
          errorMessage += 'Firestore is unavailable. Check your internet connection.';
        } else if (err.message.includes('timeout')) {
          errorMessage += 'Operation timed out. Please try again.';
        } else {
          errorMessage += err.message || 'Please try again.';
        }
        
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    // If we're on step 5 (availability), just redirect (availability auto-saves)
    if (currentStep === 5) {
      // Availability is already saved via the AvailabilitySchedule component
      // Just redirect to home
      navigate('/');
      return;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                Service Type <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                  fieldErrors.serviceType
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select a service type...</option>
                {SERVICE_TYPES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              {fieldErrors.serviceType && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{fieldErrors.serviceType}</span>
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($/hr) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                  $
                </span>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                    fieldErrors.hourlyRate
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {fieldErrors.hourlyRate ? (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{fieldErrors.hourlyRate}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Enter your hourly rate in US dollars
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location / Service Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Greater Seattle Area, WA"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg ${
                  fieldErrors.location
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.location ? (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  <span>{fieldErrors.location}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Describe the area where you provide services
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Short Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={6}
                placeholder="Tell customers about your experience, expertise, and what makes you stand out..."
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none ${
                  fieldErrors.bio
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                required
              />
              <div className="mt-2 flex items-center justify-between">
                {fieldErrors.bio ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span>⚠</span>
                    <span>{fieldErrors.bio}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {formData.bio.length < 50
                      ? `${50 - formData.bio.length} more characters required (minimum 50)`
                      : `${formData.bio.length} characters`}
                  </p>
                )}
                <p className={`text-sm ${
                  formData.bio.length > 500
                    ? 'text-red-600 font-semibold'
                    : formData.bio.length > 450
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }`}>
                  {formData.bio.length} / 500
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return <AvailabilitySchedule />;

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'What service do you provide?';
      case 2:
        return 'What is your hourly rate?';
      case 3:
        return 'Where do you provide services?';
      case 4:
        return 'Tell us about yourself';
      case 5:
        return 'External Calendar Sync (Optional)';
      case 6:
        return 'Set Your Availability';
      default:
        return 'Professional Onboarding';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            <span>←</span> Back to Home
          </button>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl bg-purple-600 text-white rounded-lg px-3 py-2 font-light flex items-center justify-center">∞</span>
              <h1 className="text-3xl font-bold text-gray-900">Professional Onboarding</h1>
            </div>
          <p className="text-gray-600">Complete your profile to start accepting bookings</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{getStepTitle()}</h2>

          <form onSubmit={handleSubmit}>
            {renderStep()}


            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Next
                </button>
              ) : currentStep === 4 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </button>
              ) : currentStep === 5 ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save & Continue'
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Complete Onboarding
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProOnboarding;

