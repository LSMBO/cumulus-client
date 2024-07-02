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

import * as dialog from "./dialog.js";
import * as job from "./job.js";
import * as output from "./output.js";
import * as utils from "./utils.js";
import * as apps from "./apps/applist.js";

const TAB_LIST = document.getElementsByClassName("tab");
const TAB_NAMES = ["tabSummary", "tabParameters", "tabLogs", "tabOutput"];
const TAB_BUTTONS = ["btnSummary", "btnParameters", "btnLogs", "btnOutput"];

async function openTab(tabName) {
    // console.log(tabName);
    var index = -1;
    document.getElementById("btnSettings").classList.replace("color-accent", "color-secondary");
    document.getElementById("tabSettings").style.display = "none";
    document.getElementById("btnStorage").classList.replace("color-accent", "color-secondary");
    document.getElementById("tabStorage").style.display = "none";
    for(let i = 0; i < TAB_LIST.length; i++) {
      if(TAB_LIST[i].id == tabName) index = i;
      TAB_LIST[i].style.display = "none";
      document.getElementById(TAB_BUTTONS[i]).classList.replace("color-accent", "color-secondary");
    }
    TAB_LIST[index].style.display = "block";
    document.getElementById(TAB_BUTTONS[index]).classList.replace("color-secondary", "color-accent");
  
    if(tabName == "tabParameters") {
      // get the appropriate form
      const app = document.getElementById("cmbAppName").value;
      if(app != "") {
        document.getElementById("formParameters").innerHTML = apps.get(app).html;
        apps.get(app).eventsFunction();
      }
      // fill the form eventually
      if(utils.getCurrentJobId() != 0) {
        utils.toggleLoadingScreen();
        const [job, error] = await window.electronAPI.getJobDetails(utils.getCurrentJobId() > 0 ? utils.getCurrentJobId() : utils.getCurrentJobId() * -1); // job id can be negative if we are cloning a job
        if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
        // console.log(job);
        for(let [key, value] of Object.entries(job.get("settings"))) {
          const node = document.getElementsByName(key)[0];
          if(node !== undefined) {
            if(node.tagName == "INPUT" && node.type == "checkbox") node.checked = value == "on";
            else node.value = value;
          }
        }
        utils.toggleLoadingScreen();
      }
    } else if(tabName == "tabOutput") {
      utils.toggleLoadingScreen();
      const [files, error] = utils.getCurrentJobId() != 0 ? await window.electronAPI.getFileList(utils.getUserName(), utils.getCurrentJobId()) : new Array();
      if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
      output.insertOutputFiles(files);
      utils.toggleLoadingScreen();
    } else if(tabName == "tabLogs") {
      job.refreshJob();
    }
}

function goToNextTab() {
    // get the tab buttons that are currently enabled
    const enabledTabsButtons = [];
    const enabledTabs = [];
    for(let i = 0; i < TAB_BUTTONS.length; i++) {
      if(document.getElementById(TAB_BUTTONS[i]).disabled == false) {
        enabledTabsButtons.push(TAB_BUTTONS[i]);
        enabledTabs.push(TAB_NAMES[i]);
      }
    }
    // search the next tab
    var nextTabId = enabledTabs[0];
    for(let i = 0; i < enabledTabsButtons.length; i++) {
      // get the button that is currently selected (it should always belong to that list)
      if(document.getElementById(enabledTabsButtons[i]).classList.contains("color-accent")) {
        if(i < enabledTabsButtons.length - 1) nextTabId = enabledTabs[i + 1];
      }
    }
    openTab(nextTabId);
}

function goToPreviousTab() {
    // get the tab buttons that are currently enabled
    const enabledTabsButtons = [];
    const enabledTabs = [];
    for(let i = 0; i < TAB_BUTTONS.length; i++) {
      if(document.getElementById(TAB_BUTTONS[i]).disabled == false) {
        enabledTabsButtons.push(TAB_BUTTONS[i]);
        enabledTabs.push(TAB_NAMES[i]);
      }
    }
    // search the next tab
    var nextTabId = enabledTabs[enabledTabsButtons.length - 1];
    for(let i = 0; i < enabledTabsButtons.length; i++) {
      // get the button that is currently selected (it should always belong to that list)
      // if(document.getElementById(enabledTabsButtons[i]).classList.contains("selected")) {
      if(document.getElementById(enabledTabsButtons[i]).classList.contains("color-accent")) {
        if(i != 0) nextTabId = enabledTabs[i - 1];
      }
    }
    openTab(nextTabId);
}

function resizeLogAreas() {
    document.getElementById("stdout").style.height = `${window.innerHeight - 130}px`;
    document.getElementById("stderr").style.height = `${window.innerHeight - 130}px`;
}

async function copyToClipboard(sourceName, target) {
    navigator.clipboard.writeText(target.textContent);
    target.select();
    const source = document.getElementById(sourceName);
    source.classList.add("copied");
    await utils.sleep(1000);
    source.classList.remove("copied");
}

export { copyToClipboard, goToNextTab, goToPreviousTab, openTab, resizeLogAreas, TAB_BUTTONS, TAB_LIST };
