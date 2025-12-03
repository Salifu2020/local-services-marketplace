import React, { useState, useEffect } from 'react';
import { db, appId } from '../../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Service Packages Component
 * Displays and manages service packages for professionals
 */
function ServicePackages({ professionalId, isOwner = false, onPackageSelect = null }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    if (!professionalId) return;

    const packagesRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      professionalId,
      'packages'
    );

    const packagesQuery = query(packagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      packagesQuery,
      (snapshot) => {
        const packagesList = [];
        snapshot.forEach((doc) => {
          packagesList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPackages(packagesList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching packages:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [professionalId]);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg.id);
    if (onPackageSelect) {
      onPackageSelect(pkg);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Service Packages</h2>
        {isOwner && <PackageManagementButton professionalId={professionalId} />}
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 mb-2">No service packages available</p>
          {isOwner && (
            <p className="text-sm text-gray-500">Create packages to offer fixed-price services</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              package={pkg}
              isOwner={isOwner}
              isSelected={selectedPackage === pkg.id}
              onSelect={() => handlePackageSelect(pkg)}
              onDelete={() => {
                setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Package Card Component
 */
function PackageCard({ package: pkg, isOwner, isSelected, onSelect, onDelete }) {
  const { showError } = useToast();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const packageRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'professionals',
        pkg.professionalId,
        'packages',
        pkg.id
      );
      await deleteDoc(packageRef);
      onDelete();
    } catch (error) {
      console.error('Error deleting package:', error);
      showError('Failed to delete package');
    }
  };

  return (
    <div
      className={`relative border-2 rounded-lg p-6 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={!isOwner ? onSelect : undefined}
    >
      {isOwner && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete package"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
        {pkg.badge && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {pkg.badge}
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-4 min-h-[3rem]">{pkg.description}</p>

      <div className="space-y-2 mb-4">
        {pkg.features && pkg.features.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
            <ul className="space-y-1">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pkg.duration && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⏱️</span>
            <span>Duration: {pkg.duration}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-baseline justify-between">
          <div>
            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
              <p className="text-sm text-gray-500 line-through">${pkg.originalPrice.toFixed(2)}</p>
            )}
            <p className="text-2xl font-bold text-gray-900">${pkg.price.toFixed(2)}</p>
          </div>
          {pkg.discount && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
              {pkg.discount}% OFF
            </span>
          )}
        </div>
        {pkg.priceType === 'fixed' ? (
          <p className="text-xs text-gray-500 mt-1">Fixed Price</p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">Per {pkg.unit || 'service'}</p>
        )}
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Selected</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Package Management Button
 */
function PackageManagementButton({ professionalId }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Manage Packages
      </button>

      {showModal && (
        <PackageManagementModal
          professionalId={professionalId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

/**
 * Package Management Modal
 */
function PackageManagementModal({ professionalId, onClose }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    priceType: 'fixed', // 'fixed' or 'per-unit'
    unit: '',
    duration: '',
    features: [],
    badge: '',
    addOns: [],
  });
  const [newFeature, setNewFeature] = useState('');
  const [newAddOn, setNewAddOn] = useState({ name: '', price: '' });

  useEffect(() => {
    const packagesRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'professionals',
      professionalId,
      'packages'
    );

    const unsubscribe = onSnapshot(
      query(packagesRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const packagesList = [];
        snapshot.forEach((doc) => {
          packagesList.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setPackages(packagesList);
      }
    );

    return () => unsubscribe();
  }, [professionalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      showError('Please fill in all required fields');
      return;
    }

    await withLoading(async () => {
      try {
        const packageData = {
          professionalId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          priceType: formData.priceType,
          unit: formData.unit.trim() || null,
          duration: formData.duration.trim() || null,
          features: formData.features.filter((f) => f.trim()),
          badge: formData.badge.trim() || null,
          addOns: formData.addOns.filter((a) => a.name.trim() && a.price),
          discount: formData.originalPrice && formData.originalPrice > formData.price
            ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
            : null,
          updatedAt: serverTimestamp(),
        };

        if (editingPackage) {
          const packageRef = doc(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'professionals',
            professionalId,
            'packages',
            editingPackage.id
          );
          await updateDoc(packageRef, packageData);
          showSuccess('Package updated successfully');
        } else {
          const packagesRef = collection(
            db,
            'artifacts',
            appId,
            'public',
            'data',
            'professionals',
            professionalId,
            'packages'
          );
          await addDoc(packagesRef, {
            ...packageData,
            createdAt: serverTimestamp(),
          });
          showSuccess('Package created successfully');
        }

        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          originalPrice: '',
          priceType: 'fixed',
          unit: '',
          duration: '',
          features: [],
          badge: '',
          addOns: [],
        });
        setEditingPackage(null);
      } catch (error) {
        console.error('Error saving package:', error);
        showError('Failed to save package');
      }
    });
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      price: pkg.price?.toString() || '',
      originalPrice: pkg.originalPrice?.toString() || '',
      priceType: pkg.priceType || 'fixed',
      unit: pkg.unit || '',
      duration: pkg.duration || '',
      features: pkg.features || [],
      badge: pkg.badge || '',
      addOns: pkg.addOns || [],
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addAddOn = () => {
    if (newAddOn.name.trim() && newAddOn.price) {
      setFormData({
        ...formData,
        addOns: [
          ...formData.addOns,
          {
            name: newAddOn.name.trim(),
            price: parseFloat(newAddOn.price),
          },
        ],
      });
      setNewAddOn({ name: '', price: '' });
    }
  };

  const removeAddOn = (index) => {
    setFormData({
      ...formData,
      addOns: formData.addOns.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {editingPackage ? 'Edit Package' : 'Create Service Package'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Package Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Basic Plumbing Service"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what's included in this package..."
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (for discount)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Price Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Type</label>
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="per-unit">Per Unit</option>
                </select>
              </div>

              {formData.priceType === 'per-unit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., hour, room, sq ft"
                  />
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2-3 hours, 1 day"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Add-on Services</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={newAddOn.name}
                  onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add-on name..."
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn({ ...newAddOn, price: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addAddOn}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {formData.addOns.map((addOn, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{addOn.name} - ${addOn.price.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => removeAddOn(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Badge (optional)</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Popular, Best Value, New"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPackage ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </form>

          {/* Existing Packages List */}
          {packages.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Packages</h3>
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{pkg.name}</p>
                      <p className="text-sm text-gray-600">${pkg.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServicePackages;

