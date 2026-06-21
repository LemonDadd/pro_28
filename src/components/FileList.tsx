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
  const { files, removeFile, clearFiles } = useApp()

  if (files.length === 0) {
    return null
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3>文件列表 ({files.length})</h3>
        <button className="btn btn-ghost" onClick={clearFiles}>
          清空全部
        </button>
      </div>
      <div className="file-list">
        <div className="file-list-table-header">
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
                className={`file-list-row ${file.hasConflict ? 'conflict' : ''} ${file.renameError ? 'error' : ''}`}
              >
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
