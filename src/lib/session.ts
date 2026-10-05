import { isStoredQualification, readJSON, removeKey, STORAGE_KEYS, type StoredQualification } from './storage';

// Run lifecycle (SPEC §4). UTMs are first-touch attribution and survive both.

/**
 * The gate was submitted: drop every wizard answer so the next run starts clean, and keep only
 * what /book and /thanks need. Called on /next, before it redirects.
 */
export function completeRun(): void {
  removeKey(STORAGE_KEYS.wizard);
}

/** "Start a new calculation": forget the finished run too. */
export function startOver(): void {
  removeKey(STORAGE_KEYS.wizard);
  removeKey(STORAGE_KEYS.qualification);
}

export function readCompletedRun(): StoredQualification | null {
  return readJSON(STORAGE_KEYS.qualification, isStoredQualification);
}
