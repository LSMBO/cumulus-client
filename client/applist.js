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

// import { getSettings, setSettings } from "./job.js";
import { prepareAppParameters, setSettings } from "./job.js";
import { CONFIG } from "./settings.js";
import { createDialogWarning } from "./dialog.js";
import { tooltip } from "./utils.js";
import * as elements from "./app_elements/elements.js";
import * as checkbox from "./app_elements/checkbox.js";
import * as checklist from "./app_elements/checklist.js";
import * as fileinput from "./app_elements/fileinput.js";
import * as filelist from "./app_elements/filelist.js";
import * as keyvalues from "./app_elements/keyvalues.js";
import * as number from "./app_elements/number.js";
import * as range from "./app_elements/range.js";
import * as select from "./app_elements/select.js";
import * as textfield from "./app_elements/textfield.js";

const XML_APP_LIST = new Map();
var ADVANCED_VISIBLE = false;

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
    // if(CONFIG.has("display.hidden.apps") && CONFIG.get("display.hidden.apps")) return true;
    // apps can be considered as hidden, its meant for older apps that should not be called anymore
    // if(isAppHidden(xml)) return false;
    if(isAppHidden(xml)) {
        // some apps are hidden but can be displayed if the user allowed it in the config file
        if(CONFIG.has("display.hidden.apps") && CONFIG.get("display.hidden.apps")) return true;
        else return false;
    }
    // some categories can also prevent apps to be displayed
    if(isAppWorkInProgress(xml)) {
        // some apps are not ready for production but can be displayed if the user allowed it in the config file
        if(CONFIG.has("display.wip.apps") && CONFIG.get("display.wip.apps")) return true;
        return false;
    }
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
        if(document.getElementsByClassName("advanced-off").length + document.getElementsByClassName("advanced-on").length == 0) {
            const item = document.getElementById(`${main.getAttribute("id")}-advanced`);
            if(item != null) item.disabled = true;
        }
    } else {
        document.getElementById(button_id).disabled = true;
    }
}

function getFirstParentWithClass(element, className) {
    var parent = element.parentElement;
    while(parent != null && !parent.classList.contains(className)) {
        parent = parent.parentElement;
    }
    return parent;
}

function createParam(id, param, input_class) {
    if(param.tagName == "select") return select.create(id, param, input_class);
    else if(param.tagName == "checklist") return checklist.create(id, param, input_class);
    else if(param.tagName == "keyvalues") return keyvalues.create(id, param, input_class);
    else if(param.tagName == "checkbox") return checkbox.create(id, param, input_class);
    else if(param.tagName == "string") return textfield.create(id, param, input_class);
    else if(param.tagName == "number") return number.create(id, param, input_class);
    else if(param.tagName == "range") return range.create(id, param, input_class);
    else if(param.tagName == "text") return elements.createTextLabel(id, param, input_class);
    else if(param.tagName == "filelist") {
        if(param.getAttribute("multiple") == "true") return filelist.create(id, param, input_class, param.getAttribute("is_folder") == "true");
        else return fileinput.create(id, param, input_class, param.getAttribute("is_folder") == "true");
    }
    // the xml has been validated, so there is no chance that none of the above cases are not matched
}

function getParamValues() {
    const settings = new Map();
    for(let item of document.getElementsByClassName("param-select")) select.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-checklist")) checklist.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-keyvalue")) keyvalues.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-checkbox")) checkbox.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-text")) textfield.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-number")) number.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-range")) range.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-file-input")) fileinput.getValue(item, settings);
    for(let item of document.getElementsByClassName("param-file-list")) filelist.getValue(item, settings);
    return settings;
}

function checkParamValues() {
    // TODO test this function
    const errors = new Array();
    for(let item of document.getElementsByClassName("param-keyvalue")) keyvalues.checkValue(item, errors);
    for(let item of document.getElementsByClassName("param-number")) number.checkValue(item, errors);
    for(let item of document.getElementsByClassName("param-range")) range.checkValue(item, errors);
     return errors;
}

