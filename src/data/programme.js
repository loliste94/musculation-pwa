// Format: { id, nom, groupe, series, repsMin, repsMax, repsSpecial, repos, technique }
// repsSpecial overrides repsMin/repsMax display ('AMRAP', 'RP')
// technique: null | 'SS' | 'DS' | 'RP' | 'UNI'

export const PROGRAMME = {
  lundi: {
    titre: 'Quadri + Pecs + Triceps',
    priorite: 'Quadri',
    groupes: ['Quadri', 'Pecs', 'Triceps', 'Abdos'],
    exercices: [
      { id: 'hack_squat',          nom: 'Hack Squat',                groupe: 'Quadri',   series: 4, repsMin: 6,  repsMax: 10, repos: 120, technique: null },
      { id: 'presse_cuisses',      nom: 'Presse à cuisses',          groupe: 'Quadri',   series: 4, repsMin: 10, repsMax: 12, repos: 90,  technique: null },
      { id: 'presse_1_jambe',      nom: 'Presse 1 jambe',            groupe: 'Quadri',   series: 3, repsMin: 12, repsMax: 12, repos: 90,  technique: 'UNI' },
      { id: 'leg_extension',       nom: 'Leg extension',             groupe: 'Quadri',   series: 3, repsMin: 12, repsMax: 15, repos: 60,  technique: 'DS' },
      { id: 'bloc_abdos',          nom: 'Bloc abdos',                groupe: 'Abdos',    series: 3, repsMin: 15, repsMax: 20, repos: 60,  technique: null },
      { id: 'dev_incline_halt',    nom: 'Dév. incliné haltères',     groupe: 'Pecs',     series: 4, repsMin: 8,  repsMax: 10, repos: 120, technique: null },
      { id: 'pec_deck_ext_corde',  nom: 'Pec deck + Ext. corde',     groupe: 'Pecs',     series: 3, repsMin: 12, repsMax: 12, repos: 90,  technique: 'SS' },
      { id: 'skull_crusher_ez',    nom: 'Skull crusher EZ',          groupe: 'Triceps',  series: 3, repsMin: 10, repsMax: 10, repos: 90,  technique: null },
      { id: 'dips_lestes',         nom: 'Dips lestés',               groupe: 'Triceps',  series: 1, repsMin: 0,  repsMax: 0,  repos: 0,   technique: 'RP', repsSpecial: 'RP' },
    ],
  },

  mardi: {
    titre: 'Dos + Ischios + Biceps',
    priorite: 'Dos',
    groupes: ['Dos', 'Ischios', 'Biceps', 'Abdos'],
    exercices: [
      { id: 'tractions_lestees',      nom: 'Tractions lestées',          groupe: 'Dos',     series: 4, repsMin: 6,  repsMax: 10, repos: 120, technique: null },
      { id: 'rowing_barre',           nom: 'Rowing barre',               groupe: 'Dos',     series: 4, repsMin: 8,  repsMax: 10, repos: 90,  technique: null },
      { id: 'tirage_horiz_curl_ez',   nom: 'Tirage horiz. + Curl EZ',    groupe: 'Dos',     series: 3, repsMin: 10, repsMax: 10, repos: 90,  technique: 'SS' },
      { id: 'curl_incline_halt',      nom: 'Curl incliné haltères',      groupe: 'Biceps',  series: 3, repsMin: 12, repsMax: 12, repos: 75,  technique: null },
      { id: 'curl_marteau',           nom: 'Curl marteau',               groupe: 'Biceps',  series: 3, repsMin: 12, repsMax: 12, repos: 75,  technique: 'RP' },
      { id: 'bloc_abdos',             nom: 'Bloc abdos',                 groupe: 'Abdos',   series: 3, repsMin: 15, repsMax: 15, repos: 60,  technique: null },
      { id: 'sdt_roumain',            nom: 'SDT roumain',                groupe: 'Ischios', series: 4, repsMin: 8,  repsMax: 10, repos: 120, technique: null },
      { id: 'leg_curl_assis',         nom: 'Leg curl assis',             groupe: 'Ischios', series: 3, repsMin: 10, repsMax: 12, repos: 75,  technique: 'DS' },
    ],
  },

  mercredi: null,

  jeudi: {
    titre: 'Pecs + Quadri rappel + Triceps',
    priorite: 'Pecs',
    groupes: ['Pecs', 'Quadri', 'Triceps', 'Épaules'],
    exercices: [
      { id: 'dev_couche_barre',        nom: 'Dév. couché barre',           groupe: 'Pecs',    series: 5, repsMin: 6,  repsMax: 8,  repos: 120, technique: null },
      { id: 'dev_incline_machine',     nom: 'Dév. incliné machine',        groupe: 'Pecs',    series: 4, repsMin: 8,  repsMax: 10, repos: 90,  technique: null },
      { id: 'ecarte_halt_incline',     nom: 'Écarté haltères incliné',     groupe: 'Pecs',    series: 3, repsMin: 12, repsMax: 12, repos: 75,  technique: null },
      { id: 'pompes_lestees',          nom: 'Pompes lestées',              groupe: 'Pecs',    series: 3, repsMin: 0,  repsMax: 0,  repos: 60,  technique: null, repsSpecial: 'AMRAP' },
      { id: 'presse_1_jambe',          nom: 'Presse 1 jambe',              groupe: 'Quadri',  series: 4, repsMin: 12, repsMax: 12, repos: 90,  technique: 'UNI' },
      { id: 'leg_extension',           nom: 'Leg extension',               groupe: 'Quadri',  series: 3, repsMin: 15, repsMax: 15, repos: 60,  technique: null },
      { id: 'ext_triceps_barre_ez',    nom: 'Ext. triceps barre EZ',       groupe: 'Triceps', series: 3, repsMin: 10, repsMax: 10, repos: 90,  technique: null },
      { id: 'overhead_triceps_corde',  nom: 'Overhead triceps corde',      groupe: 'Triceps', series: 3, repsMin: 12, repsMax: 12, repos: 75,  technique: null },
      { id: 'dev_mil_elev_lat',        nom: 'Dév. militaire + Élév. lat.', groupe: 'Épaules', series: 3, repsMin: 10, repsMax: 15, repos: 75,  technique: 'SS' },
    ],
  },

  vendredi: {
    titre: 'Ischios + Dos rappel + Biceps',
    priorite: 'Ischios',
    groupes: ['Ischios', 'Dos', 'Biceps'],
    exercices: [
      { id: 'sdt_roumain_barre',      nom: 'SDT roumain barre',        groupe: 'Ischios', series: 5, repsMin: 6,  repsMax: 8,  repos: 120, technique: null },
      { id: 'hip_thrust',             nom: 'Hip thrust',               groupe: 'Ischios', series: 4, repsMin: 10, repsMax: 10, repos: 90,  technique: null },
      { id: 'leg_curl_allonge',       nom: 'Leg curl allongé',         groupe: 'Ischios', series: 4, repsMin: 10, repsMax: 12, repos: 90,  technique: null },
      { id: 'adducteurs_mollets',     nom: 'Adducteurs + Mollets',     groupe: 'Ischios', series: 3, repsMin: 15, repsMax: 15, repos: 60,  technique: 'SS' },
      { id: 'tirage_poitrine_machine',nom: 'Tirage poitrine machine',  groupe: 'Dos',     series: 4, repsMin: 10, repsMax: 10, repos: 90,  technique: null },
      { id: 'rowing_1_bras_halt',     nom: 'Rowing 1 bras haltère',    groupe: 'Dos',     series: 3, repsMin: 10, repsMax: 10, repos: 75,  technique: null },
      { id: 'curl_halt_incline',      nom: 'Curl haltères incliné',    groupe: 'Biceps',  series: 4, repsMin: 10, repsMax: 12, repos: 75,  technique: null },
      { id: 'curl_poulie_basse',      nom: 'Curl poulie basse',        groupe: 'Biceps',  series: 2, repsMin: 12, repsMax: 12, repos: 60,  technique: 'DS' },
      { id: 'curl_brachial_marteau',  nom: 'Curl brachial marteau',    groupe: 'Biceps',  series: 3, repsMin: 12, repsMax: 12, repos: 60,  technique: null },
    ],
  },

  samedi:   null,
  dimanche: null,

  speciale: {
    titre: 'Haut du corps',
    priorite: 'Pecs',
    groupes: ['Pecs', 'Dos', 'Biceps', 'Triceps', 'Épaules', 'Abdos'],
    exercices: [
      { id: 'dev_incline_halt',    nom: 'Dév. incliné haltères',          groupe: 'Pecs',    series: 4, repsMin: 8,  repsMax: 10, repos: 120, technique: null },
      { id: 'tractions_tirage',    nom: 'Tractions ou tirage vertical',   groupe: 'Dos',     series: 4, repsMin: 8,  repsMax: 10, repos: 120, technique: null },
      { id: 'dev_machine_rowing',  nom: 'Dév. machine + Rowing poulie',   groupe: 'Pecs',    series: 3, repsMin: 10, repsMax: 10, repos: 90,  technique: 'SS' },
      { id: 'pec_deck_face_pull',  nom: 'Pec deck + Face pull',           groupe: 'Pecs',    series: 3, repsMin: 12, repsMax: 15, repos: 90,  technique: 'SS' },
      { id: 'curl_ez_ext_corde',   nom: 'Curl EZ + Ext. corde',           groupe: 'Biceps',  series: 4, repsMin: 10, repsMax: 12, repos: 90,  technique: 'SS' },
      { id: 'curl_marteau',        nom: 'Curl marteau',                   groupe: 'Biceps',  series: 3, repsMin: 12, repsMax: 12, repos: 75,  technique: 'RP' },
      { id: 'crunch_poulie',       nom: 'Crunch poulie',                  groupe: 'Abdos',   series: 3, repsMin: 15, repsMax: 20, repos: 60,  technique: null },
    ],
  },
}

