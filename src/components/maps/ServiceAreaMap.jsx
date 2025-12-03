import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useLoading } from '../../context/LoadingContext';

/**
 * Service Area Map Component
 * Interactive map for visualizing and setting service area coverage
 * Uses Leaflet.js for mapping (free, no API key required)
 */
function ServiceAreaMap({ 
  professionalId = null,
  initialLocation = null, // { lat, lon, locationText }
  serviceRadius = 25, // in kilometers
  onLocationChange = null, // callback when location changes
  onRadiusChange = null, // callback when radius changes
  readOnly = false, // if true, map is view-only
  showRadius = true, // show coverage radius circle
  height = '400px' // map height
}) {
  const { showError } = useToast();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [location, setLocation] = useState(initialLocation || { lat: 25.7617, lon: -80.1918, locationText: 'Miami, FL' }); // Default to Miami
  const [radius, setRadius] = useState(serviceRadius);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        showError('Failed to load map. Please refresh the page.');
        setLoading(false);
      }
    };

    loadLeaflet();
  }, [showError]);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const { L } = window;
      if (!L) return;

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [location.lat, location.lon],
        zoom: 11,
        zoomControl: !readOnly,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add marker for professional location
      const marker = L.marker([location.lat, location.lon], {
        draggable: !readOnly,
      }).addTo(map);

      markerRef.current = marker;

      // Add circle for service radius
      if (showRadius) {
        const circle = L.circle([location.lat, location.lon], {
          radius: radius * 1000, // Convert km to meters
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(map);

        circleRef.current = circle;
      }

      // Handle marker drag (if not read-only)
      if (!readOnly) {
        marker.on('dragend', (e) => {
          const newLat = e.target.getLatLng().lat;
          const newLon = e.target.getLatLng().lng;
          const newLocation = { ...location, lat: newLat, lon: newLon };
          setLocation(newLocation);
          if (onLocationChange) {
            onLocationChange(newLocation);
          }
          // Update circle position
          if (circleRef.current) {
            circleRef.current.setLatLng([newLat, newLon]);
          }
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      showError('Failed to initialize map.');
      setLoading(false);
    }
  }, [mapLoaded, location.lat, location.lon, readOnly, showRadius, radius, onLocationChange]);

  // Update circle radius when radius changes
  useEffect(() => {
    if (circleRef.current && radius) {
      circleRef.current.setRadius(radius * 1000); // Convert km to meters
    }
  }, [radius]);

  // Update location when initialLocation changes
  useEffect(() => {
    if (initialLocation && mapInstanceRef.current && markerRef.current) {
      setLocation(initialLocation);
      mapInstanceRef.current.setView([initialLocation.lat, initialLocation.lon], 11);
      markerRef.current.setLatLng([initialLocation.lat, initialLocation.lon]);
      if (circleRef.current) {
        circleRef.current.setLatLng([initialLocation.lat, initialLocation.lon]);
      }
    }
  }, [initialLocation]);

  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    setRadius(newRadius);
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Radius Control (if not read-only) */}
      {!readOnly && showRadius && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Area Radius: {radius} km
          </label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={radius}
            onChange={handleRadiusChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Drag the marker to set your location. Adjust the radius to define your service coverage area.
          </p>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full rounded-lg border border-gray-300 overflow-hidden"
        style={{ height }}
      />

      {/* Location Info */}
      {location.locationText && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Location:</span> {location.locationText}
          {showRadius && <span className="ml-2">• <span className="font-medium">Radius:</span> {radius} km</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Service Area Selector Component
 * For professionals to set their service area during onboarding
 */
export function ServiceAreaSelector({ onSave, initialData = null }) {
  const [location, setLocation] = useState(initialData?.location || '');
  const [radius, setRadius] = useState(initialData?.serviceRadius || 25);
  const [coordinates, setCoordinates] = useState(initialData || null);
  const [geocoding, setGeocoding] = useState(false);
  const { showSuccess, showError } = useToast();
  const { withLoading } = useLoading();

  const handleLocationSearch = async () => {
    if (!location.trim()) {
      showError('Please enter a location');
      return;
    }

    await withLoading(async () => {
      setGeocoding(true);
      try {
        const { mockGeocode } = await import('../../utils/geocoding');
        const coords = await mockGeocode(location);
        if (coords) {
          setCoordinates({
            lat: coords.lat,
            lon: coords.lon,
            locationText: location,
          });
          showSuccess('Location found!');
        } else {
          showError('Location not found. Please try a different address.');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        showError('Failed to find location. Please try again.');
      } finally {
        setGeocoding(false);
      }
    }, 'Finding location...');
  };

  const handleSave = () => {
    if (!coordinates) {
      showError('Please set a location first');
      return;
    }
    if (onSave) {
      onSave({
        ...coordinates,
        serviceRadius: radius,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city or address (e.g., Miami, FL)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
          />
          <button
            onClick={handleLocationSearch}
            disabled={geocoding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {geocoding ? 'Searching...' : 'Find'}
          </button>
        </div>
      </div>

      {coordinates && (
        <>
          <ServiceAreaMap
            initialLocation={coordinates}
            serviceRadius={radius}
            onLocationChange={setCoordinates}
            onRadiusChange={setRadius}
            readOnly={false}
            showRadius={true}
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Save Service Area
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ServiceAreaMap;

