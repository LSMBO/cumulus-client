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

// import other modules
import * as tabs from "./tabs.js";
import * as job from "./job.js";
import * as jobs from "./joblist.js";
import * as output from "./output.js";
import * as dialog from "./dialog.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as storage from "./storage.js";
import * as utils from "./utils.js";
import * as apps from "./applist.js";

var DEBUG_MODE = false;

function loadAppList() {
  // list all the available apps and add them to the list
  // WARNING, this list has to match the list of available apps on the server!!
  document.getElementById("cmbAppName").innerHTML = "<option value='' disabled></option>" + apps.getOptionList();
}

document.getElementById("btnSummary").addEventListener("click", () => tabs.openTab("tabSummary"));
document.getElementById("btnParameters").addEventListener("click", () => tabs.openTab("tabParameters"));
document.getElementById("btnLogs").addEventListener("click", () => tabs.openTab("tabLogs"));
document.getElementById("btnOutput").addEventListener("click", () => tabs.openTab("tabOutput"));
document.getElementById("cmbAppName").addEventListener("change", () => {
  document.getElementById("btnParameters").disabled = false;
  document.getElementById("btnNext").disabled = false;
  job.setAppParameters();
});
document.getElementById("aSelect").addEventListener("click", () => output.selectAllCheckboxes());
document.getElementById("aUnselect").addEventListener("click", () => output.unselectAllCheckboxes());
document.getElementById("aExpand").addEventListener("click", () => output.expandAllFolders());
document.getElementById("aCollapse").addEventListener("click", () => output.collapseAllFolders());
document.getElementById("btnClone").addEventListener("click", () => job.cloneJob());
document.getElementById("btnClone2").addEventListener("click", () => job.cloneJob());
document.getElementById("btnNext").addEventListener("click", () => tabs.openTab("tabParameters"));
document.getElementById("btnStart").addEventListener("click", () => job.startJob());
// document.getElementById("btnCancel").addEventListener("click", () => dialog.createDialogQuestion("Warning", "Are you sure you want to cancel this job?", job.cancelJob));
// document.getElementById("btnDelete").addEventListener("click", () => dialog.createDialogQuestion("Warning", "Are you sure you want to delete this job?", job.deleteJob));
document.getElementById("btnCancel").addEventListener("click", job.cancelJob);
document.getElementById("btnDelete").addEventListener("click", job.deleteJob);
document.getElementById("btnCancel2").addEventListener("click", job.cancelJob);
document.getElementById("btnDelete2").addEventListener("click", job.deleteJob);
document.getElementById("copyStdout").addEventListener("click", async () => await tabs.copyToClipboard("copyStdout", document.getElementById("stdout")));
document.getElementById("copyStderr").addEventListener("click", async () => await tabs.copyToClipboard("copyStderr", document.getElementById("stderr")));
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
    if(jobs.isSearchMode()) document.getElementById("clear_search").click();
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

  if(DEBUG_MODE && event.ctrlKey && event.key === 't') {
    // utils.toggleLoadingScreen();
    // console.log(utils.getBrowsedFiles(document.getElementsByClassName("raw-file")[0]));
    // console.log(utils.fixFilePath(document.getElementById("diann191_txtFasta").value));
    __electronLog.info("TEST KEY!");
    jobs.pauseRefresh();
    // apps.loadXmlFile();
    // console.log(apps.getLocalFiles());
    // console.log(apps.getSharedFiles());
  } else if(DEBUG_MODE && event.ctrlKey && event.key === 'K') {
    dialog.createDialogInfo("Sleeping mode", "Don't worry your jobs are still running");
  } else if(DEBUG_MODE && event.ctrlKey && event.key === 'L') {
    dialog.createDialogQuestion("Title", "This will restore the default settings, are you sure about that?");
  } else if(DEBUG_MODE && event.ctrlKey && event.key === 'M') {
    dialog.createDialogWarning("Lorem Ipsum", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
  }
}
// window.addEventListener('keydown', keydownEvent, true);
window.addEventListener('keyup', keyupEvent, true);
window.addEventListener("resize", tabs.resizeLogAreas);
window.addEventListener("click", e => {
  if(utils.isFocus()) utils.setActive(true);
});

