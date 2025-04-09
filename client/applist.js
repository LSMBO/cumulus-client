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

import { getSettings, setSettings } from "./job.js";
import { CONFIG } from "./settings.js";
import { addBrowsedFiles, browse, fixFilePath, getBrowsedFiles, getCurrentJobId, tooltip } from "./utils.js";

const XML_APP_LIST = new Map();
const SHARED_FILES_IDS = new Array();
const LOCAL_FILES_IDS = new Array();

function isAppHidden(xml) {
    const parser = new DOMParser();
    const tool = parser.parseFromString(xml, "text/xml").getElementsByTagName("tool")[0];
    return tool.hasAttribute("hidden") && tool.getAttribute("hidden");
}

function getAppCategory(xml) {
    const parser = new DOMParser();
    const tool = parser.parseFromString(xml, "text/xml").getElementsByTagName("tool")[0];
    return tool.hasAttribute("category") ? tool.getAttribute("category") : "";
}

function isAppWorkInProgress(xml) {
    return getAppCategory(xml) == "__work_in_progress__";
}

function getAppMainInformations(app_id) {
    const xml = XML_APP_LIST.get(app_id);
    // console.log(xml);
    const parser = new DOMParser();
    const tool = parser.parseFromString(xml, "text/xml").getElementsByTagName("tool")[0];
    const desc = tool.hasAttribute("description") ? tool.getAttribute("description") : "";
    const category = tool.hasAttribute("category") ? tool.getAttribute("category") : "";
    const hidden = isAppHidden(xml);
    return [tool.getAttribute("name"), tool.getAttribute("version"), desc, category, hidden];
}

function getFullName(app_id) {
    if(XML_APP_LIST.has(app_id)) {
        const [name, version, _, category, hidden] = getAppMainInformations(app_id);
        // console.log(`${name}: ${category}, ${hidden}`);
        if(hidden) return `${name} ${version} [Hidden]`;
        else if(category == "__work_in_progress__") return `${name} ${version} [Work in Progress]`;
        else return `${name} ${version}`;
    } else return app_id;
}

function isAppVisible(xml) {
    // some apps are hidden but can be displayed if the user allowed it in the config file
    if(CONFIG.has("display.hidden.apps") && CONFIG.get("display.hidden.apps")) return true;
    // apps can be considered as hidden, its meant for older apps that should not be called anymore
    if(isAppHidden(xml)) return false;
    // some categories can also prevent apps to be displayed
    if(isAppWorkInProgress(xml)) return false;
    // default is to display the app
    return true;
}

async function updateAppList() {
    XML_APP_LIST.clear();
    const apps = await window.electronAPI.listApps();
    for(let [id, xml] of apps) {
        XML_APP_LIST.set(id, xml);
    }
}

function getOptionList(selectedItem = "") {
    var html = "";
    for(let id of XML_APP_LIST.keys()) {
        if(isAppVisible(XML_APP_LIST.get(id))) {
            var sel = selectedItem == id ? "selected='true'" : "";
            html += `<option value="${id}" ${sel}>${getFullName(id)}</option>`;
        }
    }
    return html;
}

