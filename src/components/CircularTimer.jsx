import { useState, useEffect } from 'react'

export default function CircularTimer({ duration, onDismiss }) {
  const [remaining, setRemaining] = useState(duration)

  useEffect(() => {
    setRemaining(duration)
  }, [duration])

  useEffect(() => {
    if (remaining <= 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
      return
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const progress = remaining / duration
  const offset = circumference * (1 - progress)
  const done = remaining <= 0

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const label = mins > 0
    ? `${mins}:${String(secs).padStart(2, '0')}`
    : `${remaining}s`

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-white/50 text-sm uppercase tracking-widest">
          {done ? 'C\'est parti !' : 'Repos'}
        </p>
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={done ? '#10B981' : '#FF6B35'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={done ? 0 : offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
          <text x="50" y="56" textAnchor="middle" fill="white" fontSize="20" fontWeight="600" fontFamily="system-ui">
            {done ? '✓' : label}
          </text>
        </svg>
        <p className="text-white/40 text-sm">Toucher pour fermer</p>
      </div>
    </div>
  )
}
