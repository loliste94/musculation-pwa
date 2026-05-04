import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { PROGRAMME, getTodayKey } from '../data/programme'
import { GROUPE_COLORS } from '../data/colors'
import { formatFormat, isPR, getLastPoids } from '../utils/formatters'

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMER_KEY = 'muscu_timer_end'
const TIMER_PREF_KEY = 'muscu_timer_pref'

const TIMER_PRESETS = [
  { label: '45s',  value: 45,  sub: 'Isolation' },
  { label: '60s',  value: 60,  sub: 'Léger' },
  { label: '90s',  value: 90,  sub: 'Normal' },
  { label: '2min', value: 120, sub: 'Lourd' },
]

const AGENT_CHIPS = [
  'Passer les abdos',
  'Je suis fatigué',
  'Il me reste 20 min',
  'Machine prise',
]

const MACHINE_MAP = {
  hack:       { name: 'Hack Squat',          alt: 'Presse à cuisses' },
  presse:     { name: 'Presse à cuisses',     alt: 'Goblet squat' },
  traction:   { name: 'Tractions lestées',   alt: 'Tirage vertical machine' },
  rowing:     { name: 'Rowing barre',         alt: 'Rowing 1 bras haltère' },
  banc:       { name: 'Développé couché',     alt: 'Développé machine' },
  'leg curl': { name: 'Leg curl',             alt: 'SDT roumain haltères' },
  hip:        { name: 'Hip thrust',           alt: 'Leg curl allongé' },
  tirage:     { name: 'Tirage poitrine',      alt: 'Rowing haltère' },
  curl:       { name: 'Curl haltères',        alt: 'Curl poulie basse' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function scheduleNotification(delaySec) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.ready
    reg?.active?.postMessage({ type: 'SET_TIMER', delay: delaySec * 1000, body: "Série suivante — c'est parti !" })
  } catch {}
}

function repsLabel(ex) {
  if (ex.repsSpecial) return ex.repsSpecial
  return ex.repsMin === ex.repsMax ? `${ex.repsMin}` : `${ex.repsMin}–${ex.repsMax}`
}

function processAgentMessage(text, modifyActiveSession) {
  const t = text.toLowerCase()

  if (t.includes('abdo')) {
    modifyActiveSession(sess => {
      sess.exercices = sess.exercices.filter(ex => ex.groupe !== 'Abdos')
      return sess
    })
    return "Ok — bloc abdos retiré de ce soir. Tu rattraperas à la prochaine séance compatible. Durée gagnée : ~5 min."
  }

  if (t.includes('fatigu') || t.includes('claqué') || t.includes('cassé') || t.includes('dur')) {
    modifyActiveSession(sess => {
      sess.exercices = sess.exercices.map(ex => {
        const doneSets = ex.sets.filter(s => s.done).length
        if (doneSets < ex.sets.length && ex.repsMax <= 8 && ex.sets.length > 1) {
          return { ...ex, sets: ex.sets.slice(0, -1) }
        }
        return ex
      })
      return sess
    })
    return "Compris — j'ai retiré 1 série sur les exos lourds restants. Charges inchangées, garde le rythme."
  }

  const timeMatch = t.match(/(\d+)\s*min/)
  if (timeMatch) {
    const mins = parseInt(timeMatch[1])
    const priority = mins < 30 ? 'Garde uniquement les 3–4 premiers exercices (priorités), passe le reste.' : 'Tu as le temps — reste concentré sur les priorités.'
    return `${mins} minutes — ${priority}`
  }

  if (t.includes('pris') || t.includes('occupé') || t.includes('indisponib') || t.includes('machine')) {
    for (const [kw, { name, alt }] of Object.entries(MACHINE_MAP)) {
      if (t.includes(kw)) {
        return `${name} prise — remplace par ${alt}. Mêmes séries et reps.`
      }
    }
    return "Dis-moi quelle machine est prise — par exemple 'le hack est pris' ou 'la presse est prise'."
  }

  if (t.includes('baiss') || t.includes('moins lourd') || t.includes('-10') || t.includes('-5')) {
    const pct = t.includes('-10') ? 10 : 5
    return `Ok — baisse les charges de ${pct}% sur les exercices restants. Note-le pour ne pas l'oublier en cours de séance.`
  }

  return "Essaie : 'les abdos', 'je suis fatigué', 'il me reste 20 min', 'le hack est pris'."
}

// ─── InlineTimer ─────────────────────────────────────────────────────────────

