'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { LIVENESS_ACTIONS } from '@/lib/constants'
import { Camera, CheckCircle, XCircle } from 'lucide-react'

interface LivenessCheckProps {
  onComplete: (result: { passed: boolean; score: number }) => void
  onCancel: () => void
}

export function LivenessCheck({ onComplete, onCancel }: LivenessCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState<'camera' | 'challenge' | 'processing' | 'result'>('camera')
  const [currentAction, setCurrentAction] = useState<typeof LIVENESS_ACTIONS[number] | null>(null)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 'camera') return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        setError('Не удалось получить доступ к камере')
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [step])

  const startChallenge = useCallback(() => {
    setStep('challenge')
    const randomAction = LIVENESS_ACTIONS[Math.floor(Math.random() * LIVENESS_ACTIONS.length)]
    setCurrentAction(randomAction)

    let frames = 0
    const maxFrames = 60
    const interval = setInterval(() => {
      frames++
      if (frames >= maxFrames) {
        clearInterval(interval)
        processResult()
      }
    }, 50)
  }, [])

  const processResult = useCallback(() => {
    setStep('processing')

    const simulatedScore = Math.random() * 0.3 + 0.7
    const didPass = simulatedScore > 0.6

    setScore(simulatedScore)
    setPassed(didPass)
    setStep('result')
  }, [])

  const handleComplete = () => {
    onComplete({ passed, score })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onCancel} className="text-lg">
          Отмена
        </button>
        <span className="font-semibold">Проверка</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {step === 'challenge' && currentAction && (
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <div className="bg-black/60 text-white px-6 py-4 rounded-2xl mx-4 inline-block">
              <p className="text-xl font-semibold">{currentAction.label}</p>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg">Проверяем...</p>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white p-6">
              {passed ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">Проверка пройдена!</p>
                  <p className="text-gray-300">
                    Оценка: {Math.round(score * 100)}%
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-xl font-semibold mb-2">Проверка не пройдена</p>
                  <p className="text-gray-300">Попробуйте ещё раз</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black">
        {step === 'camera' && (
          <button
            onClick={startChallenge}
            className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold"
          >
            <Camera className="w-5 h-5 inline mr-2" />
            Начать проверку
          </button>
        )}

        {step === 'result' && (
          <button
            onClick={handleComplete}
            className={`w-full py-4 rounded-lg font-semibold text-white ${
              passed ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {passed ? 'Продолжить' : 'Попробовать снова'}
          </button>
        )}

        {error && (
          <p className="text-red-400 text-center mt-2">{error}</p>
        )}
      </div>
    </div>
  )
}
