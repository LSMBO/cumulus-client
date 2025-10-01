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
import * as settings from "./settings.js";
import { updateFileList } from "./app_elements/filelist.js";

var PREVIOUS_JOB_ID = 0;
var CURRENT_JOB_ID = 0;
var USERNAME = "";
var IS_ACTIVE = true; // used for sleep mode, it can be inactive even if app has focus
var IS_OFFLINE = false;
var IS_FOCUS = true;
var LAST_ACTIVITY = new Date();
var NB_SKIPS_BEFORE_REFRESH = 0;
const TIME_BETWEEN_REFRESHS_DURING_SLEEP_IN_SECONDS = 600; // 10 minutes
const TIME_BEFORE_SLEEP_IN_SECONDS = 300; // 5 minutes
const TOOLTIPTEXT = document.getElementById("tooltiptext");
const LOADER = document.getElementById("loading");
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

function toggleClass(element, className) {
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

function fixFilePath(file) {
    // use JSON.stringify to force the file path separator to be "\\"
    // then replace the Windows separator with the standard separator "/"
    const fixedPath = JSON.stringify(file).replaceAll("\\\\", "/");
    // removes the quotes that were added by JSON.stringify
    return fixedPath.substring(1, fixedPath.length - 1);
}

function addBrowsedFiles(target, files, keepPreviousFiles = false) {
    // eventually remove the previous files
    if(!keepPreviousFiles) target.innerHTML = "";

    // store files to avoid duplicates
    const fixedFiles = new Map();
    for(let label of target.getElementsByTagName("label")) {
        fixedFiles.set(label.textContent, "");
    }

    for(let file of files) {
        const path = fixFilePath(file);
        // do not add files that are already in the list
        if(!fixedFiles.has(path)) {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.textContent = "🗙";
            button.addEventListener("click", (event) => {
                const ul = event.target.parentElement.parentElement;
                // remove the current row
                event.target.parentElement.remove();
                // hide the list if there are no more rows
                if(ul.childNodes.length == 0) ul.parentElement.classList.add("w3-hide");
            });
            li.appendChild(button);
            const label = document.createElement("label");
            label.textContent = path;
            li.appendChild(label);
            target.appendChild(li);
        }
    }

    // if there are files in the list, remove the hide class to show the list
    if(files.length > 0) target.parentElement.classList.remove("w3-hide");
}

function getBrowsedFiles(target) {
    // this function should return what has been generated in the browse function
    if(target.tagName == "INPUT" && target.type == "text") return [fixFilePath(target.value)];
    else if(target.tagName == "TEXTAREA") return target.value.split("\n").map(fixFilePath);
    else if(target.tagName == "UL") return Array.from(target.childNodes).map(li => fixFilePath(li.textContent.replace("🗙", "")));
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
        // if(target.tagName == "INPUT" && target.type == "text") target.value = output[0];
        if(target.tagName == "INPUT" && target.type == "text") target.value = fixFilePath(output[0]);
        else if(target.tagName == "TEXTAREA") target.textContent = output.join("\n"); // TODO is it still used?
        else if(target.tagName == "UL") {
            addBrowsedFiles(target, output, true);
        }
        else target.value = output.join(", ");
    }
    if(target.tagName == "UL") updateFileList(target.parentElement.parentElement);
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
}

function isFocus() {
    return IS_FOCUS;
}

function updateSkipsBetweenRefreshs(reset = false) {
    // the default time between calls to the server is 5 seconds
    // but when the app is out of focus, we skip 2 calls, so there would be 15 seconds between 2 calls
    // when the app is in sleep mode, we skip 11 calls to wait 60 seconds between 2 calls
    if(reset) {
        NB_SKIPS_BEFORE_REFRESH = 0;
    } else if(NB_SKIPS_BEFORE_REFRESH <= 0) {
        if(!isActive() || IS_OFFLINE) {
            // update every 10 minute if asleep
            NB_SKIPS_BEFORE_REFRESH = parseInt(TIME_BETWEEN_REFRESHS_DURING_SLEEP_IN_SECONDS / settings.CONFIG.get("refresh.rate")) - 1; // 11;
        } else if(!isFocus()) {
            // update every 15 seconds if just blur
            NB_SKIPS_BEFORE_REFRESH = 2;
        } else {
            // update every 5 seconds otherwise
            NB_SKIPS_BEFORE_REFRESH = 0;
        }
        // set the timer with the new number of seconds to wait before refreshing the jobs
    } else NB_SKIPS_BEFORE_REFRESH -= 1; // decreasing the number of calls to skip, when we reach 0 we make the call again
    // console.log(`Number of skips before refreshing jobs: ${NB_SKIPS_BEFORE_REFRESH}`);
}