function InlineTimer({ endTime, duration, onDone }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
  )
  const firedRef = useRef(false)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !firedRef.current) {
        firedRef.current = true
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        setTimeout(onDone, 800)
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [endTime, onDone])

  const r = 14, circ = 2 * Math.PI * r
  const progress = duration > 0 ? Math.max(0, (endTime - Date.now()) / (duration * 1000)) : 0
  const offset = circ * (1 - progress)
  const color = remaining <= 10 ? '#EF4444' : remaining <= 30 ? '#F59E0B' : '#10B981'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#0d0d0d', border: `1px solid ${color}35`,
      borderRadius: 8, padding: '8px 12px', marginTop: 8,
    }}>
      <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
        <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color, fontFamily: 'system-ui',
        }}>
          {remaining}
        </div>
      </div>
      <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Repos en cours</div>
      <button onClick={onDone}
        style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
        Passer
      </button>
    </div>
  )
}

// ─── SerieRow ────────────────────────────────────────────────────────────────

function SerieRow({ setIdx, set, exercise, charges, onChange, onToggle, isSuperset }) {
  const lastKg = getLastPoids(exercise.nom, charges)
  const pr = set.done && set.poids && isPR(exercise.nom, set.poids, charges)
  const rl = repsLabel(exercise)

  const rowBase = {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 10, marginBottom: 4,
    cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
    background: set.done ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${set.done ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.07)'}`,
  }
  const numStyle = { color: set.done ? '#10B981' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }
  const inputStyle = (filled) => ({
    width: 58, background: filled ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${filled ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 7, padding: '5px 6px', fontSize: 13,
    color: '#fff', textAlign: 'center', fontFamily: 'inherit',
    opacity: set.done ? 0.5 : 1, outline: 'none',
  })
  const checkStyle = {
    fontSize: 15, color: set.done ? '#10B981' : 'rgba(255,255,255,0.18)',
    transition: 'color 0.2s', width: 20, textAlign: 'center', flexShrink: 0,
  }

  if (isSuperset) {
    return (
      <div style={rowBase} onClick={onToggle}>
        <span style={numStyle}>{setIdx + 1}</span>
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{rl} reps</span>
        <input type="number" inputMode="decimal" value={set.w1 ?? ''}
          style={inputStyle(!!set.w1)} placeholder="—" disabled={set.done}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onChange('w1', e.target.value) }}
        />
        <input type="number" inputMode="decimal" value={set.w2 ?? ''}
          style={inputStyle(!!set.w2)} placeholder="—" disabled={set.done}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onChange('w2', e.target.value) }}
        />
        <span style={checkStyle}>{set.done ? '✓' : '○'}</span>
      </div>
    )
  }

  return (
    <div style={rowBase} onClick={onToggle}>
      <span style={numStyle}>{setIdx + 1}</span>
      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{rl} reps</span>
      {lastKg && !set.poids && (
        <span style={{ fontSize: 11, color: 'rgba(255,107,53,0.5)', marginRight: 2 }}>{lastKg}kg</span>
      )}
      <input type="number" inputMode="decimal" value={set.poids}
        style={inputStyle(!!set.poids)} placeholder={lastKg ? String(lastKg) : '0'} disabled={set.done}
        onClick={e => e.stopPropagation()}
        onChange={e => { e.stopPropagation(); onChange('poids', e.target.value) }}
      />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>kg</span>
      {pr && <span style={{ fontSize: 13, flexShrink: 0 }}>🔥</span>}
      <span style={checkStyle}>{set.done ? '✓' : '○'}</span>
    </div>
  )
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function ExerciseCard({ exIdx, exercise, sets, charges, onSetChange, onSetToggle, cardRef, onScrollToNext, initialTimer }) {
  const [open, setOpen] = useState(true)
  const [timer, setTimer] = useState(initialTimer || null)
  const [timerDuration, setTimerDuration] = useState(() => {
    const saved = parseInt(localStorage.getItem(TIMER_PREF_KEY))
    return saved > 0 ? saved : (exercise.repos || 90)
  })

  const color = GROUPE_COLORS[exercise.groupe] || '#FF6B35'
  const doneSets = sets.filter(s => s.done).length
  const total = sets.length
  const allDone = doneSets === total
  const isSuperset = exercise.technique === 'SS'
  const exoNames = isSuperset ? exercise.nom.split(' + ') : []

  const subtitle = [
    `${exercise.series}×${repsLabel(exercise)}`,
    getLastPoids(exercise.nom, charges) ? `${getLastPoids(exercise.nom, charges)} kg réf.` : null,
    exercise.repos > 0 ? `${exercise.repos}s` : null,
  ].filter(Boolean).join(' · ')

  function selectPreset(val) {
    setTimerDuration(val)
    localStorage.setItem(TIMER_PREF_KEY, String(val))
  }

  function handleToggle(setIdx) {
    const wasDone = sets[setIdx].done
    onSetToggle(exIdx, setIdx)
    if (!wasDone && timerDuration > 0) {
      const endTime = Date.now() + timerDuration * 1000
      const state = { endTime, duration: timerDuration }
      setTimer(state)
      localStorage.setItem(TIMER_KEY, JSON.stringify({ ...state, exerciseName: exercise.nom }))
      scheduleNotification(timerDuration)
    } else if (wasDone) {
      setTimer(null)
      localStorage.removeItem(TIMER_KEY)
    }
  }

  function clearTimer() {
    setTimer(null)
    localStorage.removeItem(TIMER_KEY)
  }

  return (
    <div
      ref={cardRef}
      style={{ background: '#111111', borderLeft: `3px solid ${color}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{exercise.nom}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {sets.map((s, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: s.done ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"
            style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>

          {/* Timer presets */}
          {exercise.repos > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
                {TIMER_PRESETS.map(p => (
                  <button key={p.value} onClick={() => selectPreset(p.value)}
                    style={{
                      flex: 1, padding: '5px 2px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: timerDuration === p.value ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                      color: timerDuration === p.value ? '#fff' : 'rgba(255,255,255,0.35)',
                      fontSize: 11, fontWeight: 700, transition: 'background 0.15s',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <input type="range" min={15} max={300} step={15} value={timerDuration}
                onChange={e => selectPreset(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#FF6B35', cursor: 'pointer' }}
              />
            </div>
          )}

          {/* SS column headers */}
          {isSuperset && (
            <div style={{ display: 'flex', gap: 10, padding: '0 14px', marginBottom: 4 }}>
              <div style={{ width: 18 }} />
              <div style={{ flex: 1 }} />
              <div style={{ width: 58, textAlign: 'center', fontSize: 10, color: 'rgba(99,102,241,0.7)', fontWeight: 700 }}>
                {exoNames[0]?.split(' ')[0]}
              </div>
              <div style={{ width: 58, textAlign: 'center', fontSize: 10, color: 'rgba(99,102,241,0.7)', fontWeight: 700 }}>
                {exoNames[1]?.split(' ')[0]}
              </div>
              <div style={{ width: 20 }} />
            </div>
          )}

          {sets.map((set, i) => (
            <SerieRow
              key={i}
              setIdx={i}
              set={set}
              exercise={exercise}
              charges={charges}
              isSuperset={isSuperset}
              onChange={(field, val) => onSetChange(exIdx, i, field, val)}
              onToggle={() => handleToggle(i)}
            />
          ))}

          {/* Inline rest timer */}
          {timer && (
            <InlineTimer
              key={timer.endTime}
              endTime={timer.endTime}
              duration={timer.duration}
              onDone={clearTimer}
            />
          )}

          {/* Next exercise button */}
          {allDone && onScrollToNext && (
            <button
              onClick={onScrollToNext}
              style={{
                width: '100%', marginTop: 10, padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Exercice suivant <span style={{ color: '#FF6B35' }}>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── AgentPanel ───────────────────────────────────────────────────────────────

function AgentPanel({ messages, input, onInput, onSend, onClose }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#111111', borderRadius: '16px 16px 0 0',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
      maxHeight: '62vh', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Assistant</span>
        </div>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '8px 12px', lineHeight: 1.45, fontSize: 13, color: '#fff',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? '#FF6B35' : '#1c1c1c',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Quick chips */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 16px', overflowX: 'auto', flexShrink: 0 }}>
        {AGENT_CHIPS.map(chip => (
          <button key={chip} onClick={() => onSend(chip)}
            style={{
              whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 20,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer',
            }}>
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 28px', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend(input)}
          placeholder="Dis-moi ce qui se passe…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: '10px 16px', fontSize: 13, color: '#fff',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={() => onSend(input)}
          style={{
            width: 44, height: 44, borderRadius: '50%', background: '#FF6B35',
            border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
          →
        </button>
      </div>
    </div>
  )
}

// ─── StopwatchDisplay ────────────────────────────────────────────────────────

function StopwatchDisplay({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return (
    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
      {h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
    </span>
  )
}

// ─── TodayScreen ─────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const navigate = useNavigate()
  const { activeSession, charges, startSession, updateSet, toggleSet, finishSession, modifyActiveSession } = useSession()
  const [finished, setFinished] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentMessages, setAgentMessages] = useState([
    { role: 'assistant', text: "Bonjour ! Je peux adapter ta séance en temps réel. Dis-moi ce qui se passe." }
  ])
  const [agentInput, setAgentInput] = useState('')
  const cardRefs = useRef([])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const storedTimer = (() => {
    try {
      const s = localStorage.getItem(TIMER_KEY)
      if (s) {
        const p = JSON.parse(s)
        if (p.endTime > Date.now()) return p
      }
    } catch {}
    return null
  })()

  function sendAgentMessage(text) {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    const response = processAgentMessage(text, modifyActiveSession)
    setAgentMessages(prev => [...prev, userMsg, { role: 'assistant', text: response }])
    setAgentInput('')
  }

  const todayKey = getTodayKey()
  const todayProg = PROGRAMME[todayKey]

  function handleStart() {
    if (!todayProg) return
    startSession(todayKey, todayProg.exercices, todayProg.titre)
  }

  function handleFinish() {
    localStorage.removeItem(TIMER_KEY)
    finishSession()
    setFinished(true)
  }

  const totalSets = activeSession?.exercices.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0
  const doneSets  = activeSession?.exercices.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0) ?? 0
  const progress  = totalSets > 0 ? (doneSets / totalSets) * 100 : 0

  // ── Séance terminée ──
  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="text-5xl">💪</div>
        <h2 className="text-white text-2xl font-bold text-center">Séance terminée !</h2>
        <p className="text-white/50 text-center">Toutes les données ont été sauvegardées.</p>
        <button onClick={() => setFinished(false)} className="px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ background: '#FF6B35' }}>
          Nouvelle séance
        </button>
      </div>
    )
  }

  // ── Séance en cours ──
  if (activeSession) {
    return (
      <div className="flex flex-col min-h-full">
        {/* Header compact */}
        <div className="pt-safe px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{activeSession.titre}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StopwatchDisplay startTime={activeSession.startTime} />
              <button
                onClick={() => setAgentOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: agentOpen ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: '#fff', fontSize: 12, cursor: 'pointer',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Assistant
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#FF6B35', width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{doneSets}/{totalSets}</span>
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 px-3 pb-4">
          {activeSession.exercices.map((ex, exIdx) => (
            <ExerciseCard
              key={ex.id + exIdx}
              exIdx={exIdx}
              exercise={ex}
              sets={ex.sets}
              charges={charges}
              cardRef={el => cardRefs.current[exIdx] = el}
              initialTimer={storedTimer?.exerciseName === ex.nom ? storedTimer : null}
              onSetChange={updateSet}
              onSetToggle={(eI, sI) => toggleSet(eI, sI)}
              onScrollToNext={
                exIdx < activeSession.exercices.length - 1
                  ? () => cardRefs.current[exIdx + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  : null
              }
            />
          ))}
        </div>

        {/* Finish */}
        <div className="px-4 pb-4 flex-shrink-0">
          <button onClick={handleFinish} className="w-full py-4 rounded-2xl text-white font-bold text-base active:opacity-80"
            style={{ background: '#FF6B35' }}>
            Terminer la séance
          </button>
        </div>

        {/* Agent panel */}
        {agentOpen && (
          <AgentPanel
            messages={agentMessages}
            input={agentInput}
            onInput={setAgentInput}
            onSend={sendAgentMessage}
            onClose={() => setAgentOpen(false)}
          />
        )}
      </div>
    )
  }

  // ── Preview / Repos ──
  const isRestDay = !todayProg
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
              <span key={g} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: (GROUPE_COLORS[g] || '#888') + '25', color: GROUPE_COLORS[g] || '#888' }}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {isRestDay ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-5xl">😴</div>
          <p className="text-white/60 text-center">Journée de récupération — profites-en pour bien dormir et manger.</p>
          <button onClick={() => navigate('/generer')} className="mt-4 px-6 py-3 rounded-2xl text-white text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            Générer une séance spéciale
          </button>
        </div>
      ) : (
        <div className="flex-1 px-4">
          {todayProg.exercices.map((ex, i) => {
            const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
            return (
              <div key={ex.id + i} className="flex items-center gap-3 py-3"
                style={{ borderBottom: 'solid 1px rgba(255,255,255,0.06)' }}>
                <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ex.nom}</p>
                  <p className="text-white/40 text-xs mt-0.5">{formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isRestDay && (
        <div className="px-4 py-4 flex-shrink-0">
          <button onClick={handleStart} className="w-full py-4 rounded-2xl text-white font-bold text-base active:opacity-80"
            style={{ background: '#FF6B35' }}>
            Démarrer la séance
          </button>
        </div>
      )}
    </div>
  )
}