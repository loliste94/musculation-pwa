import { useState } from 'react'
import { PROGRAMME, VOLUMES_HEBDO, REGLES_PROGRESSION } from '../data/programme'
import { GROUPE_COLORS, TECH_COLORS, TECH_LABELS } from '../data/colors'
import { formatFormat } from '../utils/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const TABS = ['Split', 'Volumes', 'Règles']

const TRAINING_DAYS = [
  { key: 'lundi',    label: 'Lundi' },
  { key: 'mardi',    label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi',    label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi',   label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
]

function DayCard({ dayLabel, programme }) {
  const [open, setOpen] = useState(false)
  const isRest = !programme

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#111111' }}>
      <button
        onClick={() => !isRest && setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: isRest ? 'rgba(255,255,255,0.04)' : '#FF6B3520',
            color: isRest ? 'rgba(255,255,255,0.2)' : '#FF6B35',
          }}
        >
          {dayLabel.substring(0, 3).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{dayLabel}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {isRest ? 'Repos' : programme.titre}
          </p>
        </div>
        {!isRest && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {programme.groupes.slice(0, 3).map(g => (
                <div
                  key={g}
                  className="w-2 h-2 rounded-full"
                  style={{ background: GROUPE_COLORS[g] || '#888' }}
                />
              ))}
            </div>
            <svg
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="w-4 h-4 text-white/30 transition-transform"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      {!isRest && open && (
        <div className="pb-4">
          <div className="h-px mx-4 mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {programme.exercices.map((ex, i) => {
            const color = GROUPE_COLORS[ex.groupe] || '#FF6B35'
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2"
              >
                <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 text-sm truncate">{ex.nom}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    {formatFormat(ex)} · {ex.repos > 0 ? `${ex.repos}s` : 'RP'}
                  </p>
                </div>
                {ex.technique && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
                    style={{ background: TECH_COLORS[ex.technique] + '25', color: TECH_COLORS[ex.technique] }}
                  >
                    {TECH_LABELS[ex.technique]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VolumesView() {
  const max = Math.max(...VOLUMES_HEBDO.map(v => v.series))

  return (
    <div>
      <p className="text-white/40 text-xs uppercase tracking-wide mb-4">Séries par semaine</p>

      <div className="space-y-3 mb-6">
        {VOLUMES_HEBDO.map(v => {
          const color = Object.entries(GROUPE_COLORS).find(([k]) =>
            k.toLowerCase() === v.groupe.toLowerCase() ||
            v.groupe.toLowerCase().includes(k.toLowerCase().replace('é','e').replace('è','e'))
          )?.[1] || '#FF6B35'
          const pct = (v.series / max) * 100

          return (
            <div key={v.groupe}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/70 text-sm font-medium">{v.groupe}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs">{v.freq}</span>
                  <span className="text-white font-bold text-sm">{v.series}</span>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Vue graphique</p>
      <div className="p-4 rounded-2xl" style={{ background: '#111111' }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={VOLUMES_HEBDO}
            layout="vertical"
            margin={{ top: 0, right: 20, bottom: 0, left: 50 }}
          >
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="groupe"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="series" radius={[0, 6, 6, 0]} name="Séries/semaine">
              {VOLUMES_HEBDO.map((v, i) => {
                const color = Object.entries(GROUPE_COLORS).find(([k]) =>
                  k.toLowerCase() === v.groupe.toLowerCase() ||
                  v.groupe.toLowerCase().includes(k.toLowerCase().replace('é','e').replace('è','e'))
                )?.[1] || '#FF6B35'
                return <Cell key={i} fill={color} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ReglesView() {
  return (
    <div className="space-y-3">
      {REGLES_PROGRESSION.map((r, i) => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: '#111111' }}>
          <div className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
              style={{ background: '#FF6B3520', color: '#FF6B35' }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{r.titre}</p>
              <p className="text-white/50 text-sm mt-1 leading-relaxed">{r.corps}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="p-4 rounded-2xl mt-2" style={{ background: '#111111' }}>
        <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Techniques d'intensification</p>
        <div className="space-y-2">
          {Object.entries(TECH_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: TECH_COLORS[key] + '25', color: TECH_COLORS[key] }}
              >
                {key}
              </span>
              <span className="text-white/60 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProgramScreen() {
  const [tab, setTab] = useState(0)

  return (
    <div className="flex flex-col min-h-full">
      <div className="pt-safe px-4 pt-6 pb-2 flex-shrink-0">
        <h1 className="text-white font-bold text-2xl mb-1">Programme</h1>
        <p className="text-white/40 text-sm mb-4">4 séances/semaine · Basic Fit</p>

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
        {tab === 0 && (
          <div>
            {TRAINING_DAYS.map(d => (
              <DayCard key={d.key} dayLabel={d.label} programme={PROGRAMME[d.key]} />
            ))}
          </div>
        )}
        {tab === 1 && <VolumesView />}
        {tab === 2 && <ReglesView />}
      </div>
    </div>
  )
}
