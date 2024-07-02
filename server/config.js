const { app } = require('electron')
const fs = require('fs');
const path = require('path')

const CONFIG = new Map();
const CONFIG_FILE = "application.conf";
const LICENSE_FILE = "LICENSE.txt";
const USER_CONFIG_FILE = path.join(app.getPath('userData'), "cumulus.conf");

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
      // overwrite with user settings, if there are any
      if(fs.existsSync(USER_CONFIG_FILE)) loadConfigFile(USER_CONFIG_FILE);
      // also add the licence
      if(fs.existsSync(LICENSE_FILE)) CONFIG.set("license", fs.readFileSync(LICENSE_FILE, 'utf-8'));
      // and the version number
      CONFIG.set("cumulus.version", app.getVersion());
    }
    // console.log(CONFIG);
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
    return CONFIG;
  }
  
  function get(key) {
    loadConfig();
    return CONFIG.has(key) ? CONFIG.get(key) : "";
  }

  module.exports = { get, getConfig, saveConfig, resetConfig }
