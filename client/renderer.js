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
import * as jc from "./jobcontent.js";
import * as sidebar from "./sidebar.js";
import * as output from "./output.js";
import * as dialog from "./dialog.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as storage from "./storage.js";
import * as utils from "./utils.js";
import * as apps from "./appmanager.js";

var DEBUG_MODE = false;

function loadAppList() {
  // list all the available apps and add them to the list
  // the list of apps is retrieved from the server at startup
  document.getElementById("cmbAppName").innerHTML = "<option value='' disabled></option>" + apps.getAppsAsOptionList("", true);
}

// add the event listeners to the various items of the interface
document.getElementById("btnSummary").addEventListener("click", () => tabs.openTab("tabSummary"));
document.getElementById("btnParameters").addEventListener("click", () => tabs.openTab("tabParameters"));
document.getElementById("btnLogs").addEventListener("click", () => tabs.openTab("tabLogs"));
document.getElementById("btnOutput").addEventListener("click", () => tabs.openTab("tabOutput"));
document.getElementById("cmbAppName").addEventListener("change", () => {
  document.getElementById("btnParameters").disabled = false;
  if(apps.isWorkflow(document.getElementById("cmbAppName").value)) {
    document.getElementById("txtWorkflowName").value = document.getElementById("cmbAppName").value;
  } else {
    document.getElementById("txtWorkflowName").value = "";
  }
  jc.generateButtonBars();
  apps.generate_parameters_page();
});
document.getElementById("aSelect").addEventListener("click", () => output.selectAllCheckboxes());
document.getElementById("aUnselect").addEventListener("click", () => output.unselectAllCheckboxes());
document.getElementById("aExpand").addEventListener("click", () => output.expandAllFolders());
document.getElementById("aCollapse").addEventListener("click", () => output.collapseAllFolders());
document.getElementById("btnOutputDownload").addEventListener("click", async() => await output.downloadOutput());
document.getElementById("txtStorageSearch").addEventListener("keyup", storage.searchStorage);
// settings tab
const btnSettings = document.getElementById("btnSettings");
btnSettings.addEventListener("click", async () => await settings.openSettings());
btnSettings.addEventListener("mouseover", () => {
  const images = btnSettings.getElementsByTagName("img");
  images[0].classList.add("w3-hide");
  images[1].classList.remove("w3-hide");
});
btnSettings.addEventListener("mouseout", () => {
  const images = btnSettings.getElementsByTagName("img");
  images[0].classList.remove("w3-hide");
  images[1].classList.add("w3-hide");
});
document.getElementById("btnSettingsLicense").addEventListener("click", () => settings.toggleLicense());
document.getElementById("btnSettingsOk").addEventListener("click", () => dialog.createDialogQuestion("Save settings", "Are you sure that the new settings are valid?", settings.saveSettings));
document.getElementById("btnSettingsReset").addEventListener("click", () => dialog.createDialogQuestion("Reset settings", "This will restore the default settings, are you sure about that?", settings.resetSettings));
// storage tab
const btnStorage = document.getElementById("btnStorage");
btnStorage.addEventListener("click", async () => storage.openStorage());
btnStorage.addEventListener("mouseover", () => {
  const images = btnStorage.getElementsByTagName("img");
  images[0].classList.add("w3-hide");
  images[1].classList.remove("w3-hide");
});
btnStorage.addEventListener("mouseout", () => {
  const images = btnStorage.getElementsByTagName("img");
  images[0].classList.remove("w3-hide");
  images[1].classList.add("w3-hide");
});
document.getElementById("btnStorageRefresh").addEventListener("click", async () => await storage.refreshStorage());
// search tab
const btnSearch = document.getElementById("btnSearch");
btnSearch.addEventListener("click", async () => search.openSearch());
btnSearch.addEventListener("mouseover", () => {
  const images = btnSearch.getElementsByTagName("img");
  images[0].classList.add("w3-hide");
  images[1].classList.remove("w3-hide");
});
btnSearch.addEventListener("mouseout", () => {
  const images = btnSearch.getElementsByTagName("img");
  images[0].classList.remove("w3-hide");
  images[1].classList.add("w3-hide");
});

// function keydownEvent(event) {
  // if (event.key === 'Control' || event.key === 'Shift') return; // do nothing
  // if(event.ctrlKey && ((!event.shiftKey && event.code === 'Tab') || event.code === 'PageDown')) tabs.goToNextTab();
  // else if(event.ctrlKey && (event.shiftKey && event.code === 'Tab' || event.code === 'PageUp')) tabs.goToPreviousTab();
  // else if(event.ctrlKey && event.key === 'n') { // Ctrl+N: new job (end search if search mode)
  //   if(jobs.isSearchMode()) document.getElementById("clear_search").click();
  //   document.getElementById("new_job").click();
  // } else if(event.ctrlKey && event.key === 'f') btnSearch.click(); // Ctrl+F: search tab
// }

