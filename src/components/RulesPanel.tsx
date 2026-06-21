import React from 'react'
import { useApp } from '../store/AppContext'
import { RuleEditor } from './RuleEditor'
import {
  createReplaceRule,
  createInsertRule,
  createDeleteRule,
  createCaseRule,
  createSequenceRule,
  createRegexRule,
  createExifRule,
  createExtensionRule
} from '../utils/rules'
import { RenameRule, RuleType } from '../types'

const RULE_CREATORS: Record<RuleType, () => RenameRule> = {
  replace: createReplaceRule,
  insert: createInsertRule,
  delete: createDeleteRule,
  case: createCaseRule,
  sequence: createSequenceRule,
  regex: createRegexRule,
  exif: createExifRule,
  extension: createExtensionRule
}

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  replace: '替换文本',
  insert: '插入文本',
  delete: '删除文本',
  case: '大小写',
  sequence: '序号',
  regex: '正则表达式',
  exif: 'EXIF信息',
  extension: '扩展名'
}

const RULE_TYPE_ICONS: Record<RuleType, string> = {
  replace: '🔄',
  insert: '➕',
  delete: '✂️',
  case: '🔡',
  sequence: '🔢',
  regex: '.*',
  exif: '📷',
  extension: '📎'
}

export function RulesPanel() {
  const { rules, addRule, clearRules } = useApp()

  return (
    <div className="rules-panel">
      <div className="panel-header">
        <h3>重命名规则链</h3>
        <div className="panel-actions">
          {rules.length > 0 && (
            <button className="btn btn-ghost" onClick={clearRules}>
              清空规则
            </button>
          )}
        </div>
      </div>

      <div className="rule-add-bar">
        <span className="rule-add-label">添加规则:</span>
        <div className="rule-add-buttons">
          {(Object.keys(RULE_CREATORS) as RuleType[]).map((type) => (
            <button
              key={type}
              className="btn-rule-add"
              onClick={() => addRule(RULE_CREATORS[type]())}
              title={RULE_TYPE_LABELS[type]}
            >
              <span className="rule-icon">{RULE_TYPE_ICONS[type]}</span>
              <span className="rule-text">{RULE_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rules-list">
        {rules.length === 0 ? (
          <div className="rules-empty">
            <p>暂无规则</p>
            <p className="rules-empty-hint">点击上方按钮添加重命名规则，规则按顺序执行</p>
          </div>
        ) : (
          rules.map((rule, index) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              index={index}
              totalCount={rules.length}
            />
          ))
        )}
      </div>
    </div>
  )
}
