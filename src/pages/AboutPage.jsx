import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from 'react-i18next';

function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Logo showText={true} size="lg" className="justify-center mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            About ExpertNextDoor
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400">
            Connecting customers with trusted local professionals
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 mb-8">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
              ExpertNextDoor is a platform designed to bridge the gap between customers seeking 
              quality services and skilled professionals in their local area. We believe that 
              finding the right professional should be simple, transparent, and trustworthy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              What We Offer
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  For Customers
                </h3>
                <ul className="text-gray-700 dark:text-slate-300 space-y-2 text-sm">
                  <li>• Search and find local professionals</li>
                  <li>• View ratings and reviews</li>
                  <li>• Book appointments easily</li>
                  <li>• Track your bookings</li>
                  <li>• Communicate with professionals</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
                  For Professionals
                </h3>
                <ul className="text-gray-700 dark:text-slate-300 space-y-2 text-sm">
                  <li>• Create your professional profile</li>
                  <li>• Manage your availability</li>
                  <li>• Receive bookings from customers</li>
                  <li>• Build your reputation with reviews</li>
                  <li>• Grow your business locally</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Key Features
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl">📍</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Location-Based Search
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Find professionals near you with our location-based search and filtering system.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">⭐</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Ratings & Reviews
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Read authentic reviews and ratings from other customers to make informed decisions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">📅</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Easy Booking System
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Book appointments with professionals directly through our platform with real-time availability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">💬</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Direct Messaging
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Communicate directly with professionals through our built-in messaging system.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-2xl">🔒</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Secure & Reliable
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Your data and transactions are secure with our robust security measures.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Sign Up
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Create your account as a customer or professional. It's free and takes just a few minutes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    {t('about.step2.title', 'Search or List')}
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    {t('about.step2.description', 'Customers can search for professionals, while professionals can create their profile and set availability.')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Connect
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Book appointments, communicate, and get the services you need or provide the services you offer.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">
                    Review & Grow
                  </h3>
                  <p className="text-gray-700 dark:text-slate-300 text-sm">
                    Leave reviews and ratings to help others make informed decisions and help professionals build their reputation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Get Started
            </h2>
            <p className="text-gray-700 dark:text-slate-300 mb-6">
              Ready to find a professional or start offering your services? Join ExpertNextDoor today!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up Now
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Browse Professionals
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 dark:text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} ExpertNextDoor. All rights reserved.</p>
          <div className="mt-4 space-x-4">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <span>•</span>
            <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
              About
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;

