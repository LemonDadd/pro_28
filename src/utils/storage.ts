import { Preset, RenameHistory } from '../types'

const PRESETS_KEY = 'batch_rename_presets'
const HISTORY_KEY = 'batch_rename_history'

export function loadPresets(): Preset[] {
  try {
    const data = localStorage.getItem(PRESETS_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load presets:', e)
  }
  return []
}

export function savePresets(presets: Preset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  } catch (e) {
    console.error('Failed to save presets:', e)
  }
}

export function addPreset(preset: Preset): Preset[] {
  const presets = loadPresets()
  presets.push(preset)
  savePresets(presets)
  return presets
}

export function updatePreset(preset: Preset): Preset[] {
  const presets = loadPresets()
  const index = presets.findIndex((p) => p.id === preset.id)
  if (index !== -1) {
    preset.updatedAt = new Date().toISOString()
    presets[index] = preset
    savePresets(presets)
  }
  return presets
}

export function deletePreset(presetId: string): Preset[] {
  const presets = loadPresets().filter((p) => p.id !== presetId)
  savePresets(presets)
  return presets
}

export function loadHistory(): RenameHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('Failed to load history:', e)
  }
  return []
}

export function saveHistory(history: RenameHistory[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

export function addHistory(entry: RenameHistory): RenameHistory[] {
  const history = loadHistory()
  history.unshift(entry)
  saveHistory(history)
  return history
}
