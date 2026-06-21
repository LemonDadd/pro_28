import React from 'react'
import { useApp } from '../store/AppContext'
import { joinFilename } from '../utils/rules'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function FileList() {
  const { files, removeFile, clearFiles, toggleSelectFile, selectAll, selectNone, selectChanged } = useApp()

  if (files.length === 0) {
    return null
  }

  const selectedCount = files.filter((f) => f.selected).length
  const allSelected = selectedCount === files.length

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3>文件列表 ({files.length})</h3>
        <div className="file-list-actions">
          <span className="selected-count">已选: {selectedCount}</span>
          <button className="btn btn-ghost btn-sm" onClick={selectAll} disabled={allSelected}>
            全选
          </button>
          <button className="btn btn-ghost btn-sm" onClick={selectNone} disabled={selectedCount === 0}>
            全不选
          </button>
          <button className="btn btn-ghost btn-sm" onClick={selectChanged}>
            选有变更
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearFiles}>
            清空全部
          </button>
        </div>
      </div>
      <div className="file-list">
        <div className="file-list-table-header">
          <div className="col-checkbox">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => e.target.checked ? selectAll() : selectNone()}
            />
          </div>
          <div className="col-name">原文件名</div>
          <div className="col-preview">新文件名</div>
          <div className="col-size">大小</div>
          <div className="col-actions"></div>
        </div>
        <div className="file-list-body">
          {files.map((file) => {
            const originalFull = joinFilename(file.originalName, file.originalExtension)
            const previewFull = joinFilename(file.previewName, file.previewExtension)
            const isChanged = originalFull !== previewFull

            return (
              <div
                key={file.id}
                className={`file-list-row ${file.hasConflict ? 'conflict' : ''} ${file.renameError ? 'error' : ''} ${file.selected ? 'selected' : ''}`}
              >
                <div className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={file.selected}
                    onChange={() => toggleSelectFile(file.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="col-name file-original">
                  <span className="file-icon">
                    {file.isDirectory ? '📁' : '📄'}
                  </span>
                  <span className="file-name-text">{originalFull}</span>
                </div>
                <div className={`col-preview file-preview ${isChanged ? 'changed' : ''}`}>
                  {file.hasConflict ? (
                    <span className="conflict-badge" title={file.conflictReason}>
                      ⚠️ {previewFull}
                    </span>
                  ) : file.renameError ? (
                    <span className="error-badge" title={file.renameError}>
                      ❌ {previewFull}
                    </span>
                  ) : (
                    previewFull
                  )}
                  {file.exifLoading && <span className="loading-badge">读取EXIF...</span>}
                  {file.renameError && (
                    <span className="error-detail" title={file.renameError}>
                      失败: {file.renameError}
                    </span>
                  )}
                </div>
                <div className="col-size">{formatFileSize(file.size)}</div>
                <div className="col-actions">
                  <button
                    className="btn-icon"
                    onClick={() => removeFile(file.id)}
                    title="移除"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
