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
    const parent = elements.createDiv("", "param-row param-select w3-hover-light-grey");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(elements.createLabel(param, input_id));
    const input = elements.createElement("select", new Map([["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-select w3-border ${input_class}`]]));
    var defaultValue = "";
    for(let option of param.children) {
        if(option.hasAttribute("value")) {
            const opt = elements.createElement("option", new Map([["value", option.getAttribute("value")], ["textContent", option.textContent]]));
            if(option.hasAttribute("selected") && option.getAttribute("selected")) {
                opt.selected = true;
                defaultValue = option.getAttribute("value");
            }
            input.appendChild(opt);
        }
    }
    parent.appendChild(input);
    elements.addDefaultValue(parent, defaultValue);
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the value of the first select
    const select = item.getElementsByTagName("SELECT")[0];
    if(select != null && select.name) map.set(select.name, select.value);
}

function setValue(item, settings) {
    const select = item.getElementsByTagName("SELECT")[0];
    if(settings.has(select.name)) {
        select.value = settings.get(select.name);
    }
    //else select.value = ""; // reset the value if not in settings
}

function isDefaultValue(item) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return true;
    // compare the value of the first input to the default value
    return item.getElementsByTagName("SELECT")[0].value == item.getElementsByTagName("a")[0].textContent;
}

function isDirty() {
    for(let item of document.getElementsByClassName("param-select")) {
        if(!isDefaultValue(item)) return true;
    }
    return false;
}

export { create, getValue, isDirty, setValue };
