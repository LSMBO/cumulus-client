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

var CURRENT_JOB_ID = 0;
var USERNAME = "";
var IS_FOCUS = false;
const TOOLTIPTEXT = document.getElementById("tooltiptext");
const UNC_PATHS = new Map();
const LOADER = document.getElementById("loading");
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

class App {
    constructor(id, name, version, html, eventsFunction, getSettings, getSharedFiles, getLocalFiles) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.html = html;
        // call this function after adding the html to an object to create the events listeners
        this.eventsFunction = eventsFunction;
        // // call this function to put the user's values in a map and return it for validation
        this.getSettings = getSettings;
        this.getSharedFiles = this.getSharedFiles;
        this.getLocalFiles = this.getLocalFiles;
    }
    toString() {
        return `${this.name} ${this.version}`;
    }
}

function addZero(d) {
    return d < 10 ? `0${d}` : `${d}`;
}

function formatDate(timestamp) {
    // return the following format: YYYY/mm/dd hh:mm:ss (tz)
    const date = new Date(timestamp * 1000);
    var formattedDate = "";
    if(date.getTime() > 0) formattedDate = `${date.getFullYear()}/${addZero(date.getMonth() + 1)}/${addZero(date.getDate())} ${addZero(date.getHours())}:${addZero(date.getMinutes())}:${addZero(date.getSeconds())}`;
    // console.log(`Timestamp '${timestamp}' => '${formattedDate}'`);
    return formattedDate;
}

async function convertToUncPath(file) {
    if(UNC_PATHS.size == 0) {
        const paths = await window.electronAPI.getUncPaths();
        for(let [letter, path] of paths) {
            UNC_PATHS.set(letter, path);
        }
        // add a blank entry, just in case there is no mapping on the computer (then, no need to run this again)
        UNC_PATHS.set("", "");
    }
    const letter = file.replace(/^([a-zA-Z]:).*/, "$1");
    return UNC_PATHS.has(letter) ? file.replace(letter, UNC_PATHS.get(letter)) : file;
}

function tooltip(element, text) {
    element.addEventListener("mouseover", () => {
        TOOLTIPTEXT.textContent = text;
        TOOLTIPTEXT.style.display = "block";
        const rect = element.getBoundingClientRect();
        TOOLTIPTEXT.style.top = `${rect.top + window.scrollY + element.offsetHeight + 10}px`;
        TOOLTIPTEXT.style.left = `${rect.left + window.scrollX}px`;
        TOOLTIPTEXT.style.maxWidth = element.clientWidth + "px";
    });
    element.addEventListener("mouseout", () => {
        TOOLTIPTEXT.textContent = ""
        TOOLTIPTEXT.style.display = "none";
    });
}

async function browse(type, title, filter, properties, targetName) {
    const output = await window.electronAPI.browseServer(type, title, filter, properties);
    if(output != "") {
        const target = document.getElementById(targetName);
        if(target.tagName == "TEXTAREA") target.textContent = output.join("\n");
        else if(target.tagName == "UL") target.innerHTML = output.map(f => `<li class="w3-display-container">${f}<span class="w3-button w3-transparent w3-display-right">&times;</span></li>`).join("");
        else target.value = output.join(", ");
    }
}

function listBrowsedFiles(targetName) {
    // this function returns the list of files that where added by the browse() function above
    const files = [];
    const target = document.getElementById(targetName);
    for(let li of target.childNodes()) {
        files.push(convertToUncPath(li.textContent));
    }
    return files;
}

function toggleLoadingScreen() {
    if(LOADER.style.display != "block") {
      LOADER.style.display = "block";
    } else {
      LOADER.style.display = "none";
    }
}

function toHumanReadable(size) {
    var i = 0;
    while(size > 1024) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(2)} ${UNITS[i]}`
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

function setFocus(value) {
    IS_FOCUS = value;
}

function isFocus() {
    return IS_FOCUS;
}

function getUserName() {
    return USERNAME;
}

function setUserName(name) {
    USERNAME = name;
}

function getCurrentJobId() {
    return CURRENT_JOB_ID;
}

function setCurrentJobId(id) {
    // if value is zero, it's a new job
    // if value is above zero, it's an existing job
    // if value is below zero, it's a new job, cloned after an existing job
    CURRENT_JOB_ID = id;
}

export { App, browse, convertToUncPath, formatDate, getCurrentJobId, getUserName, isFocus, listBrowsedFiles, setCurrentJobId, setFocus, setUserName, sleep, toHumanReadable, toggleLoadingScreen, tooltip };
