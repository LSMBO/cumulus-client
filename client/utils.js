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

import * as dialog from "./dialog.js";

var CURRENT_JOB_ID = 0;
var USERNAME = "";
var IS_ACTIVE = true; // used for sleep mode, it can be inactive even if app has focus
var IS_OFFLINE = false;
var IS_FOCUS = true;
var LAST_ACTIVITY = new Date();
var NB_SKIPS_BEFORE_REFRESH = 0;
const TIME_BEFORE_SLEEP_IN_SECONDS = 300;
const TOOLTIPTEXT = document.getElementById("tooltiptext");
const UNC_PATHS = new Map();
const LOADER = document.getElementById("loading");
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

class App {
    // constructor(id, name, version, html, eventsFunction, getSharedFiles, getLocalFiles, checkSettings, setSettings) {
    constructor(id, name, version, initialize, getSharedFiles, getLocalFiles, checkSettings, setSettings) {
        this.id = id;
        this.name = name;
        this.version = version;
        // this.html = html;
        // call this function after adding the html to an object to create the events listeners
        // this.eventsFunction = eventsFunction;
        this.initialize = initialize;
        // // call this function to put the user's values in a map and return it for validation
        this.getSharedFiles = getSharedFiles;
        this.getLocalFiles = getLocalFiles;
        this.checkSettings = checkSettings;
        this.setSettings = setSettings;
    }
    toString() {
        return `${this.name} ${this.version}`;
    }
}

function toggleClass(element, className) {
    // console.log(element);
    if(element.classList.contains(className)) {
        element.classList.remove(className);
    } else {
        element.classList.add(className);
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
        TOOLTIPTEXT.style.maxWidth = element.clientWidth > 100 ? element.clientWidth + "px" : "";
        if(rect.left + window.scrollX + TOOLTIPTEXT.clientWidth >= window.outerWidth - 20) {
            // the tooltip will reach the right border, make it stick to the right border
            TOOLTIPTEXT.style.left = `${window.outerWidth - TOOLTIPTEXT.clientWidth - 35}px`;
            TOOLTIPTEXT.style.maxWidth = "";
        }
        });
    element.addEventListener("mouseout", () => {
        TOOLTIPTEXT.textContent = ""
        TOOLTIPTEXT.style.display = "none";
    });
}

// function getPathAndFileName(fullPath) {
//     const separator = fullPath.includes("/") ? "/" : "\\";
//     const items = fullPath.split(separator);
//     const name = items.pop();
//     return [items.join("/"), name];
// }

function fixFilePath(file) {
    // return JSON.stringify(file).replaceAll("\\\\", "/");
    // use JSON.stringify to force the file path separator to be "\\"
    // then replace the Windows separator with the standard separator "/"
    const fixedPath = JSON.stringify(file).replaceAll("\\\\", "/");
    // removes the quotes that were added by JSON.stringify
    return fixedPath.substring(1, fixedPath.length - 1);
}

function addBrowsedFile(filePath) {
    const items = filePath.split(filePath.includes("/") ? "/" : "\\");
    const name = items.pop();
    // return `<li><span class="color-primary-hover">&times;</span><label>${items.join("/")}/</label>${name}`;
    // return `<li><span class="color-primary-hover">×</span><label>${items.join("/")}/</label>${name}`;
    // return `<li><span class="color-primary-hover">×</span><label>${items.join("/")}/</label>${name}<div style="width:0%"></div></li>`;
    return `<li><span class="color-primary-hover">×</span><label>${items.join("/")}/</label>${name}</li>`;
}

function addBrowsedFiles(target, files) {
    target.classList.add("raw-file");
    target.innerHTML += files.map(addBrowsedFile).join("");
}

function getBrowsedFiles(target) {
    // this function should return what has been generated in the browse function
    if(target.tagName == "INPUT" && target.type == "text") return [fixFilePath(target.value)];
    else if(target.tagName == "TEXTAREA") return target.value.split("\n").map(fixFilePath);
    else if(target.tagName == "UL") return Array.from(target.childNodes).map(li => fixFilePath(li.textContent.replace("×", "")));
    else return [];
}

