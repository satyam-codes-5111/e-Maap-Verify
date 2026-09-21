import { stakeholderApi } from './stakeholderApi';

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  street: string;
  addressLine: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  displayName?: string;
}

/**
 * Reverse geocodes coordinates to obtain a readable address.
 * Never invents address data: if a field cannot be determined,
 * it is returned as an empty string so the user can manually enter it.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<GeocodedAddress> {
  try {
    const res = await stakeholderApi.reverseGeocode(lat, lon);
    if (res.success && res.data) {
      return {
        latitude: lat,
        longitude: lon,
        street: res.data.street || res.data.addressLine || '',
        addressLine: res.data.addressLine || res.data.street || '',
        city: res.data.city || '',
        district: res.data.district || '',
        state: res.data.state || '',
        pincode: res.data.pincode || '',
        displayName: res.data.displayName || '',
      };
    }
  } catch (err) {
    console.warn('Backend reverse geocode error, attempting client fallback:', err);
  }

  // Fallback directly to OpenStreetMap Nominatim if backend is unreachable
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street =
        [addr.house_number, addr.road, addr.suburb || addr.neighbourhood]
          .filter(Boolean)
          .join(', ') ||
        addr.road ||
        addr.suburb ||
        '';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const district = addr.state_district
        ? addr.state_district.replace(/\s+District$/i, '')
        : addr.county || addr.city_district || addr.district || '';
      const state = addr.state || '';
      const pincode = addr.postcode || '';

      return {
        latitude: lat,
        longitude: lon,
        street,
        addressLine: street,
        city,
        district,
        state,
        pincode,
        displayName: data.display_name || '',
      };
    }
  } catch (clientErr) {
    console.warn('Client reverse geocode error:', clientErr);
  }

  // If reverse geocoding cannot determine fields, return captured coordinates with empty address fields
  return {
    latitude: lat,
    longitude: lon,
    street: '',
    addressLine: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
  };
}
