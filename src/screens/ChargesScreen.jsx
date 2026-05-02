import { useState, useMemo } from 'react'
import { useSession } from '../context/SessionContext'
import { GROUPE_COLORS } from '../data/colors'
import { getLastPoids, isPR, formatDateShort } from '../utils/formatters'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const TABS = ['Séance', 'Progression']

export default function ChargesScreen() {
  const { activeSession, charges, updateSet, completeSet } = useSession()
  const [tab, setTab] = useState(0)

  // Stats for active session
  const stats = useMemo(() => {
    if (!activeSession) return { done: 0, total: 0, volume: 0, prs: 0 }
    let done = 0, total = 0, volume = 0, prs = 0
    activeSession.exercices.forEach(ex => {
      ex.sets.forEach(set => {
        total++
        if (set.done) {
          done++
          const kg = parseFloat(set.poids) || 0
          const rp = parseInt(set.reps) || 0
          volume += kg * rp
          if (isPR(ex.nom, set.poids, charges)) prs++
        }
      })
    })
    return { done, total, volume: Math.round(volume), prs }
  }, [activeSession, charges])

  // Exercise list for progression tab
  const exerciceNames = useMemo(() => {
    return Object.keys(charges).sort()
  }, [charges])

  const [selectedExo, setSelectedExo] = useState('')
  const progressionData = useMemo(() => {
    const exo = selectedExo || exerciceNames[0]
    if (!exo || !charges[exo]) return []
    return charges[exo].map(session => ({
      date: formatDateShort(session.date),
      max: session.sets.length > 0 ? Math.max(...session.sets.map(s => parseFloat(s.poids) || 0)) : 0,
      vol: session.sets.reduce((acc, s) => acc + (parseFloat(s.poids) || 0) * (parseInt(s.reps) || 0), 0),
    })).slice(-10)
  }, [selectedExo, exerciceNames, charges])

  const currentExo = selectedExo || exerciceNames[0] || ''

  return (
    <div className="flex flex-col min-h-full">
      <div className="pt-safe px-4 pt-6 pb-2 flex-shrink-0">
        <h1 className="text-white font-bold text-2xl mb-4">Charges</h1>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-2xl mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === i ? '#FF6B35' : 'transparent',
                color: tab === i ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto">

        {/* Tab 0: Séance en cours */}
        {tab === 0 && (
          <div>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Séries', value: `${stats.done}/${stats.total}` },
                { label: 'Volume', value: `${stats.volume} kg` },
                { label: 'PRs', value: stats.prs > 0 ? `🔥 ${stats.prs}` : '—' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-2xl text-center" style={{ background: '#111111' }}>
                  <p className="text-white font-bold text-base">{s.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {!activeSession ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="text-4xl">📋</div>
                <p className="text-white/60">Pas de séance active.</p>
                <p className="text-white/30 text-sm">Démarre une séance depuis l'écran Aujourd'hui ou le Générateur.</p>
              </div>
            ) : (
              activeSession.exercices.map((ex, exIdx) => {
                const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
                const doneSets = ex.sets.filter(s => s.done).length
                return (
                  <div key={ex.id + exIdx} className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#111111', borderLeft: `3px solid ${color}` }}>
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">{ex.nom}</span>
                        <span className="text-white/40 text-xs">{doneSets}/{ex.sets.length}</span>
                      </div>
                    </div>
                    <div className="px-4 pb-4 space-y-2">
                      {ex.sets.map((set, setIdx) => {
                        const lastKg = getLastPoids(ex.nom, charges)
                        const pr = set.done && set.poids && isPR(ex.nom, set.poids, charges)
                        return (
                          <div key={setIdx} className={`flex items-center gap-2 ${set.done ? 'opacity-50' : ''}`}>
                            <span className="text-white/30 text-sm w-5 text-center">{setIdx + 1}</span>
                            <div className="flex items-center bg-white/5 rounded-xl flex-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={set.reps}
                                onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                                placeholder={ex.repsMin > 0 ? String(ex.repsMin) : '—'}
                                disabled={set.done}
                                className="w-full bg-transparent text-white text-center py-2 text-sm outline-none placeholder-white/20"
                              />
                              <span className="text-white/30 text-xs pr-2">reps</span>
                            </div>
                            <div className="flex items-center bg-white/5 rounded-xl flex-1">
                              <input
                                type="number"
                                inputMode="decimal"
                                value={set.poids}
                                onChange={e => updateSet(exIdx, setIdx, 'poids', e.target.value)}
                                placeholder={lastKg ? String(lastKg) : '0'}
                                disabled={set.done}
                                className="w-full bg-transparent text-white text-center py-2 text-sm outline-none placeholder-white/20"
                              />
                              <span className="text-white/30 text-xs pr-2">kg</span>
                            </div>
                            {pr && <span className="text-xs">🔥</span>}
                            <button
                              onClick={() => completeSet(exIdx, setIdx)}
                              disabled={set.done}
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
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
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab 1: Progression graphs */}
        {tab === 1 && (
          <div>
            {exerciceNames.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="text-4xl">📈</div>
                <p className="text-white/60">Pas encore d'historique.</p>
                <p className="text-white/30 text-sm">Complète quelques séances pour voir ta progression ici.</p>
              </div>
            ) : (
              <div>
                {/* Exercise selector */}
                <div className="mb-4">
                  <select
                    value={currentExo}
                    onChange={e => setSelectedExo(e.target.value)}
                    className="w-full py-3 px-4 rounded-2xl text-white text-sm outline-none appearance-none"
                    style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {exerciceNames.map(name => (
                      <option key={name} value={name} style={{ background: '#111111' }}>{name}</option>
                    ))}
                  </select>
                </div>

                {progressionData.length < 2 ? (
                  <div className="p-4 rounded-2xl text-center" style={{ background: '#111111' }}>
                    <p className="text-white/40 text-sm">Minimum 2 sessions nécessaires pour afficher la courbe.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white/40 text-xs mb-3 uppercase tracking-wide">Charge max par séance (kg)</p>
                    <div className="p-4 rounded-2xl" style={{ background: '#111111' }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={progressionData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                          <Tooltip
                            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="max"
                            stroke="#FF6B35"
                            strokeWidth={2.5}
                            dot={{ fill: '#FF6B35', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Max (kg)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <p className="text-white/40 text-xs mt-4 mb-3 uppercase tracking-wide">Volume total (kg × reps)</p>
                    <div className="p-4 rounded-2xl" style={{ background: '#111111' }}>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={progressionData}>
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip
                            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="vol"
                            stroke="#06B6D4"
                            strokeWidth={2}
                            dot={{ fill: '#06B6D4', r: 3 }}
                            name="Volume (kg)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
