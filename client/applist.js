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

import { addBrowsedFiles, browse, fixFilePath, getBrowsedFiles, tooltip } from "./utils.js";

const XML_APP_LIST = new Map();
const SHARED_FILES_IDS = new Array();
const LOCAL_FILES_IDS = new Array();

function getAppMainInformations(app_id) {
    const xml = XML_APP_LIST.get(app_id);
    // console.log(xml);
    const parser = new DOMParser();
    const tool = parser.parseFromString(xml, "text/xml").getElementsByTagName("tool")[0];
    const desc = tool.hasAttribute("description") ? tool.getAttribute("description") : "";
    return [tool.getAttribute("name"), tool.getAttribute("version"), desc];
}

function getFullName(app_id) {
    if(XML_APP_LIST.has(app_id)) {
        const [name, version, _] = getAppMainInformations(app_id);
        return `${name} ${version}`;
    } else return app_id;
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
        var sel = selectedItem == id ? "selected='true'" : "";
        html += `<option value="${id}" ${sel}>${getFullName(id)}</option>`;
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
    } else {
        document.getElementById(button_id).disabled = true;
    }
}

function getFiles(ids) {
    const files = new Array();
    for(let id of ids) {
        const param = document.getElementById(id);
        if(param == null) console.log(`File item '${id}' is missing!!`);
        if(param.tagName.toUpperCase() == "INPUT") { // a single file
            const path = fixFilePath(param.value);
            if(path != "" && !files.includes(path)) files.push(path);
            // if(path != "" && !files.includes(path)) {
            //     console.log(`-> Add INPUT file '${path}'`);
            //     files.push(path);
            // }
        } else { // a list of files
            for(let path of getBrowsedFiles(document.getElementById(id))) {
                if(!files.includes(path)) files.push(path); // these paths are already fixed and cannot be modified by user
                // if(!files.includes(path)) {
                //     console.log(`-> Add FILELIST item '${path}'`);
                //     files.push(path);
                // }
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

function createInputNumber(id, param, input_class, value, placeholder="", name="") {
    const input = document.createElement("input");
    input.type = "number";
    input.id = id;
    input.name = name == "" ? param.getAttribute("name") : name;
    if(param.hasAttribute("min")) input.min = param.getAttribute("min");
    if(param.hasAttribute("max")) input.max = param.getAttribute("max");
    if(param.hasAttribute("step")) input.step = parseFloat(param.getAttribute("step"));
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

function createSelect(id, param, input_class) {
    const parent = createDiv("", "param-row param-select w3-hover-light-grey");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(createLabel(param, input_id));
    const input = document.createElement("select");
    input.id = input_id;
    input.name = param.getAttribute("name");
    input.className = `w3-select w3-border ${input_class}`;
    for(let option of param.children) {
        if(option.hasAttribute("value")) {
            const opt = document.createElement("option");
            opt.value = option.getAttribute("value");
            if(option.hasAttribute("selected") && option.getAttribute("selected")) opt.selected = true;
            opt.textContent = option.textContent;
            input.appendChild(opt);
        }
    }
    parent.appendChild(input);
    // addHoverEvent(parent.children[0], parent.children[1]);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
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
    const nb = target.children[1].getElementsByTagName("li").length;
    label.textContent = label.textContent.replace(/ \(\d+ items selected\)$/, ""); // remove previous indication
    if(nb > 0) label.textContent += ` (${nb} items selected)`;
}

function createFileList(id, param, input_class, useFolder) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-file-list w3-hover-light-grey");
    const header = createDiv("", "param-row");
    const ext = param.getAttribute("format");
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA";
    header.appendChild(createLabel(param));
    header.appendChild(createButton(input_id+"-clear", "╳", (event) => {
        event.preventDefault();
        document.getElementById(input_id).innerHTML = "";
        updateFileList(parent);
    }, "Clear the list")); // add the cancel button first, because both buttons will be float:right
    header.appendChild(createButton(input_id+"-browse", "Browse...", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: useFolder ? `.${ext} folders` : `.${ext} files`, extensions: [ext] }], [useFolder ? 'openDirectory' : 'openFile', 'multiSelections'], input_id);
    }));
    parent.appendChild(header);
    const list = createDiv("", "param-row");

    const ul = document.createElement("ul");
    ul.id = input_id;
    ul.name = param.getAttribute("name");
    ul.className = `w3-ul w3-border ${input_class}`;
    addFileDragAndDropEvents(ul, useFolder, true, [ext]);
    if(type == "RAW") SHARED_FILES_IDS.push(input_id);
    else LOCAL_FILES_IDS.push(input_id);
    list.appendChild(ul);
    parent.appendChild(list);
    // addHoverEvent(header.children[0], parent.children[1]);
    return parent;
}

