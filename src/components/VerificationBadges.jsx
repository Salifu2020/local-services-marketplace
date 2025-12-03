import React from 'react';

/**
 * Individual Verification Badge Component
 */
function VerificationBadge({ type, verified, size = 'md' }) {
  if (!verified) return null;

  const badgeConfig = {
    verified: {
      label: 'Verified',
      icon: '✓',
      color: 'bg-blue-600 text-white',
      description: 'Identity verified',
    },
    licensed: {
      label: 'Licensed',
      icon: '📜',
      color: 'bg-green-600 text-white',
      description: 'Professional license verified',
    },
    insured: {
      label: 'Insured',
      icon: '🛡️',
      color: 'bg-purple-600 text-white',
      description: 'Fully insured',
    },
    bonded: {
      label: 'Bonded',
      icon: '🔒',
      color: 'bg-indigo-600 text-white',
      description: 'Bonded professional',
    },
    'years-experience': {
      label: 'Experienced',
      icon: '⭐',
      color: 'bg-amber-600 text-white',
      description: '10+ years experience',
    },
    'response-time': {
      label: 'Quick Response',
      icon: '⚡',
      color: 'bg-yellow-600 text-white',
      description: 'Responds within 1 hour',
    },
    'top-rated': {
      label: 'Top Rated',
      icon: '🏆',
      color: 'bg-orange-600 text-white',
      description: 'Top 10% rated',
    },
    'verified-business': {
      label: 'Verified Business',
      icon: '🏢',
      color: 'bg-teal-600 text-white',
      description: 'Business verified',
    },
  };

  const config = badgeConfig[type];
  if (!config) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${config.color} ${sizeClasses[size]}`}
      title={config.description}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Verification Badges Container Component
 * Displays all verification badges for a professional
 */
function VerificationBadges({ professional, size = 'md', showAll = false, averageRating = null, reviewCount = 0 }) {
  if (!professional) return null;

  // Use passed props or professional data for ratings
  const rating = averageRating !== null ? averageRating : (professional.averageRating || null);
  const reviews = reviewCount > 0 ? reviewCount : (professional.reviewCount || 0);

  // Calculate derived verifications
  const verifications = {
    verified: professional.verified || false,
    licensed: professional.licensed || false,
    insured: professional.insured || false,
    bonded: professional.bonded || false,
    'years-experience': (professional.yearsOfExperience || 0) >= 10 || false,
    'response-time': professional.avgResponseTime && professional.avgResponseTime <= 60 || false, // 60 minutes
    'top-rated': rating !== null && rating >= 4.5 && reviews >= 10 || false,
    'verified-business': professional.businessVerified || false,
  };

  // Filter to only show verified badges (unless showAll is true)
  const activeVerifications = Object.entries(verifications).filter(
    ([_, verified]) => verified || showAll
  );

  if (activeVerifications.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeVerifications.map(([type, verified]) => (
        <VerificationBadge
          key={type}
          type={type}
          verified={verified}
          size={size}
        />
      ))}
    </div>
  );
}

/**
 * Compact Badge Display (just icons)
 */
function CompactVerificationBadges({ professional, averageRating = null, reviewCount = 0 }) {
  if (!professional) return null;

  const rating = averageRating !== null ? averageRating : (professional.averageRating || null);
  const reviews = reviewCount > 0 ? reviewCount : (professional.reviewCount || 0);

  const badges = [];
  
  if (professional.verified) badges.push({ icon: '✓', color: 'bg-blue-600', title: 'Verified' });
  if (professional.licensed) badges.push({ icon: '📜', color: 'bg-green-600', title: 'Licensed' });
  if (professional.insured) badges.push({ icon: '🛡️', color: 'bg-purple-600', title: 'Insured' });
  if (professional.bonded) badges.push({ icon: '🔒', color: 'bg-indigo-600', title: 'Bonded' });
  if ((professional.yearsOfExperience || 0) >= 10) badges.push({ icon: '⭐', color: 'bg-amber-600', title: '10+ Years Experience' });
  if (rating !== null && rating >= 4.5 && reviews >= 10) badges.push({ icon: '🏆', color: 'bg-orange-600', title: 'Top Rated' });

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`w-6 h-6 rounded-full ${badge.color} text-white flex items-center justify-center text-xs`}
          title={badge.title}
        >
          {badge.icon}
        </div>
      ))}
    </div>
  );
}

export default VerificationBadges;
export { VerificationBadge, CompactVerificationBadges };

