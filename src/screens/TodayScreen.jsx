import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { PROGRAMME, getTodayKey } from '../data/programme'
import { GROUPE_COLORS, TECH_COLORS, TECH_LABELS } from '../data/colors'
import { formatFormat, formatDuration, isPR, getLastPoids } from '../utils/formatters'
import CircularTimer from '../components/CircularTimer'

function SerieRow({ setIdx, set, exercise, charges, onChange, onComplete }) {
  const lastKg = getLastPoids(exercise.nom, charges)
  const pr = set.done && set.poids && isPR(exercise.nom, set.poids, charges)

  return (
    <div className={`flex items-center gap-2 py-1 ${set.done ? 'opacity-50' : ''}`}>
      <span className="text-white/30 text-sm w-5 text-center">{setIdx + 1}</span>
      <div className="flex items-center bg-white/5 rounded-xl overflow-hidden flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={set.reps}
          onChange={e => onChange('reps', e.target.value)}
          placeholder={exercise.repsMin > 0 ? String(exercise.repsMin) : '—'}
          disabled={set.done}
          className="w-full bg-transparent text-white text-center py-2 text-sm outline-none placeholder-white/20"
        />
        <span className="text-white/30 text-xs pr-2">reps</span>
      </div>
      <div className="flex items-center bg-white/5 rounded-xl overflow-hidden flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={set.poids}
          onChange={e => onChange('poids', e.target.value)}
          placeholder={lastKg ? String(lastKg) : '0'}
          disabled={set.done}
          className="w-full bg-transparent text-white text-center py-2 text-sm outline-none placeholder-white/20"
        />
        <span className="text-white/30 text-xs pr-2">kg</span>
      </div>
      {pr && <span className="text-xs">🔥</span>}
      <button
        onClick={onComplete}
        disabled={set.done}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
        style={{
          background: set.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
          color: set.done ? '#10B981' : 'rgba(255,255,255,0.4)',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
    </div>
  )
}

function ExerciseCard({ exIdx, exercise, sets, charges, onSetChange, onSetComplete }) {
  const [open, setOpen] = useState(true)
  const color = GROUPE_COLORS[exercise.groupe] || '#FF6B35'
  const done = sets.filter(s => s.done).length
  const total = sets.length

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: '#111111', borderLeft: `3px solid ${color}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm leading-tight">{exercise.nom}</span>
            {exercise.technique && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: TECH_COLORS[exercise.technique] + '30', color: TECH_COLORS[exercise.technique] }}
              >
                {TECH_LABELS[exercise.technique]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-medium" style={{ color }}>{exercise.groupe}</span>
            <span className="text-white/30 text-xs">{formatFormat(exercise)}</span>
            <span className="text-white/30 text-xs">{exercise.repos > 0 ? `${exercise.repos}s repos` : ''}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <span className="text-white/50 text-sm">{done}/{total}</span>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 text-white/30 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/20 text-xs w-5"></span>
            <span className="text-white/30 text-xs flex-1 text-center">Reps</span>
            <span className="text-white/30 text-xs flex-1 text-center">Poids</span>
            <span className="w-10"></span>
          </div>
          {sets.map((set, i) => (
            <SerieRow
              key={i}
              setIdx={i}
              set={set}
              exercise={exercise}
              charges={charges}
              onChange={(field, val) => onSetChange(exIdx, i, field, val)}
              onComplete={() => onSetComplete(exIdx, i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StopwatchDisplay({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const label = h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`

  return <span className="text-white/60 text-sm font-mono">{label}</span>
}

export default function TodayScreen() {
  const navigate = useNavigate()
  const { activeSession, charges, startSession, updateSet, completeSet, finishSession } = useSession()
  const [restTimer, setRestTimer] = useState(null)
  const [finished, setFinished] = useState(false)

  const todayKey = getTodayKey()
  const todayProg = PROGRAMME[todayKey]

  function handleStart() {
    if (!todayProg) return
    startSession(todayKey, todayProg.exercices, todayProg.titre)
  }

  function handleSetComplete(exIdx, setIdx) {
    completeSet(exIdx, setIdx)
    const repos = activeSession.exercices[exIdx].repos
    if (repos > 0) {
      setRestTimer({ duration: repos, exerciseName: activeSession.exercices[exIdx].nom })
    }
  }

  function handleFinish() {
    finishSession()
    setFinished(true)
  }

  const totalSets = activeSession?.exercices.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0
  const doneSets  = activeSession?.exercices.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0) ?? 0
  const progress  = totalSets > 0 ? (doneSets / totalSets) * 100 : 0

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">💪</div>
        <h2 className="text-white text-2xl font-bold text-center">Séance terminée !</h2>
        <p className="text-white/50 text-center">Toutes les données ont été sauvegardées.</p>
        <button
          onClick={() => setFinished(false)}
          className="px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ background: '#FF6B35' }}
        >
          Nouvelle séance
        </button>
      </div>
    )
  }

  if (activeSession) {
    return (
      <div className="flex flex-col min-h-full">
        {restTimer && (
          <CircularTimer
            key={restTimer.exerciseName + Date.now()}
            duration={restTimer.duration}
            onDismiss={() => setRestTimer(null)}
          />
        )}

        {/* Header */}
        <div className="pt-safe px-4 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-white font-bold text-lg leading-tight">{activeSession.titre}</h1>
            <StopwatchDisplay startTime={activeSession.startTime} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: '#FF6B35' }}
              />
            </div>
            <span className="text-white/40 text-xs">{doneSets}/{totalSets} séries</span>
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 px-4 pb-4">
          {activeSession.exercices.map((ex, exIdx) => (
            <ExerciseCard
              key={ex.id + exIdx}
              exIdx={exIdx}
              exercise={ex}
              sets={ex.sets}
              charges={charges}
              onSetChange={updateSet}
              onSetComplete={handleSetComplete}
            />
          ))}
        </div>

        {/* Finish button */}
        <div className="px-4 pb-4 flex-shrink-0">
          <button
            onClick={handleFinish}
            className="w-full py-4 rounded-2xl text-white font-bold text-base transition-opacity active:opacity-80"
            style={{ background: '#FF6B35' }}
          >
            Terminer la séance
          </button>
        </div>
      </div>
    )
  }

  // No active session — show today's programme preview or rest day
  const isRestDay = !todayProg
  const dayNames = { lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi', vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche' }
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col min-h-full">
      <div className="pt-safe px-4 pt-6 pb-4 flex-shrink-0">
        <p className="text-white/40 text-sm capitalize">{today}</p>
        <h1 className="text-white font-bold text-2xl mt-1">
          {isRestDay ? 'Repos' : todayProg.titre}
        </h1>
        {!isRestDay && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {todayProg.groupes.map(g => (
              <span
                key={g}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: (GROUPE_COLORS[g] || '#888') + '25', color: GROUPE_COLORS[g] || '#888' }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {isRestDay ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-5xl">😴</div>
          <p className="text-white/60 text-center text-base">Journée de récupération — profites-en pour bien dormir et manger.</p>
          <button
            onClick={() => navigate('/generer')}
            className="mt-4 px-6 py-3 rounded-2xl text-white text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            Générer une séance spéciale
          </button>
        </div>
      ) : (
        <div className="flex-1 px-4">
          {todayProg.exercices.map((ex, i) => {
            const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
            return (
              <div
                key={ex.id + i}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: 'solid 1px rgba(255,255,255,0.06)' }}
              >
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ex.nom}</p>
                  <p className="text-white/40 text-xs mt-0.5">{formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}</p>
                </div>
                {ex.technique && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                    style={{ background: TECH_COLORS[ex.technique] + '25', color: TECH_COLORS[ex.technique] }}
                  >
                    {ex.technique}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isRestDay && (
        <div className="px-4 py-4 flex-shrink-0">
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl text-white font-bold text-base active:opacity-80"
            style={{ background: '#FF6B35' }}
          >
            Démarrer la séance
          </button>
        </div>
      )}
    </div>
  )
}
