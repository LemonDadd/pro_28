import React from 'react'
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
  CaseMode,
  InsertPosition,
  DeleteTarget,
  SequenceFormat
} from '../types'
import { useApp } from '../store/AppContext'
import { EXIF_AVAILABLE_FIELDS } from '../utils/exifReader'

interface RuleEditorProps {
  rule: RenameRule
  index: number
  totalCount: number
}

const RULE_TYPE_LABELS: Record<string, string> = {
  replace: '替换文本',
  insert: '插入文本',
  delete: '删除文本',
  case: '大小写转换',
  sequence: '序号',
  regex: '正则表达式',
  exif: 'EXIF信息',
  extension: '扩展名'
}

const TARGET_LABELS: Record<string, string> = {
  name: '文件名',
  extension: '扩展名',
  full: '完整名称'
}

const CASE_MODE_LABELS: Record<CaseMode, string> = {
  lower: '全部小写',
  upper: '全部大写',
  title: '首字母大写',
  sentence: '句首大写'
}

const POSITION_LABELS: Record<InsertPosition, string> = {
  start: '开头',
  end: '结尾',
  before_ext: '扩展名前',
  index: '指定位置'
}

const DELETE_TARGET_LABELS: Record<DeleteTarget, string> = {
  range: '范围删除',
  from_start: '从开头删除',
  from_end: '从结尾删除',
  pattern: '按模式删除'
}

const SEQUENCE_FORMAT_LABELS: Record<SequenceFormat, string> = {
  numeric: '数字 (1, 2, 3)',
  alpha_lower: '小写字母 (a, b, c)',
  alpha_upper: '大写字母 (A, B, C)',
  roman_lower: '小写罗马 (i, ii, iii)',
  roman_upper: '大写罗马 (I, II, III)'
}

export function RuleEditor({ rule, index, totalCount }: RuleEditorProps) {
  const { updateRule, removeRule, toggleRule, reorderRules } = useApp()

  const handleUpdate = (updates: Partial<RenameRule>) => {
    updateRule(rule.id, updates)
  }

  const moveUp = () => {
    if (index > 0) {
      reorderRules(index, index - 1)
    }
  }

  const moveDown = () => {
    if (index < totalCount - 1) {
      reorderRules(index, index + 1)
    }
  }

  const renderRuleSpecific = () => {
    switch (rule.type) {
      case 'replace':
        return <ReplaceRuleEditor rule={rule} onChange={handleUpdate} />
      case 'insert':
        return <InsertRuleEditor rule={rule} onChange={handleUpdate} />
      case 'delete':
        return <DeleteRuleEditor rule={rule} onChange={handleUpdate} />
      case 'case':
        return <CaseRuleEditor rule={rule} onChange={handleUpdate} />
      case 'sequence':
        return <SequenceRuleEditor rule={rule} onChange={handleUpdate} />
      case 'regex':
        return <RegexRuleEditor rule={rule} onChange={handleUpdate} />
      case 'exif':
        return <ExifRuleEditor rule={rule} onChange={handleUpdate} />
      case 'extension':
        return <ExtensionRuleEditor rule={rule} onChange={handleUpdate} />
      default:
        return null
    }
  }

  const showTargetSelect = rule.type !== 'extension' && rule.type !== 'sequence' && rule.type !== 'exif'

  return (
    <div className={`rule-editor ${rule.enabled ? '' : 'disabled'}`}>
      <div className="rule-header">
        <div className="rule-header-left">
          <label className="rule-toggle">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={() => toggleRule(rule.id)}
            />
          </label>
          <span className="rule-index">#{index + 1}</span>
          <span className="rule-type-label">{RULE_TYPE_LABELS[rule.type]}</span>
          {showTargetSelect && (
            <select
              className="rule-target-select"
              value={rule.target}
              onChange={(e) => handleUpdate({ target: e.target.value as any })}
            >
              {Object.entries(TARGET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="rule-header-right">
          <button className="btn-icon" onClick={moveUp} disabled={index === 0} title="上移">
            ↑
          </button>
          <button
            className="btn-icon"
            onClick={moveDown}
            disabled={index === totalCount - 1}
            title="下移"
          >
            ↓
          </button>
          <button className="btn-icon btn-danger" onClick={() => removeRule(rule.id)} title="删除">
            ✕
          </button>
        </div>
      </div>
      <div className="rule-body">{renderRuleSpecific()}</div>
    </div>
  )
}

interface SubEditorProps<T> {
  rule: T
  onChange: (updates: Partial<T>) => void
}

function ReplaceRuleEditor({ rule, onChange }: SubEditorProps<ReplaceRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>查找:</label>
        <input
          type="text"
          value={rule.find}
          onChange={(e) => onChange({ find: e.target.value })}
          placeholder="要查找的文本"
        />
      </div>
      <div className="field-row">
        <label>替换为:</label>
        <input
          type="text"
          value={rule.replace}
          onChange={(e) => onChange({ replace: e.target.value })}
          placeholder="替换文本"
        />
      </div>
      <div className="field-row field-checkboxes">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rule.useRegex}
            onChange={(e) => onChange({ useRegex: e.target.checked })}
          />
          使用正则
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rule.caseSensitive}
            onChange={(e) => onChange({ caseSensitive: e.target.checked })}
          />
          区分大小写
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rule.replaceAll}
            onChange={(e) => onChange({ replaceAll: e.target.checked })}
          />
          全部替换
        </label>
      </div>
    </div>
  )
}

