// RN-03 — progressive lockout after 5 consecutive failed login attempts per email.
// Durations double each time the threshold is hit again: 30s, 1min, 2min, 4min, 8min, capped at 30min.
//
// Storage is localStorage, so the counter is scoped per email PER BROWSER/DEVICE —
// logging in from two devices with the same email tracks two independent counters.
// This is intentional: RN-03 requires rejecting attempts without contacting the
// server during lockout, which rules out a synced (server-side) counter for now.

const STORAGE_KEY = 'tosho:loginLockout'
const MAX_ATTEMPTS = 5
const BASE_LOCK_MS = 30 * 1000
const MAX_LOCK_MS = 30 * 60 * 1000

interface LockoutEntry {
  attempts: number
  lockLevel: number
  lockUntil: number | null
}

type LockoutStore = Record<string, LockoutEntry>

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const readStore = (): LockoutStore => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeStore = (store: LockoutStore) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

const lockDurationForLevel = (level: number) => Math.min(BASE_LOCK_MS * 2 ** level, MAX_LOCK_MS)

export interface LockoutStatus {
  locked: boolean
  remainingMs: number
}

export const getLockoutStatus = (email: string): LockoutStatus => {
  const store = readStore()
  const entry = store[normalizeEmail(email)]

  if (!entry?.lockUntil) return { locked: false, remainingMs: 0 }

  const remainingMs = entry.lockUntil - Date.now()
  if (remainingMs <= 0) return { locked: false, remainingMs: 0 }

  return { locked: true, remainingMs }
}

export const registerFailedAttempt = (email: string): LockoutStatus => {
  const key = normalizeEmail(email)
  const store = readStore()
  const entry = store[key] ?? { attempts: 0, lockLevel: 0, lockUntil: null }

  entry.attempts += 1

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockUntil = Date.now() + lockDurationForLevel(entry.lockLevel)
    entry.lockLevel += 1
    entry.attempts = 0
  }

  store[key] = entry
  writeStore(store)

  return getLockoutStatus(email)
}

export const clearLockout = (email: string) => {
  const store = readStore()
  delete store[normalizeEmail(email)]
  writeStore(store)
}

export const formatRemainingTime = (ms: number): string => {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes === 0) return `${seconds}s`
  return `${minutes}min ${seconds.toString().padStart(2, '0')}s`
}
