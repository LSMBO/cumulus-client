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

import * as elements from "./elements.js";

function create(id, param, input_class) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = elements.createDiv("", "param-row param-checkbox w3-hover-light-grey");
    parent.appendChild(elements.createLabel(param, input_id));
    const input = elements.createElement("input", new Map([["type", "checkbox"], ["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-check ${input_class}`]]));
    input.checked = param.getAttribute("value") == "true";
    const div = elements.createElement("div", new Map([["class", "cumulus-checkbox"]]));
    const label = elements.createElement("label", new Map([["class", "switch"], ["for", input_id]]));
    label.appendChild(input);
    const slider = elements.createElement("div", new Map([["class", "slider round"]]));
    label.appendChild(slider);
    div.appendChild(label);
    parent.appendChild(div);
    elements.addDefaultValue(parent, param.getAttribute("value") == "true");
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the value of the first input
    const input = item.getElementsByTagName("input")[0];
    if(input != null) map.set(input.name, input.checked);
}

function setValue(item, settings) {
    const input = item.getElementsByTagName("input")[0];
    if(settings.has(input.name) && settings.get(input.name)) {
        input.checked = true;
    } else input.checked = false; // reset the value if not in settings
}

function setValueTo(item, value) {
    item.getElementsByTagName("input")[0].checked = value;
}

function copyFrom(source, destination) {
    const value = source.getElementsByTagName("input")[0].checked;
    destination.getElementsByTagName("input")[0].checked = value;
}

function resetToDefault(item) {
    // default value is stored in the <a> tag
    const defaultValue = item.getElementsByTagName("a")[0].textContent == "true";
    item.getElementsByTagName("input")[0].checked = defaultValue;
}

function isDefaultValue(item) {
    // do not check the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return true;
    // get default value
    const defaultValue = item.getElementsByTagName("a")[0].textContent == "true";
    // compare the value of the first input to the default value
    return item.getElementsByTagName("input")[0].checked == defaultValue;
}

function isDirty() {
    for(let item of document.getElementsByClassName("param-checkbox")) {
        if(!isDefaultValue(item)) return true;
    }
    return false;
}

export { copyFrom, create, getValue, isDirty, resetToDefault, setValue, setValueTo };
