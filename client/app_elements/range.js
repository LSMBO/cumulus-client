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
    const parent = elements.createDiv("", "param-row param-range w3-hover-light-grey");
    parent.appendChild(elements.createLabel(param, input_id));
    const value1 = param.hasAttribute("value") ? param.getAttribute("value") : "";
    parent.appendChild(elements.createInputNumber(input_id, param, input_class, value1, param.hasAttribute("placeholder") ? param.getAttribute("placeholder") : "", param.getAttribute("name")+"-min"));
    const value2 = param.hasAttribute("value2") ? param.getAttribute("value2") : "";
    parent.appendChild(elements.createInputNumber(input_id+"-2", param, input_class, value2, param.hasAttribute("placeholder2") ? param.getAttribute("placeholder2") : "", param.getAttribute("name")+"-max"));
    elements.addDefaultValue(parent, `${value1}-${value2}`);
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the value of the first two inputs
    const inputs = item.getElementsByTagName("input");
    if(inputs[0].value != "" && inputs[1].value != "") { // if one value is empty, do not set the value (user is made aware of this with checkValue)
        map.set(inputs[0].name, inputs[0].value);
        map.set(inputs[1].name, inputs[1].value);
    }
}

function checkValue(item, errors) {
    // do not check anything if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the values
    const value1 = item.getElementsByTagName("input")[0].value;
    const value2 = item.getElementsByTagName("input")[1].value;
    // if one value is missing, it's an error
    if(value1 == "" || value2 == "") errors.push(`A value of '${item.getElementsByTagName("label")[0].textContent}' is missing`);
    // if one value is not a number, it's an error
    if(isNaN(value1) || isNaN(value2)) errors.push(`A value of '${item.getElementsByTagName("label")[0].textContent}' is not a number`);
}

function setValue(item, settings) {
    for(let input of item.getElementsByTagName("input")) {
        if(settings.has(input.name)) {
            input.value = settings.get(input.name);
        }
        // else input.value = "";
    }
}

function setValueTo(item, value) {
    const inputs = item.getElementsByTagName("input");
    inputs[0].value = value[0];
    inputs[1].value = value[1];
}

function copyFrom(source, destination) {
    for(let i in source.getElementsByTagName("input")) {
        const value = source.getElementsByTagName("input")[i].value;
        destination.getElementsByTagName("input")[i].value = value;
    }
}

function resetToDefault(item) {
    // default value is stored in the <a> tag
    const defaults = item.getElementsByTagName("a")[0].textContent.split("-");
    item.getElementsByTagName("input")[0].value = defaults[0];
    item.getElementsByTagName("input")[1].value = defaults[1];
}

function isDefaultValue(item) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return true;
    // compare the value of the first input to the default value
    return item.getElementsByTagName("input")[0].value + "-" + item.getElementsByTagName("input")[1].value == item.getElementsByTagName("a")[0].textContent;
}

function isDirty() {
    for(let item of document.getElementsByClassName("param-range")) {
        if(!isDefaultValue(item)) return true;
    }
    return false;
}

export { copyFrom, checkValue, create, getValue, isDirty, resetToDefault, setValue, setValueTo };
