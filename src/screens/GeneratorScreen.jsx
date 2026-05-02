import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { PROGRAMME, DAY_MAP, getSessionForDay } from '../data/programme'
import { GROUPE_COLORS, TECH_COLORS, TECH_LABELS } from '../data/colors'
import { formatFormat } from '../utils/formatters'

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

function Pill({ label, emoji, desc, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-95 flex-1"
      style={{
        background: selected ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1.5px solid ${selected ? '#FF6B35' : 'rgba(255,255,255,0.08)'}`,
        color: selected ? '#FF6B35' : 'rgba(255,255,255,0.7)',
      }}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-sm font-semibold">{label}</span>
      {desc && <span className="text-xs opacity-60 text-center leading-tight">{desc}</span>}
    </button>
  )
}

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
      <div className="pt-safe px-4 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-white font-bold text-2xl">Générateur</h1>
        <p className="text-white/40 text-sm mt-1">Séance adaptée à ton état du jour</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: step >= s ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                  color: step >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="h-px flex-1 w-8" style={{ background: step > s ? '#FF6B35' : 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
          <span className="text-white/30 text-xs ml-auto">
            {step === 1 ? 'Contexte' : step === 2 ? 'Énergie' : 'Séance'}
          </span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-4">

        {/* Step 1: Day + Context */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Day selector */}
            <div>
              <p className="text-white/60 text-sm font-medium mb-3">Jour</p>
              <div className="flex gap-2">
                {DAYS_TRAINING.map(d => (
                  <button
                    key={d}
                    onClick={() => setDay(d)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                    style={{
                      background: day === d ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                      color: day === d ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div>
              <p className="text-white/60 text-sm font-medium mb-3">Contexte</p>
              <div className="grid grid-cols-2 gap-2">
                {CONTEXTES.map(c => (
                  <Pill
                    key={c.key}
                    label={c.label}
                    emoji={c.emoji}
                    desc={c.desc}
                    selected={contexte === c.key}
                    onClick={() => setContexte(c.key)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-2xl text-white font-bold mt-4 active:opacity-80"
              style={{ background: '#FF6B35' }}
            >
              Suivant →
            </button>
          </div>
        )}

        {/* Step 2: Energy */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-white/60 text-sm font-medium">Comment tu te sens ce soir ?</p>
            <div className="grid grid-cols-2 gap-2">
              {ENERGIES.map(e => (
                <Pill
                  key={e.key}
                  label={e.label}
                  emoji={e.emoji}
                  desc={e.desc}
                  selected={energie === e.key}
                  onClick={() => setEnergie(e.key)}
                />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl text-white/60 font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                ← Retour
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 py-4 rounded-2xl text-white font-bold active:opacity-80"
                style={{ background: '#FF6B35' }}
              >
                Générer →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generated session */}
        {step === 3 && generated && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">{generated.titre}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {generated.isDeload && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#8B5CF625', color: '#8B5CF6' }}>Déload</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FF6B3525', color: '#FF6B35' }}>{energyLabel}</span>
                </div>
              </div>
              <span className="text-white/40 text-sm">{generated.exercices.length} exos</span>
            </div>

            {generated.exercices.map((ex, i) => {
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
                    <p className="text-white/40 text-xs mt-0.5">
                      {formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}
                      {ex.chargeMultiplier && ex.chargeMultiplier < 1 && (
                        <span className="ml-2 text-yellow-400">−{Math.round((1 - ex.chargeMultiplier) * 100)}% charges</span>
                      )}
                    </p>
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

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl text-white/60 font-semibold"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                ← Modifier
              </button>
              <button
                onClick={handleUse}
                className="flex-1 py-4 rounded-2xl text-white font-bold active:opacity-80"
                style={{ background: '#FF6B35' }}
              >
                Utiliser cette séance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
