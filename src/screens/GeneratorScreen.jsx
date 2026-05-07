import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { PROGRAMME, DAY_MAP, getSessionForDay } from '../data/programme'
import { GROUPE_COLORS, TECH_COLORS } from '../data/colors'
import { formatFormat } from '../utils/formatters'
import { ExerciseImage } from '../hooks/useExerciseImage.jsx'

const DAYS_TRAINING = ['lundi', 'mardi', 'jeudi', 'vendredi']
const DAY_LABELS = { lundi: 'Lun', mardi: 'Mar', jeudi: 'Jeu', vendredi: 'Ven' }

const CONTEXTES = [
  { key: 'normale',  label: 'Normale',  emoji: '💪', desc: 'Séance standard' },
  { key: 'reprise',  label: 'Reprise',  emoji: '🔄', desc: 'Après une pause' },
  { key: 'deload',   label: 'Déload',   emoji: '🧘', desc: 'Volume −30%' },
  { key: 'voyage',   label: 'Voyage',   emoji: '✈️', desc: 'Haut du corps' },
]

const ENERGIES = [
  { key: 'top',     label: 'Au top',  emoji: '⚡', desc: 'Charges max' },
  { key: 'bien',    label: 'Bien',    emoji: '😊', desc: 'Séance normale' },
  { key: 'moyen',   label: 'Moyen',   emoji: '😐', desc: 'Charges −5%' },
  { key: 'fatigue', label: 'Fatigué', emoji: '😴', desc: 'Charges −10%' },
]

function estimatedMinutes(exercices) {
  const total = exercices.reduce((t, ex) => t + ex.series * ((ex.repos || 90) + 40), 0)
  return Math.max(30, Math.round(total / 60 / 5) * 5)
}

// ─── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, emoji, desc, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '14px 8px', borderRadius: 16, transition: 'all 0.15s', flex: 1,
      background: selected ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.05)',
      border: `1.5px solid ${selected ? '#FF6B35' : 'rgba(255,255,255,0.08)'}`,
      color: selected ? '#FF6B35' : 'rgba(255,255,255,0.7)', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      {desc && <span style={{ fontSize: 11, opacity: 0.6, textAlign: 'center', lineHeight: 1.3 }}>{desc}</span>}
    </button>
  )
}

// ─── GeneratorScreen ─────────────────────────────────────────────────────────

export default function GeneratorScreen() {
  const navigate = useNavigate()
  const { startSession } = useSession()

  const todayKey = DAY_MAP[new Date().getDay()]
  const defaultDay = DAYS_TRAINING.includes(todayKey) ? todayKey : 'lundi'

  const [step, setStep] = useState(1)
  const [day, setDay] = useState(defaultDay)
  const [contexte, setContexte] = useState('normale')
  const [energie, setEnergie] = useState('bien')
  const [generated, setGenerated] = useState(null)

  function handleGenerate() {
    const session = getSessionForDay(day, contexte, energie)
    setGenerated(session)
    setStep(3)
  }

  function handleUse() {
    if (!generated) return
    const titre = generated.titre + (generated.isDeload ? ' (Déload)' : '')
    startSession(generated.key || day, generated.exercices, titre, generated.isDeload)
    navigate('/')
  }

  const energyLabel = ENERGIES.find(e => e.key === energie)?.label || ''

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="pt-safe px-4 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-white font-bold text-2xl">Générateur</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Séance adaptée à ton état du jour</p>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, transition: 'all 0.2s',
                background: step >= s ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                color: step >= s ? '#fff' : 'rgba(255,255,255,0.25)',
              }}>{s}</div>
              {s < 3 && (
                <div style={{ width: 24, height: 2, borderRadius: 1, background: step > s ? '#FF6B35' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {step === 1 ? 'Contexte' : step === 2 ? 'Énergie' : 'Séance'}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">

        {/* Step 1: Day + Context */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Jour</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {DAYS_TRAINING.map(d => (
                  <button key={d} onClick={() => setDay(d)} style={{
                    flex: 1, padding: '12px 4px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                    background: day === d ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                    color: day === d ? '#fff' : 'rgba(255,255,255,0.45)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{DAY_LABELS[d]}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contexte</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CONTEXTES.map(c => (
                  <Pill key={c.key} label={c.label} emoji={c.emoji} desc={c.desc} selected={contexte === c.key} onClick={() => setContexte(c.key)} />
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} style={{
              width: '100%', padding: '16px', borderRadius: 16,
              background: '#FF6B35', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Suivant →</button>
          </div>
        )}

        {/* Step 2: Energy */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Comment tu te sens ce soir ?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ENERGIES.map(e => (
                <Pill key={e.key} label={e.label} emoji={e.emoji} desc={e.desc} selected={energie === e.key} onClick={() => setEnergie(e.key)} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>← Retour</button>
              <button onClick={handleGenerate} style={{
                flex: 1, padding: '16px', borderRadius: 16,
                background: '#FF6B35', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>Générer →</button>
            </div>
          </div>
        )}

        {/* Step 3: Generated session */}
        {step === 3 && generated && (
          <div>
            {/* Session info */}
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{generated.titre}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  ~{estimatedMinutes(generated.exercices)} min · {generated.exercices.length} exercices
                </span>
                {generated.isDeload && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#8B5CF625', color: '#8B5CF6' }}>Déload</span>
                )}
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: '#FF6B3525', color: '#FF6B35' }}>{energyLabel}</span>
              </div>
            </div>

            {/* Exercise list */}
            <div style={{ background: '#111111', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
              {generated.exercices.map((ex, i) => {
                const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
                return (
                  <div key={ex.id + i} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderBottom: i < generated.exercices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <ExerciseImage id={ex.id} nom={ex.nom} groupe={ex.groupe} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{ex.nom}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}</span>
                        {ex.chargeMultiplier && ex.chargeMultiplier < 1 && (
                          <span style={{ color: '#F59E0B', fontWeight: 600 }}>−{Math.round((1 - ex.chargeMultiplier) * 100)}%</span>
                        )}
                      </div>
                    </div>
                    {ex.technique && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, flexShrink: 0,
                        background: (TECH_COLORS[ex.technique] || color) + '25', color: TECH_COLORS[ex.technique] || color,
                      }}>{ex.technique}</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: 1, padding: '16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>← Modifier</button>
              <button onClick={handleUse} style={{
                flex: 2, padding: '16px', borderRadius: 16,
                background: '#FF6B35', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>Commencer →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}