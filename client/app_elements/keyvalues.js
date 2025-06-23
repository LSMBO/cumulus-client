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

import { tooltip } from "../utils.js";
import * as elements from "./elements.js";

function createHeader(table, param) {
    const row = document.createElement("tr");
    const th1 = elements.createElement("th", new Map([["textContent", param.getAttribute("label_key")]]));
    th1.appendChild(elements.createElement("i", new Map([["textContent", param.getAttribute("placeholder_key")]])));
    row.appendChild(th1);
    const th2 = elements.createElement("th", new Map([["textContent", param.getAttribute("label_value")]]));
    th2.appendChild(elements.createElement("i", new Map([["textContent", param.getAttribute("placeholder_value")]])));
    row.appendChild(th2);
    const th3 = document.createElement("th");
    const button = elements.createElement("button", new Map([["textContent", "🗙"]]));
    button.addEventListener("click", (e) => {
        e.preventDefault();
        const table = e.target.parentElement.parentElement.parentElement;
        addRow(table, "", "");
        table.rows[table.rows.length - 1].getElementsByTagName("input")[0].focus();
    });
    tooltip(button, "Add a new element");
    th3.appendChild(button);
    // add value type as a hidden element, so that the type can be used to create the input fields
    th3.appendChild(elements.createElement("i", new Map([["textContent", param.getAttribute("type_of")]])));
    row.appendChild(th3);
    table.appendChild(row);
}

function addRow(table, key, value) {
    // the table already has a header line, containing placeholders for the key and value and the type of value
    const placeholder_key = table.getElementsByTagName("th")[0].getElementsByTagName("i")[0].textContent;
    const placeholder_value = table.getElementsByTagName("th")[1].getElementsByTagName("i")[0].textContent;
    const type_of = table.getElementsByTagName("th")[2].getElementsByTagName("i")[0].textContent;
    // create a new row with the key and value
    const row = document.createElement("tr");
    const cell1 = document.createElement("td");
    cell1.appendChild(elements.createElement("input", new Map([["type", "text"], ["class", "w3-input w3-border"], ["value", key], ["placeholder", placeholder_key]])));
    row.appendChild(cell1);
    const cell2 = document.createElement("td");
    if(type_of == "integer") {
        cell2.appendChild(elements.createElement("input", new Map([["type", "number"], ["class", "w3-input w3-border"], ["value", value], ["placeholder", placeholder_value]])));
    } else if(type_of == "float") {
        cell2.appendChild(elements.createElement("input", new Map([["type", "number"], ["step", 0.01], ["class", "w3-input w3-border"], ["value", value], ["placeholder", placeholder_value]])));
    } else {
        cell2.appendChild(elements.createElement("input", new Map([["type", "text"], ["class", "w3-input w3-border"], ["value", value], ["placeholder", placeholder_value]])));
    }
    row.appendChild(cell2);
    const td = document.createElement("td");
    const button = elements.createElement("button", new Map([["textContent", "🗙"]]));
    button.addEventListener("click", (e) => {
        e.preventDefault();
        const row = e.target.parentElement.parentElement;
        const table = row.parentElement;
        row.remove();
        if(table.rows.length == 1) addRow(table, "", "");
    });
    tooltip(button, "Remove this element");
    td.appendChild(button);
    row.appendChild(td);
    table.appendChild(row);
}

function create(id, param, input_class) {
    // list of key-value pairs, one per line with two text fields and a button to remove the current line
    // there is also a header line with the label and a button to add a new line
    const parent = elements.createDiv("", "param-row param-keyvalue w3-hover-light-grey");
    parent.name = param.getAttribute("name");
    const input_id = `${id}-${param.getAttribute("name")}`;
    parent.appendChild(elements.createLabel(param, input_id));
    // determine the classes for the main table (using __class__ style to store information in the DOM, but they are not used in the CSS)
    const classes = ["w3-ul"];
    if(param.hasAttribute("is_list") && param.getAttribute("is_list") == "true") classes.push("__is_list__");
    // create an element with a first line containing the headers and the '+' button
    const table = elements.createElement("table", new Map([["id", input_id], ["name", param.getAttribute("name")], ["class", classes.join(" ")]]));
    createHeader(table, param);
    const defaultValues = new Array();
    for(let option of param.children) {
        addRow(table, option.getAttribute("key"), option.getAttribute("value"));
        defaultValues.push(option.getAttribute("key")+"-"+option.getAttribute("value"));
    }
    // make sure to display at least one row
    if(table.rows.length == 1) addRow(table, "", "");
    parent.appendChild(table);
    elements.addDefaultValue(parent, defaultValues.join("-"));
    return parent;
}

