import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const SessionContext = createContext(null)

function loadJSON(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    return s !== null ? JSON.parse(s) : fallback
  } catch { return fallback }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function SessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(() => loadJSON('muscu_session_active', null))
  const [seances, setSeances] = useState(() => loadJSON('muscu_seances', []))
  const [charges, setCharges] = useState(() => loadJSON('muscu_charges', {}))

  const startSession = useCallback((dayKey, exercices, titre, isDeload = false) => {
    const session = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      programme_key: dayKey,
      titre,
      is_deload: isDeload,
      startTime: new Date().toISOString(),
      exercices: exercices.map(ex => ({
        ...ex,
        sets: Array.from({ length: ex.series }, () => ({ reps: '', poids: '', done: false })),
      })),
    }
    setActiveSession(session)
    saveJSON('muscu_session_active', session)
    return session
  }, [])

  const updateSet = useCallback((exIdx, setIdx, field, value) => {
    setActiveSession(prev => {
      if (!prev) return prev
      const updated = JSON.parse(JSON.stringify(prev))
      updated.exercices[exIdx].sets[setIdx][field] = value
      saveJSON('muscu_session_active', updated)
      return updated
    })
  }, [])

  const completeSet = useCallback((exIdx, setIdx) => {
    setActiveSession(prev => {
      if (!prev) return prev
      const updated = JSON.parse(JSON.stringify(prev))
      updated.exercices[exIdx].sets[setIdx].done = true
      updated.exercices[exIdx].sets[setIdx].timestamp = new Date().toISOString()
      saveJSON('muscu_session_active', updated)
      return updated
    })
  }, [])

  const finishSession = useCallback(() => {
    if (!activeSession) return null

    const endTime = new Date()
    const duree_minutes = Math.round((endTime - new Date(activeSession.startTime)) / 60000)

    let total_series = 0
    let volume_total_kg = 0
    let prs = 0

    activeSession.exercices.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.done) {
          total_series++
          const kg = parseFloat(set.poids) || 0
          const rp = parseInt(set.reps) || 0
          volume_total_kg += kg * rp
          const hist = charges[ex.nom] || []
          const allSets = hist.flatMap(h => h.sets)
          const maxKg = allSets.length > 0 ? Math.max(...allSets.map(s => parseFloat(s.poids) || 0)) : 0
          if (kg > maxKg && kg > 0) prs++
        }
      })
    })

    const newCharges = JSON.parse(JSON.stringify(charges))
    activeSession.exercices.forEach(ex => {
      const doneSets = ex.sets.filter(s => s.done)
      if (doneSets.length === 0) return
      if (!newCharges[ex.nom]) newCharges[ex.nom] = []
      newCharges[ex.nom].push({
        date: activeSession.date,
        sets: doneSets.map(s => ({ reps: parseInt(s.reps) || 0, poids: parseFloat(s.poids) || 0 })),
      })
    })

    const completed = {
      ...activeSession,
      endTime: endTime.toISOString(),
      duree_minutes,
      total_series,
      volume_total_kg: Math.round(volume_total_kg),
      prs,
    }

    const newSeances = [...seances, completed]
    setSeances(newSeances)
    setCharges(newCharges)
    setActiveSession(null)
    saveJSON('muscu_seances', newSeances)
    saveJSON('muscu_charges', newCharges)
    localStorage.removeItem('muscu_session_active')

    return completed
  }, [activeSession, seances, charges])

  const cancelSession = useCallback(() => {
    setActiveSession(null)
    localStorage.removeItem('muscu_session_active')
  }, [])

  return (
    <SessionContext.Provider value={{
      activeSession, seances, charges,
      startSession, updateSet, completeSet, finishSession, cancelSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