async function browse(type, title, filter, properties, targetName) {
    // set default path to the current path, if any
    const target = document.getElementById(targetName);
    const currentFiles = getBrowsedFiles(target);
    const defaultPath = currentFiles.length > 0 ? currentFiles[0] : "";
    // browse the server
    const output = await window.electronAPI.browseServer(type, title, defaultPath, filter, properties);
    if(output != "") {
        if(target.tagName == "INPUT" && target.type == "text") target.value = output[0];
        else if(target.tagName == "TEXTAREA") target.textContent = output.join("\n");
        else if(target.tagName == "UL") {
            addBrowsedFiles(target, output);
        }
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

function setActive(value) {
    IS_ACTIVE = value;
    // store the time of the last time the app was set active
    if(IS_ACTIVE) {
        LAST_ACTIVITY = new Date();
        updateSkipsBetweenRefreshs(true);
    }
    // console.log(`Last activity was at: ${LAST_ACTIVITY}`);
}

function setOffline(value) {
    IS_OFFLINE = value;
}

function isActive() {
    return IS_ACTIVE;
}

function getLastActivity() {
    return LAST_ACTIVITY;
}

function setFocus(value) {
    IS_FOCUS = value;
    // if the app gets focus, it's active again
    // if the app looses focus, it's not active
    // setActive(IS_FOCUS);
}

function isFocus() {
    return IS_FOCUS;
}

function updateSkipsBetweenRefreshs(reset = false) {
    if(reset) {
        NB_SKIPS_BEFORE_REFRESH = 0;
    } else if(NB_SKIPS_BEFORE_REFRESH <= 0) {
        // update every minute if asleep
        if(!isActive() ||IS_OFFLINE) NB_SKIPS_BEFORE_REFRESH = 11;
        // update every 15 seconds if just blur
        else if(!isFocus()) NB_SKIPS_BEFORE_REFRESH = 2;
        // update every 5 seconds otherwise
        else NB_SKIPS_BEFORE_REFRESH = 0;
    } else NB_SKIPS_BEFORE_REFRESH -= 1;
    // console.log(`Number of skips before refreshing jobs: ${NB_SKIPS_BEFORE_REFRESH}`);
}

function checkSleepMode() {
    const timeSinceLastActivity = Math.floor((new Date() - getLastActivity()) / 1000);
    // console.log(`Seconds since last activity: ${timeSinceLastActivity} (isActive=${isActive()})`);
    // sleep mode is on if the time since last activity exceeds the threshold
    if(isActive() && timeSinceLastActivity > TIME_BEFORE_SLEEP_IN_SECONDS) {
        // console.log("App appears to be inactive");
        // set the app as inactive
        setActive(false);
        // dialog.openDialogInfo("Sleeping mode", "Cumulus will be refreshed less often, but do not worry your jobs are still running!");
        dialog.openDialogSleep();
    }
    // update the counter at every step
    updateSkipsBetweenRefreshs();
}

function doRefresh() {
    return NB_SKIPS_BEFORE_REFRESH <= 0;
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

function updateCheckboxList(target) {
    const text = target.getElementsByTagName("div")[0];
    const div = target.getElementsByTagName("div")[1];
    text.innerHTML = "";
    for(let label of div.getElementsByTagName("label")) {
        if(label.children[0].checked) text.innerHTML += `<label>${label.textContent}</label>`;
    }
}

function setDefaultCheckboxList(target) {
    for(let input of target.getElementsByTagName("div")[1].getElementsByTagName("input")) {
        input.checked = true;
    }
    updateCheckboxList(target);
}

function selectCheckboxListItem(target, name, value) {
    for(let label of target.getElementsByTagName("div")[1].getElementsByTagName("label")) {
        if(label.children[0].name == name) label.children[0].checked = value;
    }
}

function getCheckboxListSelection(target) {
    const items = {};
    for(let label of target.getElementsByTagName("div")[1].getElementsByTagName("label")) {
        if(label.children[0].checked) items[label.children[0].name] = label.textContent;
    }
    return items;
}

function checkboxListEventListener(target) {
    // console.log(target);
    if(target.classList.contains("w3-input") && target.parentElement.classList.contains("selector")) {
        // user has clicked on the visible div where labels are displayed, show the div with the checkboxes
        toggleClass(target.parentElement.getElementsByTagName("div")[1], "w3-hide");
        toggleClass(target.parentElement.getElementsByTagName("div")[2], "w3-hide");
    } else if(target.tagName == "LABEL" && target.parentElement.parentElement.classList.contains("selector")) {
        // user has clicked on a label in the visible div, show the div with the checkboxes
        toggleClass(target.parentElement.parentElement.getElementsByTagName("div")[1], "w3-hide");
        toggleClass(target.parentElement.parentElement.getElementsByTagName("div")[2], "w3-hide");
    } else if(target.tagName == "INPUT" && target.type == "checkbox") {
        // user has selected/unselected a checkbox, update the visible div
        updateCheckboxList(target.parentElement.parentElement.parentElement);
    } else if(target.classList.contains("selector-outside")) {
        // user has clicked outside of the div with the checkboxes, hide the list of results
        toggleClass(target.previousElementSibling, "w3-hide");
        toggleClass(target, "w3-hide");
    }
}

function addCheckboxList(parent, label, items, tooltiptext) {
    parent.classList.add("w3-row", "w3-section", "selector");
    var html = `<label for="txt_${parent.id}" class="w3-col">${label}</label>
    <div id="txt_${parent.id}" class="w3-input w3-border w3-rest"></div>
    <div id="div_${parent.id}" class="w3-hide selector-items">`
    // items should be like this: {"key1": "value1", ..., "keyN": "valueN"}
    for(let key in items) {
        html += `<label><input type="checkbox" name="${key}" checked />${items[key]}</label>`;
    }
    html += "</div><div class='selector-outside w3-hide'></div></div>";
    parent.innerHTML = html;
    parent.addEventListener("click", (e) => checkboxListEventListener(e.target));
    tooltip(parent.getElementsByTagName("label")[0], tooltiptext);
}

export { addBrowsedFiles, addCheckboxList, App, browse, checkSleepMode, convertToUncPath, doRefresh, fixFilePath, formatDate, getBrowsedFiles, getCheckboxListSelection, getCurrentJobId, getLastActivity, getUserName, isActive, isFocus, listBrowsedFiles, selectCheckboxListItem, setActive, setCurrentJobId, setDefaultCheckboxList, setFocus, setOffline, setUserName, sleep, toHumanReadable, toggleClass, toggleLoadingScreen, tooltip, updateCheckboxList };
