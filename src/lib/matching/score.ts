import type { Walk, GeoPoint } from '@/types'
import { getDistanceKm } from '@/lib/geo/distance'
import { MAX_WALK_RADIUS_KM } from '@/lib/constants'

interface MatchScore {
  walk: Walk
  score: number
  distance: number
}

export function calculateMatchScore(
  walk: Walk,
  userLocation: GeoPoint,
  userProfile: { rating: number; walk_count: number }
): MatchScore {
  const distance = getDistanceKm(userLocation, walk.location)

  if (distance > MAX_WALK_RADIUS_KM) {
    return { walk, score: 0, distance }
  }

  const distanceScore = Math.max(0, 1 - distance / MAX_WALK_RADIUS_KM) * 40

  const now = Date.now()
  const scheduledTime = new Date(walk.scheduled_at).getTime()
  const timeDiffMinutes = Math.abs(scheduledTime - now) / (1000 * 60)
  const timeScore = Math.max(0, 1 - timeDiffMinutes / 60) * 30

  const trustScore = Math.min(walkProfile_rating_to_trust(userProfile.rating), 20)

  const capacityScore = walk.current_count < walk.max_people ? 10 : 0

  const totalScore = distanceScore + timeScore + trustScore + capacityScore

  return { walk, score: totalScore, distance }
}

function walkProfile_rating_to_trust(rating: number): number {
  if (rating >= 4.5) return 20
  if (rating >= 4.0) return 15
  if (rating >= 3.5) return 10
  return 5
}

export function rankWalks(
  walks: Walk[],
  userLocation: GeoPoint,
  userProfile: { rating: number; walk_count: number }
): MatchScore[] {
  return walks
    .map((walk) => calculateMatchScore(walk, userLocation, userProfile))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}