export const DAY_MAP = {
  0: 'dimanche',
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
}

export function getTodayKey() {
  return DAY_MAP[new Date().getDay()]
}

export function getSessionForDay(dayKey, contexte, energie) {
  let baseKey = dayKey
  if (contexte === 'reprise' || contexte === 'voyage') baseKey = 'speciale'

  const session = PROGRAMME[baseKey]
  if (!session) return null

  let exercices = session.exercices.map(ex => ({ ...ex }))

  if (contexte === 'deload') {
    exercices = exercices.map(ex => ({
      ...ex,
      series: Math.max(1, ex.series - (ex.series > 3 ? 2 : 1)),
      technique: null,
    }))
  }

  const chargeMultiplier =
    energie === 'moyen'   ? 0.95 :
    energie === 'fatigue' ? 0.90 : 1.0

  const seriesReduction = energie === 'fatigue' ? 1 : 0

  if (chargeMultiplier !== 1.0 || seriesReduction > 0) {
    exercices = exercices.map(ex => ({
      ...ex,
      chargeMultiplier,
      series: (ex.repsMin <= 8 && seriesReduction > 0)
        ? Math.max(1, ex.series - seriesReduction)
        : ex.series,
    }))
  }

  return {
    ...session,
    key: baseKey,
    isDeload: contexte === 'deload',
    exercices,
  }
}