function createFileInput(id, param, input_class, useFolder) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-file w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = document.createElement("input");
    const ext = param.getAttribute("format");
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA";
    input.type = "text";
    input.id = input_id;
    input.name = param.getAttribute("name");
    if(param.hasAttribute("value")) input.value = param.getAttribute("value");
    input.className = `w3-input w3-border ${input_class}`;
    input.placeholder = `Select a ${ext.toUpperCase()} file`;
    // allow drag & drop of file
    addFileDragAndDropEvents(input, useFolder, false, [ext]);
    parent.appendChild(createButton(input_id+"-btn", "…", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: useFolder ? `.${ext} folder` : `.${ext} file`, extensions: [ext] }], [useFolder ? 'openDirectory' : 'openFile'], input_id);
    }));
    if(type == "RAW") SHARED_FILES_IDS.push(input_id);
    else LOCAL_FILES_IDS.push(input_id);
    parent.appendChild(input); // add this later because both button and input will be float:right
    // addHoverEvent(parent.children[0], parent.children[2]);
    return parent;
}

function createCheckbox(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-checkbox w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = input_id;
    input.name = param.getAttribute("name");
    input.checked = param.getAttribute("value") == "true";
    input.className = `w3-check ${input_class}`;
    // create an elaborated parent for custom checkbox
    const div = document.createElement("div");
    div.className = "cumulus-checkbox";
    const label = document.createElement("label");
    label.className = "switch";
    label.setAttribute("for", input_id);
    label.appendChild(input);
    const slider = document.createElement("div");
    slider.classList.add("slider", "round");
    label.appendChild(slider);
    div.appendChild(label);
    parent.appendChild(div);
    // addHoverEvent(parent.children[0], input);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createNumber(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-number w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    parent.appendChild(createInputNumber(input_id, param, input_class, param.hasAttribute("value") ? param.getAttribute("value") : "", param.hasAttribute("placeholder") ? param.getAttribute("placeholder") : ""));
    // addHoverEvent(parent.children[0], parent.children[1]);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createRange(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-range w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    parent.appendChild(createInputNumber(input_id+"-2", param, input_class, param.hasAttribute("value2") ? param.getAttribute("value2") : "", param.hasAttribute("placeholder2") ? param.getAttribute("placeholder2") : "", param.getAttribute("name")+"-max")); // add this one first, because both inputs will be float:right
    parent.appendChild(createInputNumber(input_id, param, input_class, param.hasAttribute("value") ? param.getAttribute("value") : "", param.hasAttribute("placeholder") ? param.getAttribute("placeholder") : "", param.getAttribute("name")+"-min"));
    // addHoverEvent(parent.children[0], parent.children[1], parent.children[2]);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createTextfield(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-text w3-hover-light-grey");
    parent.appendChild(createLabel(param, input_id));
    const input = document.createElement("input");
    input.type = "text";
    input.id = input_id;
    input.name = param.getAttribute("name");
    if(param.hasAttribute("placeholder")) input.placeholder = param.getAttribute("placeholder");
    if(param.hasAttribute("value")) input.value = param.getAttribute("value");
    input.className = `w3-input w3-border ${input_class}`;
    parent.appendChild(input);
    // addHoverEvent(parent.children[0], parent.children[1]);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createTextLabel(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = createDiv("", "param-row param-label w3-hover-light-grey");
    const label = createLabel(param);
    label.classList.add(param.getAttribute("level"));
    parent.appendChild(label);
    if(param.hasAttribute("hidden") && param.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createParam(id, param, input_class) {
    if(param.tagName == "select") return createSelect(id, param, input_class);
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
        const value = conditional.classList.contains("param-checkbox") ? conditional.checked : conditional.value; // the value that will determine which when is displayed
        // loop through the next items that contain a "when" class
        var next = conditional.parentElement.nextElementSibling;
        while(next && next.classList.contains("when")) {
            // show or hide the when case
            if(next.id == `${conditional.id}-when-${value}`) next.classList.remove("w3-hide");
            else next.classList.add("w3-hide");
            // move to the next element
            next = next.nextElementSibling;
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
    getConditionalParamElement(item).addEventListener(getConditionalEventType(item), () => conditionalEvent(input));
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
        if(child.tagName.toUpperCase() == "CONDITIONAL") params.appendChild(createConditional(id, child));
        else params.appendChild(createParam(id, child, ""));
    }
    parent.appendChild(params);
    if(section.hasAttribute("hidden") && section.getAttribute("hidden")) parent.classList.add("w3-hide");
    return parent;
}

function createAppPage(parent) {
    const id = parent.getAttribute("id");
    const div = createDiv(`${id}-main`, "app_settings")
    const title = document.createElement("h3");
    title.textContent = `${parent.getAttribute("name")} ${parent.getAttribute("version")} parameters`;
    div.appendChild(title)
    // for(let section of parent.getElementsByTagName("section")) {
    for(let section of parent.children) {
        div.appendChild(createSection(id, section));
    }
    return div;
}

// export { get, getFullName, getOptionList, has, list };
export { conditionalEvent, getFullName, getLocalFiles, getOptionList, getSharedFiles, initialize, updateAppList, updateFileList };
