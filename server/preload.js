const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getUncPaths: () => ipcRenderer.invoke('get-unc-paths'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (map) => ipcRenderer.invoke('set-config', map),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    getUserName: () => ipcRenderer.invoke('get-user-name'),
    getJobList: (host, user, app, tag, number) => ipcRenderer.invoke('get-job-list', host, user, app, tag, number),
    getJobDetails: (id) => ipcRenderer.invoke('get-job-details', id),
    getJobStatus: (id) => ipcRenderer.invoke('get-job-status', id),
    getFileList: (owner, id) => ipcRenderer.invoke('get-file-list', owner, id),
    listHosts: () => ipcRenderer.invoke('list-hosts'),
    listStorage: () => ipcRenderer.invoke('list-storage'),
    checkVersion: () => ipcRenderer.invoke('check-version'),
    browseServer: (type, title, filter, properties) => ipcRenderer.invoke('browse', type, title, filter, properties),
    countExistingFiles: (path, files) => ipcRenderer.invoke('count-existing-files', path, files),
    downloadFile: (owner, job_id, file_name, target) => ipcRenderer.invoke('download', owner, job_id, file_name, target),
    startJob: (owner, app, strategy, description, settings, rawfiles, fastafiles) => ipcRenderer.invoke('start-job', owner, app, strategy, description, settings, rawfiles, fastafiles),
    cancelJob: (owner, id) => ipcRenderer.invoke('cancel-job', owner, id),
    deleteJob: (owner, id) => ipcRenderer.invoke('delete-job', owner, id),
    exitApp: () => ipcRenderer.invoke('close-app'),
})

window.addEventListener('DOMContentLoaded', () => {
})
