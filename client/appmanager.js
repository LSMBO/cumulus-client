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

import { setSettings } from "./jobcontent.js";
import { CONFIG } from "./settings.js";
import { createDialogWarning } from "./dialog.js";
import { getCurrentJobId, tooltip } from "./utils.js";
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
var CURRENT_APP_ID = null; // used to know which app is currently selected in the combobox

function isAppHidden(xml) {
    const parser = new DOMParser();
    const main = parser.parseFromString(xml, "text/xml").firstChild;
    return main.hasAttribute("hidden") && main.getAttribute("hidden") != "false";
}

function getAppCategory(xml) {
    const parser = new DOMParser();
    const main = parser.parseFromString(xml, "text/xml").firstChild;
    return main.hasAttribute("category") && main.getAttribute("category");
}

function isAppWorkInProgress(xml) {
    return getAppCategory(xml) == "__work_in_progress__";
}

function getAppMainInformations(app_id) {
    const xml = XML_APP_LIST.get(app_id);
    const parser = new DOMParser();
    const main = parser.parseFromString(xml, "text/xml").firstChild;
    const desc = main.hasAttribute("description") && main.getAttribute("description");
    const category = main.hasAttribute("category") && main.getAttribute("category");
    const hidden = isAppHidden(xml);
    return [main.getAttribute("name"), main.getAttribute("version"), desc, category, hidden];
}

function getFullName(app_id, display_description = false) {
    if(XML_APP_LIST.has(app_id)) {
        const [name, version, description, category, hidden] = getAppMainInformations(app_id);
        var fullname = `${name} ${version}`;
        if(display_description && description != "") fullname += `: ${description}`;
        if(hidden) fullname = `[Hidden] ${fullname}`;
        else if(category == "__work_in_progress__") fullname = `[Work in Progress] ${fullname}`;
        return fullname;
    } else return app_id;
}

