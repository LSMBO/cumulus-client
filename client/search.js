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

import * as tabs from "./tabs.js";
import * as jobs from "./joblist.js";
import * as settings from "./settings.js";
import * as utils from "./utils.js";
import * as apps from "./apps/applist.js";

const LAST_SEARCH_SETTINGS = new Map();
const mainSearchStatus = document.getElementById("divSearchStatusElement");
// const divSearchStatus = document.getElementById("divSearchStatus");
// const txtSearchStatus = document.getElementById("txtSearchStatus");
const txtSearchAppName = document.getElementById("txtSearchAppName");

function openSearch() {
    tabs.openTab("tabSearch");
}

// function updateStatusList() {
//     txtSearchStatus.innerHTML = "";
//     for(let label of divSearchStatus.getElementsByTagName("label")) {
//         if(label.children[0].checked) txtSearchStatus.innerHTML += `<label>${label.textContent}</label>`;
//     }
// }

function setDefaultValues() {
    // owner: utils.getUserName()
    document.getElementById("txtSearchOwner").value = "";
    // status: check all
    // for(let input of divSearchStatus.getElementsByTagName("input")) {
    //     input.checked = true;
    // }
    // updateStatusList();
    utils.setDefaultCheckboxList(mainSearchStatus);
    txtSearchAppName.selectedIndex = 0;
    document.getElementById("txtSearchFile").value = "";
    document.getElementById("txtSearchTag").value = "";
    document.getElementById("cmbSearchDate").selectedIndex = 0;
    document.getElementById("txtSearchDate1").value = "";
    document.getElementById("txtSearchDate2").value = "";
    document.getElementById("txtSearchNbJobs").value = settings.CONFIG.get("max.nb.jobs");
}

function storeSearchSettings(owner, app, file, desc, statuses, date, from, to, number) {
  LAST_SEARCH_SETTINGS.clear();
  LAST_SEARCH_SETTINGS.set("owner", owner);
  LAST_SEARCH_SETTINGS.set("app", app);
  LAST_SEARCH_SETTINGS.set("file", file);
  LAST_SEARCH_SETTINGS.set("desc", desc);
  LAST_SEARCH_SETTINGS.set("statuses", statuses);
  LAST_SEARCH_SETTINGS.set("date", date);
  LAST_SEARCH_SETTINGS.set("from", from);
  LAST_SEARCH_SETTINGS.set("to", to);
  LAST_SEARCH_SETTINGS.set("number", number);
}

function getPreviousSearchSettings() {
  const owner = LAST_SEARCH_SETTINGS.get("owner");
  const app = LAST_SEARCH_SETTINGS.get("app");
  const file = LAST_SEARCH_SETTINGS.get("file");
  const desc = LAST_SEARCH_SETTINGS.get("desc");
  const statuses = LAST_SEARCH_SETTINGS.get("statuses");
  const date = LAST_SEARCH_SETTINGS.get("date");
  const from = LAST_SEARCH_SETTINGS.get("from");
  const to = LAST_SEARCH_SETTINGS.get("to");
  const number = LAST_SEARCH_SETTINGS.get("number");
  return [owner, app, file, desc, statuses, date, from, to, number];
}

function getCurrentSearchSettings() {
  const owner = document.getElementById("txtSearchOwner").value;
  const app = document.getElementById("txtSearchAppName").value;
  const file = document.getElementById("txtSearchFile").value;
  const desc = document.getElementById("txtSearchTag").value;
//   const statuses = [];
//   for(let lbl of txtSearchStatus.getElementsByTagName("label")) {
//       statuses.push(lbl.textContent);
//   }
//   const statuses = utils.getCheckboxListSelection(mainSearchStatus);
  const statuses = Object.entries(utils.getCheckboxListSelection(mainSearchStatus)).map(kv => kv[1]);
  const date = document.getElementById("cmbSearchDate").value;
  const from = document.getElementById("txtSearchDate1").value;
  const to = document.getElementById("txtSearchDate2").value;
  const number = document.getElementById("txtSearchNbJobs").value;
  return [owner, app, file, desc, statuses, date, from, to, number];
}

// document.addEventListener("click", (event) => {
//     if(event.target.id == "txtSearchStatus" || (event.target.parentElement != null && event.target.parentElement.id == "txtSearchStatus")) {
//         // toggle the list of statuses when clicking on the main div
//         if(divSearchStatus.classList.contains("w3-hide")) {
//             divSearchStatus.classList.remove("w3-hide");
//         } else {
//             divSearchStatus.classList.add("w3-hide");
//         }
//     } else if(!divSearchStatus.contains(event.target)) {
//         // hide the list of statuses when clicking anywhere else, except if it's on the list itself
//         divSearchStatus.classList.add("w3-hide");
//     }
// });
utils.addCheckboxList(mainSearchStatus, "Status", {"pending": "Pending", "running": "Running", "done": "Done", "failed": "Failed", "cancelled": "Cancelled", "archived": "Archived"}, "Restrict the search to specific statuses (if no status is selected then the filter will be disabled).");

// divSearchStatus.addEventListener("click", (_) => updateStatusList());
document.getElementById("btnSearchMe").addEventListener("click", (e) => { e.preventDefault(); document.getElementById("txtSearchOwner").value = utils.getUserName(); });
document.getElementById("btnSearchOk").addEventListener("click", async (e) => {
    e.preventDefault();
    // jobs.searchJobs(false);
    jobs.setSearchMode(true);
    jobs.reloadJobList(false);
});
document.getElementById("btnSearchReset").addEventListener("click", (e) => {
    e.preventDefault();
    setDefaultValues();
    // jobs.getLastJobs();
    jobs.setSearchMode(false);
    jobs.reloadJobList();
});

// initialize on first opening
txtSearchAppName.innerHTML = "<option value='all' selected></option>";
for(let [id, _] of apps.list()) {
    txtSearchAppName.innerHTML += `<option value="${id}">${apps.getFullName(id)}</option>`;
}

export { getCurrentSearchSettings, getPreviousSearchSettings, openSearch, setDefaultValues, storeSearchSettings };
