import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { FileItem, RenameRule, Preset, RenameHistory, AppState } from '../types'
import { applyRules } from '../utils/renameEngine'
import { splitFilename, joinFilename } from '../utils/rules'
import { loadPresets, savePresets, loadHistory, saveHistory } from '../utils/storage'
import { readExifData, isImageFile } from '../utils/exifReader'

declare global {
  interface Window {
    api?: {
      openFiles: () => Promise<string[]>
      readDir: (dirPath: string) => Promise<string[]>
      stat: (filePath: string) => Promise<{ size: number; mtime: string; isDirectory: boolean } | null>
      readFile: (filePath: string) => Promise<{ data: string } | null>
      rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>
    }
  }
}

type Action =
  | { type: 'INITIALIZE'; presets: Preset[]; history: RenameHistory[] }
  | { type: 'ADD_FILE'; file: FileItem }
  | { type: 'REMOVE_FILE'; fileId: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'UPDATE_FILE'; fileId: string; updates: Partial<FileItem> }
  | { type: 'UPDATE_ALL_FILES'; files: FileItem[] }
  | { type: 'ADD_RULE'; rule: RenameRule }
  | { type: 'UPDATE_RULE'; ruleId: string; updates: Partial<RenameRule> }
  | { type: 'REMOVE_RULE'; ruleId: string }
  | { type: 'REORDER_RULES'; fromIndex: number; toIndex: number }
  | { type: 'TOGGLE_RULE'; ruleId: string }
  | { type: 'CLEAR_RULES' }
  | { type: 'SET_RULES'; rules: RenameRule[] }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_PRESETS'; presets: Preset[] }
  | { type: 'SELECT_PRESET'; presetId: string | null }
  | { type: 'SET_HISTORY'; history: RenameHistory[] }

const initialState: AppState = {
  files: [],
  rules: [],
  presets: [],
  history: [],
  selectedPresetId: null,
  isProcessing: false
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, presets: action.presets, history: action.history }

    case 'ADD_FILE':
      if (state.files.some((f) => f.originalPath === action.file.originalPath)) {
        return state
      }
      return { ...state, files: [...state.files, action.file] }

    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter((f) => f.id !== action.fileId) }

    case 'CLEAR_FILES':
      return { ...state, files: [] }

    case 'UPDATE_FILE':
      return {
        ...state,
        files: state.files.map((f) =>
          f.id === action.fileId ? { ...f, ...action.updates } : f
        )
      }

    case 'UPDATE_ALL_FILES':
      return { ...state, files: action.files }

    case 'ADD_RULE':
      return { ...state, rules: [...state.rules, action.rule] }

    case 'UPDATE_RULE':
      return {
        ...state,
        rules: state.rules.map((r) =>
          r.id === action.ruleId ? ({ ...r, ...action.updates } as RenameRule) : r
        )
      }

    case 'REMOVE_RULE':
      return { ...state, rules: state.rules.filter((r) => r.id !== action.ruleId) }

    case 'REORDER_RULES': {
      const rules = [...state.rules]
      const [removed] = rules.splice(action.fromIndex, 1)
      rules.splice(action.toIndex, 0, removed)
      return { ...state, rules }
    }

    case 'TOGGLE_RULE':
      return {
        ...state,
        rules: state.rules.map((r) =>
          r.id === action.ruleId ? { ...r, enabled: !r.enabled } : r
        )
      }

    case 'CLEAR_RULES':
      return { ...state, rules: [] }

    case 'SET_RULES':
      return { ...state, rules: action.rules }

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.isProcessing }

    case 'SET_PRESETS':
      return { ...state, presets: action.presets }

    case 'SELECT_PRESET':
      return { ...state, selectedPresetId: action.presetId }

    case 'SET_HISTORY':
      return { ...state, history: action.history }

    default:
      return state
  }
}

