import { createClient } from '@supabase/supabase-js'

// ─── v3 — si ves esto en consola, el archivo nuevo está desplegado ────────────
console.log('%c[db.js v3] cargado correctamente', 'color:#4ade80;font-weight:bold;font-size:13px')

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[db.js v3] ❌ FALTAN variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_KEY')
} else {
  console.log('[db.js v3] ✅ Variables de entorno OK:', SUPABASE_URL)
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Error logging wrapper ────────────────────────────────────────────────────
const safe = async (promise, label) => {
  try {
    const res = await promise
    if (res.error) {
      console.error(`[Supabase ❌ ${label}]`, res.error.message, res.error)
      alert(`Error guardando en Supabase (${label}):\n${res.error.message}\n\nRevisa la consola (F12) para más detalles.`)
    } else {
      console.log(`[Supabase ✅ ${label}] OK`)
    }
    return res
  } catch (err) {
    console.error(`[Supabase 💥 ${label}] excepción:`, err)
    alert(`Excepción en ${label}: ${err.message}`)
  }
}

// ─── Mappers snake_case (DB) ↔ camelCase (App) ───────────────────────────────

const toUser = r => r ? ({
  id: r.id, username: r.username, displayName: r.display_name,
  password: r.password, email: r.email, role: r.role,
  isActive: r.is_active, adGroup: r.ad_group, ssoProvider: r.sso_provider,
}) : null

const fromUser = u => ({
  id: u.id, username: u.username, display_name: u.displayName,
  password: u.password, email: u.email, role: u.role,
  is_active: u.isActive, ad_group: u.adGroup ?? null,
  sso_provider: u.ssoProvider ?? null,
})

const toEnv = r => r ? ({
  id: r.id, name: r.name, category: r.category,
  isArchived: r.is_archived, isLocked: r.is_locked,
  maxReservationDuration: r.max_reservation_duration,
  color: r.color ?? null, url: r.url ?? null,
}) : null

const fromEnv = e => ({
  id: e.id, name: e.name, category: e.category,
  is_archived: e.isArchived ?? false,
  is_locked: e.isLocked ?? false,
  max_reservation_duration: e.maxReservationDuration,
  color: e.color || null,
  url: e.url || null,
})

const toRepo = r => r ? ({
  id: r.id, name: r.name, isArchived: r.is_archived,
}) : null

const fromRepo = r => ({
  id: r.id, name: r.name, is_archived: r.isArchived ?? false,
})

const toRes = r => r ? ({
  id: r.id,
  environmentId: r.environment_id,
  reservedByUserId: r.reserved_by_user_id,
  jiraIssueKeys: r.jira_issue_keys || [],
  description: r.description,
  plannedStart: r.planned_start,
  plannedEnd: r.planned_end,
  status: r.status,
  selectedRepositoryIds: r.selected_repository_ids || [],
  usageSession: r.usage_session || null,
  policyFlags: r.policy_flags || { exceedsMaxDuration: false },
}) : null

const fromRes = r => ({
  id: r.id,
  environment_id: r.environmentId,
  reserved_by_user_id: r.reservedByUserId,
  jira_issue_keys: r.jiraIssueKeys || [],
  description: r.description || null,
  planned_start: r.plannedStart,
  planned_end: r.plannedEnd,
  status: r.status,
  selected_repository_ids: r.selectedRepositoryIds || [],
  usage_session: r.usageSession || null,
  policy_flags: r.policyFlags || { exceedsMaxDuration: false },
})

const toGroup = r => r ? ({
  id: r.id, name: r.name, description: r.description, role: r.role,
}) : null

const fromGroup = g => ({
  id: g.id, name: g.name, description: g.description, role: g.role,
})

const toPolicy = r => r ? ({
  bookingWindowDays: r.booking_window_days,
  minDurationHours: Number(r.min_duration_hours),
  allowPastStart: r.allow_past_start,
  businessHoursOnly: r.business_hours_only,
  businessHoursStart: r.business_hours_start,
  businessHoursEnd: r.business_hours_end,
}) : null

const fromPolicy = p => ({
  id: 1,
  booking_window_days: p.bookingWindowDays,
  min_duration_hours: p.minDurationHours,
  allow_past_start: p.allowPastStart,
  business_hours_only: p.businessHoursOnly,
  business_hours_start: p.businessHoursStart,
  business_hours_end: p.businessHoursEnd,
})

// ─── Load all ─────────────────────────────────────────────────────────────────

export async function loadAll() {
  const [u, g, e, r, res, pol] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('ad_groups').select('*'),
    supabase.from('environments').select('*'),
    supabase.from('repositories').select('*'),
    supabase.from('reservations').select('*'),
    supabase.from('policy').select('*').eq('id', 1).single(),
  ])

  const firstErr = u.error || g.error || e.error || r.error || res.error || pol.error
  if (firstErr) throw new Error(firstErr.message)

  return {
    users:    u.data.map(toUser),
    adGroups: g.data.map(toGroup),
    envs:     e.data.map(toEnv),
    repos:    r.data.map(toRepo),
    ress:     res.data.map(toRes),
    policy:   toPolicy(pol.data),
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const dbAddUser    = u  => safe(supabase.from('users').insert(fromUser(u)), 'addUser')
export const dbUpdateUser = u  => safe(supabase.from('users').update(fromUser(u)).eq('id', u.id), 'updateUser')

// ─── Environments ─────────────────────────────────────────────────────────────
export const dbAddEnv    = e  => safe(supabase.from('environments').insert(fromEnv(e)), 'addEnv')
export const dbUpdateEnv = e  => safe(supabase.from('environments').update(fromEnv(e)).eq('id', e.id), 'updateEnv')

// ─── Repositories ─────────────────────────────────────────────────────────────
export const dbAddRepo    = r  => safe(supabase.from('repositories').insert(fromRepo(r)), 'addRepo')
export const dbUpdateRepo = r  => safe(supabase.from('repositories').update(fromRepo(r)).eq('id', r.id), 'updateRepo')

// ─── Reservations ─────────────────────────────────────────────────────────────
export const dbUpsertRes  = r  => safe(supabase.from('reservations').upsert(fromRes(r)), 'upsertRes')
export const dbUpdateRes  = r  => safe(supabase.from('reservations').update(fromRes(r)).eq('id', r.id), 'updateRes')

// ─── AD Groups ────────────────────────────────────────────────────────────────
export const dbAddGroup    = g => safe(supabase.from('ad_groups').insert(fromGroup(g)), 'addGroup')
export const dbUpdateGroup = g => safe(supabase.from('ad_groups').update(fromGroup(g)).eq('id', g.id), 'updateGroup')
export const dbDeleteGroup = id => safe(supabase.from('ad_groups').delete().eq('id', id), 'deleteGroup')

// ─── Policy ───────────────────────────────────────────────────────────────────
export const dbSavePolicy  = p => safe(supabase.from('policy').upsert(fromPolicy(p)), 'savePolicy')
