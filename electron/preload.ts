import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath)
})
