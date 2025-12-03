import React, { useState, useEffect } from 'react';
import { auth, db, appId } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Referral Program Component
 * Displays referral code, stats, and referral management
 */
function ReferralProgram({ userId }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewards: 0,
    pendingRewards: 0,
  });
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Fetch or create referral code
    const fetchReferralCode = async () => {
      try {
        const userRef = doc(db, 'artifacts', appId, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.referralCode) {
            setReferralCode(userData.referralCode);
          } else {
            // Generate new referral code
            const newCode = generateReferralCode(userId);
            await updateDoc(userRef, {
              referralCode: newCode,
              referralCodeCreatedAt: serverTimestamp(),
            });
            setReferralCode(newCode);
          }
        } else {
          // Create user document with referral code
          const newCode = generateReferralCode(userId);
          await setDoc(userRef, {
            referralCode: newCode,
            referralCodeCreatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
          setReferralCode(newCode);
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
        showError('Failed to load referral code');
      }
    };

    fetchReferralCode();

    // Fetch referral stats
    const referralsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'referrals'
    );

    const referralsQuery = query(
      referralsRef,
      where('referrerId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      referralsQuery,
      async (snapshot) => {
        const referralsList = [];
        let totalRewards = 0;
        let pendingRewards = 0;
        let activeReferrals = 0;

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          referralsList.push({
            id: docSnapshot.id,
            ...data,
          });

          // Calculate rewards
          if (data.rewardStatus === 'earned') {
            totalRewards += data.rewardAmount || 0;
          } else if (data.rewardStatus === 'pending') {
            pendingRewards += data.rewardAmount || 0;
          }

          // Count active referrals (users who have completed at least one booking)
          if (data.status === 'active') {
            activeReferrals++;
          }
        }

        setReferrals(referralsList);
        setReferralStats({
          totalReferrals: referralsList.length,
          activeReferrals,
          totalRewards,
          pendingRewards,
        });
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching referrals:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, showError]);

  const handleCopyCode = () => {
    if (referralCode) {
      const referralLink = `${window.location.origin}?ref=${referralCode}`;
      navigator.clipboard.writeText(referralLink).then(() => {
        showSuccess('Referral link copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Referral link copied to clipboard!');
      });
    }
  };

  const handleShare = async (platform) => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    const message = `Join ExpertNextDoor and get rewarded! Use my referral code: ${referralCode}`;

    if (platform === 'email') {
      window.location.href = `mailto:?subject=Join ExpertNextDoor&body=${encodeURIComponent(message + '\n\n' + referralLink)}`;
    } else if (platform === 'sms') {
      window.location.href = `sms:?body=${encodeURIComponent(message + ' ' + referralLink)}`;
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Referral Program</h2>

      {/* Referral Code Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Referral Code</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-white rounded-lg px-4 py-3 border-2 border-blue-300">
            <p className="text-2xl font-bold text-blue-600 font-mono">{referralCode}</p>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Copy Link
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Share your referral code with friends and earn rewards when they sign up and complete their first booking!
        </p>

        {/* Share Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleShare('email')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            📧 Email
          </button>
          <button
            onClick={() => handleShare('sms')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            💬 SMS
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            💬 WhatsApp
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Referrals"
          value={referralStats.totalReferrals}
          icon="👥"
          color="bg-blue-100"
        />
        <StatCard
          title="Active Referrals"
          value={referralStats.activeReferrals}
          icon="✅"
          color="bg-green-100"
        />
        <StatCard
          title="Total Rewards"
          value={`$${referralStats.totalRewards.toFixed(2)}`}
          icon="💰"
          color="bg-yellow-100"
        />
        <StatCard
          title="Pending Rewards"
          value={`$${referralStats.pendingRewards.toFixed(2)}`}
          icon="⏳"
          color="bg-orange-100"
        />
      </div>

      {/* Referrals List */}
      {referrals.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referrals.map((referral) => (
              <ReferralItem key={referral.id} referral={referral} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">📤</div>
          <p className="text-gray-600 font-medium mb-2">No referrals yet</p>
          <p className="text-sm text-gray-500">
            Share your referral code to start earning rewards!
          </p>
        </div>
      )}

      {/* Rewards Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">How It Works</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">1.</span>
            <span>Share your referral code with friends</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">2.</span>
            <span>They sign up using your code</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">3.</span>
            <span>You earn $10 when they complete their first booking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">4.</span>
            <span>They also get $10 off their first booking!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/**
 * Referral Item Component
 */
function ReferralItem({ referral }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">
            {referral.referredUserName || referral.referredUserId || 'Unknown User'}
          </p>
          <p className="text-sm text-gray-500">
            Joined: {formatDate(referral.referredAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(referral.status)}`}>
            {referral.status || 'Pending'}
          </span>
          {referral.rewardAmount && (
            <span className="text-lg font-bold text-green-600">
              ${referral.rewardAmount.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      {referral.rewardStatus && (
        <p className="text-xs text-gray-500">
          Reward: {referral.rewardStatus === 'earned' ? '✓ Earned' : '⏳ Pending'}
        </p>
      )}
    </div>
  );
}

/**
 * Generate a unique referral code
 */
function generateReferralCode(userId) {
  // Use first 4 chars of userId + random 4 chars
  const userIdPart = userId.substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${userIdPart}${randomPart}`;
}

export default ReferralProgram;

