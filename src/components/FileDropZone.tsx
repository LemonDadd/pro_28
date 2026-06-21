import React, { useState, useRef } from 'react'
import { useApp } from '../store/AppContext'

export function FileDropZone() {
  const { addFiles, addFile } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const paths: string[] = []

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        const path = (file as any).path
        if (path) {
          paths.push(path)
        }
      }
    }

    if (paths.length > 0) {
      await addFiles(paths)
    }
  }

  const handleClick = () => {
    if (window.api) {
      window.api.openFiles().then((paths) => {
        if (paths && paths.length > 0) {
          addFiles(paths)
        }
      })
    } else if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = (file as any).path
        if (path) {
          await addFile(path)
        }
      }
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      <div className="drop-zone-content">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="drop-zone-title">拖入文件或文件夹到此处</p>
        <p className="drop-zone-subtitle">或点击选择文件</p>
      </div>
    </div>
  )
}
