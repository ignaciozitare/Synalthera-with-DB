// src/lib/db.js
// Supabase client + all CRUD operations for SynalterA
// Env vars (Vite): VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    "[db] ⚠️  Missing env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY.\n" +
    "    Add them in Vercel → Project Settings → Environment Variables."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────────────
// Seed data (inserted on first load if tables are empty)
// ─────────────────────────────────────────────
const H = (n) => new Date(Date.now() + n * 3_600_000).toISOString();
const D = (n) => new Date(Date.now() + n * 86_400_000).toISOString();

const SEED_USERS = [
  { id:"u0", username:"admin",  display_name:"Admin User",    password:"admin",  email:"admin@company.com",  role:"ADMIN", is_active:true,  ad_group:"admins", sso_provider:null },
  { id:"u1", username:"user1",  display_name:"Alice García",  password:"user1",  email:"alice@company.com",  role:"USER",  is_active:true,  ad_group:"devs",   sso_provider:null },
  { id:"u2", username:"user2",  display_name:"Bob Martín",    password:"user2",  email:"bob@company.com",    role:"USER",  is_active:true,  ad_group:"devs",   sso_provider:null },
  { id:"u3", username:"user3",  display_name:"Carol López",   password:"user3",  email:"carol@company.com",  role:"USER",  is_active:false, ad_group:"devs",   sso_provider:null },
  { id:"u4", username:"sso1",   display_name:"SSO Demo User", password:"sso1",   email:"sso@company.com",    role:"USER",  is_active:true,  ad_group:"devs",   sso_provider:"google" },
];

const SEED_ENVS = [
  { id:"e1", name:"DEV-01",     category:"DEV",     is_archived:false, is_locked:false, max_reservation_duration:8,  color:"#7c3aed", url:null },
  { id:"e2", name:"DEV-02",     category:"DEV",     is_archived:false, is_locked:false, max_reservation_duration:4,  color:"#7c3aed", url:null },
  { id:"e3", name:"PRE-01",     category:"PRE",     is_archived:false, is_locked:false, max_reservation_duration:24, color:"#b45309", url:null },
  { id:"e4", name:"STAGING-01", category:"STAGING", is_archived:false, is_locked:false, max_reservation_duration:48, color:"#0e7490", url:null },
  { id:"e5", name:"STAGING-02", category:"STAGING", is_archived:true,  is_locked:false, max_reservation_duration:12, color:"#0e7490", url:null },
];

const SEED_REPOS = [
  { id:"r1", name:"frontend-app",    is_archived:false },
  { id:"r2", name:"backend-api",     is_archived:false },
  { id:"r3", name:"infra-scripts",   is_archived:false },
  { id:"r4", name:"legacy-monolith", is_archived:true  },
  { id:"r5", name:"data-pipeline",   is_archived:false },
  { id:"r6", name:"auth-service",    is_archived:false },
  { id:"r7", name:"analytics-core",  is_archived:false },
];

const SEED_RESS = [
  {
    id:"r01", environment_id:"e1", reserved_by_user_id:"u1",
    jira_issue_keys:["PROJ-101","PROJ-102"],
    description:"Frontend deploy + integration test",
    planned_start:H(2), planned_end:H(6),
    status:"Reserved", selected_repository_ids:["r1","r2"],
    usage_session:null, policy_flags:{exceedsMaxDuration:false},
  },
  {
    id:"r02", environment_id:"e3", reserved_by_user_id:"u2",
    jira_issue_keys:["PROJ-202"],
    description:"Auth rollout to PRE",
    planned_start:H(-2), planned_end:H(5),
    status:"InUse", selected_repository_ids:["r2","r3"],
    usage_session:{actualStart:H(-2),actualEnd:null,branches:["main","feature/login"]},
    policy_flags:{exceedsMaxDuration:false},
  },
  {
    id:"r03", environment_id:"e4", reserved_by_user_id:"u1",
    jira_issue_keys:["PROJ-303","PROJ-304"],
    description:"Staging full deploy — policy violation",
    planned_start:H(10), planned_end:H(62),
    status:"PolicyViolation", selected_repository_ids:["r1"],
    usage_session:null, policy_flags:{exceedsMaxDuration:true},
  },
  {
    id:"r04", environment_id:"e2", reserved_by_user_id:"u2",
    jira_issue_keys:["PROJ-404"],
    description:"Data pipeline validation",
    planned_start:H(26), planned_end:H(30),
    status:"Reserved", selected_repository_ids:["r5"],
    usage_session:null, policy_flags:{exceedsMaxDuration:false},
  },
  {
    id:"r05", environment_id:"e1", reserved_by_user_id:"u0",
    jira_issue_keys:["PROJ-505"],
    description:"Admin hotfix",
    planned_start:H(-10), planned_end:H(-6),
    status:"Completed", selected_repository_ids:["r1","r2"],
    usage_session:{actualStart:H(-10),actualEnd:H(-7),branches:["main"]},
    policy_flags:{exceedsMaxDuration:false},
  },
];

