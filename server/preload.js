const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    checkRsyncAgent: () => ipcRenderer.invoke('check-rsync'),
    checkServer: () => ipcRenderer.invoke('check-server'),
    getUncPaths: () => ipcRenderer.invoke('get-unc-paths'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (map) => ipcRenderer.invoke('set-config', map),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    getUserName: () => ipcRenderer.invoke('get-user-name'),
    getDebugMode: () => ipcRenderer.invoke('get-debug-mode'),
    getLastJobs: (job_id, number) => ipcRenderer.invoke('get-last-jobs', job_id, number),
    searchJobs: (current_job_id, owner, app, file, desc, statuses, date, from, to, number) => ipcRenderer.invoke('search-jobs', current_job_id, owner, app, file, desc, statuses, date, from, to, number),
    getTransferProgress: (owner, id) => ipcRenderer.invoke('get-transfer-progress', owner, id),
    listApps: () => ipcRenderer.invoke('list-apps'),
    listFlavors: () => ipcRenderer.invoke('list-flavors'),
    listStorage: () => ipcRenderer.invoke('list-storage'),
    getDiskUsage: () => ipcRenderer.invoke('get-disk-usage'),
    browseServer: (type, title, defaultPath, filter, properties) => ipcRenderer.invoke('browse', type, title, defaultPath, filter, properties),
    saveDialog: (title, currentPath, filter) => ipcRenderer.invoke('save-dialog', title, currentPath, filter),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    loadFile: (filePath) => ipcRenderer.invoke('load-file', filePath),
    countExistingFiles: (path, files) => ipcRenderer.invoke('count-existing-files', path, files),
    downloadFile: (owner, job_id, file_name, target) => ipcRenderer.invoke('download', owner, job_id, file_name, target),
    startJob: (owner, app, strategy, description, settings, rawfiles, fastafiles) => ipcRenderer.invoke('start-job', owner, app, strategy, description, settings, rawfiles, fastafiles),
    cancelJob: (owner, id) => ipcRenderer.invoke('cancel-job', owner, id),
    deleteJob: (owner, id) => ipcRenderer.invoke('delete-job', owner, id),
    openUrl: (url) => ipcRenderer.invoke('open-url', url),
    exitApp: () => ipcRenderer.invoke('close-app'),
    showFilePath: (file) => { return webUtils.getPathForFile(file); },
    restartApp: () => ipcRenderer.invoke('restart-app'),
})

window.addEventListener('DOMContentLoaded', () => {
})
