import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db, appId } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signInWithGoogle } from '../utils/auth';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import Logo from '../components/Logo';

function SignUpPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await withLoading(async () => {
      try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;

        // Update user profile with display name
        await updateProfile(user, {
          displayName: formData.name.trim(),
        });

        // Create user document in Firestore
        const userDocRef = doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'users',
          user.uid
        );

        await setDoc(userDocRef, {
          userId: user.uid,
          email: formData.email,
          name: formData.name.trim(),
          displayName: formData.name.trim(),
          createdAt: new Date().toISOString(),
          role: 'customer', // Default role
        });

        showSuccess('Account created successfully!');
        navigate('/');
      } catch (error) {
        console.error('Sign up error:', error);
        let errorMessage = 'Failed to create account. ';

        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage += 'This email is already registered. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Invalid email address.';
            break;
          case 'auth/weak-password':
            errorMessage += 'Password is too weak. Please choose a stronger password.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage += 'Email/password accounts are not enabled.';
            break;
          default:
            errorMessage += error.message;
        }

        showError(errorMessage);
      }
    });
  };

  const handleGoogleSignUp = async () => {
    await withLoading(async () => {
      try {
        await signInWithGoogle();
        showSuccess('Account created with Google successfully!');
        navigate('/');
      } catch (error) {
        console.error('Google sign-up error:', error);
        let errorMessage = 'Failed to sign up with Google. ';
        
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-up popup was closed. Please try again.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked. Please allow popups and try again.';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Only one popup request is allowed at a time.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Google sign-in is not enabled. Please contact support or use email/password sign-up.';
            break;
          default:
            errorMessage += error.message;
        }
        
        showError(errorMessage);
      }
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo showText={true} size="lg" className="text-white justify-center" />
        </div>

        {/* Sign Up Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 text-center">
            Create Account
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-center mb-6">
            Join ExpertNextDoor today
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                required
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                  errors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                required
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                  errors.password
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 ${
                  errors.confirmPassword
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                required
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                  Or
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="mt-6 w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;