export const VOLUMES_HEBDO = [
  { groupe: 'Quadriceps', series: 18, freq: '2×/sem' },
  { groupe: 'Ischios',    series: 15, freq: '2×/sem' },
  { groupe: 'Pectoraux',  series: 15, freq: '2×/sem' },
  { groupe: 'Dos',        series: 15, freq: '2×/sem' },
  { groupe: 'Biceps',     series: 14, freq: '4×/sem' },
  { groupe: 'Triceps',    series: 14, freq: '4×/sem' },
  { groupe: 'Abdos',      series: 24, freq: '4×/sem' },
  { groupe: 'Épaules',    series: 9,  freq: '1×/sem' },
]

export const REGLES_PROGRESSION = [
  {
    titre: 'Double progression (quadris)',
    corps: 'Vise le bas de la fourchette sem. 1–2, monte jusqu\'en haut sem. 3–4. Quand tu atteins le haut sur toutes les séries → +2.5 kg la semaine suivante.',
  },
  {
    titre: 'Cahier de progression',
    corps: 'Noter charge + reps chaque série. Objectif : +1 rep ou +0.5 kg par séance sur au moins 1 exo biceps et 1 exo triceps.',
  },
  {
    titre: 'Déload automatique semaine 5',
    corps: 'Volume −30 %, mêmes charges. Bannière de rappel 7 jours avant. Pas de techniques d\'intensification.',
  },
  {
    titre: 'Chrono strict',
    corps: 'Lourd (6–8 reps) = 2 min · Moyen (8–12) = 90 s · Isolation = 60 s · Supersets = 90 s.',
  },
  {
    titre: 'Rotation abdos toutes les 2 semaines',
    corps: 'Sem. 1–2 → crunch poulie + gainage + relevé jambes. Sem. 3–4 → roue abdo + obliques + planche latérale.',
  },
  {
    titre: 'Si machine prise',
    corps: 'Permuter avec un exercice équivalent, jamais attendre.',
  },
]