const SEED_GROUPS = [
  { id:"g1", name:"admins", description:"System administrators", role:"ADMIN" },
  { id:"g2", name:"devs",   description:"Development team",      role:"USER"  },
  { id:"g3", name:"ops",    description:"Operations team",        role:"USER"  },
];

const SEED_POLICY = {
  id: 1,
  booking_window_days: 30,
  min_duration_hours: 0.5,
  allow_past_start: true,
  business_hours_only: false,
  business_hours_start: 8,
  business_hours_end: 20,
};

// ─────────────────────────────────────────────
// Row mappers  (snake_case DB ↔ camelCase JS)
// ─────────────────────────────────────────────
const toUser = (r) => ({
  id:            r.id,
  username:      r.username,
  displayName:   r.display_name,
  password:      r.password,
  email:         r.email,
  role:          r.role,
  isActive:      r.is_active,
  adGroup:       r.ad_group,
  ssoProvider:   r.sso_provider,
});

const fromUser = (u) => ({
  id:           u.id,
  username:     u.username,
  display_name: u.displayName,
  password:     u.password,
  email:        u.email,
  role:         u.role,
  is_active:    u.isActive,
  ad_group:     u.adGroup ?? null,
  sso_provider: u.ssoProvider ?? null,
});

const toEnv = (r) => ({
  id:                      r.id,
  name:                    r.name,
  category:                r.category,
  isArchived:              r.is_archived,
  isLocked:                r.is_locked,
  maxReservationDuration:  r.max_reservation_duration,
  color:                   r.color ?? null,
  url:                     r.url ?? null,
});

const fromEnv = (e) => ({
  id:                       e.id,
  name:                     e.name,
  category:                 e.category,
  is_archived:              e.isArchived,
  is_locked:                e.isLocked,
  max_reservation_duration: e.maxReservationDuration,
  color:                    e.color ?? null,
  url:                      e.url ?? null,
});

const toRepo = (r) => ({
  id:         r.id,
  name:       r.name,
  isArchived: r.is_archived,
});

const fromRepo = (r) => ({
  id:          r.id,
  name:        r.name,
  is_archived: r.isArchived,
});

const toRes = (r) => ({
  id:                     r.id,
  environmentId:          r.environment_id,
  reservedByUserId:       r.reserved_by_user_id,
  jiraIssueKeys:          r.jira_issue_keys ?? [],
  description:            r.description ?? "",
  plannedStart:           r.planned_start,
  plannedEnd:             r.planned_end,
  status:                 r.status,
  selectedRepositoryIds:  r.selected_repository_ids ?? [],
  usageSession:           r.usage_session ?? null,
  policyFlags:            r.policy_flags ?? { exceedsMaxDuration: false },
});

const fromRes = (r) => ({
  id:                      r.id,
  environment_id:          r.environmentId,
  reserved_by_user_id:     r.reservedByUserId,
  jira_issue_keys:         r.jiraIssueKeys ?? [],
  description:             r.description ?? "",
  planned_start:           r.plannedStart,
  planned_end:             r.plannedEnd,
  status:                  r.status,
  selected_repository_ids: r.selectedRepositoryIds ?? [],
  usage_session:           r.usageSession ?? null,
  policy_flags:            r.policyFlags ?? { exceedsMaxDuration: false },
});

const toGroup = (r) => ({
  id:          r.id,
  name:        r.name,
  description: r.description,
  role:        r.role,
});

const fromGroup = (g) => ({
  id:          g.id,
  name:        g.name,
  description: g.description,
  role:        g.role,
});

const toPolicy = (r) => ({
  bookingWindowDays:  r.booking_window_days,
  minDurationHours:   r.min_duration_hours,
  allowPastStart:     r.allow_past_start,
  businessHoursOnly:  r.business_hours_only,
  businessHoursStart: r.business_hours_start,
  businessHoursEnd:   r.business_hours_end,
});

// ─────────────────────────────────────────────
// Seed helper — inserts rows only if table is empty
// ─────────────────────────────────────────────
async function seedIfEmpty(table, rows) {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (count === 0) {
    const { error } = await supabase.from(table).insert(rows);
    if (error) console.warn(`[db] seed ${table}:`, error.message);
    else console.info(`[db] seeded ${rows.length} rows into ${table}`);
  }
}

async function seedPolicyIfEmpty() {
  const { count } = await supabase
    .from("policy")
    .select("id", { count: "exact", head: true });

  if (count === 0) {
    const { error } = await supabase.from("policy").insert(SEED_POLICY);
    if (error) console.warn("[db] seed policy:", error.message);
  }
}

