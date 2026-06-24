'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWalkStore } from '@/hooks/useWalkStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { WALK_FORMATS } from '@/lib/constants'
import type { Walk } from '@/types'
import { MapPin, Plus, X, Clock, Users, Navigation } from 'lucide-react'
import Link from 'next/link'

interface WalkCard extends Walk {
  creator?: { display_name: string; avatar_url: string | null }
  distance_km?: number
  lat?: number
  lng?: number
}

export default function MapPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { userLocation, setUserLocation } = useWalkStore()
  const [walks, setWalks] = useState<WalkCard[]>([])
  const [selectedWalk, setSelectedWalk] = useState<WalkCard | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapInitRef = useRef(false)
  const [joining, setJoining] = useState(false)
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [geoError, setGeoError] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const loadingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    retryGeolocation()
  }, [setUserLocation])

  const retryGeolocation = () => {
    setGeoError(false)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { setGeoError(true); setUserLocation({ lat: 55.7558, lng: 37.6173 }) }
      )
    }
  }


    useEffect(() => {
    if (!userLocation) return

    const fetchWalks = async () => {
      const res = await fetch(`/api/walks/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=3&status=open`)
      const data = await res.json()
      if (data.walks) setWalks(data.walks)
    }

    fetchWalks()
    const interval = setInterval(fetchWalks, 30000)
    return () => clearInterval(interval)
  }, [userLocation])

  useEffect(() => {
    if (!userLocation || mapLoaded || mapInitRef.current) return
    mapInitRef.current = true

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`
    loadingTimeoutRef.current = setTimeout(() => {
      setMapLoaded(true)
    }, 15000)

    script.onload = () => {
      const ymaps = (window as any).ymaps
      if (!ymaps) {
        setError('Не удалось загрузить Яндекс.Карты')
        setMapLoaded(true)
        return
      }
      ymaps.ready(() => {
        try {
          const map = new ymaps.Map('map', {
            center: [userLocation.lat, userLocation.lng],
            zoom: 14,
            controls: ['zoomControl'],
          })

          const clusterer = new ymaps.Clusterer({ preset: 'islands#invertedBlueClusterIcons' })
          const placemarks = walks.map((walk, idx) => {
            const pm = new ymaps.Placemark(
              [walk.lat || walk.location?.lat, walk.lng || walk.location?.lng],
              { balloonContent: walk.title },
              { preset: 'islands#blueCircleDotIcon' }
            )
            pm.events.add('click', () => setSelectedWalk(walks[idx]))
            return pm
          })

          clusterer.add(placemarks)
          map.geoObjects.add(clusterer)

          if (userLocation) {
            const myPos = new ymaps.Placemark(
              [userLocation.lat, userLocation.lng],
              { hintContent: 'Вы здесь' },
              { preset: 'islands#blueCircleIcon' }
            )
            map.geoObjects.add(myPos)
          }

          setMapLoaded(true)
        } catch (e) {
          setError('Ошибка при инициализации карты')
          setMapLoaded(true)
        }
      })
    }
    script.onerror = () => {
      setError('Не удалось загрузить карту. Проверьте API ключ.')
      setMapLoaded(true)
    }
    document.head.appendChild(script)

    return () => clearTimeout(loadingTimeoutRef.current)
  }, [userLocation, walks, mapLoaded])

  const handleJoin = async (walkId: string) => {
    if (!user) { router.push('/profile'); return }
    setJoining(true)
    setError(null)

    const res = await fetch(`/api/walks/${walkId}/join`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      router.push(`/chats/${walkId}`)
    } else {
      setError(data.error || 'Ошибка при отклике')
    }
    setJoining(false)
  }

  return (
    <div className="relative h-screen">
      <div id="map" className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <MapPin className="w-10 h-10 mx-auto text-blue-600 animate-pulse" />
            <p className="mt-2 text-sm text-gray-500">Загрузка карты...</p>
          </div>
        </div>
      )}

            {geoError && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-amber-800 mb-2">Не удалось определить местоположение. Показан центр Москвы.</p>
          <button
            onClick={retryGeolocation}
            className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      )}

{error && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Link
        href="/walk/create"
        className="absolute bottom-24 right-4 z-20 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-6 h-6 text-white" />
      </Link>

      {walks.length > 0 && !selectedWalk && (
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow">
          {walks.length} прогулок рядом
        </div>
      )}

            {viewMode === 'list' && (
        <div className="absolute inset-0 z-10 pt-20 pb-32 overflow-y-auto bg-white">
          <div className="px-4 space-y-2">
            {walks.filter(w => formatFilter === 'all' || w.format === formatFilter).map(walk => (
              <button
                key={walk.id}
                onClick={() => setSelectedWalk(walk)}
                className="w-full bg-white border rounded-xl p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{WALK_FORMATS[walk.format as keyof typeof WALK_FORMATS]?.emoji || '🚶'}</span>
                  <h3 className="font-semibold">{walk.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {walk.district && <span>{walk.district}</span>}
                  <span>{walk.current_count}/{walk.max_people}</span>
                  <span>{new Date(walk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                  {walk.distance_km && <span>{walk.distance_km.toFixed(1)} км</span>}
                </div>
              </button>
            ))}
            {walks.filter(w => formatFilter === 'all' || w.format === formatFilter).length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>Нет подходящих прогулок</p>
              </div>
            )}
          </div>
        </div>
      )}
      {selectedWalk && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{selectedWalk.title}</h2>
                <span>{WALK_FORMATS[selectedWalk.format as keyof typeof WALK_FORMATS]?.emoji}</span>
              </div>
              {selectedWalk.creator && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedWalk.creator.display_name}
                </p>
              )}
            </div>
            <button onClick={() => setSelectedWalk(null)} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {selectedWalk.description && (
              <p className="text-sm text-gray-600">{selectedWalk.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {selectedWalk.current_count}/{selectedWalk.max_people}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(selectedWalk.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {selectedWalk.distance_km && (
                <span className="flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  {selectedWalk.distance_km < 1
                    ? `${Math.round(selectedWalk.distance_km * 1000)}м`
                    : `${selectedWalk.distance_km.toFixed(1)}км`}
                </span>
              )}
              {selectedWalk.district && (
                <span>{selectedWalk.district}</span>
              )}
            </div>

            <button
              onClick={() => handleJoin(selectedWalk.id)}
              disabled={joining || selectedWalk.current_count >= selectedWalk.max_people}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? 'Отправка...' :
               selectedWalk.current_count >= selectedWalk.max_people ? 'Мест нет' :
               'Откликнуться'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
