import { getServiceClient } from './supabase.ts'

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function checkGeofence(
  latitude: number,
  longitude: number
): Promise<{ inside: boolean }> {
  const supabase = getServiceClient()
  const { data: geofences } = await supabase
    .from('geofence_config')
    .select('latitude, longitude, radius_meters')
    .eq('is_active', true)

  if (!geofences || geofences.length === 0) return { inside: true }

  for (const gf of geofences) {
    const distKm = haversineDistance(latitude, longitude, gf.latitude, gf.longitude)
    const distMeters = distKm * 1000
    if (distMeters <= gf.radius_meters) return { inside: true }
  }

  return { inside: false }
}

export function checkDrift(
  checkInLat: number,
  checkInLng: number,
  checkOutLat: number,
  checkOutLng: number,
  maxDriftKm = 50
): boolean {
  const dist = haversineDistance(checkInLat, checkInLng, checkOutLat, checkOutLng)
  return dist > maxDriftKm
}
