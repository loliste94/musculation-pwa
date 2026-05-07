import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { PROGRAMME, getTodayKey } from '../data/programme'
import { GROUPE_COLORS } from '../data/colors'
import { formatFormat, isPR, getLastPoids } from '../utils/formatters'
import { ExerciseImage } from '../hooks/useExerciseImage.jsx'

const TIMER_KEY = 'muscu_timer_end'
const TIMER_PREF_KEY = 'muscu_timer_pref'

const TIMER_PRESETS = [
  { label: '45s',  value: 45  },
  { label: '60s',  value: 60  },
  { label: '90s',  value: 90  },
  { label: '2min', value: 120 },
]

const AGENT_CHIPS = ['Passer les abdos', 'Je suis fatigué', 'Il me reste 20 min', 'Machine prise']

const MACHINE_MAP = {
  hack:       { name: 'Hack Squat',        alt: 'Presse à cuisses' },
  presse:     { name: 'Presse à cuisses',  alt: 'Goblet squat' },
  traction:   { name: 'Tractions lestées', alt: 'Tirage vertical machine' },
  rowing:     { name: 'Rowing barre',      alt: 'Rowing 1 bras haltère' },
  banc:       { name: 'Développé couché',  alt: 'Développé machine' },
  'leg curl': { name: 'Leg curl',          alt: 'SDT roumain haltères' },
  hip:        { name: 'Hip thrust',        alt: 'Leg curl allongé' },
  tirage:     { name: 'Tirage poitrine',   alt: 'Rowing haltère' },
  curl:       { name: 'Curl haltères',     alt: 'Curl poulie basse' },
}

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

function estimatedMinutes(exercices) {
  const total = exercices.reduce((t, ex) => t + ex.series * ((ex.repos || 90) + 40), 0)
  return Math.max(30, Math.round(total / 60 / 5) * 5)
}

function processAgentMessage(text, modifyActiveSession) {
  const t = text.toLowerCase()
  if (t.includes('abdo')) {
    modifyActiveSession(sess => { sess.exercices = sess.exercices.filter(ex => ex.groupe !== 'Abdos'); return sess })
    return "Ok — bloc abdos retiré de ce soir. Tu rattraperas à la prochaine séance compatible. Durée gagnée : ~5 min."
  }
  if (t.includes('fatigu') || t.includes('claqué') || t.includes('cassé') || t.includes('dur')) {
    modifyActiveSession(sess => {
      sess.exercices = sess.exercices.map(ex => {
        const doneSets = ex.sets.filter(s => s.done).length
        if (doneSets < ex.sets.length && ex.repsMax <= 8 && ex.sets.length > 1) return { ...ex, sets: ex.sets.slice(0, -1) }
        return ex
      })
      return sess
    })
    return "Compris — j'ai retiré 1 série sur les exos lourds restants. Charges inchangées, garde le rythme."
  }
  const timeMatch = t.match(/(\d+)\s*min/)
  if (timeMatch) {
    const mins = parseInt(timeMatch[1])
    return `${mins} minutes — ${mins < 30 ? 'Garde uniquement les 3–4 premiers exercices, passe le reste.' : 'Tu as le temps — reste concentré.'}`
  }
  if (t.includes('pris') || t.includes('occupé') || t.includes('indisponib') || t.includes('machine')) {
    for (const [kw, { name, alt }] of Object.entries(MACHINE_MAP)) {
      if (t.includes(kw)) return `${name} prise — remplace par ${alt}. Mêmes séries et reps.`
    }
    return "Dis-moi quelle machine est prise — ex. 'le hack est pris'."
  }
  if (t.includes('baiss') || t.includes('moins lourd') || t.includes('-10') || t.includes('-5')) {
    return `Ok — baisse les charges de ${t.includes('-10') ? 10 : 5}% sur les exercices restants.`
  }
  return "Essaie : 'les abdos', 'je suis fatigué', 'il me reste 20 min', 'le hack est pris'."
}

// ─── RestTimerSheet ───────────────────────────────────────────────────────────