function InsertRuleEditor({ rule, onChange }: SubEditorProps<InsertRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>插入文本:</label>
        <input
          type="text"
          value={rule.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="要插入的文本"
        />
      </div>
      <div className="field-row">
        <label>位置:</label>
        <select
          value={rule.position}
          onChange={(e) => onChange({ position: e.target.value as InsertPosition })}
        >
          {Object.entries(POSITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {rule.position === 'index' && (
        <div className="field-row">
          <label>索引位置:</label>
          <input
            type="number"
            min="0"
            value={rule.index ?? 0}
            onChange={(e) => onChange({ index: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}
    </div>
  )
}

function DeleteRuleEditor({ rule, onChange }: SubEditorProps<DeleteRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>删除方式:</label>
        <select
          value={rule.targetMode}
          onChange={(e) => onChange({ targetMode: e.target.value as DeleteTarget })}
        >
          {Object.entries(DELETE_TARGET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {rule.targetMode === 'range' && (
        <>
          <div className="field-row">
            <label>起始索引:</label>
            <input
              type="number"
              min="0"
              value={rule.startIndex ?? 0}
              onChange={(e) => onChange({ startIndex: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="field-row">
            <label>结束索引:</label>
            <input
              type="number"
              min="0"
              value={rule.endIndex ?? 0}
              onChange={(e) => onChange({ endIndex: parseInt(e.target.value) || 0 })}
            />
          </div>
        </>
      )}

      {(rule.targetMode === 'from_start' || rule.targetMode === 'from_end') && (
        <div className="field-row">
          <label>字符数:</label>
          <input
            type="number"
            min="0"
            value={rule.count ?? 0}
            onChange={(e) => onChange({ count: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}

      {rule.targetMode === 'pattern' && (
        <>
          <div className="field-row">
            <label>匹配模式:</label>
            <input
              type="text"
              value={rule.pattern ?? ''}
              onChange={(e) => onChange({ pattern: e.target.value })}
              placeholder="要删除的文本或正则"
            />
          </div>
          <div className="field-row field-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rule.useRegex ?? false}
                onChange={(e) => onChange({ useRegex: e.target.checked })}
              />
              使用正则
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rule.caseSensitive ?? false}
                onChange={(e) => onChange({ caseSensitive: e.target.checked })}
              />
              区分大小写
            </label>
          </div>
        </>
      )}
    </div>
  )
}

function CaseRuleEditor({ rule, onChange }: SubEditorProps<CaseRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>转换模式:</label>
        <select
          value={rule.mode}
          onChange={(e) => onChange({ mode: e.target.value as CaseMode })}
        >
          {Object.entries(CASE_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function SequenceRuleEditor({ rule, onChange }: SubEditorProps<SequenceRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>格式:</label>
        <select
          value={rule.format}
          onChange={(e) => onChange({ format: e.target.value as SequenceFormat })}
        >
          {Object.entries(SEQUENCE_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <label>起始值:</label>
        <input
          type="number"
          min="1"
          value={rule.start}
          onChange={(e) => onChange({ start: parseInt(e.target.value) || 1 })}
        />
      </div>
      <div className="field-row">
        <label>步长:</label>
        <input
          type="number"
          min="1"
          value={rule.step}
          onChange={(e) => onChange({ step: parseInt(e.target.value) || 1 })}
        />
      </div>
      {rule.format === 'numeric' && (
        <div className="field-row">
          <label>补零位数:</label>
          <input
            type="number"
            min="0"
            max="10"
            value={rule.padding}
            onChange={(e) => onChange({ padding: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}
      <div className="field-row">
        <label>位置:</label>
        <select
          value={rule.position}
          onChange={(e) => onChange({ position: e.target.value as InsertPosition })}
        >
          {Object.entries(POSITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {rule.position === 'index' && (
        <div className="field-row">
          <label>索引位置:</label>
          <input
            type="number"
            min="0"
            value={rule.index ?? 0}
            onChange={(e) => onChange({ index: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}
      <div className="field-row">
        <label>分隔符:</label>
        <input
          type="text"
          value={rule.separator}
          onChange={(e) => onChange({ separator: e.target.value })}
        />
      </div>
    </div>
  )
}

function RegexRuleEditor({ rule, onChange }: SubEditorProps<RegexRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>匹配模式:</label>
        <input
          type="text"
          value={rule.pattern}
          onChange={(e) => onChange({ pattern: e.target.value })}
          placeholder="正则表达式 (如: (\w+)-(\d+))"
        />
      </div>
      <div className="field-row">
        <label>替换为:</label>
        <input
          type="text"
          value={rule.replacement}
          onChange={(e) => onChange({ replacement: e.target.value })}
          placeholder="替换文本 (如: $2_$1)"
        />
      </div>
      <div className="field-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rule.caseSensitive}
            onChange={(e) => onChange({ caseSensitive: e.target.checked })}
          />
          区分大小写
        </label>
      </div>
    </div>
  )
}

function ExifRuleEditor({ rule, onChange }: SubEditorProps<ExifRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>EXIF字段:</label>
        <select
          value={rule.field}
          onChange={(e) => onChange({ field: e.target.value })}
        >
          {EXIF_AVAILABLE_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      {(rule.field.includes('Date') || rule.field.includes('Time')) && (
        <div className="field-row">
          <label>日期格式:</label>
          <input
            type="text"
            value={rule.format ?? 'YYYYMMDD'}
            onChange={(e) => onChange({ format: e.target.value })}
            placeholder="YYYYMMDD / YYYY-MM-DD / YYYYMMDD_HHmmss"
          />
        </div>
      )}
      <div className="field-row">
        <label>位置:</label>
        <select
          value={rule.position}
          onChange={(e) => onChange({ position: e.target.value as InsertPosition })}
        >
          {Object.entries(POSITION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {rule.position === 'index' && (
        <div className="field-row">
          <label>索引位置:</label>
          <input
            type="number"
            min="0"
            value={rule.index ?? 0}
            onChange={(e) => onChange({ index: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}
      <div className="field-row">
        <label>分隔符:</label>
        <input
          type="text"
          value={rule.separator}
          onChange={(e) => onChange({ separator: e.target.value })}
        />
      </div>
    </div>
  )
}

function ExtensionRuleEditor({ rule, onChange }: SubEditorProps<ExtensionRule>) {
  return (
    <div className="rule-fields">
      <div className="field-row">
        <label>操作:</label>
        <select
          value={rule.action}
          onChange={(e) => onChange({ action: e.target.value as any })}
        >
          <option value="lower">转为小写</option>
          <option value="upper">转为大写</option>
          <option value="change">替换为</option>
          <option value="remove">移除扩展名</option>
        </select>
      </div>
      {rule.action === 'change' && (
        <div className="field-row">
          <label>新扩展名:</label>
          <input
            type="text"
            value={rule.newExtension ?? ''}
            onChange={(e) => onChange({ newExtension: e.target.value })}
            placeholder="jpg (无需点号)"
          />
        </div>
      )}
    </div>
  )
}
