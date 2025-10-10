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

// function to update the label of the checklist when the user selects an option
function updateLabel(input) {
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

function toggleChecklist(event, dropdown, i) {
    // toggle the dropdown when the user clicks on the input or the label
    if(event.target.tagName == "DIV") event.preventDefault();
    if(!dropdown.contains(event.target)) {
        if(dropdown.classList.contains("w3-hide")) {
            dropdown.classList.remove("w3-hide");
            i.classList.replace("checklist-down", "checklist-up");
        } else {
            dropdown.classList.add("w3-hide");
            i.classList.replace("checklist-up", "checklist-down");
        }
    }
}

function create(id, param, input_class) {
    // similar to a <select>, but used to display a list of checkboxes
    const parent = elements.createDiv("", "param-row param-checklist w3-hover-light-grey");
    parent.name = param.getAttribute("name");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(elements.createLabel(param, input_id));
    const input = elements.createElement("div", new Map([["id", input_id], ["name", param.getAttribute("name")], ["tabindex", "0"], ["class", `w3-select w3-border checklist ${input_class}`]]));
    const span = document.createElement("span");
    const label = document.createElement("label");
    const i = elements.createElement("i", new Map([["class", "checklist-down"]]));
    span.appendChild(i);
    span.appendChild(label);
    input.appendChild(span);
    const dropdown = document.createElement("div");
    dropdown.classList.add("w3-hide");
    const defaultValues = new Array();
    for(let option of param.children) {
        const opt = elements.createElement("input", new Map([["type", "checkbox"], ["id", `${input_id}_${option.getAttribute("value")}`], ["name", param.getAttribute("name")], ["value", option.getAttribute("value")], ["class", `w3-check ${input_class}`]]));
        if(option.hasAttribute("selected") && option.getAttribute("selected")) {
            opt.checked = true;
            defaultValues.push("true");
        } else defaultValues.push("false");
        opt.addEventListener("change", (e) => updateLabel(input));
        // create a label for this checkbox
        const label = elements.createElement("label", new Map([["for", opt.id], ["textContent", option.textContent]]));
        label.appendChild(opt);
        // insert the label with the checkbox in the input div
        dropdown.appendChild(label);
    }
    input.appendChild(dropdown);
    parent.appendChild(input);
    elements.addDefaultValue(parent, defaultValues.join("-"));
    updateLabel(input);
    // add an event to display the dropdown when the label is clicked
    input.addEventListener("click", (event) => toggleChecklist(event, dropdown, i));
    // add an event to do the same when the input is focused and the space key is pressed
    input.addEventListener("keydown", (event) => {
        if(event.key == "Enter" || event.key == " ") toggleChecklist(event, dropdown, i);
    });

    // also add an event to hide the dropdown when clicking outside of it
    document.addEventListener("click", (event) => {
        if(!input.contains(event.target)) {
            dropdown.classList.add("w3-hide");
            i.classList.replace("checklist-up", "checklist-down");
        }
    });
    // set param visibility
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the value of the input
    const values = new Array();
    for(let input of item.getElementsByTagName("input")) {
        if(input.checked) values.push(input.value);
    }
    if(values.length == 0) return; // no values to store
    map.set(item.name, values);
}

function setValue(item, settings) {
    if(settings.has(item.name)) {
        const values = settings.get(item.name);
        for(let input of item.getElementsByTagName("input")) {
            if(values.includes(input.value)) input.checked = true;
            else input.checked = false;
        }
    } else {
        for(let input of item.getElementsByTagName("input")) {
            input.checked = false;
        }
    }
    updateLabel(item.children[1]);
}

function setValueTo(item, value) {
    if(value) {
        for(let input of item.getElementsByTagName("input")) {
            if(value.includes(input.value)) input.checked = true;
            else input.checked = false;
        }
    } else {
        for(let input of item.getElementsByTagName("input")) {
            input.checked = false;
        }
    }
}

function copyFrom(source, destination) {
    const source_inputs = source.getElementsByTagName("input");
    const dest_inputs = destination.getElementsByTagName("input");
    for(let i = 0; i < source_inputs.length; i++) {
        dest_inputs[i].checked = source_inputs[i].checked;
    }
}

function resetToDefault(item) {
    // default value is stored in the <a> tag
    const defaultValues = item.getElementsByTagName("a")[0].textContent.split("-");
    const inputs = item.getElementsByTagName("input");
    for(let i = 0; i < inputs.length; i++) {
        if(i < defaultValues.length && defaultValues[i] == "true") inputs[i].checked = true;
        else inputs[i].checked = false;
    }
    updateLabel(item.children[1]);
}

function isDefaultValue(item) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return true;
    // get the default value of the input
    const defaultValue = item.getElementsByTagName("a")[0].textContent;
    // get the list of selected values
    var selectedValues = new Array();
    for(let input of item.getElementsByTagName("input")) {
        selectedValues.push(input.checked ? "true" : "false");
    }
    // compare the default value with the selected values
    return defaultValue == selectedValues.join("-");
}

function isDirty() {
    for(let item of document.getElementsByClassName("param-checklist")) {
        if(!isDefaultValue(item)) return true;
    }
    return false;
}

export { copyFrom, create, getValue, isDirty, resetToDefault, setValue, setValueTo };
