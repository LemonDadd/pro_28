import React from 'react'
import { useApp } from '../store/AppContext'

export function ActionBar() {
  const { files, rules, executeRename, undoLastRename, history, isProcessing } = useApp()

  const hasConflicts = files.some((f) => f.hasConflict)
  const hasChanges = files.some(
    (f) => f.previewName !== f.originalName || f.previewExtension !== f.originalExtension
  )
  const canExecute = files.length > 0 && rules.length > 0 && hasChanges && !hasConflicts && !isProcessing
  const canUndo = history.length > 0 && !isProcessing

  const changedCount = files.filter(
    (f) =>
      !f.hasConflict &&
      (f.previewName !== f.originalName || f.previewExtension !== f.originalExtension)
  ).length

  return (
    <div className="action-bar">
      <div className="action-stats">
        <span className="stat-item">
          <strong>{files.length}</strong> 个文件
        </span>
        {rules.length > 0 && (
          <span className="stat-item">
            <strong>{rules.filter((r) => r.enabled).length}</strong> 条启用规则
          </span>
        )}
        {hasChanges && (
          <span className={`stat-item ${hasConflicts ? 'conflict' : 'success'}`}>
            <strong>{changedCount}</strong> 个将重命名
            {hasConflicts && <span className="conflict-note"> (存在冲突)</span>}
          </span>
        )}
      </div>
      <div className="action-buttons">
        <button
          className="btn btn-secondary"
          onClick={undoLastRename}
          disabled={!canUndo}
          title={history.length > 0 ? `撤销 ${history[0].operations.length} 个重命名操作` : '无可撤销操作'}
        >
          ↩️ 撤销
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={executeRename}
          disabled={!canExecute}
          title={
            !canExecute
              ? hasConflicts
                ? '请先解决命名冲突'
                : files.length === 0
                ? '请先添加文件'
                : rules.length === 0
                ? '请先添加规则'
                : !hasChanges
                ? '没有需要重命名的文件'
                : ''
              : '执行重命名'
          }
        >
          {isProcessing ? '处理中...' : '✨ 执行重命名'}
        </button>
      </div>
    </div>
  )
}
