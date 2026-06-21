import React, { useState } from 'react'
import { useApp } from '../store/AppContext'

export function PresetsPanel() {
  const { presets, rules, savePreset, loadPreset, deletePreset, selectedPresetId } = useApp()
  const [newPresetName, setNewPresetName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    if (!newPresetName.trim()) return
    if (rules.length === 0) {
      alert('请先添加至少一条规则')
      return
    }
    savePreset(newPresetName.trim())
    setNewPresetName('')
    setIsSaving(false)
  }

  return (
    <div className="presets-panel">
      <div className="panel-header">
        <h3>预设 (Presets)</h3>
      </div>

      {isSaving ? (
        <div className="preset-save-form">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="预设名称"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setIsSaving(false)
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsSaving(false)}>
            取消
          </button>
        </div>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => setIsSaving(true)}>
          💾 保存当前规则为预设
        </button>
      )}

      <div className="presets-list">
        {presets.length === 0 ? (
          <div className="presets-empty">
            <p>暂无预设</p>
            <p className="presets-empty-hint">保存常用的规则组合以便快速复用</p>
          </div>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className={`preset-item ${selectedPresetId === preset.id ? 'selected' : ''}`}
            >
              <div className="preset-info" onClick={() => loadPreset(preset.id)}>
                <div className="preset-name">{preset.name}</div>
                <div className="preset-meta">
                  {preset.rules.length} 条规则 ·{' '}
                  {new Date(preset.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className="btn-icon btn-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`确定删除预设 "${preset.name}" 吗？`)) {
                    deletePreset(preset.id)
                  }
                }}
                title="删除预设"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