function isAppVisible(xml) {
    // some apps are hidden but can be displayed if the user allowed it in the config file
    // apps can be considered as hidden, its meant for older apps that should not be called anymore
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

function getAppsAsOptionList(selectedItem = "", display_description = false) {
    var html = "";
    /* 
    The following code lists the apps and the workflows too
    It's disabled because workflows could not be tested enough
     */
    // for(let tag of ["Tool", "Workflow"]) {
    //     html += `<optgroup label="${tag}s">`;
    //     for(let id of XML_APP_LIST.keys()) {
    //         const xml = XML_APP_LIST.get(id);
    //         if(xml.startsWith(`<${tag.toLowerCase()}`) && isAppVisible(xml)) {
    //             var sel = selectedItem == id ? "selected='true'" : "";
    //             html += `<option value="${id}" ${sel}>${getFullName(id, display_description)}</option>`;
    //         }
    //     }
    //     html += "</optgroup>";
    // }

    /* 
    The following code only lists the apps
     */
    for(let id of XML_APP_LIST.keys()) {
        const xml = XML_APP_LIST.get(id);
        if(xml.startsWith(`<${"tool".toLowerCase()}`) && isAppVisible(xml)) {
            var sel = selectedItem == id ? "selected='true'" : "";
            html += `<option value="${id}" ${sel}>${getFullName(id, display_description)}</option>`;
        }
    }
    return html;
}

function readXmlApp(app_id) {
    // load the xml parser
    const parser = new DOMParser();
    // read the xml file for the app
    const xml = XML_APP_LIST.has(app_id) ? XML_APP_LIST.get(app_id) : null;
    if(!xml) return null; // app not found
    return parser.parseFromString(xml, "text/xml").firstChild;
}

function isWorkflow(app_id) {
    return readXmlApp(app_id).tagName.toLowerCase() == "workflow";
}

function get_app_template(app_id) {
    return XML_APP_LIST.has(app_id) ? XML_APP_LIST.get(app_id) : null;
}

function get_app_templates(app_id) {
    // we assume that app_id is a workflow, so we need to retrieve the templates for the apps in the workflow
    const templates = new Array();
    // retrieve all the xml templates for the workflow
    for(let tool of readXmlApp(app_id).children) {
        if(XML_APP_LIST.has(tool.getAttribute("id"))) {
            templates.push(XML_APP_LIST.get(tool.getAttribute("id")));
        }
    }
    // return the array of templates
    return templates;
}

function generate_parameters_page() {
    const parser = new DOMParser();
    const form = document.getElementById("formParameters");
    const button_id = "btnParameters";
    // get the selected app name, it can be a workflow or a single app
    const app_id = document.getElementById("cmbAppName").value;
    // delete the previous parameters page
    form.innerHTML = "";
    // if the app corresponds to a workflow, we need to load the templates for the apps in the workflow
    if(isWorkflow(app_id)) {
        var i = 0;
        // loop through the apps in the workflow
        const templates = get_app_templates(app_id);
        for(let xml of templates) {
            const template = parser.parseFromString(xml, "text/xml").firstChild;
            // get the template id
            CURRENT_APP_ID = template.getAttribute("id");
            // create the div for the app
            const div = createAppPage(template, i, templates.length);
            // only display the first app in the workflow
            if(i > 0) div.classList.add("w3-hide");
            // add the div to the form
            form.appendChild(div);
            i += 1;
        }
        CURRENT_APP_ID = form.children[0].id.replace("-main", "");
    } else {
        // simply create the app page for this app
        CURRENT_APP_ID = app_id;
        const template = parser.parseFromString(get_app_template(app_id), "text/xml").firstChild;
        const div = createAppPage(template);
        form.appendChild(div);
    }
    document.getElementById(button_id).disabled = false;
    // hide the advanced button if there is no advanced parameters
    if(document.getElementsByClassName("advanced-off").length + document.getElementsByClassName("advanced-on").length == 0) {
        document.getElementById("btn_header-advanced").disabled = true;
    }
}

function getFirstParentWithClass(element, className) {
    var parent = element.parentElement;
    while(parent != null && !parent.classList.contains(className)) {
        parent = parent.parentElement;
    }
    return parent;
}

function disableParameters(parent, disable) {
    for(let tagtype of ["input", "select", "button"]) {
        for(let item of parent.getElementsByTagName(tagtype)) {
            // do not disable the Advanced and Save buttons
            if(item.id == "btn_header-save") continue;
            else if(item.id == "btn_header-advanced") continue;
            // set the properties
            item.disabled = disable;
            if(disable) item.classList.add("cm-disabled");
            else item.classList.remove("cm-disabled");
            // do the same for the parent element of any checkbox
            if(tagtype == "input" && item.type == "checkbox") {
                item.parentElement.disabled = disable;
                if(disable) item.parentElement.classList.add("cm-disabled");
                else item.parentElement.classList.remove("cm-disabled");
            }
        }
    }
}

function adjustParameterValue(id, param) {
    // if the current app is not part of a workflow, return null already
    if(document.getElementById("txtWorkflowName").value == "") return null; // not a workflow, nothing to do
    // otherwise, get the workflow xml and search if the param id is listed there (also check that the app is the current one)
    const workflow_xml = XML_APP_LIST.get(document.getElementById("txtWorkflowName").value);
    const parser = new DOMParser();
    const workflow = parser.parseFromString(workflow_xml, "text/xml").firstChild;
    // get the part of the workflow that corresponds to the current app
    for(let tool of workflow.children) {
        if(tool.id == CURRENT_APP_ID) {
            for(let wfp of tool.children) {
                if(wfp.getAttribute("name") == id) {
                    // if the workflow indicate a specific value for the param, change the value of the param
                    // do not change it if it's a dynamic value (i.e. contains "%" or has a "from_tool" argument)
                    if(!wfp.hasAttribute("from_tool") && !wfp.getAttribute("value").includes("%")) {
                        // setParamValue(param, wfp.getAttribute("name"), wfp.getAttribute("value"));
                        setParamValue(param, wfp.getAttribute("value"));
                    }
                    // also set the visibility
                    if(wfp.hasAttribute("visibility")) {
                        const visibility = wfp.getAttribute("visibility");
                        if(visibility == "hidden") param.classList.add("w3-hide");
                        else if(visibility == "disabled") disableParameters(param, true);
                    }
                    break; // no need to continue, we found the parameter
                }
            }
            break;
        }
    }
}

function addUrlLineIfAny(parent, base_param) {
    // if the base_param has a url attribute, add a line to the parent with a link to that url
    // if the base_param has a url_label attribute, prepend that label to the url (it would not be clickable)
    if(base_param.hasAttribute("url")) {
        const div = elements.createDiv("", "param-row param-url");
        if(base_param.hasAttribute("url_label")) {
            // const label = document.createElement("label");
            // label.textContent = param.getAttribute("label");
            const label = elements.createElement("label", new Map([["textContent", base_param.getAttribute("url_label")]]));
            div.appendChild(label);
        }
        const url = base_param.getAttribute("url");
        const link = elements.createElement("a", new Map([["href", url], ["textContent", url], ["target", "_blank"]]));
        link.addEventListener("click", (event) => {
            event.preventDefault();
            window.electronAPI.openUrl(url);
        });
        div.appendChild(link);
        parent.appendChild(div);
    }
}

function createParam(id, base_param, input_class) {
    var param = null;
    if(base_param.tagName == "select") param = select.create(id, base_param, input_class);
    else if(base_param.tagName == "checklist") param = checklist.create(id, base_param, input_class);
    else if(base_param.tagName == "keyvalues") param = keyvalues.create(id, base_param, input_class);
    else if(base_param.tagName == "checkbox") param = checkbox.create(id, base_param, input_class);
    else if(base_param.tagName == "string") param = textfield.create(id, base_param, input_class);
    else if(base_param.tagName == "number") param = number.create(id, base_param, input_class);
    else if(base_param.tagName == "range") param = range.create(id, base_param, input_class);
    else if(base_param.tagName == "text") param = elements.createTextLabel(id, base_param, input_class);
    else if(base_param.tagName == "filelist") {
        if(base_param.getAttribute("multiple") == "true") param = filelist.create(id, base_param, input_class, base_param.getAttribute("is_folder") == "true");
        else param = fileinput.create(id, base_param, input_class, base_param.getAttribute("is_folder") == "true");
    }
    // the params may have a url attribute, add a line to the parent with a link to that url
    addUrlLineIfAny(param, base_param)
    // the xml has been validated, so there is no chance that none of the above cases are not matched
    // in case of a workflow, the parameter value can be forced by the workflow
    adjustParameterValue(base_param.getAttribute("name"), param);
    return param;
}

function getParamValues(parent, prependJobId = false) {
    const settings = new Map();
    for(let item of parent.getElementsByClassName("param-select")) select.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-checklist")) checklist.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-keyvalue")) keyvalues.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-checkbox")) checkbox.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-text")) textfield.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-number")) number.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-range")) range.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-file-input")) fileinput.getValue(item, settings);
    for(let item of parent.getElementsByClassName("param-file-list")) filelist.getValue(item, settings);
    return settings;
}

