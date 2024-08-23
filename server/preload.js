const { contextBridge, ipcRenderer } = require('electron')

// TODO check if all functions are still used
contextBridge.exposeInMainWorld('electronAPI', {
    checkServer: () => ipcRenderer.invoke('check-server'),
    getUncPaths: () => ipcRenderer.invoke('get-unc-paths'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (map) => ipcRenderer.invoke('set-config', map),
    resetConfig: () => ipcRenderer.invoke('reset-config'),
    getUserName: () => ipcRenderer.invoke('get-user-name'),
    getDebugMode: () => ipcRenderer.invoke('get-debug-mode'),
    // getLastJobs: (number) => ipcRenderer.invoke('get-last-jobs', number),
    getLastJobs: (job_id, number) => ipcRenderer.invoke('get-last-jobs', job_id, number),
    searchJobs: (current_job_id, owner, app, file, desc, statuses, date, from, to, number) => ipcRenderer.invoke('search-jobs', current_job_id, owner, app, file, desc, statuses, date, from, to, number),
    getJobDetails: (id) => ipcRenderer.invoke('get-job-details', id),
    getJobStatus: (id) => ipcRenderer.invoke('get-job-status', id),
    getTransferProgress: (owner, id) => ipcRenderer.invoke('get-transfer-progress', owner, id),
    getFileList: (owner, id) => ipcRenderer.invoke('get-file-list', owner, id),
    listHosts: () => ipcRenderer.invoke('list-hosts'),
    listStorage: () => ipcRenderer.invoke('list-storage'),
    // checkVersion: () => ipcRenderer.invoke('check-version'),
    browseServer: (type, title, defaultPath, filter, properties) => ipcRenderer.invoke('browse', type, title, defaultPath, filter, properties),
    countExistingFiles: (path, files) => ipcRenderer.invoke('count-existing-files', path, files),
    downloadFile: (owner, job_id, file_name, target) => ipcRenderer.invoke('download', owner, job_id, file_name, target),
    startJob: (owner, app, strategy, description, settings, rawfiles, fastafiles) => ipcRenderer.invoke('start-job', owner, app, strategy, description, settings, rawfiles, fastafiles),
    cancelJob: (owner, id) => ipcRenderer.invoke('cancel-job', owner, id),
    deleteJob: (owner, id) => ipcRenderer.invoke('delete-job', owner, id),
    exitApp: () => ipcRenderer.invoke('close-app'),
})

window.addEventListener('DOMContentLoaded', () => {
})
