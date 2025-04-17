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
import { browse } from "../utils.js";

function create(id, param, input_class, useFolder) {
    const input_id = `${id}-${param.getAttribute("name")}`;
    const parent = elements.createDiv("", "param-row param-file-input w3-hover-light-grey");
    parent.appendChild(elements.createLabel(param, input_id));
    const input = elements.createElement("input", new Map([["type", "text"], ["id", input_id], ["name", param.getAttribute("name")], ["class", `w3-input w3-border ${input_class}`]]));
    const ext = param.getAttribute("format").toUpperCase().split(";"); // allow multiple extensions
    const type = param.getAttribute("is_raw_input") == "true" ? "RAW" : "FASTA"; // TODO rename RAW and FASTA to SHARED and LOCAL
    if(param.hasAttribute("value")) input.value = param.getAttribute("value");
    elements.addFileDragAndDropEvents(input, useFolder, false, ext);
    parent.appendChild(input);
    parent.appendChild(elements.createButton(input_id+"-btn", "…", (event) => {
        event.preventDefault();
        browse(type, param.getAttribute("label"), [ { name: param.getAttribute("label"), extensions: ext }], [useFolder ? 'openDirectory' : 'openFile'], input_id);
    }));
    if(type == "RAW") elements.SHARED_FILES_IDS.push(input_id);
    else elements.LOCAL_FILES_IDS.push(input_id);
    elements.setSettingVisibility(parent, param);
    return parent;
}

function getValue(item, map) {
    // get the id of either ul or input element
    // const input = item.getElementsByTagName("input").length > 0 ? item.getElementsByTagName("input")[0] : item.getElementsByTagName("ul")[0];
    const input = item.getElementsByTagName("input")[0];
    // call the getFiles function
    const files = elements.getFiles([input.id]);
    // only return one file (the first one)
    if(files.length == 0) return;
    // store the files in the map
    map.set(input.name, files[0]);
}

function setValue(item, settings) {
    const input = item.getElementsByTagName("input")[0];
    if(settings.has(input.name)) input.value = settings.get(input.name);
}

export { create, getValue, setValue };
