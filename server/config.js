const { app } = require('electron');
const fs = require('fs');
const log = require('electron-log/main');
const path = require('path');
const semver = require('semver');
const { execSync } = require('child_process');

const CONFIG = new Map();
// original config file is read from the application folder, it contains the default settings
const CONFIG_FILE = path.join(__dirname, "../application.conf");
const LICENSE_FILE = path.join(__dirname, "../LICENSE.txt");
// user's config file is saved in the user data folder, this allows multiple users to execute the same client
const USER_CONFIG_FILE = path.join(app.getPath('userData'), "cumulus.conf");

var DEBUG_MODE = false; // when true, allows some code to be executed or some extra logs to be displayed
const UNC_PATHS = getUncPaths(); // map of drive letters to UNC paths
var MAX_AGE_IN_DAYS = 90; // default maximum age for data files

function loadConfigFile(file) {
  const regex = /^\s*([^=\s]+)\s*=\s*(.*)\s*$/;
  for(let line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    line = line.trim(); // remove space and tabs at the beginning and end of each line
    line = line.replace(/;$/, ""); // remove semicolon, because it's just too tempting to end lines with that character
    if(!line.startsWith("//") && !line.startsWith("#") && line.includes("=")) { // do not consider commented lines
      const matches = line.match(regex);
      if(matches !== null) CONFIG.set(matches[1], matches[2].replace(/^["']/, "").replace(/['"]$/, ""));
    }
  }
}

function loadConfig() {
  if(CONFIG.size == 0) {
    // get application config
    if(fs.existsSync(CONFIG_FILE)) loadConfigFile(CONFIG_FILE);
    else log.error(`Could not find ${CONFIG_FILE}`);
    // overwrite with user settings, if there are any
    if(fs.existsSync(USER_CONFIG_FILE)) loadConfigFile(USER_CONFIG_FILE);
    else log.error(`Could not find ${USER_CONFIG_FILE}`);
    // also add the licence
    if(fs.existsSync(LICENSE_FILE)) CONFIG.set("license", fs.readFileSync(LICENSE_FILE, 'utf-8'));
    else log.error(`Could not find ${LICENSE_FILE}`);
    // and the version number
    CONFIG.set("cumulus.version", app.getVersion());
  }
}

function saveConfig(_, config) {
  var content = "";
  for(let [key, value] of config) {
    CONFIG.set(key, value);
    // if(key != "license" && key != "cumulus.version") content += `${key} = ${value}\n`;
    // do not allow some extreme values (they can be changed during a session, but not kept forever)
    let store = true;
    if(key == "max.nb.jobs" && value == -1) store = false;
    if(key == "refresh.rate" && value <= 1) store = false;
    // also do not write the license in this file
    // if(key != "license" && key != "cumulus.version") store = false;
    if(key == "license" || key == "cumulus.version") store = false;
    // do not store the server config
    if(key == "output.folder" || key == "temp.folder" || key == "data.max.age.in.days" || key == "controller.version" || key == "client.min.version") store = false;
    if(store) content += `${key} = ${value}\n`;
  }
  try {
    fs.writeFileSync(USER_CONFIG_FILE, content);
  } catch(err) {
    console.error(err);
  }
}

function resetConfig(evt) {
  CONFIG.clear();
  if(fs.existsSync(CONFIG_FILE)) loadConfigFile(CONFIG_FILE);
  saveConfig(evt, CONFIG);
}

function getConfig() {
  loadConfig();
  // add data.max.age.in.days to the config if not present
  if(!CONFIG.has("data.max.age.in.days")) CONFIG.set("data.max.age.in.days", MAX_AGE_IN_DAYS);
  return CONFIG;
}

function get(key) {
  loadConfig();
  return CONFIG.has(key) ? CONFIG.get(key) : "";
}

function set(key, value) {
  loadConfig();
  // store data.max.age.in.days in a variable
  if(key == "data.max.age.in.days") MAX_AGE_IN_DAYS = parseInt(value);
  // store the value in the config map
  CONFIG.set(key, value);
}

function checkVersion() {
  // client
  if(!semver.gte(CONFIG.get("cumulus.version"), CONFIG.get("client.min.version"))) return `Client version '${CONFIG.get("cumulus.version")}' is too old, please update your client.`;
  // server (should only happen during development)
  else if(!semver.gte(CONFIG.get("controller.version"), CONFIG.get("cumulus.controller.min.version"))) return `Cumulus controller version '${CONFIG.get("controller.version")}' is too old, please contact the administrator.`;
  // rsync (should only happen during development)
  else if(!semver.gte(CONFIG.get("rsync.version"), CONFIG.get("rsync.min.version"))) return `RSync agent version '${CONFIG.get("rsync.version")}' is too old, please contact the administrator.`;
  // all good
  else return "";
}

/**
 * Retrieves a map of drive letters to their corresponding UNC paths for all mapped network drives.
 * Uses the `net use` command to list mapped drives and their UNC paths.
 * 
 * This function is called once at the start of the application to populate the UNC_PATHS map.
 * 
 * @returns {Map<string, string>} A map where the keys are drive letters (e.g., "Z:") and the values are UNC paths (e.g., "\\server\share").
 */
function getUncPaths() {
  const paths = new Map();
  if(process.platform === "win32") {
    for(let line of execSync(`net use`).toString().split(/\r?\n/)) {
      // only consider lines starting with OK
      if(line.startsWith("OK")) {
        // split the line into parts, the first part is "OK", the second part is the drive letter, the last part is the UNC path (which can contain spaces)
        const parts = line.split(/\s+/);
        if(parts.length >= 3) {
          const letter = parts[1].replace(":", ""); // remove the colon at the end
          const uncPath = parts[2].replaceAll("\\", "/"); // convert backslashes to slashes
          paths.set(letter, uncPath);
        }
      }
    }
  }
  return paths;
}

/**
 * Converts a Windows file path with a drive letter to its corresponding UNC path if applicable.
 *
 * If the platform is Windows and the drive letter exists in the UNC_PATHS map,
 * replaces the drive letter with its UNC path equivalent.
 *
 * @param {string} filePath - The file path to convert.
 * @returns {string} The converted UNC path if applicable, otherwise the original file path.
 */
function convertToUncPath(filePaths) {
  const convertedPaths = [];
  for(let filePath of filePaths) {
    const driveLetter = filePath.match(/^([a-zA-Z]):/);
    if(driveLetter && UNC_PATHS.has(driveLetter[1])) {
      convertedPaths.push(filePath.replace(driveLetter[1] + ":", UNC_PATHS.get(driveLetter[1])));
    } else convertedPaths.push(filePath);
  }
  return convertedPaths;
}

module.exports = { DEBUG_MODE, checkVersion, convertToUncPath, get, getConfig, resetConfig, saveConfig, set }
