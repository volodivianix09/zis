export type WalkFormat = 'walk' | 'coffee' | 'sport' | 'food' | 'culture' | 'other'

export type WalkStatus = 'open' | 'matching' | 'active' | 'completed' | 'cancelled'

export type ParticipantRole = 'creator' | 'participant'

export type ParticipantStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  telegram_id: number
  username: string | null
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_verified: boolean
  liveness_passed_at: string | null
  rating: number
  walk_count: number
  created_at: string
}

export interface Walk {
  id: string
  creator_id: string
  title: string
  description: string | null
  format: WalkFormat
  district: string | null
  address: string | null
  location: {
    lat: number
    lng: number
  }
  max_people: number
  current_count: number
  status: WalkStatus
  scheduled_at: string
  created_at: string
  expires_at: string | null
}

export interface WalkParticipant {
  walk_id: string
  user_id: string
  role: ParticipantRole
  status: ParticipantStatus
  liveness_verified: boolean
  joined_at: string
}

export interface Message {
  id: string
  walk_id: string
  sender_id: string
  content: string
  encrypted_content: string | null
  iv: string | null
  created_at: string
  is_system: boolean
}

export interface Review {
  id: string
  walk_id: string
  reviewer_id: string
  target_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface LivenessChallenge {
  id: string
  action: 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'look_up' | 'look_down'
  expires_at: string
}

export interface LivenessResult {
  challenge_id: string
  score: number
  passed: boolean
  device_fingerprint: string
}

export interface GeoPoint {
  lat: number
  lng: number
}

export interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

export interface TelegramInitData {
  user?: TelegramWebAppUser
  auth_date: number
  hash: string
}
