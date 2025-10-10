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

import { addBrowsedFiles, fixFilePath, getBrowsedFiles, tooltip } from "../utils.js";
import { isAdvancedParametersVisible } from "../appmanager.js";

const SHARED_FILES_IDS = new Array();
const LOCAL_FILES_IDS = new Array();

function addDefaultValue(param, defaultValue) {
    const item = document.createElement("a");
    item.textContent = defaultValue;
    param.appendChild(item);
}

function hasAdvancedParent(param) {
    var parent = param;
    // console.log(param);
    while(parent != null && parent.tagName.toUpperCase() != "FORM") {
        // stop if we reach the the first element containing a class "when"
        if(parent.classList.contains("advanced-off")) {
            // console.log("This is an advanced parameter!");
            return true;
        }
        // continue with the next parent
        parent = parent.parentNode;
    }
    // if there was no parent with class "when", return true
    return true;
}

function hasVisibleWhenParent(param) {
    var parent = param.parentNode;
    while(parent != null && parent.tagName.toUpperCase() != "FORM") {
        // stop if we reach the the first element containing a class "when"
        if(parent.classList.contains("when")) {
            // return true if the class "visible" is present, false otherwise
            return parent.classList.contains("visible");
        }
        // continue with the next parent
        parent = parent.parentNode;
    }
    // if there was no parent with class "when", return true
    return true;
}

function createElement(tagName, options, children = []) {
    const element = document.createElement(tagName);
    // options is a map of attributes to set on the element
    if(options) {
        for(let [key, value] of options) {
            if(key == "textContent") element.textContent = value;
            else element.setAttribute(key, value);
        }
    }
    // add children elements
    for(let child of children) {
        element.appendChild(child);
    }
    return element;
}

function createDiv(id, classname) {
    const div = document.createElement("div");
    if(id != "") div.id = id;
    if(classname != "") div.className = classname;
    return div;
}

function createLabel(param, target="") {
    const label = document.createElement("label");
    label.textContent = param.getAttribute("label");
    if(param.hasAttribute("help") && param.getAttribute("help") != "") tooltip(label, param.getAttribute("help"));
    if(target != "") label.setAttribute("for", target);
    return label;
}

function createInputText(id, param, input_class, value, placeholder="", name="") {
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = name == "" ? param.getAttribute("name") : name;
    input.placeholder = placeholder;
    input.value = value;
    input.className = `w3-input w3-border ${input_class}`;
    return input;
}

function createInputNumber(id, param, input_class, value, placeholder="", name="") {
    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.name = name == "" ? param.getAttribute("name") : name;
    if(param.hasAttribute("min")) input.min = param.getAttribute("min");
    if(param.hasAttribute("max")) input.max = param.getAttribute("max");
    if(param.hasAttribute("step")) input.step = parseFloat(param.getAttribute("step"));
    if(param.hasAttribute("type_of") && param.getAttribute("type_of") == "float") input.step = "0.01";
    input.placeholder = placeholder;
    input.value = value;
    input.className = `w3-input w3-border ${input_class}`;
    return input;
}

function createButton(id, label, event, tooltiptext = "") {
    const button = document.createElement("button");
    button.id = id;
    button.className = "w3-button color-opposite";
    button.textContent = label;
    if(tooltiptext != "") tooltip(button, tooltiptext);
    button.addEventListener("click", event);
    return button;
}

function setSettingVisibility(item, param) {
    if(param.hasAttribute("visibility")) {
        if(param.getAttribute("visibility") == "hidden") item.classList.add("w3-hide");
        else if(param.getAttribute("visibility") == "advanced") item.classList.add(isAdvancedParametersVisible() ? "advanced-on" : "advanced-off");
    }
}

function createTextLabel(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-label w3-hover-light-grey");
    const label = createLabel(param);
    label.classList.add(param.getAttribute("level"));
    parent.appendChild(label);
    setSettingVisibility(parent, param);
    return parent;
}

function checkExtensions(fileName, allowedExtensions) {
    // console.log(`Check if '${fileName}' ends with any of '${allowedExtensions}'`);
    if(allowedExtensions.length == 0) return true;
    for(let ext of allowedExtensions) {
        if((ext.startsWith(".") && fileName.endsWith(ext)) || (!ext.startsWith(".") && fileName.endsWith(`.${ext}`))) return true;
    }
    return false;
}

function dropHandler(event, useFolder, multiple, allowedExtensions = []) {
    event.preventDefault();
    // console.log(`dropHandler(event, ${useFolder}, ${multiple}, ${allowedExtensions})`);
    const files = [];
    for(let f of event.dataTransfer.files) {
        if(((!useFolder && f.size != 4096) || (useFolder && f.size == 4096)) && checkExtensions(f.name, allowedExtensions)) {
            const path = electronAPI.showFilePath(f);
            if(multiple) files.push(path);
            else {
                event.target.value = path;
                break; // only use the first file or folder that matches all criteria
            }
        }
    }
    if(multiple) addBrowsedFiles(event.target, files);
    // console.log(files);
    return false;
}

function addFileDragAndDropEvents(item, useFolder, multiple, allowedExtensions = []) {
    item.addEventListener("dragover", (e) => e.preventDefault());
    item.addEventListener("dragleave", (e) => e.preventDefault());
    item.addEventListener("dragend", (e) => e.preventDefault());
    item.addEventListener("drop", (event) => dropHandler(event, useFolder, multiple, allowedExtensions));
}

function getFiles(ids) {
    const files = new Array();
    for(let id of ids) {
        const param = document.getElementById(id);
        if(param == null) {
            console.log(`File item '${id}' is missing!!`); // it happened once, how is it possible?
            return null;
        }
        if(param.tagName.toUpperCase() == "INPUT") { // a single file
            const path = fixFilePath(param.value);
            if(path != "" && !files.includes(path)) files.push(path);
        } else { // a list of files
            for(let path of getBrowsedFiles(document.getElementById(id))) {
                if(!files.includes(path)) files.push(path); // these paths are already fixed and cannot be modified by user
            }
        }
    }
    return files;
}

function getLocalFiles() {
    // during initialize, store the ids of the elements that will contain local files (any file except raw data)
    // return the unique list of file paths for all these elements
    // console.log("getLocalFiles()");
    return getFiles(LOCAL_FILES_IDS);
}

function getSharedFiles() {
    // during initialize, store the ids of the elements that will contain shared files (only raw data)
    // return the unique list of file paths for all these elements
    // console.log("getSharedFiles()");
    return getFiles(SHARED_FILES_IDS);
}

export { addDefaultValue, addFileDragAndDropEvents, createElement, createDiv, createLabel, createInputText, createInputNumber, createButton, createTextLabel, getFiles, getLocalFiles, getSharedFiles, hasAdvancedParent, hasVisibleWhenParent, setSettingVisibility, SHARED_FILES_IDS, LOCAL_FILES_IDS };
