/*
Copyright or © or Copr. Alexandre BUREL for LSMBO / IPHC UMR7178 / CNRS (2024)

[a.burel@unistra.fr]

This software is the client for Cumulus, a client-server to operate jobs on a Cloud.

This software is governed by the CeCILL license under French law and
abiding by the rules of distribution of free software.  You can  use, 
modify and/ or redistribute the software under the terms of the CeCILL
license as circulated by CEA, CNRS and INRIA at the following URL
"http://www.cecill.info". 

As a counterpart to the access to the source code and  rights to copy,
modify and redistribute granted by the license, users are provided only
with a limited warranty  and the software's author,  the holder of the
economic rights,  and the successive licensors  have only  limited
liability. 

In this respect, the user's attention is drawn to the risks associated
with loading,  using,  modifying and/or developing or reproducing the
software by the user in light of its specific status of free software,
that may mean  that it is complicated to manipulate,  and  that  also
therefore means  that it is reserved for developers  and  experienced
professionals having in-depth computer knowledge. Users are therefore
encouraged to load and test the software's suitability as regards their
requirements in conditions enabling the security of their systems and/or 
data to be ensured and,  more generally, to use and operate it in the 
same conditions as regards security. 

The fact that you are presently reading this means that you have had
knowledge of the CeCILL license and that you accept its terms.
*/

// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path')
const config = require('./config.js');
const rest = require('./rest.js');
const srv = require('./server.js');

var mainWindow = null;
const DEBUG_MODE = true;

function getUncPaths() {
  const paths = new Map();
  for(let line of execSync(`net use`).toString().split(/\r?\n/)) {
    const items = line.split(/\s+/);
    if(items.length > 4 && items[0] == "OK") {
      const letter = items[1];
      const uncPath = execSync(`net use ${letter}`).toString().split(/\r?\n/)[1].replace(/[^\\\/]+[\s\t]+/, "");
      paths.set(letter, uncPath);
    }
  }
  return paths;
}

function getUserName() {
  return process.env.USERNAME;
}

function getDebugMode() {
  return DEBUG_MODE;
}

async function browse(_, type, title, currentPath, filter, properties) {
  // console.log(`Type: '${type}' ; title: '${title}' ; path: '${currentPath}' ; filter: '${filter}' ; properties: '${properties}'`);
  var defaultPath = "";
  if(currentPath != "") defaultPath = path.dirname(currentPath);
  else if(type == "FASTA") defaultPath = config.get("fasta.path");
  else if(type == "RAW") defaultPath = config.get("raw.file.path");
  // console.log(`Browse here: "${defaultPath}"`);
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { title: title, defaultPath: defaultPath, filters: filter, properties: properties });
  return canceled ? "" : filePaths;
}

function countExistingFiles(_, currentPath, files) {
  var nbExistingFiles = 0;
  for(let file of files) {
    // console.log(`Testing file ${currentPath}/${file}}`);
    if(fs.existsSync(currentPath + "/" + file)) nbExistingFiles++;
  }
  // console.log(`${nbExistingFiles} files are already there`);
  return nbExistingFiles;
}

function createWindow () {
  // Create the browser window.
  // const mainWindow = new BrowserWindow({
  mainWindow = new BrowserWindow({
    width: DEBUG_MODE ? 1800 : 1280,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'img/favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // uncomment the next line to open the app in full screen mode
  // mainWindow.maximize();

  // Open the DevTools.
  if(DEBUG_MODE) mainWindow.webContents.openDevTools()
}

function exitApp() {
  if (process.platform !== 'darwin') app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('check-rsync', srv.checkRsyncAgent);
  ipcMain.handle('check-server', srv.checkServer);
  ipcMain.handle('get-unc-paths', getUncPaths);
  ipcMain.handle('get-config', config.getConfig);
  ipcMain.handle('set-config', config.saveConfig);
  ipcMain.handle('reset-config', config.resetConfig);
  ipcMain.handle('get-user-name', getUserName);
  ipcMain.handle('get-debug-mode', getDebugMode);
  ipcMain.handle('get-last-jobs', srv.getLastJobs);
  ipcMain.handle('search-jobs', srv.searchJobs);
  ipcMain.handle('get-job-details', srv.jobDetails);
  ipcMain.handle('get-job-status', srv.jobStatus);
  ipcMain.handle('get-transfer-progress', srv.transferProgress);
  ipcMain.handle('get-file-list', srv.listJobFiles);
  // ipcMain.handle('check-version', srv.checkVersion);
  ipcMain.handle('list-storage', srv.listStorage);
  ipcMain.handle('list-hosts', srv.listHosts);
  ipcMain.handle('browse', browse);
  ipcMain.handle('count-existing-files', countExistingFiles);
  ipcMain.handle('download', srv.downloadFile);
  ipcMain.handle('start-job', srv.createJob);
  ipcMain.handle('cancel-job', srv.cancelJob);
  ipcMain.handle('delete-job', srv.deleteJob);
  ipcMain.handle('close-app', exitApp);

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
