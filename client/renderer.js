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
// import * as storage from "./storage.js";
import * as elements from "./app_elements/elements.js";
import * as utils from "./utils.js";
import * as apps from "./appmanager.js";

var DEBUG_MODE = false;

function loadAppList() {
  // list all the available apps and add them to the list
  // the list of apps is retrieved from the server at startup
  document.getElementById("cmbAppName").innerHTML = "<option value='' disabled></option>" + apps.getAppsAsOptionList("", true);
}

// initialize the tabs
tabs.initialize();
jc.initialize();
output.initialize();
var LAST_TYPED_KEYS = "";
async function keyupEvent(event) {
  // console.log(event);
  // Change tab
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
    __electronLog.info("TEST KEY!");
    sidebar.pauseRefresh();
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
  // if there is a connection error, open a dialog allowing to open settings, retry or quit
  const message = error + "<br/><br/>Maybe you have a wrong parameter. Click on the button below to access your settings.<br/>If it does not work, warn the administrator and retry later.";
  if(error != "") {
    dialog.createDialogForBootCheck("Connection error", message, initialize);
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
    // set event listeners for the main window
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
