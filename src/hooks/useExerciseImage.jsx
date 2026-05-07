import { useState, useEffect } from 'react'
import { GROUPE_COLORS } from '../data/colors'

// Maps programme.js exercise IDs → English ExerciseDB search term
const EXERCISE_NAME_MAP = {
  hack_squat:              'hack squat',
  dev_incline_halt:        'incline dumbbell press',
  presse_cuisses:          'leg press',
  pec_deck_ext_corde:      'pec deck fly',
  presse_1_jambe:          'single leg press',
  skull_crusher_ez:        'ez bar skull crusher',
  leg_extension:           'leg extension',
  dips_lestes:             'dips',
  bloc_abdos:              'cable crunch',
  tractions_lestees:       'pull up',
  sdt_roumain:             'romanian deadlift dumbbell',
  rowing_barre:            'bent over barbell row',
  leg_curl_assis:          'seated leg curl',
  tirage_horiz_curl_ez:    'cable seated row',
  curl_incline_halt:       'incline dumbbell curl',
  curl_marteau:            'hammer curl',
  dev_couche_barre:        'barbell bench press',
  dev_incline_machine:     'incline chest press machine',
  ecarte_halt_incline:     'incline dumbbell fly',
  ext_triceps_barre_ez:    'ez bar tricep extension',
  pompes_lestees:          'push up',
  overhead_triceps_corde:  'overhead cable tricep extension',
  dev_mil_elev_lat:        'dumbbell shoulder press',
  sdt_roumain_barre:       'barbell romanian deadlift',
  tirage_poitrine_machine: 'lat pulldown',
  hip_thrust:              'barbell hip thrust',
  rowing_1_bras_halt:      'one arm dumbbell row',
  leg_curl_allonge:        'lying leg curl',
  curl_halt_incline:       'incline dumbbell curl',
  adducteurs_mollets:      'standing calf raise',
  curl_poulie_basse:       'cable curl',
  curl_brachial_marteau:   'hammer curl',
  tractions_tirage:        'pull up',
  dev_machine_rowing:      'chest press machine',
  pec_deck_face_pull:      'pec deck fly',
  curl_ez_ext_corde:       'ez bar curl',
  crunch_poulie:           'cable crunch',
}

const CACHE_PREFIX = 'muscu_eximg_'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

function getCached(key) {
  try {
    const s = localStorage.getItem(CACHE_PREFIX + key)
    if (!s) return undefined
    const { url, ts } = JSON.parse(s)
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(CACHE_PREFIX + key); return undefined }
    return url
  } catch { return undefined }
}

function setCache(key, url) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ url, ts: Date.now() })) } catch {}
}

async function fetchGif(searchTerm) {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY
  console.log('API KEY:', apiKey)
  console.log('Fetching:', searchTerm)
  if (!apiKey) return ''
  console.log('RAPIDAPI KEY:', import.meta.env.VITE_RAPIDAPI_KEY)
  console.log('EXERCISE NAME:', searchTerm)
  const res = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(searchTerm)}?limit=1&offset=0`,
    { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
  )
  if (!res.ok) return ''
  const data = await res.json()
  return data?.[0]?.gifUrl || ''
}

// Returns: null (loading) | '' (miss/no image) | 'https://...' (gif url)
export function useExerciseImage(id) {
  const cached = getCached(id)
  const [url, setUrl] = useState(cached !== undefined ? cached : null)

  useEffect(() => {
    if (cached !== undefined) { setUrl(cached); return }
    const searchTerm = EXERCISE_NAME_MAP[id]
    if (!searchTerm) { setCache(id, ''); setUrl(''); return }
    let cancelled = false
    fetchGif(searchTerm).then(gifUrl => {
      if (cancelled) return
      setCache(id, gifUrl)
      setUrl(gifUrl)
    }).catch(() => {
      if (!cancelled) { setCache(id, ''); setUrl('') }
    })
    return () => { cancelled = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return url
}

// ─── ExerciseImage component ──────────────────────────────────────────────────

export function ExerciseImage({ id, nom, groupe, size = 48 }) {
  const url = useExerciseImage(id)
  const color = GROUPE_COLORS[groupe] || '#FF6B35'
  const r = Math.round(size * 0.27)
  const initials = (nom || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

  if (url === null) {
    return (
      <div style={{
        width: size, height: size, borderRadius: r, flexShrink: 0,
        background: 'rgba(255,255,255,0.07)',
      }} />
    )
  }

  if (url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: r, flexShrink: 0,
        overflow: 'hidden', background: '#1c1c1c',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <img src={url} alt={nom} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: color + '1a', border: `1.5px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: Math.round(size * 0.3), fontWeight: 800, color, letterSpacing: -0.5 }}>
        {initials}
      </span>
    </div>
  )
}