function getParamValuesAsString() {
    const json = getParamValues();
    // add the app id to the json object
    json.set("app_id", document.getElementById("cmbAppName").value);
    json.set("advanced_parameters_visible", document.getElementById("btn_header-advanced").classList.contains("advanced-visible"));
    // convert the json object to a string, using pretty print
    return JSON.stringify(Object.fromEntries(json), (_, value) => {
        if (value instanceof Map) {
            return [...value.entries()];
        }
        return value;
    }, 2);
}

function setParamValues(settings) {
    for(let item of document.getElementsByClassName("param-select")) select.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-checklist")) checklist.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-keyvalue")) keyvalues.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-checkbox")) checkbox.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-text")) textfield.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-number")) number.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-range")) range.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-file-input")) fileinput.setValue(item, settings);
    for(let item of document.getElementsByClassName("param-file-list")) filelist.setValue(item, settings);
}

function isFormDirty() {
    if(select.isDirty()) return true;
    if(checklist.isDirty()) return true;
    if(keyvalues.isDirty()) return true;
    if(checkbox.isDirty()) return true;
    if(textfield.isDirty()) return true;
    if(number.isDirty()) return true;
    if(range.isDirty()) return true;
    if(fileinput.isDirty()) return true;
    if(filelist.isDirty()) return true;
    return false;
}

function getConditionalParamElement(param) {
    if(param.classList.contains("param-select")) return param.getElementsByTagName("SELECT")[0];
    else if(param.classList.contains("param-file-input")) return param.getElementsByTagName("INPUT")[0];
    else if(param.classList.contains("param-checkbox")) return param.getElementsByTagName("INPUT")[0];
    else if(param.classList.contains("param-number")) return param.getElementsByTagName("INPUT")[0];
    else if(param.classList.contains("param-text")) return param.getElementsByTagName("INPUT")[0];
}

function getConditionalEventType(param) {
    if(param.classList.contains("param-select") || param.classList.contains("param-checkbox")) return "change";
    else if(param.classList.contains("param-file-input") || param.classList.contains("param-number")) return "input";
    else if(param.classList.contains("param-text")) return "input";
}

function conditionalEvent(conditional) {
    // conditional must have a class "cond"
    if(conditional.classList.contains("cond")) {
        // if conditional is a checkbox, get the value from the checked property, else get the value from the value property
        const value = conditional.type == "checkbox" ? conditional.checked : conditional.value; // the value that will determine which when is displayed
        // loop through the next items that contain a "when" class
        const nextElements = getFirstParentWithClass(conditional, "param-row").parentElement.getElementsByClassName("when");
        // show or hide the when cases
        for(let next of nextElements) {
            // get the value of the when case
            const when_value = next.id.replace(`${conditional.id}-when-`, "");
            // if the when has a class "allow_regex", check if the value matches the regex
            if(next.classList.contains("__allow_regex__")) {
                const regex = new RegExp(when_value);
                if(regex.test(value)) next.classList.add("visible");
                else next.classList.remove("visible");
            } else {
                if(when_value == String(value)) next.classList.add("visible");
                else next.classList.remove("visible");
            }
        }
    }
}

