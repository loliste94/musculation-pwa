export function formatReps(ex) {
  if (ex.repsSpecial) return ex.repsSpecial
  if (ex.repsMin === ex.repsMax) return `${ex.repsMin}`
  return `${ex.repsMin}–${ex.repsMax}`
}

export function formatFormat(ex) {
  const reps = formatReps(ex)
  return `${ex.series}×${reps}`
}

export function formatDuration(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m} min`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function getWeekLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `Semaine du ${mon.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
}

export function isSameWeek(a, b) {
  const da = new Date(a + 'T12:00:00')
  const db = new Date(b + 'T12:00:00')
  const monA = new Date(da); monA.setDate(da.getDate() - ((da.getDay() + 6) % 7))
  const monB = new Date(db); monB.setDate(db.getDate() - ((db.getDay() + 6) % 7))
  return monA.toDateString() === monB.toDateString()
}

export function isPR(exerciceNom, poids, charges) {
  const hist = charges[exerciceNom]
  if (!hist || hist.length === 0) return false
  const allSets = hist.flatMap(h => h.sets)
  const max = Math.max(...allSets.map(s => parseFloat(s.poids) || 0))
  return (parseFloat(poids) || 0) > max
}

export function getLastPoids(exerciceNom, charges) {
  const hist = charges[exerciceNom]
  if (!hist || hist.length === 0) return null
  const last = hist[hist.length - 1]
  if (!last.sets || last.sets.length === 0) return null
  const max = Math.max(...last.sets.map(s => parseFloat(s.poids) || 0))
  return max > 0 ? max : null
}

export function getCycleSemaine(seances) {
  if (seances.length === 0) return 1
  const lastDeload = [...seances].reverse().find(s => s.is_deload)
  const refDate = lastDeload
    ? new Date(lastDeload.date + 'T12:00:00')
    : new Date(seances[0].date + 'T12:00:00')
  const weeks = Math.floor((Date.now() - refDate) / (7 * 24 * 3600 * 1000))
  return (weeks % 4) + 1
}