function getValue(item, map) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // store the values differently is the elements are lists or not
    const is_list = item.getElementsByTagName("table")[0].classList.contains("__is_list__");
    // get the value of the table
    const values = new Map();
    for(let row of item.getElementsByTagName("tr")) {
        if(row.getElementsByTagName("th").length > 0) continue; // skip the header row
        const key = row.getElementsByTagName("input")[0].value;
        const value = row.getElementsByTagName("input")[1].value;
        if(key != "" && value != "") {
            // values.set(key, value);
            // if it's a list, store the values in an array, the key may have been already stored
            if(is_list) {
                if(!values.has(key)) values.set(key, new Array());
                values.get(key).push(value);
            } else {
                // if it's not a list, store the value as a key-value pair
                values.set(key, value);
            }
        }
    }
    if(values.size == 0) return; // no values to store
    map.set(item.name, values);
}

function checkValue(item, errors) {
    // do not check anything if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return;
    // get the expected value type
    const type_of = item.getElementsByTagName("th")[2].getElementsByTagName("i")[0].textContent;
    // check each row of the table
    for(let row of item.getElementsByTagName("tr")) {
        if(row.getElementsByTagName("th").length > 0) continue; // skip the header row
        const key = row.getElementsByTagName("input")[0].value;
        const value = row.getElementsByTagName("input")[1].value;
        // if one key or value is missing, it's an error
        if((key == "" && value != "") || (key != "" && value == "")) {
            errors.push(`A value of '${item.getElementsByTagName("label")[0].textContent}' is missing`);
            return;
        }
        // if one value is not a number, it's an error
        if((type_of == "integer" || type_of == "float") && isNaN(value)) {
            errors.push(`A value of '${item.getElementsByTagName("label")[0].textContent}' is not a number`);
            return;
        }
    }
}

function setValue(item, settings) {
    const table = item.getElementsByTagName("table")[0];
    // console.log(table);
    // remove all rows except for the header row
    while(table.rows.length > 1) table.deleteRow(1);
    // add the new rows eventually
    if(settings.has(item.name)) {
        // the setting is a map of key-value pairs
        const map = settings.get(item.name);
        // console.log(map);
        // loop over the map and create a new row for each key-value pair
        for(let [key, value] of map) {
            // console.log(typeof value);
            // addRow(table, key, value);
            // if the value is an array, loop over the array and create a new row for each value
            if(Array.isArray(value)) {
                for(let v of value) addRow(table, key, v);
            } else addRow(table, key, value);
        }
    }
    // make sure to display at least one row
    if(table.rows.length == 1) addRow(table, "", "");
}

function setValueTo(item, values) {
    const table = item.getElementsByTagName("table")[0];
    // remove all rows except for the header row
    while(table.rows.length > 1) table.deleteRow(1);
    // loop over the map and create a new row for each key-value pair
    for(let [key, value] of values) {
        // if the value is an array, loop over the array and create a new row for each value
        if(Array.isArray(value)) {
            for(let v of value) addRow(table, key, v);
        } else addRow(table, key, value);
    }
}

function copyFrom(source, destination) {
    const source_table = source.getElementsByTagName("table")[0];
    const dest_table = destination.getElementsByTagName("table")[0];
    for(let row of source_table.getElementsByTagName("tr")) {
        const key = row.getElementsByTagName("input")[0].value;
        const value = row.getElementsByTagName("input")[1].value;
        addRow(dest_table, key, value);
    }
}

function isDefaultValue(item) {
    // do not get the value if the element is not visible
    if(!elements.hasVisibleWhenParent(item)) return true;
    // get the default value of the input
    const defaultValue = item.getElementsByTagName("a")[0].textContent;
    // get the list of selected values
    const selectedValues = new Array();
    for(let row of item.getElementsByTagName("tr")) {
        if(row.getElementsByTagName("th").length > 0) continue; // skip the header row
        const key = row.getElementsByTagName("input")[0].value;
        const value = row.getElementsByTagName("input")[1].value;
        if(key != "" && value != "") selectedValues.push(key+"-"+value);
    }
    // compare the default value to the selected values
    return defaultValue == selectedValues.join("-");
}

function isDirty() {
    for(let item of document.getElementsByClassName("param-keyvalue")) {
        if(!isDefaultValue(item)) return true;
    }
    return false;
}

export { copyFrom, checkValue, create, getValue, isDirty, setValue, setValueTo };