function createConditional(id, cond) {
    const cond_id = `${id}-${cond.getAttribute("name")}`;
    const parent = elements.createDiv(cond_id, "");
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
            const value = when.getAttribute("value");
            const div_id = `${input.id}-when-${value}`;
            const div = elements.createDiv(div_id, "when");
            if(when.hasAttribute("allow_regex") && when.getAttribute("allow_regex") == "true") div.classList.add("__allow_regex__");
            for(let child of when.children) {
                if(child.tagName.toUpperCase() != "WHEN") div.appendChild(createParam(`${id}-${value}`, child, ""));
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
    const parent = elements.createDiv("", "section-parent");

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

    const params = elements.createDiv(sectionId, section.getAttribute("expanded") ? "section" : "section w3-hide");
    for(let child of section.children) {
        if(child.tagName.toUpperCase() == "CONDITIONAL") params.appendChild(createConditional(sectionId, child));
        else params.appendChild(createParam(sectionId, child, ""));
    }
    parent.appendChild(params);
    // if(section.hasAttribute("hidden") && section.getAttribute("hidden")) parent.classList.add("w3-hide");
    elements.setSettingVisibility(parent, section);
    return parent;
}

async function saveParameters(event) {
    event.preventDefault();
    // check the parameters first
    const errors = checkParamValues();
    if(errors.length > 0) {
        // display the errors in a dialog
        createDialogWarning("Invalid parameters", errors.join("<br/>"));
    } else {
        // ask user where to save the file
        const output = await window.electronAPI.saveDialog("Save the parameters", "parameters.txt", []);
        if(output != "") {
            const settings = getParamValuesAsString();
            // ask the server to save the file
            await window.electronAPI.saveFile(output, settings);
        }
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
            setSettings(new Map(Object.entries(json)), false);
            if(json.advanced_parameters_visible) displayAdvancedParameters();
        }
    }
}

function displayAdvancedParameters() {
    const parent = document.getElementById("btn_header-advanced");
    parent.classList.add("advanced-visible");
    for(let item of document.getElementsByTagName("div")) {
        if(item.classList.contains("advanced-off")) {
            item.classList.remove("advanced-off");
            item.classList.add("advanced-on");
        }
    }
    ADVANCED_VISIBLE = true;
}

function hideAdvancedParameters() {
    const parent = document.getElementById("btn_header-advanced");
    parent.classList.remove("advanced-visible");
    for(let item of document.getElementsByTagName("div")) {
        if(item.classList.contains("advanced-on")) {
            item.classList.remove("advanced-on");
            item.classList.add("advanced-off");
        }
    }
    ADVANCED_VISIBLE = false;
}

function toggleAdvancedParameters(event) {
    event.preventDefault();
    if(!document.getElementById("btn_header-advanced").classList.contains("advanced-visible")) displayAdvancedParameters();
    else hideAdvancedParameters();
}

function isAdvancedParametersVisible() {
    return ADVANCED_VISIBLE;
}

// function that creates a header line with a h3 title, a button to save the parameters, and a button to load the parameters
function createHeader(id, title) {
    const header = elements.createDiv("", "app_header");
    const h3 = document.createElement("h3");
    h3.textContent = title;
    header.appendChild(h3);
    const buttons = elements.createDiv("", "app_header_buttons");
    buttons.appendChild(elements.createButton("btn_header-advanced", "Advanced", toggleAdvancedParameters, "Display advanced parameters"));
    buttons.appendChild(elements.createButton("btn_header-load", "Load", loadParameters, "Load the parameters"));
    buttons.appendChild(elements.createButton("btn_header-save", "Save", saveParameters, "Save the parameters as a text file"));
    buttons.appendChild(elements.createButton("btn_header-reset", "Reset", (event) => {event.preventDefault; prepareAppParameters();}, "Reset all parameters"));
    header.appendChild(buttons);
    return header;
}

function createAppPage(parent) {
    // reset the file lists
    elements.SHARED_FILES_IDS.length = 0;
    elements.LOCAL_FILES_IDS.length = 0;
    // create the main div
    const id = parent.getAttribute("id");
    const div = elements.createDiv(`${id}-main`, "app_settings")
    div.appendChild(createHeader(id, `${parent.getAttribute("name")} ${parent.getAttribute("version")} parameters`));
    for(let section of parent.children) {
        div.appendChild(createSection(id, section));
    }
    return div;
}

export { checkParamValues, conditionalEvent, getFullName, getOptionList, getParamValuesAsString, initialize, isAdvancedParametersVisible, isFormDirty, setParamValues, updateAppList };