interface AppContextType extends AppState {
  addFiles: (paths: string[]) => Promise<void>
  addFile: (path: string, stat?: { size: number; mtime: string; isDirectory: boolean }) => Promise<void>
  removeFile: (fileId: string) => void
  clearFiles: () => void
  addRule: (rule: RenameRule) => void
  updateRule: (ruleId: string, updates: Partial<RenameRule>) => void
  removeRule: (ruleId: string) => void
  reorderRules: (fromIndex: number, toIndex: number) => void
  toggleRule: (ruleId: string) => void
  clearRules: () => void
  applyRulesToFiles: () => void
  executeRename: () => Promise<boolean>
  undoLastRename: () => Promise<boolean>
  savePreset: (name: string) => void
  loadPreset: (presetId: string) => void
  deletePreset: (presetId: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    const presets = loadPresets()
    const history = loadHistory()
    dispatch({ type: 'INITIALIZE', presets, history })
  }, [])

  const applyRulesToFiles = useCallback(() => {
    const updatedFiles: FileItem[] = state.files.map((file, index) => {
      const { name, ext } = applyRules(state.rules, file, index)
      return {
        ...file,
        previewName: name,
        previewExtension: ext,
        hasConflict: false,
        conflictReason: undefined
      }
    })

    const pathMap = new Map<string, string[]>()
    for (const file of updatedFiles) {
      const fullNew = joinFilename(file.previewName, file.previewExtension)
      const key = file.directory ? `${file.directory}/${fullNew}` : fullNew
      if (!pathMap.has(key)) {
        pathMap.set(key, [])
      }
      pathMap.get(key)!.push(file.id)
    }

    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i]
      const fullNew = joinFilename(file.previewName, file.previewExtension)
      const key = file.directory ? `${file.directory}/${fullNew}` : fullNew
      const ids = pathMap.get(key) || []
      let hasConflict = false
      let conflictReason: string | undefined
      if (ids.length > 1) {
        hasConflict = true
        conflictReason = '命名冲突'
      }
      if (!file.previewName && !file.previewExtension) {
        hasConflict = true
        conflictReason = '文件名为空'
      }
      if (hasConflict) {
        updatedFiles[i] = { ...file, hasConflict, conflictReason }
      }
    }

    dispatch({ type: 'UPDATE_ALL_FILES', files: updatedFiles })
  }, [state.rules, state.files])

  useEffect(() => {
    if (state.files.length > 0) {
      applyRulesToFiles()
    }
  }, [state.rules])

  const addFile = useCallback(
    async (filePath: string, statInfo?: { size: number; mtime: string; isDirectory: boolean }) => {
      let info = statInfo
      if (!info && window.api) {
        const result = await window.api.stat(filePath)
        info = result || undefined
      }
      if (!info) {
        info = { size: 0, mtime: new Date().toISOString(), isDirectory: false }
      }

      if (info.isDirectory && window.api) {
        const subFiles = await window.api.readDir(filePath)
        for (const sf of subFiles) {
          await addFile(sf)
        }
        return
      }

      const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
      const fullName = lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath
      const dir = lastSlash >= 0 ? filePath.slice(0, lastSlash) : ''
      const { name, ext } = splitFilename(fullName)

      const newFile: FileItem = {
        id: uuidv4(),
        originalPath: filePath,
        directory: dir,
        originalName: name,
        originalExtension: ext,
        previewName: name,
        previewExtension: ext,
        size: info.size,
        mtime: info.mtime,
        isDirectory: info.isDirectory,
        hasConflict: false,
        exifData: undefined,
        exifLoading: false
      }

      dispatch({ type: 'ADD_FILE', file: newFile })

      if (isImageFile(newFile)) {
        dispatch({ type: 'UPDATE_FILE', fileId: newFile.id, updates: { exifLoading: true } })
        const exifResult = window.api ? await readExifData(filePath) : null
        dispatch({
          type: 'UPDATE_FILE',
          fileId: newFile.id,
          updates: { exifData: exifResult || undefined, exifLoading: false }
        })
        applyRulesToFiles()
      } else {
        applyRulesToFiles()
      }
    },
    [applyRulesToFiles]
  )

  const addFiles = useCallback(
    async (paths: string[]) => {
      for (const path of paths) {
        await addFile(path)
      }
    },
    [addFile]
  )

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', fileId })
    applyRulesToFiles()
  }, [applyRulesToFiles])

  const clearFiles = useCallback(() => {
    dispatch({ type: 'CLEAR_FILES' })
  }, [])

  const addRule = useCallback(
    (rule: RenameRule) => {
      dispatch({ type: 'ADD_RULE', rule })
      applyRulesToFiles()
    },
    [applyRulesToFiles]
  )

  const updateRule = useCallback(
    (ruleId: string, updates: Partial<RenameRule>) => {
      dispatch({ type: 'UPDATE_RULE', ruleId, updates })
      applyRulesToFiles()
    },
    [applyRulesToFiles]
  )

  const removeRule = useCallback(
    (ruleId: string) => {
      dispatch({ type: 'REMOVE_RULE', ruleId })
      applyRulesToFiles()
    },
    [applyRulesToFiles]
  )

  const reorderRules = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_RULES', fromIndex, toIndex })
      applyRulesToFiles()
    },
    [applyRulesToFiles]
  )

  const toggleRule = useCallback(
    (ruleId: string) => {
      dispatch({ type: 'TOGGLE_RULE', ruleId })
      applyRulesToFiles()
    },
    [applyRulesToFiles]
  )

  const clearRules = useCallback(() => {
    dispatch({ type: 'CLEAR_RULES' })
    applyRulesToFiles()
  }, [applyRulesToFiles])

  const executeRename = useCallback(async () => {
    if (!window.api) {
      alert('Electron API not available')
      return false
    }

    const toRename = state.files.filter(
      (f) =>
        !f.hasConflict &&
        (f.previewName !== f.originalName || f.previewExtension !== f.originalExtension)
    )

    if (toRename.length === 0) return false

    dispatch({ type: 'SET_PROCESSING', isProcessing: true })

    const successes: Array<{ originalPath: string; newPath: string }> = []

    try {
      for (const file of toRename) {
        const newName = joinFilename(file.previewName, file.previewExtension)
        const newPath = file.directory ? `${file.directory}/${newName}` : newName

        if (newPath === file.originalPath) continue

        const result = await window.api.rename(file.originalPath, newPath)
        if (result.success) {
          successes.push({ originalPath: file.originalPath, newPath })
        }
      }

      if (successes.length > 0) {
        const historyEntry: RenameHistory = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          operations: successes
        }

        const newHistory = [historyEntry, ...state.history].slice(0, 50)
        saveHistory(newHistory)
        dispatch({ type: 'SET_HISTORY', history: newHistory })

        const updatedFiles = state.files
          .map((f) => {
            const op = successes.find((s) => s.originalPath === f.originalPath)
            if (op) {
              const { name, ext } = splitFilename(
                op.newPath.split('/').pop() || op.newPath.split('\\').pop() || ''
              )
              return {
                ...f,
                originalPath: op.newPath,
                originalName: name,
                originalExtension: ext,
                previewName: name,
                previewExtension: ext
              }
            }
            return f
          })
          .filter((f) => {
            const failed = toRename.find(
              (t) => t.id === f.id && !successes.some((s) => s.originalPath === t.originalPath)
            )
            return !failed
          })

        dispatch({ type: 'UPDATE_ALL_FILES', files: updatedFiles })
        applyRulesToFiles()
      }

      return successes.length > 0
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false })
    }
  }, [state.files, state.history, applyRulesToFiles])

  const undoLastRename = useCallback(async () => {
    if (state.history.length === 0 || !window.api) return false

    const last = state.history[0]
    dispatch({ type: 'SET_PROCESSING', isProcessing: true })

    try {
      for (let i = last.operations.length - 1; i >= 0; i--) {
        const op = last.operations[i]
        await window.api.rename(op.newPath, op.originalPath)
      }

      const updatedFiles = state.files.map((f) => {
        const op = last.operations.find((o) => o.newPath === f.originalPath)
        if (op) {
          const { name, ext } = splitFilename(
            op.originalPath.split('/').pop() || op.originalPath.split('\\').pop() || ''
          )
          return {
            ...f,
            originalPath: op.originalPath,
            originalName: name,
            originalExtension: ext,
            previewName: name,
            previewExtension: ext
          }
        }
        return f
      })

      const newHistory = state.history.slice(1)
      saveHistory(newHistory)

      dispatch({ type: 'UPDATE_ALL_FILES', files: updatedFiles })
      dispatch({ type: 'SET_HISTORY', history: newHistory })
      applyRulesToFiles()

      return true
    } finally {
      dispatch({ type: 'SET_PROCESSING', isProcessing: false })
    }
  }, [state.files, state.history, applyRulesToFiles])

  const savePreset = useCallback(
    (name: string) => {
      const now = new Date().toISOString()
      const newPreset: Preset = {
        id: uuidv4(),
        name,
        createdAt: now,
        updatedAt: now,
        rules: JSON.parse(JSON.stringify(state.rules))
      }
      const newPresets = [...state.presets, newPreset]
      savePresets(newPresets)
      dispatch({ type: 'SET_PRESETS', presets: newPresets })
    },
    [state.rules, state.presets]
  )

  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = state.presets.find((p) => p.id === presetId)
      if (preset) {
        dispatch({ type: 'SET_RULES', rules: JSON.parse(JSON.stringify(preset.rules)) })
        dispatch({ type: 'SELECT_PRESET', presetId })
        applyRulesToFiles()
      }
    },
    [state.presets, applyRulesToFiles]
  )

  const deletePreset = useCallback(
    (presetId: string) => {
      const newPresets = state.presets.filter((p) => p.id !== presetId)
      savePresets(newPresets)
      dispatch({ type: 'SET_PRESETS', presets: newPresets })
      if (state.selectedPresetId === presetId) {
        dispatch({ type: 'SELECT_PRESET', presetId: null })
      }
    },
    [state.presets, state.selectedPresetId]
  )

  const value: AppContextType = {
    ...state,
    addFiles,
    addFile,
    removeFile,
    clearFiles,
    addRule,
    updateRule,
    removeRule,
    reorderRules,
    toggleRule,
    clearRules,
    applyRulesToFiles,
    executeRename,
    undoLastRename,
    savePreset,
    loadPreset,
    deletePreset
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
