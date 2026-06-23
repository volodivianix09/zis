export const WALK_FORMATS = {
  walk: { label: 'Прогулка', emoji: '🚶' },
  coffee: { label: 'Кофе', emoji: '☕' },
  sport: { label: 'Спорт', emoji: '⚽' },
  food: { label: 'Еда', emoji: '🍕' },
  culture: { label: 'Культура', emoji: '🎭' },
  other: { label: 'Другое', emoji: '✨' },
} as const

export const WALK_STATUS = {
  open: { label: 'Открыта', color: 'bg-green-500' },
  matching: { label: 'Подбор', color: 'bg-yellow-500' },
  active: { label: 'Активна', color: 'bg-blue-500' },
  completed: { label: 'Завершена', color: 'bg-gray-500' },
  cancelled: { label: 'Отменена', color: 'bg-red-500' },
} as const

export const LIVENESS_ACTIONS = [
  { id: 'blink', label: 'Моргни' },
  { id: 'smile', label: 'Улыбнись' },
  { id: 'turn_left', label: 'Поверни голову влево' },
  { id: 'turn_right', label: 'Поверни голову вправо' },
  { id: 'look_up', label: 'Посмотри вверх' },
  { id: 'look_down', label: 'Посмотри вниз' },
] as const

export const MAX_WALK_RADIUS_KM = 3
export const DEFAULT_WALK_RADIUS_KM = 1.5
export const PRESENCE_UPDATE_INTERVAL_MS = 10000
export const WALK_DURATION_MINUTES = 60
export const MAX_PARTICIPANTS = 5
