import {
  RenameRule,
  ReplaceRule,
  InsertRule,
  DeleteRule,
  CaseRule,
  SequenceRule,
  RegexRule,
  ExifRule,
  ExtensionRule,
  FileItem
} from '../types'
import { splitFilename, joinFilename, escapeRegex } from './rules'

function applyToTarget(
  rule: RenameRule,
  name: string,
  ext: string,
  fn: (input: string) => string
): { name: string; ext: string } {
  switch (rule.target) {
    case 'name':
      return { name: fn(name), ext }
    case 'extension':
      return { name, ext: fn(ext) }
    case 'full':
      const full = joinFilename(name, ext)
      const result = fn(full)
      return splitFilename(result)
    default:
      return { name, ext }
  }
}

function applyReplace(
  rule: ReplaceRule,
  name: string,
  ext: string
): { name: string; ext: string } {
  return applyToTarget(rule, name, ext, (input) => {
    if (!rule.find) return input
    try {
      let pattern: RegExp
      if (rule.useRegex) {
        const flags = `${rule.replaceAll ? 'g' : ''}${rule.caseSensitive ? '' : 'i'}`
        pattern = new RegExp(rule.find, flags)
      } else {
        const flags = `${rule.replaceAll ? 'g' : ''}${rule.caseSensitive ? '' : 'i'}`
        pattern = new RegExp(escapeRegex(rule.find), flags)
      }
      return input.replace(pattern, rule.replace)
    } catch {
      return input
    }
  })
}

function applyInsert(
  rule: InsertRule,
  name: string,
  ext: string
): { name: string; ext: string } {
  if (!rule.text) return { name, ext }

  switch (rule.position) {
    case 'start':
      return applyToTarget(rule, name, ext, (input) => rule.text + input)
    case 'end':
      return applyToTarget(rule, name, ext, (input) => input + rule.text)
    case 'before_ext':
      if (rule.target === 'name' || rule.target === 'full') {
        return { name: name + rule.text, ext }
      }
      return { name, ext }
    case 'index':
      return applyToTarget(rule, name, ext, (input) => {
        const idx = Math.max(0, Math.min(rule.index ?? 0, input.length))
        return input.slice(0, idx) + rule.text + input.slice(idx)
      })
    default:
      return { name, ext }
  }
}

function applyDelete(
  rule: DeleteRule,
  name: string,
  ext: string
): { name: string; ext: string } {
  return applyToTarget(rule, name, ext, (input) => {
    switch (rule.targetMode) {
      case 'range': {
        const start = rule.startIndex ?? 0
        const end = rule.endIndex ?? start
        if (start < 0 || end > input.length || start > end) return input
        return input.slice(0, start) + input.slice(end)
      }
      case 'from_start': {
        const count = rule.count ?? 0
        return input.slice(Math.min(count, input.length))
      }
      case 'from_end': {
        const count = rule.count ?? 0
        return input.slice(0, Math.max(0, input.length - count))
      }
      case 'pattern': {
        if (!rule.pattern) return input
        try {
          const flags = rule.caseSensitive === false ? 'gi' : 'g'
          const pattern = rule.useRegex
            ? new RegExp(rule.pattern, flags)
            : new RegExp(escapeRegex(rule.pattern), flags)
          return input.replace(pattern, '')
        } catch {
          return input
        }
      }
      default:
        return input
    }
  })
}

function applyCase(
  rule: CaseRule,
  name: string,
  ext: string
): { name: string; ext: string } {
  return applyToTarget(rule, name, ext, (input) => {
    switch (rule.mode) {
      case 'lower':
        return input.toLowerCase()
      case 'upper':
        return input.toUpperCase()
      case 'title':
        return input.replace(/\b\w/g, (c) => c.toUpperCase())
      case 'sentence':
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase()
      default:
        return input
    }
  })
}

function toRoman(num: number, uppercase: boolean): string {
  if (num < 1 || num > 3999) return String(num)
  const map: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ]
  let result = ''
  let n = num
  for (const [value, symbol] of map) {
    while (n >= value) {
      result += symbol
      n -= value
    }
  }
  return uppercase ? result : result.toLowerCase()
}

function toAlpha(num: number, uppercase: boolean): string {
  if (num < 1) return ''
  let result = ''
  let n = num
  while (n > 0) {
    const remainder = (n - 1) % 26
    result = String.fromCharCode(65 + remainder) + result
    n = Math.floor((n - 1) / 26)
  }
  return uppercase ? result : result.toLowerCase()
}

function formatSequence(rule: SequenceRule, value: number): string {
  let formatted: string
  switch (rule.format) {
    case 'numeric':
      formatted = String(value)
      break
    case 'alpha_lower':
      formatted = toAlpha(value, false)
      break
    case 'alpha_upper':
      formatted = toAlpha(value, true)
      break
    case 'roman_lower':
      formatted = toRoman(value, false)
      break
    case 'roman_upper':
      formatted = toRoman(value, true)
      break
    default:
      formatted = String(value)
  }
  if (rule.format === 'numeric' && rule.padding > formatted.length) {
    formatted = formatted.padStart(rule.padding, '0')
  }
  return formatted
}

