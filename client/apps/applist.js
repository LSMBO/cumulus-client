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

import * as diann181 from "./diann181.js";
import * as diann191 from "./diann191.js";
import * as test from "./test.js"; // TODO remove this app

const APP_LIST = new Map();

function addApplication(app) {
    APP_LIST.set(app.id, app);
}

// WARNING, this is where the actual apps are made available to the user
// MAKE SURE that you only add apps that are available on the server!!
addApplication(diann181.get());
addApplication(diann191.get()); // TODO should we put this app first? or keep the alphabetical order?
addApplication(test.get());

function list() {
    return APP_LIST;
}

function get(id) {
    return APP_LIST.get(id);
}

function has(id) {
    return APP_LIST.has(id);
}

function getFullName(id) {
    if(APP_LIST.has(id)) return APP_LIST.get(id).toString();
    return id;
}

function getOptionList(selectedItem = "") {
    var html = "";
    for(let [id, app] of APP_LIST) {
        var sel = selectedItem == id ? "selected='true'" : "";
        html += `<option value="${id}" ${sel}>${app.toString()}</option>`;
    }
    return html;
}

export { get, getFullName, getOptionList, has, list };
