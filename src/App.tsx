import React from 'react'
import { AppProvider } from './store/AppContext'
import { FileDropZone } from './components/FileDropZone'
import { FileList } from './components/FileList'
import { RulesPanel } from './components/RulesPanel'
import { PresetsPanel } from './components/PresetsPanel'
import { ActionBar } from './components/ActionBar'
import './styles/index.css'

function AppContent() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 批量重命名工具</h1>
        <p className="app-subtitle">
          拖入文件 · 配置规则链 · 实时预览 · 一键重命名
        </p>
      </header>

      <main className="app-main">
        <div className="app-main-left">
          <FileDropZone />
          <FileList />
        </div>
        <div className="app-main-right">
          <RulesPanel />
          <PresetsPanel />
        </div>
      </main>

      <ActionBar />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