function applySequence(
  rule: SequenceRule,
  name: string,
  ext: string,
  index: number
): { name: string; ext: string } {
  const value = rule.start + index * rule.step
  const seq = formatSequence(rule, value)

  const applySeq = (input: string): string => {
    switch (rule.position) {
      case 'start':
        return seq + rule.separator + input
      case 'end':
        return input + rule.separator + seq
      case 'before_ext':
        return input
      case 'index':
        const idx = Math.max(0, Math.min(rule.index ?? 0, input.length))
        return input.slice(0, idx) + seq + rule.separator + input.slice(idx)
      default:
        return input
    }
  }

  if (rule.position === 'before_ext' && (rule.target === 'name' || rule.target === 'full')) {
    return { name: name + rule.separator + seq, ext }
  }

  return applyToTarget(rule, name, ext, applySeq)
}

function applyRegex(
  rule: RegexRule,
  name: string,
  ext: string
): { name: string; ext: string } {
  return applyToTarget(rule, name, ext, (input) => {
    if (!rule.pattern) return input
    try {
      const flags = `g${rule.caseSensitive ? '' : 'i'}`
      const pattern = new RegExp(rule.pattern, flags)
      return input.replace(pattern, rule.replacement)
    } catch {
      return input
    }
  })
}

function formatDate(date: Date, format: string): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace(/YYYY/g, String(year))
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds)
}

function getExifValue(file: FileItem, field: string, format?: string): string {
  if (!file.exifData) return ''
  const value = file.exifData[field]
  if (!value) return ''

  if (value instanceof Date || field.includes('Date') || field.includes('Time')) {
    const date = value instanceof Date ? value : new Date(value)
    if (!isNaN(date.getTime())) {
      return formatDate(date, format || 'YYYY-MM-DD')
    }
  }

  return String(value)
}

function applyExif(
  rule: ExifRule,
  name: string,
  ext: string,
  file: FileItem
): { name: string; ext: string } {
  const value = getExifValue(file, rule.field, rule.format)
  if (!value) return { name, ext }

  const applyExifText = (input: string): string => {
    switch (rule.position) {
      case 'start':
        return value + rule.separator + input
      case 'end':
        return input + rule.separator + value
      case 'before_ext':
        return input
      case 'index':
        const idx = Math.max(0, Math.min(rule.index ?? 0, input.length))
        return input.slice(0, idx) + value + rule.separator + input.slice(idx)
      default:
        return input
    }
  }

  if (rule.position === 'before_ext' && (rule.target === 'name' || rule.target === 'full')) {
    return { name: name + rule.separator + value, ext }
  }

  return applyToTarget(rule, name, ext, applyExifText)
}

function applyExtension(
  rule: ExtensionRule,
  _name: string,
  ext: string
): { name: string; ext: string } {
  switch (rule.action) {
    case 'lower':
      return { name: _name, ext: ext.toLowerCase() }
    case 'upper':
      return { name: _name, ext: ext.toUpperCase() }
    case 'remove':
      return { name: _name, ext: '' }
    case 'change':
      return { name: _name, ext: rule.newExtension?.replace(/^\./, '') || ext }
    default:
      return { name: _name, ext }
  }
}

export function applyRule(
  rule: RenameRule,
  name: string,
  ext: string,
  index: number,
  file: FileItem
): { name: string; ext: string } {
  if (!rule.enabled) return { name, ext }

  switch (rule.type) {
    case 'replace':
      return applyReplace(rule, name, ext)
    case 'insert':
      return applyInsert(rule, name, ext)
    case 'delete':
      return applyDelete(rule, name, ext)
    case 'case':
      return applyCase(rule, name, ext)
    case 'sequence':
      return applySequence(rule, name, ext, index)
    case 'regex':
      return applyRegex(rule, name, ext)
    case 'exif':
      return applyExif(rule, name, ext, file)
    case 'extension':
      return applyExtension(rule, name, ext)
    default:
      return { name, ext }
  }
}

export function applyRules(
  rules: RenameRule[],
  file: FileItem,
  index: number
): { name: string; ext: string } {
  let result = { name: file.originalName, ext: file.originalExtension }

  for (const rule of rules) {
    result = applyRule(rule, result.name, result.ext, index, file)
  }

  return result
}

export function detectConflicts(files: FileItem[]): Map<string, string[]> {
  const pathMap = new Map<string, string[]>()

  for (const file of files) {
    const newPath = joinFilename(file.previewName, file.previewExtension)
    if (!pathMap.has(newPath)) {
      pathMap.set(newPath, [])
    }
    pathMap.get(newPath)!.push(file.id)
  }

  return pathMap
}