function initialize(app_id, parent_id, button_id) {
    document.getElementById(parent_id).innerHTML = "";
    if(XML_APP_LIST.has(app_id)) {
        // add the id of the xml app
        const xml = XML_APP_LIST.get(app_id);
        // load the xml file
        const parser = new DOMParser();
        const main = parser.parseFromString(xml, "text/xml").getElementsByTagName("tool")[0];
        const div = createAppPage(main);
        document.getElementById(parent_id).appendChild(div);
        document.getElementById(button_id).disabled = false;
        // hide the advanced button if there is no advanced parameters
        if(document.getElementsByClassName("advanced-off").length == 0) document.getElementById(`${main.getAttribute("id")}-advanced`).disabled = true;
    } else {
        document.getElementById(button_id).disabled = true;
    }
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

// function checkSettings() {
//     // is it really necessary?
//     // is it even possible now?
//     // veriffications may just be included in the xml file...
// }

function getFirstParentWithClass(element, className) {
    var parent = element.parentElement;
    while(parent != null && !parent.classList.contains(className)) {
        parent = parent.parentElement;
    }
    return parent;
}

function createElement(tagName, options) {
    const element = document.createElement(tagName);
    // options is a map of attributes to set on the element
    for(let [key, value] of options) {
        if(key == "textContent") element.textContent = value;
        else element.setAttribute(key, value);
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

// function addHoverEvent() {
//     if(arguments.length >= 2) {
//         const source = arguments[0];
//         for(let i = 1; i < arguments.length; i++) {
//             source.addEventListener("mouseover", () => arguments[i].classList.add("hover"));
//             source.addEventListener("mouseout", () => arguments[i].classList.remove("hover"));
//         }
//     }
// }

function setSettingVisibility(item, param) {
    if(param.hasAttribute("visibility")) {
        if(param.getAttribute("visibility") == "hidden") item.classList.add("w3-hide");
        if(param.getAttribute("visibility") == "advanced") item.classList.add("advanced-off");
    }
}

function createSelect(id, param, input_class) {
    const parent = createDiv("", "param-row param-select w3-hover-light-grey");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(createLabel(param, input_id));
    const input = createElement("select", new Map([["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-select w3-border ${input_class}`]]));
    for(let option of param.children) {
        if(option.hasAttribute("value")) {
            const opt = createElement("option", new Map([["value", option.getAttribute("value")], ["textContent", option.textContent]]));
            if(option.hasAttribute("selected") && option.getAttribute("selected")) opt.selected = true;
            input.appendChild(opt);
        }
    }
    parent.appendChild(input);
    setSettingVisibility(parent, param);
    return parent;
}

// function to update the label of the checklist when the user selects an option
function updateChecklistLabel(input) {
    const label = input.getElementsByTagName("label")[0];
    const dropdown = input.getElementsByTagName("div")[0];
    const checkboxes = dropdown.getElementsByTagName("input");
    var nbSelected = 0;
    for(let checkbox of checkboxes) {
        if(checkbox.checked) nbSelected++;
    }
    if(nbSelected == 0) label.textContent = "Select options";
    else label.textContent = `${nbSelected} selected`;
}

function createChecklist(id, param, input_class) {
    // similar to a <select>, but used to display a list of checkboxes
    const parent = createDiv("", "param-row param-checklist w3-hover-light-grey");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(createLabel(param, input_id));
    const input = createElement("div", new Map([["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-select w3-border ${input_class}`]]));
    const span = document.createElement("span");
    const label = document.createElement("label");
    const i = createElement("i", new Map([["class", "checklist-down"]]));
    span.appendChild(i);
    span.appendChild(label);
    input.appendChild(span);
    const dropdown = document.createElement("div");
    dropdown.classList.add("w3-hide");
    for(let option of param.children) {
        const opt = createElement("input", new Map([["type", "checkbox"], ["id", `${input_id}_${option.getAttribute("value")}`], ["name", param.getAttribute("name")], ["class", `w3-check ${input_class}`]]));
        if(option.hasAttribute("selected") && option.getAttribute("selected")) opt.checked = true;
        opt.addEventListener("change", () => updateChecklistLabel(input));
        // create a label for this checkbox
        const label = createElement("label", new Map([["for", opt.id], ["textContent", option.textContent]]));
        label.appendChild(opt);
        // insert the label with the checkbox in the input div
        dropdown.appendChild(label);
    }
    input.appendChild(dropdown);
    parent.appendChild(input);
    updateChecklistLabel(input);
    // add an event to display the dropdown when the label is clicked
    input.addEventListener("click", (event) => {
        if(!dropdown.contains(event.target)) {
            if(dropdown.classList.contains("w3-hide")) {
                dropdown.classList.remove("w3-hide");
                i.classList.replace("checklist-down", "checklist-up");
            } else {
                dropdown.classList.add("w3-hide");
                i.classList.replace("checklist-up", "checklist-down");
            }
        }
    });
    // also add an event to hide the dropdown when clicking outside of it
    document.addEventListener("click", (event) => {
        if(!input.contains(event.target)) {
            dropdown.classList.add("w3-hide");
            i.classList.replace("checklist-up", "checklist-down");
        }
    });
    // set param visibility
    setSettingVisibility(parent, param);
    return parent;
}

function createKeyValueRow(param, option = null, is_header = false) {
    const row = document.createElement("tr");
    if(is_header) {
        row.appendChild(createElement("th", new Map([["textContent", param.getAttribute("label_key")]])));
        row.appendChild(createElement("th", new Map([["textContent", param.getAttribute("label_value")]])));
        const th = document.createElement("th");
        const button = createElement("button", new Map([["textContent", "🗙"]]));
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const table = e.target.parentElement.parentElement.parentElement;
            table.appendChild(createKeyValueRow(param));
        });
        tooltip(button, "Add a new element");
        th.appendChild(button);
        row.appendChild(th);
    } else {
        const placeholder_key = param.hasAttribute("placeholder_key") ? param.getAttribute("placeholder_key") : "Key";
        const placeholder_value = param.hasAttribute("placeholder_value") ? param.getAttribute("placeholder_value") : "Value";
        const cell1 = document.createElement("td");
        cell1.appendChild(createElement("input", new Map([["type", "text"], ["class", "w3-input w3-border"], ["textContent", option ? option.getAttribute("key") : ""], ["placeholder", placeholder_key]])));
        row.appendChild(cell1);
        const cell2 = document.createElement("td");
        if(param.hasAttribute("type_of") && param.getAttribute("type_of") == "integer") {
            cell2.appendChild(createElement("input", new Map([["type", "number"], ["class", "w3-input w3-border"], ["textContent", option ? option.getAttribute("value") : ""], ["placeholder", placeholder_value]])));
        } else if(param.hasAttribute("type_of") && param.getAttribute("type_of") == "float") {
            cell2.appendChild(createElement("input", new Map([["type", "number"], ["step", 0.01], ["class", "w3-input w3-border"], ["textContent", option ? option.getAttribute("value") : ""], ["placeholder", placeholder_value]])));
        } else {
            cell2.appendChild(createElement("input", new Map([["type", "text"], ["class", "w3-input w3-border"], ["textContent", option ? option.getAttribute("value") : ""], ["placeholder", placeholder_value]])));
        }
        row.appendChild(cell2);
        const td = document.createElement("td");
        const button = createElement("button", new Map([["textContent", "🗙"]]));
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const row = e.target.parentElement.parentElement;
            const table = row.parentElement;
            row.remove();
            if(table.rows.length == 1) table.appendChild(createKeyValueRow(param));
        });
        tooltip(button, "Remove this element");
        td.appendChild(button);
        row.appendChild(td);
    }
    return row;
}

function createKeyValueList(id, param, input_class) {
    // list of key-value pairs, one per line with two text fields and a button to remove the current line
    // there is also a header line with the label and a button to add a new line
    const parent = createDiv("", "param-row param-keyvalue w3-hover-light-grey");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(createLabel(param, input_id));
    // create an element with a first line containing the headers and the '+' button
    const table = createElement("table", new Map([["id", input_id], ["name", param.getAttribute("name")], ["class", "w3-ul"]]));
    table.appendChild(createKeyValueRow(param, null, true));
    for(let option of param.children) {
        table.appendChild(createKeyValueRow(param, option));
    }
    // make sure to display at least one row
    if(table.rows.length == 1) table.appendChild(createKeyValueRow(param));
    parent.appendChild(table);
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

function updateFileList(target) {
    const label = target.children[0].getElementsByTagName("label")[0];
    const list = target.children[1];
    const nb = list.getElementsByTagName("li").length;
    label.textContent = label.textContent.replace(/ \(\d+ items selected\)$/, ""); // remove previous indication
    if(nb > 0) {
        label.textContent += ` (${nb} items selected)`;
        list.classList.remove("w3-hide");
    } else {
        list.classList.add("w3-hide");
    }
}

function createFileList(id, param, input_class, useFolder) {
    // TODO when the list is empty, hide the list (second param-row)
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-file-list w3-hover-light-grey");
    const header = createDiv("", "param-row");
    const ext = param.getAttribute("format");
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA";
    header.appendChild(createLabel(param));
    header.appendChild(createButton(input_id+"-clear", "🗙", (event) => {
        event.preventDefault();
        document.getElementById(input_id).innerHTML = "";
        updateFileList(parent);
    }, "Clear the list")); // add the cancel button first, because both buttons will be float:right
    header.appendChild(createButton(input_id+"-browse", "Browse...", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: useFolder ? `.${ext} folders` : `.${ext} files`, extensions: [ext] }], [useFolder ? 'openDirectory' : 'openFile', 'multiSelections'], input_id);
    }));
    parent.appendChild(header);
    const list = createDiv("", "param-row w3-hide");

    const ul = createElement("ul", new Map([["id", input_id], ["class", `w3-ul w3-border ${input_class}`]]));
    addFileDragAndDropEvents(ul, useFolder, true, [ext]);
    if(type == "RAW") SHARED_FILES_IDS.push(input_id);
    else LOCAL_FILES_IDS.push(input_id);
    list.appendChild(ul);
    parent.appendChild(list);
    setSettingVisibility(parent, param);
    return parent;
}

function createFileInput(id, param, input_class, useFolder) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-file w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = createElement("input", new Map([["type", "text"], ["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-input w3-border ${input_class}`]]));
    const ext = param.getAttribute("format").toUpperCase().split(";"); // allow multiple extensions
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA"; // TODO rename RAW and FASTA to SHARED and LOCAL
    if(param.hasAttribute("value")) input.value = param.getAttribute("value");
    addFileDragAndDropEvents(input, useFolder, false, ext);
    parent.appendChild(createButton(input_id+"-btn", "…", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: param.getAttribute("label"), extensions: ext }], [useFolder ? 'openDirectory' : 'openFile'], input_id);
    }));
    if(type == "RAW") SHARED_FILES_IDS.push(input_id);
    else LOCAL_FILES_IDS.push(input_id);
    parent.appendChild(input); // add this later because both button and input will be float:right
    setSettingVisibility(parent, param);
    return parent;
}

function createCheckbox(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-checkbox w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = createElement("input", new Map([["type", "checkbox"], ["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-check ${input_class}`]]));
    input.checked = param.getAttribute("value") == "true";
    const div = createElement("div", new Map([["class", "cumulus-checkbox"]]));
    const label = createElement("label", new Map([["class", "switch"], ["for", input_id]]));
    label.appendChild(input);
    const slider = createElement("div", new Map([["class", "slider round"]]));
    label.appendChild(slider);
    div.appendChild(label);
    parent.appendChild(div);
    setSettingVisibility(parent, param);
    return parent;
}

function createNumber(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-number w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    parent.appendChild(createInputNumber(input_id, param, input_class, param.hasAttribute("value") ? param.getAttribute("value") : "", param.hasAttribute("placeholder") ? param.getAttribute("placeholder") : ""));
    setSettingVisibility(parent, param);
    return parent;
}

function createRange(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-range w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    parent.appendChild(createInputNumber(input_id+"-2", param, input_class, param.hasAttribute("value2") ? param.getAttribute("value2") : "", param.hasAttribute("placeholder2") ? param.getAttribute("placeholder2") : "", param.getAttribute("name")+"-max")); // add this one first, because both inputs will be float:right
    parent.appendChild(createInputNumber(input_id, param, input_class, param.hasAttribute("value") ? param.getAttribute("value") : "", param.hasAttribute("placeholder") ? param.getAttribute("placeholder") : "", param.getAttribute("name")+"-min"));
    setSettingVisibility(parent, param);
    return parent;
}

function createTextfield(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-text w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = createElement("input", new Map([["type", "text"], ["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-input w3-border ${input_class}`]]));
    if(param.hasAttribute("placeholder")) input.placeholder = param.getAttribute("placeholder");
    if(param.hasAttribute("value")) input.value = param.getAttribute("value");
    parent.appendChild(input);
    setSettingVisibility(parent, param);
    return parent;
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

function createParam(id, param, input_class) {
    if(param.tagName == "select") return createSelect(id, param, input_class);
    else if(param.tagName == "checklist") return createChecklist(id, param, input_class);
    else if(param.tagName == "keyvalues") return createKeyValueList(id, param, input_class);
    else if(param.tagName == "checkbox") return createCheckbox(id, param, input_class);
    else if(param.tagName == "string") return createTextfield(id, param, input_class);
    else if(param.tagName == "number") return createNumber(id, param, input_class);
    else if(param.tagName == "range") return createRange(id, param, input_class);
    else if(param.tagName == "text") return createTextLabel(id, param, input_class);
    else if(param.tagName == "filelist") {
        if(param.getAttribute("multiple") == "true") return createFileList(id, param, input_class, param.getAttribute("is_folder") == "true");
        else return createFileInput(id, param, input_class, param.getAttribute("is_folder") == "true");
    }
    // the xml has been validated, so there is no chance that none of the above cases are not matched
}

function getConditionalParamElement(param) {
    if(param.classList.contains("param-select")) return param.getElementsByTagName("SELECT")[0];
    else if(param.classList.contains("param-file")) return param.getElementsByTagName("INPUT")[0];
    else if(param.classList.contains("param-checkbox")) return param.getElementsByTagName("INPUT")[0];
    else if(param.classList.contains("param-number")) return param.getElementsByTagName("INPUT")[0];
}

function getConditionalEventType(param) {
    if(param.classList.contains("param-select") || param.classList.contains("param-checkbox")) return "change";
    else if(param.classList.contains("param-file") || param.classList.contains("param-number")) return "input";
}

function conditionalEvent(conditional) {
    // conditional must have a class "cond"
    if(conditional.classList.contains("cond")) {
        // if conditional is a checkbox, get the value from the checked property, else get the value from the value property
        const value = conditional.type == "checkbox" ? conditional.checked : conditional.value; // the value that will determine which when is displayed
        // loop through the next items that contain a "when" class
        const nextElements = getFirstParentWithClass(conditional, "param-row").parentElement.getElementsByClassName("when");
        for(let next of nextElements) {
            // show or hide the when case
            if(next.id == `${conditional.id}-when-${value}`) next.classList.add("visible");
            else next.classList.remove("visible");
        }
    }
}

function createConditional(id, cond) {
    const cond_id = `${id}-${cond.getAttribute("name")}`;
    const parent = createDiv(cond_id, "");
    // get the first (and only) param from the children of cond (there are many param in cond's children, do not confuse them)
    var i = 0;
    var param = cond.children[i++];
    while(i < cond.childElementCount && param.tagName.toUpperCase() == "WHEN") param = cond.children[i++];
    const item = createParam(id, param, "cond"); // this param can be anything, but it's usually a SELECT or a CHECKBOX
    const input = item.getElementsByClassName("cond")[0]; // the id of the actual input that will trigger the event
    parent.appendChild(item);
    // const map = new Map(); // used for the event listener
    for(let when of cond.children) {
        if(when.tagName.toUpperCase() == "WHEN") {
            const div_id = `${input.id}-when-${when.getAttribute("value")}`;
            const div = createDiv(div_id, "when");
            for(let child of when.children) {
                if(child.tagName.toUpperCase() != "WHEN") div.appendChild(createParam(id, child, ""));
            }
            parent.appendChild(div);
        }
    }
    // for the event listener, i need the id of the element to target (or the element itself), and the type of event to listen to
    // for now, conditional does not support file-list and range
    getConditionalParamElement(item).addEventListener(getConditionalEventType(item), (e) => conditionalEvent(input));
    // trigger the event to initialize the values
    conditionalEvent(input);
    return parent;
}

function createSection(id, section) {
    const up = `<i class="section-minus"></i>`;
    const down = `<i class="section-plus"></i>`;
    const sort = section.getAttribute("expanded") == "true" ? up : down;
    const sectionId = `${id}-section-${section.getAttribute("name")}`;
    const parent = createDiv("", "section-parent");

    const title = document.createElement("h4");
    title.innerHTML = `${sort}${section.getAttribute("title")}`;
    title.addEventListener("click", (event) => {
        // console.log(event.target);
        const target = event.target.tagName.toUpperCase() == "I" ? event.target.parentElement : event.target;
        if(target.nextElementSibling.classList.contains("w3-hide")) {
            target.getElementsByTagName("i")[0].classList.replace("section-plus", "section-minus");
            target.nextElementSibling.classList.remove("w3-hide");
        } else {
            target.getElementsByTagName("i")[0].classList.replace("section-minus", "section-plus");
            target.nextElementSibling.classList.add("w3-hide");
        }
    });
    if(section.hasAttribute("help") && section.getAttribute("help") != "") tooltip(title, section.getAttribute("help"));
    parent.appendChild(title);

    const params = createDiv(sectionId, section.getAttribute("expanded") ? "section" : "section w3-hide");
    for(let child of section.children) {
        if(child.tagName.toUpperCase() == "CONDITIONAL") params.appendChild(createConditional(sectionId, child));
        else params.appendChild(createParam(sectionId, child, ""));
    }
    parent.appendChild(params);
    // if(section.hasAttribute("hidden") && section.getAttribute("hidden")) parent.classList.add("w3-hide");
    setSettingVisibility(parent, section);
    return parent;
}

async function saveParameters(event) {
    event.preventDefault();
    // ask user where to save the file
    const output = await window.electronAPI.saveDialog("Save the parameters", "parameters.txt", []);
    if(output != "") {
        // call job.getSettings() to get the parameters
        const json = getSettings();
        // add the app id to the json object
        json.set("app_id", document.getElementById("cmbAppName").value);
        // convert the json object to a string, using pretty print
        const settings = JSON.stringify(Object.fromEntries(json), null, 2);
        // ask the server to save the file
        await window.electronAPI.saveFile(output, settings);
    }
}

async function loadParameters(event) {
    event.preventDefault();
    // ask user to select a file
    const app_id = document.getElementById("cmbAppName").value;
    const output = await window.electronAPI.browseServer("", "Load the parameters", `Cumulus-${app_id}.txt`, [{name: `.txt files`, extensions: ["txt"]}], ['openFile']);
    if(output != "") {
        // read the file
        const content = await window.electronAPI.loadFile(output[0]);
        const json = JSON.parse(content);
        // check that the file content is for the current app
        if(json.app_id == app_id) {
            // remove the app_id from the map
            delete(json.app_id);
            // set the parameters
            setSettings(new Map(Object.entries(json)));
        }
    }
}

function toggleAdvancedParameters(event) {
    event.preventDefault();
    const parent = event.target;
    if(parent.textContent == "Show advanced parameters") {
        parent.textContent = "Hide advanced parameters";
        for(let item of document.getElementsByTagName("div")) {
            if(item.classList.contains("advanced-off")) {
                item.classList.remove("advanced-off");
                item.classList.add("advanced-on");
            }
        }
    } else {
        parent.textContent = "Show advanced parameters";
        for(let item of document.getElementsByTagName("div")) {
            if(item.classList.contains("advanced-on")) {
                item.classList.remove("advanced-on");
                item.classList.add("advanced-off");
            }
        }
    }
}

// function that creates a header line with a h3 title, a button to save the parameters, and a button to load the parameters
function createHeader(id, title) {
    const header = createDiv("", "app_header");
    const h3 = document.createElement("h3");
    h3.textContent = title;
    header.appendChild(h3);
    header.appendChild(createButton(`${id}-save`, "Save", saveParameters, "Save the parameters as a text file"));
    header.appendChild(createButton(`${id}-load`, "Load", loadParameters, "Load the parameters"));
    header.appendChild(createButton(`${id}-advanced`, "Show advanced parameters", toggleAdvancedParameters, "Display advanced parameters"));
    return header;
}

function createAppPage(parent) {
    // reset the file lists
    SHARED_FILES_IDS.length = 0;
    LOCAL_FILES_IDS.length = 0;
    // create the main div
    const id = parent.getAttribute("id");
    const div = createDiv(`${id}-main`, "app_settings")
    div.appendChild(createHeader(id, `${parent.getAttribute("name")} ${parent.getAttribute("version")} parameters`));
    for(let section of parent.children) {
        div.appendChild(createSection(id, section));
    }
    return div;
}

export { conditionalEvent, createElement, getFullName, getLocalFiles, getOptionList, getSharedFiles, initialize, updateAppList, updateFileList };