function checkParamValues() {
    const errors = new Array();
    for(let item of document.getElementsByClassName("param-keyvalue")) keyvalues.checkValue(item, errors);
    for(let item of document.getElementsByClassName("param-number")) number.checkValue(item, errors);
    for(let item of document.getElementsByClassName("param-range")) range.checkValue(item, errors);
     return errors;
}

function mapToObjectDeep(value) {
  if (value instanceof Map) {
    const obj = {};
    for (const [key, val] of value.entries()) {
      obj[key] = mapToObjectDeep(val); // recursively convert nested Maps
    }
    return obj;
  } else if (Array.isArray(value)) {
    return value.map(mapToObjectDeep); // recursively handle arrays
  } else {
    return value; // primitives and plain objects stay the same
  }
}

function getParamValuesAsString(prependJobId, parent = document) {
    const json = getParamValues(parent);
    // add the app id to the json object
    json.set("app_id", document.getElementById("cmbAppName").value);
    json.set("advanced_parameters_visible", document.getElementById("btn_header-advanced").classList.contains("advanced-visible"));
    if(document.getElementById("txtWorkflowName").value != "") json.set("workflow_id", document.getElementById("txtWorkflowName").value);
    // make the settings correspond to the current job id (if boolean is true)
    if(prependJobId) {
        const job_id = getCurrentJobId();
        const main_settings = new Map();
        main_settings.set(job_id, json);
        // stringify the map, taking care of nested maps
        const plainObject = mapToObjectDeep(main_settings);
        const text = JSON.stringify(plainObject, null, 2);
        return text;
    } else {
        // convert the json object to a string, using pretty print
        return JSON.stringify(Object.fromEntries(json), (_, value) => {
            if (value instanceof Map) {
                return [...value.entries()];
            }
            return value;
        }, 2);
    }
}

function getSettingsSets() {
    // do the same as getParamValues, but separate the settings by app id
    const settings = new Map();
    for(let tool of document.getElementById("formParameters").children) {
        settings.set(tool.id.replace("-main", ""), getParamValuesAsString(false, tool));
    }
    // return the map as a string (this should work with workflows and jobs)
    return settings
}

