import React, { useState } from 'react';
import ServiceAreaMap from './ServiceAreaMap';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Multi-Area Manager Component
 * Allows professionals to manage multiple service areas
 */
function MultiAreaManager({ areas = [], onAreasChange }) {
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();
  const [editingIndex, setEditingIndex] = useState(null);
  const [newArea, setNewArea] = useState({
    location: '',
    locationText: '',
    lat: null,
    lon: null,
    serviceRadius: 25,
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddArea = () => {
    if (!newArea.locationText || !newArea.lat || !newArea.lon) {
      showError('Please set a location on the map first');
      return;
    }

    const updatedAreas = [...areas, { ...newArea }];
    onAreasChange(updatedAreas);
    setNewArea({
      location: '',
      locationText: '',
      lat: null,
      lon: null,
      serviceRadius: 25,
    });
    setShowAddForm(false);
    showSuccess('Service area added!');
  };

  const handleRemoveArea = (index) => {
    const updatedAreas = areas.filter((_, i) => i !== index);
    onAreasChange(updatedAreas);
    showSuccess('Service area removed');
  };

  const handleEditArea = (index) => {
    setEditingIndex(index);
    setNewArea({ ...areas[index] });
    setShowAddForm(true);
  };

  const handleUpdateArea = () => {
    if (!newArea.locationText || !newArea.lat || !newArea.lon) {
      showError('Please set a location on the map first');
      return;
    }

    const updatedAreas = [...areas];
    updatedAreas[editingIndex] = { ...newArea };
    onAreasChange(updatedAreas);
    setEditingIndex(null);
    setNewArea({
      location: '',
      locationText: '',
      lat: null,
      lon: null,
      serviceRadius: 25,
    });
    setShowAddForm(false);
    showSuccess('Service area updated!');
  };

  const handleLocationChange = (location) => {
    setNewArea(prev => ({
      ...prev,
      ...location,
      locationText: location.locationText || prev.locationText,
    }));
  };

  const handleRadiusChange = (radius) => {
    setNewArea(prev => ({ ...prev, serviceRadius: radius }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Service Areas</h3>
          <p className="text-sm text-gray-600 mt-1">
            Add multiple locations where you provide services
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Area
          </button>
        )}
      </div>

      {/* Existing Areas List */}
      {areas.length > 0 && (
        <div className="space-y-3">
          {areas.map((area, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{area.locationText || area.location}</p>
                <p className="text-sm text-gray-600">
                  Radius: {area.serviceRadius || 25} km
                  {area.lat && area.lon && (
                    <span className="ml-2">
                      • {area.lat.toFixed(4)}, {area.lon.toFixed(4)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditArea(index)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveArea(index)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingIndex !== null ? 'Edit Service Area' : 'Add New Service Area'}
            </h4>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingIndex(null);
                setNewArea({
                  location: '',
                  locationText: '',
                  lat: null,
                  lon: null,
                  serviceRadius: 25,
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Name
            </label>
            <input
              type="text"
              value={newArea.location}
              onChange={(e) => setNewArea(prev => ({ ...prev, location: e.target.value, locationText: e.target.value }))}
              placeholder="e.g., Downtown Miami, FL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {newArea.location && (
            <ServiceAreaMap
              initialLocation={newArea.lat && newArea.lon ? {
                lat: newArea.lat,
                lon: newArea.lon,
                locationText: newArea.locationText || newArea.location
              } : null}
              serviceRadius={newArea.serviceRadius}
              onLocationChange={handleLocationChange}
              onRadiusChange={handleRadiusChange}
              readOnly={false}
              showRadius={true}
              height="300px"
            />
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingIndex(null);
                setNewArea({
                  location: '',
                  locationText: '',
                  lat: null,
                  lon: null,
                  serviceRadius: 25,
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingIndex !== null ? handleUpdateArea : handleAddArea}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingIndex !== null ? 'Update Area' : 'Add Area'}
            </button>
          </div>
        </div>
      )}

      {areas.length === 0 && !showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No service areas added yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Service Area
          </button>
        </div>
      )}
    </div>
  );
}

export default MultiAreaManager;