function RestTimerSheet({ endTime, duration, exerciseName, onDone, onAdjust }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endTime - Date.now()) / 1000)))
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
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

  const r = 50, circ = 2 * Math.PI * r
  const progress = duration > 0 ? Math.max(0, (endTime - Date.now()) / (duration * 1000)) : 0
  const offset = circ * (1 - progress)
  const color = remaining <= 10 ? '#EF4444' : remaining <= 30 ? '#F59E0B' : '#10B981'
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <>
      <div onClick={onDone} style={{ position: 'fixed', inset: 0, zIndex: 290, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300,
        background: '#141414', borderRadius: '22px 22px 0 0',
        padding: '12px 24px 44px',
        boxShadow: '0 -24px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }} />

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 22, letterSpacing: 1, textTransform: 'uppercase' }}>
          Repos · {exerciseName}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 124, height: 124 }}>
            <svg width="124" height="124" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="62" cy="62" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
              <circle cx="62" cy="62" r={r} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: -2 }}>
                {timeStr}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button onClick={() => onAdjust(-10)} style={{
            flex: 1, padding: '12px', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)', border: 'none',
            color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>−10s</button>
          <button onClick={() => onAdjust(+10)} style={{
            flex: 1, padding: '12px', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)', border: 'none',
            color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>+10s</button>
        </div>

        <button onClick={onDone} style={{
          width: '100%', padding: '14px', borderRadius: 16,
          background: color + '18', border: `1.5px solid ${color}35`,
          color, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          Passer le repos
        </button>
      </div>
    </>
  )
}

// ─── SerieRow ────────────────────────────────────────────────────────────────

function SerieRow({ setIdx, set, exercise, charges, onChange, onToggle, isSuperset }) {
  const lastKg = getLastPoids(exercise.nom, charges)
  const pr = set.done && set.poids && isPR(exercise.nom, set.poids, charges)
  const rl = repsLabel(exercise)
  const isDone = set.done

  const inputStyle = (filled) => ({
    width: 58, textAlign: 'center', fontSize: 14, fontWeight: 600,
    background: filled ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${filled ? 'rgba(255,107,53,0.25)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8, padding: '6px 4px', color: '#fff',
    outline: 'none', opacity: isDone ? 0.5 : 1, fontFamily: 'inherit',
  })

  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 4px', cursor: 'pointer',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: isDone ? 'rgba(16,185,129,0.05)' : 'transparent',
      transition: 'background 0.2s',
    }}>
      <span style={{ width: 22, textAlign: 'center', fontSize: 12, fontWeight: 700, color: isDone ? '#10B981' : 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
        {setIdx + 1}
      </span>
      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{rl} reps</span>

      {isSuperset ? (
        <>
          <input type="number" inputMode="decimal" value={set.w1 ?? ''} placeholder="—" disabled={isDone}
            style={{ ...inputStyle(!!set.w1), width: 54 }}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onChange('w1', e.target.value) }}
          />
          <input type="number" inputMode="decimal" value={set.w2 ?? ''} placeholder="—" disabled={isDone}
            style={{ ...inputStyle(!!set.w2), width: 54 }}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onChange('w2', e.target.value) }}
          />
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="number" inputMode="decimal" value={set.poids}
            placeholder={lastKg ? String(lastKg) : '0'} disabled={isDone}
            style={inputStyle(!!set.poids)}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onChange('poids', e.target.value) }}
          />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 16 }}>kg</span>
        </div>
      )}

      {pr && <span style={{ fontSize: 12, flexShrink: 0 }}>🔥</span>}

      <div style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: isDone ? '#10B981' : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${isDone ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {isDone && (
          <svg viewBox="0 0 12 10" fill="none" width="12" height="10">
            <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </div>
  )
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function ExerciseCard({ exIdx, exercise, sets, charges, onSetChange, onSetToggle, cardRef, onScrollToNext, timerDuration, onTimerStart }) {
  const [open, setOpen] = useState(true)
  const color = GROUPE_COLORS[exercise.groupe] || '#FF6B35'
  const doneSets = sets.filter(s => s.done).length
  const total = sets.length
  const allDone = doneSets === total
  const isSuperset = exercise.technique === 'SS'
  const exoNames = isSuperset ? exercise.nom.split(' + ') : []

  function handleToggle(setIdx) {
    const wasDone = sets[setIdx].done
    onSetToggle(exIdx, setIdx)
    if (!wasDone && timerDuration > 0) {
      onTimerStart(timerDuration, exercise.nom)
    }
  }

  return (
    <div ref={cardRef} style={{
      background: '#111111', borderRadius: 16, marginBottom: 10, overflow: 'hidden',
      border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'border-color 0.3s',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <ExerciseImage id={exercise.id} nom={exercise.nom} groupe={exercise.groupe} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{exercise.nom}</span>
            {exercise.technique && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: color + '22', color, flexShrink: 0 }}>
                {exercise.technique}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {exercise.series}×{repsLabel(exercise)} · {exercise.repos > 0 ? `${exercise.repos}s` : 'RP'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {sets.map((s, i) => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: 4,
                background: s.done ? '#10B981' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"
            style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 2 }}>
            <span style={{ width: 22, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>#</span>
            <span style={{ flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>REPS</span>
            {isSuperset ? (
              <>
                <span style={{ width: 54, textAlign: 'center', fontSize: 10, color: color, opacity: 0.6, fontWeight: 700 }}>{exoNames[0]?.split(' ')[0]?.toUpperCase()}</span>
                <span style={{ width: 54, textAlign: 'center', fontSize: 10, color: color, opacity: 0.6, fontWeight: 700 }}>{exoNames[1]?.split(' ')[0]?.toUpperCase()}</span>
              </>
            ) : (
              <span style={{ width: 78, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>KG</span>
            )}
            <div style={{ width: 26 }} />
          </div>

          {sets.map((set, i) => (
            <SerieRow
              key={i} setIdx={i} set={set} exercise={exercise} charges={charges}
              isSuperset={isSuperset}
              onChange={(field, val) => onSetChange(exIdx, i, field, val)}
              onToggle={() => handleToggle(i)}
            />
          ))}

          {allDone && onScrollToNext && (
            <button onClick={onScrollToNext} style={{
              width: '100%', marginTop: 10, padding: '10px 14px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12, color: '#10B981', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              Exercice suivant
              <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#111111', borderRadius: '16px 16px 0 0',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
      maxHeight: '62vh', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%', padding: '8px 12px', lineHeight: 1.45, fontSize: 13, color: '#fff',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? '#FF6B35' : '#1c1c1c',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '6px 16px', overflowX: 'auto', flexShrink: 0 }}>
        {AGENT_CHIPS.map(chip => (
          <button key={chip} onClick={() => onSend(chip)} style={{
            whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer',
          }}>{chip}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px 28px', flexShrink: 0 }}>
        <input value={input} onChange={e => onInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend(input)}
          placeholder="Dis-moi ce qui se passe…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '10px 16px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={() => onSend(input)} style={{
          width: 44, height: 44, borderRadius: '50%', background: '#FF6B35',
          border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>→</button>
      </div>
    </div>
  )
}

// ─── StopwatchDisplay ────────────────────────────────────────────────────────

function StopwatchDisplay({ startTime }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTime])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return (
    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
      {h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
    </span>
  )
}

// ─── TodayScreen ─────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const navigate = useNavigate()
  const { activeSession, charges, startSession, updateSet, toggleSet, finishSession, modifyActiveSession } = useSession()
  const [finished, setFinished] = useState(false)
  const [timerDuration, setTimerDuration] = useState(() => {
    const saved = parseInt(localStorage.getItem(TIMER_PREF_KEY))
    return saved > 0 ? saved : 90
  })
  const [restTimer, setRestTimer] = useState(() => {
    try {
      const s = localStorage.getItem(TIMER_KEY)
      if (s) { const p = JSON.parse(s); if (p.endTime > Date.now()) return p }
    } catch {}
    return null
  })
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentMessages, setAgentMessages] = useState([
    { role: 'assistant', text: "Bonjour ! Je peux adapter ta séance en temps réel. Dis-moi ce qui se passe." }
  ])
  const [agentInput, setAgentInput] = useState('')
  const cardRefs = useRef([])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
  }, [])

  function handleTimerStart(duration, exerciseName) {
    const endTime = Date.now() + duration * 1000
    const state = { endTime, duration, exerciseName }
    setRestTimer(state)
    localStorage.setItem(TIMER_KEY, JSON.stringify(state))
    scheduleNotification(duration)
  }

  function handleTimerAdjust(delta) {
    setRestTimer(prev => {
      if (!prev) return prev
      const newEndTime = Math.max(Date.now() + 1000, prev.endTime + delta * 1000)
      const updated = { ...prev, endTime: newEndTime }
      localStorage.setItem(TIMER_KEY, JSON.stringify(updated))
      return updated
    })
  }

  function handleTimerDone() {
    setRestTimer(null)
    localStorage.removeItem(TIMER_KEY)
  }

  function sendAgentMessage(text) {
    if (!text.trim()) return
    const response = processAgentMessage(text, modifyActiveSession)
    setAgentMessages(prev => [...prev, { role: 'user', text: text.trim() }, { role: 'assistant', text: response }])
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
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          💪
        </div>
        <h2 className="text-white text-2xl font-bold text-center">Séance terminée !</h2>
        <p className="text-white/50 text-center">Toutes les données ont été sauvegardées.</p>
        <button onClick={() => setFinished(false)} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{ background: '#FF6B35' }}>
          Nouvelle séance
        </button>
      </div>
    )
  }

  // ── Séance en cours ──
  if (activeSession) {
    return (
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="pt-safe px-4 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>{activeSession.titre}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StopwatchDisplay startTime={activeSession.startTime} />
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{doneSets}/{totalSets} séries</span>
              </div>
            </div>
            <button onClick={() => setAgentOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.12)',
              background: agentOpen ? 'rgba(16,185,129,0.12)' : 'transparent',
              color: agentOpen ? '#10B981' : 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              Coach
            </button>
          </div>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: '#FF6B35', width: `${progress}%`, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Sticky timer preset banner */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 14px 10px',
        }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {TIMER_PRESETS.map(p => (
              <button key={p.value}
                onClick={() => { setTimerDuration(p.value); localStorage.setItem(TIMER_PREF_KEY, String(p.value)) }}
                style={{
                  flex: 1, padding: '7px 2px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: timerDuration === p.value ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                  color: timerDuration === p.value ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                }}
              >{p.label}</button>
            ))}
          </div>
          <input type="range" min={15} max={300} step={15} value={timerDuration}
            onChange={e => { const v = parseInt(e.target.value); setTimerDuration(v); localStorage.setItem(TIMER_PREF_KEY, String(v)) }}
            style={{ width: '100%', accentColor: '#FF6B35', cursor: 'pointer', display: 'block' }}
          />
        </div>

        {/* Exercise list */}
        <div className="flex-1 px-3 pb-4 pt-3">
          {activeSession.exercices.map((ex, exIdx) => (
            <ExerciseCard
              key={ex.id + exIdx}
              exIdx={exIdx} exercise={ex} sets={ex.sets} charges={charges}
              timerDuration={timerDuration}
              cardRef={el => cardRefs.current[exIdx] = el}
              onSetChange={updateSet}
              onSetToggle={(eI, sI) => toggleSet(eI, sI)}
              onTimerStart={handleTimerStart}
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
          <button onClick={handleFinish}
            className="w-full py-4 rounded-2xl text-white font-bold text-base active:opacity-80"
            style={{ background: '#FF6B35' }}>
            Terminer la séance
          </button>
        </div>

        {/* Rest timer overlay */}
        {restTimer && (
          <RestTimerSheet
            endTime={restTimer.endTime}
            duration={restTimer.duration}
            exerciseName={restTimer.exerciseName || ''}
            onDone={handleTimerDone}
            onAdjust={handleTimerAdjust}
          />
        )}

        {/* Agent panel */}
        {agentOpen && (
          <AgentPanel
            messages={agentMessages} input={agentInput}
            onInput={setAgentInput} onSend={sendAgentMessage}
            onClose={() => setAgentOpen(false)}
          />
        )}
      </div>
    )
  }

  // ── Preview ──
  const isRestDay = !todayProg
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (isRestDay) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="pt-safe px-4 pt-6 pb-4 flex-shrink-0">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }} className="capitalize">{today}</p>
          <h1 className="text-white font-bold text-2xl mt-1">Repos</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <div className="text-5xl">😴</div>
          <p className="text-white/60 text-center">Journée de récupération — profites-en pour bien dormir et manger.</p>
          <button onClick={() => navigate('/generer')} className="mt-4 px-6 py-3 rounded-2xl text-white text-sm font-medium" style={{ background: 'rgba(255,255,255,0.08)' }}>
            Générer une séance spéciale
          </button>
        </div>
      </div>
    )
  }

  const estMins = estimatedMinutes(todayProg.exercices)

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="pt-safe px-4 pt-6 pb-3 flex-shrink-0">
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }} className="capitalize">{today}</p>
        <h1 className="text-white font-bold text-2xl mt-1">{todayProg.titre}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>~{estMins} min · {todayProg.exercices.length} exercices</span>
          {todayProg.groupes.map(g => (
            <span key={g} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
              background: (GROUPE_COLORS[g] || '#888') + '25', color: GROUPE_COLORS[g] || '#888',
            }}>{g}</span>
          ))}
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 px-4">
        {todayProg.exercices.map((ex, i) => {
          const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
          return (
            <div key={ex.id + i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <ExerciseImage id={ex.id} nom={ex.nom} groupe={ex.groupe} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{ex.nom}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}
                </div>
              </div>
              {ex.technique && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, flexShrink: 0, background: color + '22', color }}>
                  {ex.technique}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="px-4 py-4 flex-shrink-0">
        <button onClick={handleStart}
          className="w-full py-4 rounded-2xl text-white font-bold text-base active:opacity-80"
          style={{ background: '#FF6B35' }}>
          Commencer la séance
        </button>
        <button onClick={() => navigate('/generer')}
          className="w-full py-3 text-white/40 text-sm font-medium mt-1"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
          Adapter la séance →
        </button>
      </div>
    </div>
  )
}