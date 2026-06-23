import type { GeoPoint } from '@/types'

export function getDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`
  return `${km.toFixed(1)} км`
}

export function isWithinRadius(point: GeoPoint, center: GeoPoint, radiusKm: number): boolean {
  return getDistanceKm(point, center) <= radiusKm
}