function setParamValue(param, value) {
    if(param.classList.contains(`param-select`)) select.setValueTo(param, value);
    if(param.classList.contains(`param-checklist`)) checklist.setValueTo(param, value);
    if(param.classList.contains(`param-keyvalue`)) keyvalues.setValueTo(param, value);
    if(param.classList.contains(`param-checkbox`)) checkbox.setValueTo(param, value);
    if(param.classList.contains(`param-text`)) textfield.setValueTo(param, value);
    if(param.classList.contains(`param-number`)) number.setValueTo(param, value);
    if(param.classList.contains(`param-range`)) range.setValueTo(param, value);
    if(param.classList.contains(`param-fileinput`)) fileinput.setValueTo(param, value);
    if(param.classList.contains(`param-filelist`)) filelist.setValueTo(param, value);
}

function setParamValues(settingsMap) {
    // settings is a map of [job_id, settings]
    // the job_id is not used here, but the order of the settings is important
    // the first settings is for the first child of formParameters, the second for the second child, etc.
    // loop through the children of formParameters and set the values
    const settingsList = Array.from(settingsMap.values());
    const form = document.getElementById("formParameters");
    if(settingsList.length == 0 || form.children.length != settingsList.length) return; // something not right, exit early
    for(let i = 0; i < form.children.length; i++) {
        const settings = new Map(Object.entries(settingsList[i]));
        const div = form.children[i];
        // fill the settings for this div only
        for(let item of div.getElementsByClassName("param-select")) select.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-checklist")) checklist.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-keyvalue")) keyvalues.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-checkbox")) checkbox.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-text")) textfield.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-number")) number.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-range")) range.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-file-input")) fileinput.setValue(item, settings);
        for(let item of div.getElementsByClassName("param-file-list")) filelist.setValue(item, settings);
    }
}

function resetParamValues(parent) {
    for(let item of parent.getElementsByClassName("param-select")) select.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-checklist")) checklist.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-keyvalue")) keyvalues.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-checkbox")) checkbox.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-text")) textfield.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-number")) number.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-range")) range.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-file-input")) fileinput.resetToDefault(item);
    for(let item of parent.getElementsByClassName("param-file-list")) filelist.resetToDefault(item);
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
    elements.setSettingVisibility(parent, section);
    return parent;
}

function getParamFileName() {
    const app_id = document.getElementById("cmbAppName").value;
    const job_id = getCurrentJobId();
    // return `Cumulus-${app_id}.par`;
    return job_id > 0 ? `Cumulus-Job${job_id}-${app_id}.par` : `Cumulus-${app_id}.par`;
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
        // const output = await window.electronAPI.saveDialog("Save the parameters", "parameters.txt", []);
        const filename = getParamFileName();
        const output = await window.electronAPI.saveDialog("Save the parameters", filename, []);
        if(output != "") {
            // TODO this should be tested in order to support workflows
            const settings = getParamValuesAsString(true);
            // ask the server to save the file
            await window.electronAPI.saveFile(output, settings);
        }
    }
}

function loadSettingsFromContent(content) {
    // convert the content to a Map
    const json = JSON.parse(content);
    // the commented code below was meant to handle workflows
    // // old versions were not made for workflows, check and adjust the content
    // if(json.app_id != undefined) {
    //     // if the app_id is set at this level, it means that the file was created before workflows were implemented
    //     // we need to include the content into a Map with the app_id as key
    //     return new Map([[json.app_id, content]]);
    // } else return new Map(Object.entries(json));
    return new Map(Object.entries(json));
}

