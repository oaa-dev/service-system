import type { Merchant } from '@/types/api';

/**
 * Calculate the great-circle distance between two points on the Earth
 * using the Haversine formula.
 *
 * @returns Distance in kilometres.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Filter a list of merchants to those whose address coordinates fall within
 * the given radius from the user's position.
 * Merchants without coordinates are excluded.
 */
export function filterByRadius(
  merchants: Merchant[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): Merchant[] {
  return merchants.filter((m) => {
    const lat = m.address?.latitude;
    const lng = m.address?.longitude;
    if (lat == null || lng == null) return false;
    return haversineDistance(userLat, userLng, lat, lng) <= radiusKm;
  });
}
