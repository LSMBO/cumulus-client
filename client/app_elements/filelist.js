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
import { addBrowsedFiles, browse } from "../utils.js";

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

function create(id, param, input_class, useFolder) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = elements.createDiv("", "param-row param-file-list w3-hover-light-grey");
    parent.name = param.getAttribute("name");
    const header = elements.createDiv("", "param-row");
    const ext = param.getAttribute("format");
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA";
    header.appendChild(elements.createLabel(param));
    header.appendChild(elements.createButton(input_id+"-browse", "Browse...", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: useFolder ? `.${ext} folders` : `.${ext} files`, extensions: [ext] }], [useFolder ? 'openDirectory' : 'openFile', 'multiSelections'], input_id);
    }));
    header.appendChild(elements.createButton(input_id+"-clear", "🗙", (event) => {
        event.preventDefault();
        document.getElementById(input_id).innerHTML = "";
        updateFileList(parent);
    }, "Clear the list"));
    parent.appendChild(header);
    const list = elements.createDiv("", "param-row w3-hide");

    const ul = elements.createElement("ul", new Map([["id", input_id], ["class", `w3-ul w3-border ${input_class}`]]));
    elements.addFileDragAndDropEvents(ul, useFolder, true, [ext]);
    if(type == "RAW") elements.SHARED_FILES_IDS.push(input_id);
    else elements.LOCAL_FILES_IDS.push(input_id);
    list.appendChild(ul);
    parent.appendChild(list);
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // get the id of either ul or input element
    const input = item.getElementsByTagName("ul")[0];
    // call the getFiles function
    const files = elements.getFiles([input.id]);
    // store the files in the map
    map.set(item.name, files);
}

function setValue(item, settings) {
    const ul = item.getElementsByTagName("ul")[0];
    if(settings.has(item.name)) addBrowsedFiles(ul, settings.get(item.name));
}

export { create, getValue, setValue, updateFileList };