var LAST_TYPED_KEYS = "";
async function keyupEvent(event) {
  // console.log(event);
  // Change tab
  // if(event.key === 'Control' || event.key === 'Shift') return; // do nothing
  if(event.ctrlKey && ((!event.shiftKey && event.code === 'Tab') || event.code === 'PageDown')) tabs.goToNextTab();
  else if(event.ctrlKey && (event.shiftKey && event.code === 'Tab' || event.code === 'PageUp')) tabs.goToPreviousTab();
  // Ctrl+N: new job (end search if search mode)
  else if(event.ctrlKey && event.key === 'n') {
    if(search.isSearchMode()) document.getElementById("clear_search").click();
    document.getElementById("new_job").click();
  }
  // Ctrl+F: search tab
  else if(event.ctrlKey && event.key === 'f') btnSearch.click();
  else if(event.ctrlKey && event.keyCode >= 96 && event.keyCode <= 105) LAST_TYPED_KEYS += event.key; // event.key has to be [0-9]
  else if(!event.ctrlKey && event.keyCode == 17) {
    // open the job if it exists
    const job = document.getElementById(`job_${LAST_TYPED_KEYS}`);
    if(job != null) job.click();
    LAST_TYPED_KEYS = "";
  }

  // DEBUG shortcuts, using Ctrl+T can trigger something we want to test
  // at the moment, it's just used to pause/unpause the refresh of the job list
  if(DEBUG_MODE && event.ctrlKey && event.key === 't') {
    // utils.toggleLoadingScreen();
    // console.log(utils.getBrowsedFiles(document.getElementsByClassName("raw-file")[0]));
    // console.log(utils.fixFilePath(document.getElementById("diann191_txtFasta").value));
    __electronLog.info("TEST KEY!");
    // jobs.pauseRefresh();
    sidebar.pauseRefresh();
    // console.log(apps.getSettingsSets());
    // apps.loadXmlFile();
    // console.log(apps.getLocalFiles());
    // console.log(apps.getSharedFiles());
  // } else if(DEBUG_MODE && event.ctrlKey && event.key === 'K') {
  //   dialog.createDialogInfo("Sleeping mode", "Don't worry your jobs are still running");
  // } else if(DEBUG_MODE && event.ctrlKey && event.key === 'L') {
  //   dialog.createDialogQuestion("Title", "This will restore the default settings, are you sure about that?");
  // } else if(DEBUG_MODE && event.ctrlKey && event.key === 'M') {
  //   dialog.createDialogWarning("Lorem Ipsum", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
  }
}
window.addEventListener('keyup', keyupEvent, true);
window.addEventListener("click", e => {
  if(utils.isFocus()) utils.setActive(true);
});

async function loadRemoteFlavors() {
  // load the host list
  const [flavors] = await window.electronAPI.listFlavors();
  // generate the combo content
  var content = "";
  for(let flavor in flavors) {
    content += `<option value="${flavor}">${flavor} [CPU: ${flavors[flavor].cpu}, RAM: ${flavors[flavor].ram} GB, Weight: ${flavors[flavor].weight}]</option>`;
  }
  // fill all the combo that list the flavors
  document.getElementById("cmbSettingsDefaultStrategy").innerHTML = content;
  document.getElementById("cmbStrategy").innerHTML = content;
  // also set the max weight for the OpenStack strategy
  document.getElementById("txtStrategy").textContent = `Strategy (maximum weight on the server: ${settings.CONFIG.get("openstack.max.flavor")})`;
}

