/**
 * Mock geocoding function that simulates an API call to convert an address to coordinates.
 * Returns a promise that resolves after a short delay with mock latitude and longitude.
 * 
 * @param {string} address - The address string to geocode
 * @returns {Promise<{lat: number, lon: number}>} Promise that resolves with coordinates
 */
export function mockGeocode(address) {
  return new Promise((resolve) => {
    // Simulate API delay (500ms)
    setTimeout(() => {
      const addressLower = address.toLowerCase();

      // Check for Miami
      if (addressLower.includes('miami')) {
        resolve({ lat: 25.7617, lon: -80.1918 });
        return;
      }

      // Check for Austin
      if (addressLower.includes('austin')) {
        resolve({ lat: 30.2672, lon: -97.7431 });
        return;
      }

      // Default location (Los Angeles)
      resolve({ lat: 34.0522, lon: -118.2437 });
    }, 500);
  });
}