// ─────────────────────────────────────────────
// loadAll — called once on app mount
// ─────────────────────────────────────────────
export async function loadAll() {
  // Seed tables in parallel if they're empty
  await Promise.all([
    seedIfEmpty("users",        SEED_USERS),
    seedIfEmpty("environments", SEED_ENVS),
    seedIfEmpty("repositories", SEED_REPOS),
    seedIfEmpty("reservations", SEED_RESS),
    seedIfEmpty("ad_groups",    SEED_GROUPS),
    seedPolicyIfEmpty(),
  ]);

  // Fetch everything in parallel
  const [
    { data: usersRaw,  error: usersErr  },
    { data: envsRaw,   error: envsErr   },
    { data: reposRaw,  error: reposErr  },
    { data: ressRaw,   error: ressErr   },
    { data: groupsRaw, error: groupsErr },
    { data: policyRaw, error: policyErr },
  ] = await Promise.all([
    supabase.from("users").select("*").order("username"),
    supabase.from("environments").select("*").order("name"),
    supabase.from("repositories").select("*").order("name"),
    supabase.from("reservations").select("*").order("planned_start", { ascending: false }),
    supabase.from("ad_groups").select("*").order("name"),
    supabase.from("policy").select("*").eq("id", 1).single(),
  ]);

  if (usersErr)  throw new Error("users: "  + usersErr.message);
  if (envsErr)   throw new Error("environments: " + envsErr.message);
  if (reposErr)  throw new Error("repositories: " + reposErr.message);
  if (ressErr)   throw new Error("reservations: " + ressErr.message);
  if (groupsErr) throw new Error("ad_groups: " + groupsErr.message);
  if (policyErr) throw new Error("policy: "  + policyErr.message);

  return {
    users:    (usersRaw  ?? []).map(toUser),
    envs:     (envsRaw   ?? []).map(toEnv),
    repos:    (reposRaw  ?? []).map(toRepo),
    ress:     (ressRaw   ?? []).map(toRes),
    adGroups: (groupsRaw ?? []).map(toGroup),
    policy:   toPolicy(policyRaw),
  };
}

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────
export async function dbAddUser(user) {
  const { error } = await supabase.from("users").insert(fromUser(user));
  if (error) console.error("[db] addUser:", error.message);
}

export async function dbUpdateUser(user) {
  const { error } = await supabase
    .from("users")
    .update(fromUser(user))
    .eq("id", user.id);
  if (error) console.error("[db] updateUser:", error.message);
}

// ─────────────────────────────────────────────
// Environments
// ─────────────────────────────────────────────
export async function dbAddEnv(env) {
  const { error } = await supabase.from("environments").insert(fromEnv(env));
  if (error) console.error("[db] addEnv:", error.message);
}

export async function dbUpdateEnv(env) {
  const { error } = await supabase
    .from("environments")
    .update(fromEnv(env))
    .eq("id", env.id);
  if (error) console.error("[db] updateEnv:", error.message);
}

// ─────────────────────────────────────────────
// Repositories
// ─────────────────────────────────────────────
export async function dbAddRepo(repo) {
  const { error } = await supabase.from("repositories").insert(fromRepo(repo));
  if (error) console.error("[db] addRepo:", error.message);
}

export async function dbUpdateRepo(repo) {
  const { error } = await supabase
    .from("repositories")
    .update(fromRepo(repo))
    .eq("id", repo.id);
  if (error) console.error("[db] updateRepo:", error.message);
}

// ─────────────────────────────────────────────
// Reservations
// ─────────────────────────────────────────────
export async function dbUpsertRes(res) {
  const { error } = await supabase
    .from("reservations")
    .upsert(fromRes(res), { onConflict: "id" });
  if (error) console.error("[db] upsertRes:", error.message);
}

export async function dbUpdateRes(res) {
  const { error } = await supabase
    .from("reservations")
    .update(fromRes(res))
    .eq("id", res.id);
  if (error) console.error("[db] updateRes:", error.message);
}

// ─────────────────────────────────────────────
// AD Groups
// ─────────────────────────────────────────────
export async function dbAddGroup(group) {
  const { error } = await supabase.from("ad_groups").insert(fromGroup(group));
  if (error) console.error("[db] addGroup:", error.message);
}

export async function dbUpdateGroup(group) {
  const { error } = await supabase
    .from("ad_groups")
    .update(fromGroup(group))
    .eq("id", group.id);
  if (error) console.error("[db] updateGroup:", error.message);
}

export async function dbDeleteGroup(id) {
  const { error } = await supabase
    .from("ad_groups")
    .delete()
    .eq("id", id);
  if (error) console.error("[db] deleteGroup:", error.message);
}

// ─────────────────────────────────────────────
// Policy
// ─────────────────────────────────────────────
export async function dbSavePolicy(policy) {
  const { error } = await supabase
    .from("policy")
    .upsert({
      id:                   1,
      booking_window_days:  policy.bookingWindowDays,
      min_duration_hours:   policy.minDurationHours,
      allow_past_start:     policy.allowPastStart,
      business_hours_only:  policy.businessHoursOnly,
      business_hours_start: policy.businessHoursStart,
      business_hours_end:   policy.businessHoursEnd,
    }, { onConflict: "id" });
  if (error) console.error("[db] savePolicy:", error.message);
}
