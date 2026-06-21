import { v4 as uuidv4 } from 'uuid'
import {
  FileItem,
  RenameRule,
  ReplaceRule,
  InsertRule,
  DeleteRule,
  CaseRule,
  SequenceRule,
  RegexRule,
  ExifRule,
  ExtensionRule,
  Preset,
  RenameHistory
} from '../types'

export function createDefaultRules(): RenameRule[] {
  return []
}

export function createReplaceRule(): ReplaceRule {
  return {
    id: uuidv4(),
    type: 'replace',
    enabled: true,
    target: 'name',
    find: '',
    replace: '',
    caseSensitive: false,
    useRegex: false,
    replaceAll: true
  }
}

export function createInsertRule(): InsertRule {
  return {
    id: uuidv4(),
    type: 'insert',
    enabled: true,
    target: 'name',
    text: '',
    position: 'before_ext'
  }
}

export function createDeleteRule(): DeleteRule {
  return {
    id: uuidv4(),
    type: 'delete',
    enabled: true,
    target: 'name',
    targetMode: 'from_start',
    count: 1,
    caseSensitive: false
  }
}

export function createCaseRule(): CaseRule {
  return {
    id: uuidv4(),
    type: 'case',
    enabled: true,
    target: 'name',
    mode: 'title'
  }
}

export function createSequenceRule(): SequenceRule {
  return {
    id: uuidv4(),
    type: 'sequence',
    enabled: true,
    target: 'name',
    format: 'numeric',
    start: 1,
    step: 1,
    padding: 2,
    position: 'start',
    separator: '_'
  }
}

export function createRegexRule(): RegexRule {
  return {
    id: uuidv4(),
    type: 'regex',
    enabled: true,
    target: 'name',
    pattern: '',
    replacement: '',
    caseSensitive: false
  }
}

export function createExifRule(): ExifRule {
  return {
    id: uuidv4(),
    type: 'exif',
    enabled: true,
    target: 'name',
    field: 'DateTimeOriginal',
    position: 'start',
    separator: '_',
    format: 'YYYYMMDD'
  }
}

export function createExtensionRule(): ExtensionRule {
  return {
    id: uuidv4(),
    type: 'extension',
    enabled: true,
    target: 'extension',
    action: 'lower'
  }
}

export function createPreset(name: string, rules: RenameRule[]): Preset {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    rules: JSON.parse(JSON.stringify(rules))
  }
}

export function createRenameHistory(
  operations: Array<{ originalPath: string; newPath: string }>
): RenameHistory {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    operations
  }
}

export function splitFilename(fullName: string): { name: string; ext: string } {
  const lastDot = fullName.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) {
    return { name: fullName, ext: '' }
  }
  return {
    name: fullName.slice(0, lastDot),
    ext: fullName.slice(lastDot + 1)
  }
}

export function joinFilename(name: string, ext: string): string {
  if (!ext) return name
  return `${name}.${ext}`
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function joinPath(directory: string, filename: string): string {
  if (!directory) return filename
  if (directory.endsWith('/') || directory.endsWith('\\')) {
    return directory + filename
  }
  const hasForwardSlash = directory.includes('/')
  const hasBackslash = directory.includes('\\')
  if (hasBackslash && !hasForwardSlash) {
    return `${directory}\\${filename}`
  }
  return `${directory}/${filename}`
}

export function getBasename(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath
}