function addTooltips() {
  // TODO probably should move these in each module?
  // Note: the tooltips for the job parameters must be added directly in the apps/*.js files
  // menu buttons
  utils.tooltip(document.getElementById("btnSearch"), "Job search");
  utils.tooltip(document.getElementById("btnStorage"), "Remote storage viewer");
  utils.tooltip(document.getElementById("btnSettings"), "Cumulus configuration");
  // job summary
  utils.tooltip(document.getElementById("txtJobOwner").previousElementSibling, "This field shows the name of the user who created the job, it cannot be modified.");
  // utils.tooltip(document.getElementById("txtJobStatus").previousElementSibling, "A job goes through the following statuses: PENDING, RUNNING, DONE or FAILED or CANCELLED. It will also be archived later."); // PENDING, RUNNING, DONE, FAILED, CANCELLED, ARCHIVED_DONE, ARCHIVED_FAILED, ARCHIVED_CANCELLED
  utils.tooltip(document.getElementById("txtJobStatus").previousElementSibling, "A job goes through the following statuses: PENDING, PREPARING, RUNNING, DONE or FAILED or CANCELLED. It will also be archived later."); // PENDING, PREPARING, RUNNING, DONE, FAILED, CANCELLED, ARCHIVED_DONE, ARCHIVED_FAILED, ARCHIVED_CANCELLED
  utils.tooltip(document.getElementById("cmbAppName").previousElementSibling, "Select the software to run, with its corresponding version.");
  utils.tooltip(document.getElementById("cmbStrategy").previousElementSibling, "The strategy to create the virtual machine. WARNING: the heavier the strategy the longer it may take to start your job.");
  // utils.tooltip(document.getElementById("txtSelectedHost").previousElementSibling, "The host is the virtual machine (VM) where the job has been sent. Each VM has its own resources.");
  utils.tooltip(document.getElementById("txtJobDescription").previousElementSibling, "Add a description to your job, it can help you or others to distinguish a job without reviewing the set of parameters.");
  // settings tab
  utils.tooltip(document.getElementById("txtSettingsServerAddress").previousElementSibling, "Warning: do not change this value unless you are certain!");
  utils.tooltip(document.getElementById("txtSettingsNbJobs").previousElementSibling, "By default Cumulus will only display the 100 last jobs; use -1 to show all the jobs");
  utils.tooltip(document.getElementById("txtSettingsRefreshRate").previousElementSibling, "Number of seconds between each refresh of the job list and job status; minimal value is 5 seconds");
  utils.tooltip(document.getElementById("cmbSettingsDefaultStrategy").previousElementSibling, "The strategy will automatically be selected when you create a new job, you can always change it then");
  utils.tooltip(document.getElementById("txtSettingsDefaultRawFilesPath").previousElementSibling, "Warning: do not change it unless you are certain!");
  utils.tooltip(document.getElementById("txtSettingsDefaultFastaFilesPath").previousElementSibling, "Warning: do not change it unless you are certain!");
  utils.tooltip(document.getElementById("txtSettingsServerPort").previousElementSibling, "Warning: do not change it unless you are certain!");
  utils.tooltip(document.getElementById("txtSettingsRsyncAddress").previousElementSibling, "Warning: do not change it unless you are certain!");
  utils.tooltip(document.getElementById("txtSettingsRsyncPort").previousElementSibling, "Warning: do not change it unless you are certain!");
  // search tab
  utils.tooltip(document.getElementById("txtSearchOwner").previousElementSibling, "Display the jobs for which the owner contains the given tag (case insensitive).");
  utils.tooltip(document.getElementById("txtSearchAppName").previousElementSibling, "Restrict the search to a specific software.");
  utils.tooltip(document.getElementById("txtSearchFile").previousElementSibling, "Display the jobs for which at least one input file contains the given tag (case insensitive).");
  utils.tooltip(document.getElementById("txtSearchTag").previousElementSibling, "Search jobs containing a given tag in their description (case insensitive).");
}

/**
 * Initializes the Cumulus client application.
 * 
 * This async function performs the following steps:
 * 1. Loads application settings.
 * 2. Checks if the client version matches the server version.
 *    - If there is a connection error, displays a dialog for the user to update the server address and retry.
 *    - If successful, continues initialization.
 * 3. Retrieves and sets the debug mode and username.
 * 4. Updates the document title with the current version.
 * 5. Loads available flavors and applications.
 * 6. Initializes the search tab with default settings.
 * 7. Adds tooltips to the UI.
 * 8. Sets up window focus/blur event listeners.
 * 9. Refreshes the sidebar and resets its interval.
 * 10. Opens the first job in the list.
 * 11. Removes the splash screen and displays the main UI.
 * 12. Sets the application as active (mainly for debug mode).
 * 
 * @async
 * @function initialize
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
async function initialize() {
  // load the settings
  await settings.loadSettings();
  // check that the client have the same version number as the server
  var error = await window.electronAPI.checkServer();
  const message = error + "<br/><br/>Check the server address and retry. <br/>If it does not work, warn the administrator and retry later.";
  const value = settings.CONFIG.get("cumulus.controller");
  const onYes = () => { settings.updateSetting("cumulus.controller", dialog.getLastDialog().getElementsByTagName("input")[0].value); }
  if(error != "") {
    dialog.createDialogForBootCheck("Connection error", message, value, onYes, initialize);
  } else {
    // get the username and the configuration
    DEBUG_MODE = await window.electronAPI.getDebugMode();
    utils.setUserName(await window.electronAPI.getUserName())
    document.getElementsByTagName("title")[0].textContent = `Cumulus [${settings.CONFIG.get("cumulus.version")}]`;
    // list all the available flavors
    await loadRemoteFlavors();
    // load the list of available apps
    await apps.updateAppList();
    loadAppList();
    // set default settings to the search tab
    search.initialize();
    search.setDefaultValues();
    // add the tooltip texts
    addTooltips();
    window.addEventListener("focus", (_) => utils.setFocus(true));
    window.addEventListener("blur", (_) => utils.setFocus(false)); // when the app is not in focus, set the interval to 5 minutes
    sidebar.refreshSidebar();
    // window does not have focus at startup when devtools are open
    // load the first job on the list
    jc.openNewJob();
    sidebar.resetInterval();
    // remove the splash screen when all is ready
    document.getElementById("detail").getElementsByTagName("header")[0].style.display = "block";
    document.getElementById("splash").style.display = "none";
    utils.setActive(true); // only required on debug mode
  }
}

initialize();
