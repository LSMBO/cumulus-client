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
var IS_ACTIVE = true; // used for sleep mode, it can be inactive even if app has focus
var IS_FOCUS = true;
var LAST_ACTIVITY = new Date();
const TOOLTIPTEXT = document.getElementById("tooltiptext");
const UNC_PATHS = new Map();
const LOADER = document.getElementById("loading");
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

class App {
    // constructor(id, name, version, html, eventsFunction, getSettings, getSharedFiles, getLocalFiles) {
    constructor(id, name, version, html, eventsFunction, getSharedFiles, getLocalFiles, checkSettings, setSettings) {
        this.id = id;
        this.name = name;
        this.version = version;
        this.html = html;
        // call this function after adding the html to an object to create the events listeners
        this.eventsFunction = eventsFunction;
        // // call this function to put the user's values in a map and return it for validation
        // this.getSettings = getSettings;
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
    return `<li><span class="color-primary-hover">×</span><label>${items.join("/")}/</label>${name}<div style="width:0%"></div></li>`;
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
    if(value) LAST_ACTIVITY = new Date();
    // console.log(`Last activity was at: ${LAST_ACTIVITY}`);
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
    setActive(IS_FOCUS);
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
    // const items = [];
    // for(let lbl of target.getElementsByTagName("div")[0].getElementsByTagName("label")) {
    //     items.push(lbl.textContent);
    // }
    // return items;
    const items = {};
    for(let label of target.getElementsByTagName("div")[1].getElementsByTagName("label")) {
        if(label.children[0].checked) items[label.children[0].name] = label.textContent;
    }
    return items;
}

function checkboxListEventListener(target) {
    console.log(target);
    if(target.classList.contains("w3-input") && target.parentElement != null && target.parentElement.classList.contains("selector")) {
        // this is the txt with the results as labels in it
        toggleClass(target.parentElement.getElementsByTagName("div")[1], "w3-hide");
    } else if(target.tagName == "LABEL" && target.parentElement != null && target.parentElement.classList.contains("w3-input") && target.parentElement.parentElement != null && target.parentElement.parentElement.classList.contains("selector")) {
        // this is one result in the txt
        toggleClass(target.parentElement.parentElement.getElementsByTagName("div")[1], "w3-hide");
    } {
        // hide the list of results when clicking anywhere else, except if it's on the list itself
        for(let div of document.getElementsByClassName("selector")) {
            if(!div.contains(target)) {
                div.getElementsByClassName("selector-items")[0].classList.add("w3-hide");
            }
        }
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
    html += "</div></div>";
    parent.innerHTML = html;
    // document.addEventListener("click", (event) => checkboxListEventListener(event.target));
    parent.getElementsByTagName("div")[1].addEventListener("click", (_) => updateCheckboxList(parent));
    tooltip(parent.getElementsByTagName("label")[0], tooltiptext);
}

export { addBrowsedFiles, addCheckboxList, App, browse, checkboxListEventListener, convertToUncPath, fixFilePath, formatDate, getBrowsedFiles, getCheckboxListSelection, getCurrentJobId, getLastActivity, getUserName, isActive, isFocus, listBrowsedFiles, selectCheckboxListItem, setActive, setCurrentJobId, setDefaultCheckboxList, setFocus, setUserName, sleep, toHumanReadable, toggleLoadingScreen, tooltip, updateCheckboxList };
