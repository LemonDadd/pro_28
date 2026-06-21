export type RuleType =
  | 'replace'
  | 'insert'
  | 'delete'
  | 'case'
  | 'sequence'
  | 'regex'
  | 'exif'
  | 'extension'

export type CaseMode = 'lower' | 'upper' | 'title' | 'sentence'

export type InsertPosition = 'start' | 'end' | 'before_ext' | 'index'

export type DeleteTarget = 'range' | 'from_start' | 'from_end' | 'pattern'

export type SequenceFormat = 'numeric' | 'alpha_lower' | 'alpha_upper' | 'roman_lower' | 'roman_upper'

export interface BaseRule {
  id: string
  type: RuleType
  enabled: boolean
  target: 'name' | 'extension' | 'full'
}

export interface ReplaceRule extends BaseRule {
  type: 'replace'
  find: string
  replace: string
  caseSensitive: boolean
  useRegex: boolean
  replaceAll: boolean
}

export interface InsertRule extends BaseRule {
  type: 'insert'
  text: string
  position: InsertPosition
  index?: number
}

export interface DeleteRule extends BaseRule {
  type: 'delete'
  targetMode: DeleteTarget
  startIndex?: number
  endIndex?: number
  count?: number
  pattern?: string
  useRegex?: boolean
  caseSensitive?: boolean
}

export interface CaseRule extends BaseRule {
  type: 'case'
  mode: CaseMode
}

export interface SequenceRule extends BaseRule {
  type: 'sequence'
  format: SequenceFormat
  start: number
  step: number
  padding: number
  position: InsertPosition
  separator: string
  index?: number
}

export interface RegexRule extends BaseRule {
  type: 'regex'
  pattern: string
  replacement: string
  caseSensitive: boolean
}

export interface ExifRule extends BaseRule {
  type: 'exif'
  field: string
  position: InsertPosition
  separator: string
  format?: string
  index?: number
}

export interface ExtensionRule extends BaseRule {
  type: 'extension'
  action: 'change' | 'lower' | 'upper' | 'remove'
  newExtension?: string
}

export type RenameRule =
  | ReplaceRule
  | InsertRule
  | DeleteRule
  | CaseRule
  | SequenceRule
  | RegexRule
  | ExifRule
  | ExtensionRule

export interface FileItem {
  id: string
  originalPath: string
  directory: string
  originalName: string
  originalExtension: string
  previewName: string
  previewExtension: string
  size: number
  mtime: string
  isDirectory: boolean
  hasConflict: boolean
  conflictReason?: string
  exifData?: Record<string, any>
  exifLoading?: boolean
}

export interface Preset {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  rules: RenameRule[]
}

export interface RenameHistory {
  id: string
  timestamp: string
  operations: Array<{
    originalPath: string
    newPath: string
  }>
}

export interface AppState {
  files: FileItem[]
  rules: RenameRule[]
  presets: Preset[]
  history: RenameHistory[]
  selectedPresetId: string | null
  isProcessing: boolean
}
