import { useState, useMemo } from 'react'
import { useSession } from '../context/SessionContext'
import { GROUPE_COLORS } from '../data/colors'
import { formatDate, formatDuration, getWeekLabel, isSameWeek, getCycleSemaine } from '../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const TABS = ['Liste', 'Calendrier', 'Stats']

function SessionCard({ seance }) {
  const [open, setOpen] = useState(false)
  const dateLabel = formatDate(seance.date)

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ background: '#111111' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
          style={{ background: '#FF6B3525', color: '#FF6B35' }}
        >
          {new Date(seance.date + 'T12:00:00').getDate()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{seance.titre}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-white/40 text-xs">{formatDuration(seance.duree_minutes)}</span>
            <span className="text-white/40 text-xs">{seance.total_series} séries</span>
            <span className="text-white/40 text-xs">{seance.volume_total_kg} kg</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {seance.prs > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FF6B3520', color: '#FF6B35' }}>
              🔥 {seance.prs} PR
            </span>
          )}
          {seance.is_deload && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
              Déload
            </span>
          )}
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 text-white/30 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && seance.exercices && (
        <div className="px-4 pb-4 space-y-1">
          <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {seance.exercices.map((ex, i) => {
            const doneSets = ex.sets?.filter(s => s.done) || []
            return (
              <div key={i} className="flex items-center gap-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GROUPE_COLORS[ex.groupe] || '#888' }} />
                <span className="text-white/70 text-sm flex-1 truncate">{ex.nom}</span>
                <span className="text-white/30 text-xs">
                  {doneSets.length}×{doneSets[0] ? `${doneSets[0].poids}kg` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CalendarView({ seances }) {
  const [month, setMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }
  })

  const sessionByDate = useMemo(() => {
    const map = {}
    seances.forEach(s => {
      if (!map[s.date]) map[s.date] = []
      map[s.date].push(s)
    })
    return map
  }, [seances])

  const firstDay = new Date(month.year, month.month, 1)
  const lastDay = new Date(month.year, month.month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon=0
  const days = []

  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${month.year}-${String(month.month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    days.push({ day: d, date: dateStr, sessions: sessionByDate[dateStr] || [] })
  }

  const monthLabel = new Date(month.year, month.month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  function getColor(sessions) {
    if (sessions.length === 0) return null
    const groupes = sessions.flatMap(s => s.exercices?.flatMap(ex => ex.groupe ? [ex.groupe] : []) || [])
    const first = groupes[0]
    return GROUPE_COLORS[first] || '#FF6B35'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonth(m => {
            const d = new Date(m.year, m.month - 1, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          ←
        </button>
        <span className="text-white font-semibold capitalize">{monthLabel}</span>
        <button
          onClick={() => setMonth(m => {
            const d = new Date(m.year, m.month + 1, 1)
            return { year: d.getFullYear(), month: d.getMonth() }
          })}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="text-center text-white/30 text-xs py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />
          const color = getColor(d.sessions)
          const isToday = d.date === new Date().toISOString().split('T')[0]
          return (
            <div
              key={i}
              className="aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative"
              style={{
                background: color ? color + '30' : 'rgba(255,255,255,0.04)',
                color: color ? color : isToday ? '#FF6B35' : 'rgba(255,255,255,0.6)',
                border: isToday ? '1.5px solid #FF6B35' : '1.5px solid transparent',
              }}
            >
              {d.day}
              {d.sessions.length > 0 && (
                <div
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: color }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {Object.entries(GROUPE_COLORS).map(([g, c]) => (
          <div key={g} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            <span className="text-white/40 text-xs">{g}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatsView({ seances }) {
  const cycleSemaine = getCycleSemaine(seances)
  const showDeloadAlert = cycleSemaine >= 4

  const weeklyVolume = useMemo(() => {
    const weeks = []
    const sorted = [...seances].sort((a, b) => a.date.localeCompare(b.date))
    sorted.forEach(s => {
      const label = getWeekLabel(s.date).replace('Semaine du ', 'S ')
      const w = weeks.find(wk => isSameWeek(wk._ref, s.date))
      if (w) {
        w.volume += s.volume_total_kg
        w.seances++
      } else {
        weeks.push({ label: label.substring(0, 8), _ref: s.date, volume: s.volume_total_kg, seances: 1 })
      }
    })
    return weeks.slice(-8)
  }, [seances])

  const prsThisMonth = useMemo(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return seances
      .filter(s => s.date.startsWith(monthStr))
      .reduce((acc, s) => acc + (s.prs || 0), 0)
  }, [seances])

  return (
    <div className="space-y-4">
      {showDeloadAlert && (
        <div className="p-4 rounded-2xl" style={{ background: '#8B5CF620', border: '1px solid #8B5CF650' }}>
          <p className="text-purple-400 font-semibold text-sm">
            🧘 Semaine {cycleSemaine} — Déload recommandé
          </p>
          <p className="text-purple-300/70 text-xs mt-1">
            Tu es à la semaine {cycleSemaine} du cycle. Il est temps de prévoir une semaine de déload (volume −30%).
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Séances', value: seances.length },
          { label: 'PRs ce mois', value: prsThisMonth > 0 ? `🔥 ${prsThisMonth}` : '0' },
          { label: 'Cycle S.', value: `S${cycleSemaine}` },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl text-center" style={{ background: '#111111' }}>
            <p className="text-white font-bold text-base">{s.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {weeklyVolume.length > 0 && (
        <div>
          <p className="text-white/40 text-xs mb-3 uppercase tracking-wide">Volume par semaine (kg)</p>
          <div className="p-4 rounded-2xl" style={{ background: '#111111' }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyVolume}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <Bar dataKey="volume" fill="#FF6B35" radius={[6, 6, 0, 0]} name="Volume (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {seances.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-4xl">📊</div>
          <p className="text-white/60">Pas encore de données.</p>
          <p className="text-white/30 text-sm">Termine ta première séance pour voir tes stats.</p>
        </div>
      )}
    </div>
  )
}

export default function HistoryScreen() {
  const { seances } = useSession()
  const [tab, setTab] = useState(0)

  const grouped = useMemo(() => {
    const sorted = [...seances].sort((a, b) => b.date.localeCompare(a.date))
    const groups = []
    sorted.forEach(s => {
      const label = getWeekLabel(s.date)
      const g = groups.find(g => g.label === label)
      if (g) g.seances.push(s)
      else groups.push({ label, seances: [s] })
    })
    return groups
  }, [seances])

  return (
    <div className="flex flex-col min-h-full">
      <div className="pt-safe px-4 pt-6 pb-2 flex-shrink-0">
        <h1 className="text-white font-bold text-2xl mb-4">Historique</h1>

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
            {grouped.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="text-4xl">📅</div>
                <p className="text-white/60">Pas encore de séances.</p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.label} className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-3">{group.label}</p>
                  {group.seances.map(s => <SessionCard key={s.id} seance={s} />)}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 1 && <CalendarView seances={seances} />}
        {tab === 2 && <StatsView seances={seances} />}
      </div>
    </div>
  )
}
