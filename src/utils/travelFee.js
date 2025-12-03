import { haversineDistance } from './helpers';

/**
 * Calculate travel fee based on distance from professional to customer location
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} baseFee - Base travel fee (default: $5)
 * @param {number} perKmRate - Rate per kilometer (default: $0.50)
 * @param {number} maxFee - Maximum travel fee (default: $25)
 * @returns {number} Travel fee in dollars
 */
export function calculateTravelFee(
  distanceKm,
  baseFee = 5,
  perKmRate = 0.5,
  maxFee = 25
) {
  if (distanceKm <= 0) return 0;
  
  const fee = baseFee + (distanceKm * perKmRate);
  return Math.min(fee, maxFee);
}

/**
 * Calculate travel fee for a booking
 * Supports both single area and multi-area professionals
 * @param {Object} professional - Professional object with lat/lon (or serviceAreas array)
 * @param {Object} customerLocation - Customer location with lat/lon
 * @param {Object} options - Fee calculation options
 * @returns {number} Travel fee in dollars
 */
export function calculateBookingTravelFee(professional, customerLocation, options = {}) {
  // Check for multi-area support
  if (professional.serviceAreas && Array.isArray(professional.serviceAreas) && professional.serviceAreas.length > 0) {
    return calculateMultiAreaTravelFee(professional, customerLocation, options);
  }

  // Single area calculation
  if (!professional.lat || !professional.lon || !customerLocation.lat || !customerLocation.lon) {
    return 0;
  }

  const distance = haversineDistance(
    professional.lat,
    professional.lon,
    customerLocation.lat,
    customerLocation.lon
  );

  return calculateTravelFee(distance, options.baseFee, options.perKmRate, options.maxFee);
}

/**
 * Check if customer location is within professional's service area
 * Supports both single area and multi-area professionals
 * @param {Object} professional - Professional object with lat/lon and serviceRadius (or serviceAreas array)
 * @param {Object} customerLocation - Customer location with lat/lon
 * @returns {boolean} True if within service area
 */
export function isWithinServiceArea(professional, customerLocation) {
  if (!customerLocation.lat || !customerLocation.lon) {
    return false;
  }

  // Check multi-area support first
  if (professional.serviceAreas && Array.isArray(professional.serviceAreas) && professional.serviceAreas.length > 0) {
    // Check if customer is within any of the service areas
    return professional.serviceAreas.some(area => {
      if (!area.lat || !area.lon) return false;
      const serviceRadius = area.serviceRadius || 25;
      const distance = haversineDistance(
        area.lat,
        area.lon,
        customerLocation.lat,
        customerLocation.lon
      );
      return distance <= serviceRadius;
    });
  }

  // Fall back to single area check
  if (!professional.lat || !professional.lon) {
    return false;
  }

  const serviceRadius = professional.serviceRadius || 25; // Default 25km
  const distance = haversineDistance(
    professional.lat,
    professional.lon,
    customerLocation.lat,
    customerLocation.lon
  );

  return distance <= serviceRadius;
}

/**
 * Calculate travel fee for multi-area professionals (uses closest area)
 * @param {Object} professional - Professional object with serviceAreas array
 * @param {Object} customerLocation - Customer location with lat/lon
 * @param {Object} options - Fee calculation options
 * @returns {number} Travel fee in dollars
 */
export function calculateMultiAreaTravelFee(professional, customerLocation, options = {}) {
  if (!professional.serviceAreas || !Array.isArray(professional.serviceAreas) || professional.serviceAreas.length === 0) {
    return calculateBookingTravelFee(professional, customerLocation, options);
  }

  // Find the closest service area
  let closestArea = null;
  let minDistance = Infinity;

  professional.serviceAreas.forEach(area => {
    if (!area.lat || !area.lon) return;
    const distance = haversineDistance(
      area.lat,
      area.lon,
      customerLocation.lat,
      customerLocation.lon
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestArea = { ...area, distance };
    }
  });

  if (!closestArea) {
    return 0;
  }

  // Calculate fee based on distance to closest area
  return calculateTravelFee(minDistance, options.baseFee, options.perKmRate, options.maxFee);
}