async function loadRemoteHosts() {
  // load the host list
  const [hosts] = await window.electronAPI.listHosts();
  // generate the combo content
  var content = "<option value=\"first_available\">Use the first available host</option>";
  content += "<option value=\"best_cpu\">Wait for the host with the most CPU</option>";
  content += "<option value=\"best_ram\">Wait for the host with the most RAM</option>";
  for(let host of hosts) {
    content += `<option value="host:${host["name"]}">Use host '${host["name"]}' (${host["cpu"]} CPU, ${host["ram"]} GB of RAM), wait if it's used</option>`;
  }
  // fill all the combo that list the hosts
  document.getElementById("cmbSettingsDefaultStrategy").innerHTML = content;
  document.getElementById("cmbStrategy").innerHTML = content;
}

function addTooltips() {
  // TODO probably should move these in each module?
  // Note: the tooltips for the job parameters must be added directly in the apps/*.js files
  // menu buttons
  utils.tooltip(document.getElementById("btnSearch"), "Advanced job search");
  utils.tooltip(document.getElementById("btnStorage"), "Remote storage viewer");
  utils.tooltip(document.getElementById("btnSettings"), "Cumulus configuration");
  // job summary
  utils.tooltip(document.getElementById("txtJobOwner").previousElementSibling, "This field cannot be modified, it helps with tracking the jobs.");
  utils.tooltip(document.getElementById("txtJobStatus").previousElementSibling, "A job goes through the following statuses: PENDING, RUNNING, DONE or FAILED or CANCELED. It will also be archived later."); // PENDING, RUNNING, DONE, FAILED, CANCELLED, ARCHIVED_DONE, ARCHIVED_FAILED, ARCHIVED_CANCELLED
  utils.tooltip(document.getElementById("cmbAppName").previousElementSibling, "Select the software to run, with its corresponding version.");
  utils.tooltip(document.getElementById("cmbStrategy").previousElementSibling, "The software will run on a virtual machine (VM) in the Cloud, the strategy allows you to influence which VM will be selected.");
  utils.tooltip(document.getElementById("txtSelectedHost").previousElementSibling, "The host is the virtual machine (VM) where the job has been sent. Each VM has its own resources.");
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
  utils.tooltip(document.getElementById("txtSearchTag").previousElementSibling, "Search a tag in the description of a job (case insensitive).");
}

async function initialize() {
  // check that the client have the same version number as the server
  const error = await window.electronAPI.checkServer();
  if(error != "") dialog.createDialogWarning("Connection error", error + "<br /><br />Warn the admin and restart later.", async () => await window.electronAPI.exitApp(), "Quit");
  else {
    // get the username and the configuration
    DEBUG_MODE = await window.electronAPI.getDebugMode();
    utils.setUserName(await window.electronAPI.getUserName())
    await settings.loadSettings();
    document.getElementsByTagName("title")[0].textContent = `Cumulus [${settings.CONFIG.get("cumulus.version")}]`;
    // adjust the size of the elements
    tabs.resizeLogAreas();
    // list all the available hosts
    await loadRemoteHosts();
    // load the list of available apps
    await apps.updateAppList();
    loadAppList();
    // set default settings to the search tab
    search.setDefaultValues();
    // add the tooltip texts
    addTooltips();
    window.addEventListener("focus", (_) => {
      utils.setFocus(true);
    });
    // when the app is not in focus, set the interval to 5 minutes
    window.addEventListener("blur", (_) => {
      // if(!DEBUG_MODE) dialog.openDialogInfo("Sleeping mode", "Don't worry your jobs are still running");
      utils.setFocus(false);
    });
    jobs.reloadJobList();
    // window does not have focus at startup when devtools are open
    // load the first job on the list
    job.createJob();
    jobs.resetInterval();
    utils.setActive(true); // only required on debug mode
  }
}

initialize();
