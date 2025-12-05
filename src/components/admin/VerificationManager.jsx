import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../firebase';
import VerificationBadges from '../VerificationBadges';

function VerificationManager() {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [verificationData, setVerificationData] = useState({
    verified: false,
    licensed: false,
    insured: false,
    bonded: false,
    businessVerified: false,
    yearsOfExperience: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const professionalsRef = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'professionals'
        );

        const snapshot = await getDocs(professionalsRef);
        const professionalsList = [];
        snapshot.forEach((doc) => {
          professionalsList.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setProfessionals(professionalsList);
      } catch (err) {
        console.error('Error fetching professionals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, []);

  const handleSelectProfessional = (professional) => {
    setSelectedProfessional(professional);
    setVerificationData({
      verified: professional.verified || false,
      licensed: professional.licensed || false,
      insured: professional.insured || false,
      bonded: professional.bonded || false,
      businessVerified: professional.businessVerified || false,
      yearsOfExperience: professional.yearsOfExperience || 0,
    });
  };

  const handleSaveVerification = async () => {
    if (!selectedProfessional) return;

    setSaving(true);
    try {
      const professionalRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        selectedProfessional.id
      );

      await updateDoc(professionalRef, {
        ...verificationData,
        verifiedAt: verificationData.verified ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      setProfessionals(professionals.map(pro => 
        pro.id === selectedProfessional.id 
          ? { ...pro, ...verificationData }
          : pro
      ));

      setSelectedProfessional({ ...selectedProfessional, ...verificationData });
      alert('Verification updated successfully!');
    } catch (err) {
      console.error('Error updating verification:', err);
      alert('Failed to update verification. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading professionals...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Professional Verification</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professionals List */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Professional</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {professionals.map((professional) => (
              <button
                key={professional.id}
                onClick={() => handleSelectProfessional(professional)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedProfessional?.id === professional.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {professional.serviceType || 'Professional'}
                    </p>
                    <p className="text-sm text-gray-500">{professional.id.substring(0, 8)}...</p>
                  </div>
                  <VerificationBadges professional={professional} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Form */}
        {selectedProfessional && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Verify: {selectedProfessional.serviceType || 'Professional'}
            </h3>

            <div className="space-y-4">
              {/* Verified Badge */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Verified Professional</label>
                  <p className="text-sm text-gray-500">Identity verified</p>
                </div>
                <input
                  type="checkbox"
                  checked={verificationData.verified}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, verified: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Licensed */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Licensed</label>
                  <p className="text-sm text-gray-500">Professional license verified</p>
                </div>
                <input
                  type="checkbox"
                  checked={verificationData.licensed}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, licensed: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Insured */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Insured</label>
                  <p className="text-sm text-gray-500">Fully insured</p>
                </div>
                <input
                  type="checkbox"
                  checked={verificationData.insured}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, insured: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Bonded */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Bonded</label>
                  <p className="text-sm text-gray-500">Bonded professional</p>
                </div>
                <input
                  type="checkbox"
                  checked={verificationData.bonded}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, bonded: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Business Verified */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Verified Business</label>
                  <p className="text-sm text-gray-500">Business license verified</p>
                </div>
                <input
                  type="checkbox"
                  checked={verificationData.businessVerified}
                  onChange={(e) =>
                    setVerificationData({ ...verificationData, businessVerified: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {/* Years of Experience */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="block font-medium text-gray-900 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={verificationData.yearsOfExperience}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      yearsOfExperience: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Professionals with 10+ years get "Experienced" badge
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">Badge Preview:</p>
                <VerificationBadges professional={verificationData} size="sm" />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveVerification}
                disabled={saving}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Verification'}
              </button>
            </div>
          </div>
        )}

        {!selectedProfessional && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a professional to manage verifications</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificationManager;