async function loadParameters(event) {
    event.preventDefault();
    // ask user to select a file
    const filename = getParamFileName();
    const output = await window.electronAPI.browseServer("", "Load the parameters", filename, [{name: `.par files`, extensions: ["par", "txt"]}], ['openFile']);
    if(output != "") {
        // read the file
        const content = await window.electronAPI.loadFile(output[0]);
        // old versions were not made for workflows, check and adjust the content
        const settings = loadSettingsFromContent(content);
        // set the parameters
        setSettings(settings, false);
        if(settings.advanced_parameters_visible) displayAdvancedParameters();
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

function switchWorkflowApp(event, moveNext = true) {
    event.preventDefault();
    // do nothing if the button is disabled
    if(event.target.classList.contains("w3-disabled")) return;
    // if(target.classList.contains("w3-disabled")) return;
    // get the list of apps in the workflow, it's the children of the main form
    const children = document.getElementById("formParameters").children;
    // find the number of the app currently displayed (the only one that is not hidden)
    var currentIndex = -1;
    for(let i = 0; i < children.length; i++) {
        if(!children[i].classList.contains("w3-hide")) {
            currentIndex = i;
            break;
        }
    }
    // hide this div and display the previous one
    if(currentIndex >= 0) { // this condition should always be true, but just in case
        children[currentIndex].classList.add("w3-hide"); // hide the current app
        if(moveNext) children[currentIndex + 1].classList.remove("w3-hide"); // show the next app
        else children[currentIndex - 1].classList.remove("w3-hide"); // show the previous app
    }
    // enable or disable the buttons in the button bar
    document.getElementById("btnGotoPrev").classList.remove("w3-disabled");
    document.getElementById("btnStart").classList.add("w3-hide");
    document.getElementById("btnGotoNext").classList.remove("w3-hide");
    if(!moveNext && currentIndex == 1) {
        document.getElementById("btnGotoPrev").classList.add("w3-disabled");
    }
    if(moveNext && currentIndex == children.length - 2) {
        document.getElementById("btnStart").classList.remove("w3-hide");
        document.getElementById("btnGotoNext").classList.add("w3-hide");
    }
    // update the current app id
    CURRENT_APP_ID = children[moveNext ? currentIndex + 1 : currentIndex - 1].getAttribute("id").replace("-main", "");
}

function createHeaderUrl(url) {
    const url_parent = elements.createDiv("", "url");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = url;
    link.addEventListener("click", (event) => {
        event.preventDefault();
        window.electronAPI.openUrl(url);
    });
    url_parent.appendChild(link);
    return url_parent;
}

function createHeaderSwitchButton(is_before, is_disabled = false, tooltip_text = "") {
    const button = elements.createElement("i", new Map([["textContent", is_before ? "⏴" : "⏵"]]));
    // button.disabled = is_disabled;
    if(is_disabled) button.classList.add("w3-disabled");
    tooltip(button, tooltip_text);
    button.addEventListener("click", (event) => switchWorkflowApp(event, !is_before));
    return button;
}

function createHeader(title, url, isWorkflow, index = 0, total = 1) {
    // create a parent div for the header
    const header = elements.createDiv("", "tool_header");
    // add a div with the title and the buttons to switch between apps in a workflow
    const titlebox = document.createElement("div");
    if(isWorkflow) titlebox.appendChild(createHeaderSwitchButton(true, index == 0, "Previous app in the workflow"));
    titlebox.appendChild(elements.createElement("h3", new Map([["textContent", title]])));
    if(isWorkflow) titlebox.appendChild(createHeaderSwitchButton(false, index == total - 1, "Next app in the workflow"));
    header.appendChild(titlebox);
    // add a second div with the buttons to save/load/reset the parameters
    const buttonbox = document.createElement("div");
    buttonbox.appendChild(elements.createButton("btn_header-advanced", "Advanced", toggleAdvancedParameters, "Display advanced parameters"));
    buttonbox.appendChild(elements.createButton("btn_header-load", "Load", loadParameters, "Load the parameters"));
    buttonbox.appendChild(elements.createButton("btn_header-save", "Save", saveParameters, "Save the parameters as a text file"));
    buttonbox.appendChild(elements.createButton("btn_header-reset", "Reset", (event) => {event.preventDefault; generate_parameters_page();}, "Reset all parameters"));
    header.appendChild(buttonbox);
    // add a row with the url of the app
    if(url != "") header.appendChild(createHeaderUrl(url));
    // return the header
    return header;
}

function createAppPage(parent, index = 0, total = 1) {
    // reset the file lists
    elements.SHARED_FILES_IDS.length = 0;
    elements.LOCAL_FILES_IDS.length = 0;
    // create the main div
    const id = parent.getAttribute("id");
    const div = elements.createDiv(`${id}-main`, "app_settings")
    const url = parent.hasAttribute("url") ? parent.getAttribute("url") : "";
    const is_workflow = isWorkflow(document.getElementById("cmbAppName").value);
    div.appendChild(createHeader(`${parent.getAttribute("name")} ${parent.getAttribute("version")} parameters`, url, is_workflow, index, total));
    for(let section of parent.children) {
        div.appendChild(createSection(id, section));
    }
    return div;
}

export { checkParamValues, conditionalEvent, disableParameters, generate_parameters_page, getFullName, getAppsAsOptionList, getParamValuesAsString, getSettingsSets, isAdvancedParametersVisible, isFormDirty, isWorkflow, resetParamValues, setParamValues, switchWorkflowApp, updateAppList };