function checkSleepMode() {
    const timeSinceLastActivity = Math.floor((new Date() - getLastActivity()) / 1000);
    // console.log(`Seconds since last activity: ${timeSinceLastActivity} (isActive=${isActive()})`);
    // sleep mode is on if the time since last activity exceeds the threshold
    if(timeSinceLastActivity > TIME_BEFORE_SLEEP_IN_SECONDS) {
        // console.log("App appears to be inactive");
        // set the app as inactive
        setActive(false);
        dialog.createDialogSleep(TIME_BETWEEN_REFRESHS_DURING_SLEEP_IN_SECONDS);
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
    PREVIOUS_JOB_ID = CURRENT_JOB_ID;
    CURRENT_JOB_ID = id;
}

function getPreviousJobId() {
    return PREVIOUS_JOB_ID;
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

function checkboxListEventListener(target, allowZeroSelection) {
    // console.log(target);
    if(target.classList.contains("w3-input") && target.parentElement.classList.contains("selector")) {
        // user has clicked on the visible div where labels are displayed, show the div with the checkboxes
        toggleClass(target.parentElement.getElementsByTagName("div")[1], "w3-hide");
        toggleClass(target.parentElement.getElementsByTagName("div")[2], "w3-hide");
    } else if(target.tagName == "LABEL" && target.parentElement.parentElement.classList.contains("selector")) {
        // user has clicked on a label in the visible div, show the div with the checkboxes (only when not visible)
        target.parentElement.parentElement.getElementsByTagName("div")[1].classList.remove("w3-hide");
        target.parentElement.parentElement.getElementsByTagName("div")[2].classList.remove("w3-hide");
    } else if(target.tagName == "INPUT" && target.type == "checkbox") {
        const parent = target.parentElement.parentElement.parentElement;
        // if it's not allowed to have 0 selected items, reselect the latest item unchecked
        if(!allowZeroSelection && Object.keys(getCheckboxListSelection(parent)).length == 0) target.checked = !target.checked;
        // user has selected/unselected a checkbox, update the visible div
        updateCheckboxList(parent);
    } else if(target.classList.contains("selector-outside")) {
        // user has clicked outside of the div with the checkboxes, hide the list of results
        toggleClass(target.previousElementSibling, "w3-hide");
        toggleClass(target, "w3-hide");
    }
}

function addCheckboxList(parent, label, items, allowZeroSelection, tooltiptext) {
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
    parent.addEventListener("click", (e) => checkboxListEventListener(e.target, allowZeroSelection));
    tooltip(parent.getElementsByTagName("label")[0], tooltiptext);
}

function extractJobLog(text, extract_stdout = true, extract_stderr = true, extract_server = true, extract_info = false) {
    // the jobs are logged in a single file, each line from stdout starts with [STDOUT], similarly for stderr
    // there are also [INFO] lines with date, cpu and memory usage
    // level can be "stdout", "stderr", "info" or "all"
    var output = "";
    for(let line of text.split("\n")) {
        if(line.startsWith("[INFO]")) {
            if(extract_info) output += line.replace("[INFO] ", "") + "\n";
        } else if(line.startsWith("[SERVER]")) {
            if(extract_server) output += line.replace("[SERVER] ", "<span class='stdalt'>") + "</span>\n";
        } else if(line.startsWith("[STDERR]")) {
            if(extract_stderr) output += line.replace("[STDERR] ", "<span class='stderr'>") + "</span>\n";
        } else { // STDOUT is not explicitly mentioned, it's just a normal line
            if(extract_stdout) output += `<span class='stdout'>${line}</span>\n`;
        }
    }
    return output;
}

function extractInfoFromJobLog(text) {
    // only extract lines starting with [INFO]
    const data = extractJobLog(text, false, false, false, true);
    // split each line and return arrays of dates, cpus and memories
    const dates = []; const cpus = []; const memories = [];
    for(let line of data.split("\n")) {
        const parts = line.split(";");
        // skip empty or misformed lines (should have 3 parts separated by ";")
        if(parts.length != 3) continue;
        // get the date, cpu and memory from the line
        const date = parts[0].trim();
        const cpu = parseInt(parts[1].replace("CPU:", "").replace("%", "").trim());
        const ram = parseInt(parts[2].replace("RAM:", "").replace("%", "").trim());
        // store the values
        dates.push(date);
        cpus.push(cpu);
        memories.push(ram);
    }
    // console.log(dates, cpus, memories);
    return [dates, cpus, memories];
}

export { addBrowsedFiles, addCheckboxList, browse, checkSleepMode, doRefresh, extractJobLog, extractInfoFromJobLog, fixFilePath, formatDate, getBrowsedFiles, getCheckboxListSelection, getCurrentJobId, getLastActivity, getPreviousJobId, getUserName, isActive, isFocus, selectCheckboxListItem, setActive, setCurrentJobId, setDefaultCheckboxList, setFocus, setOffline, setUserName, sleep, toHumanReadable, toggleClass, toggleLoadingScreen, tooltip, updateCheckboxList };
