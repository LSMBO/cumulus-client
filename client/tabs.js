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

// import { initialize } from "./search.js";
// import { hideLicense } from "./settings.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as storage from "./storage.js";
import * as utils from "./utils.js";

const TAB_NAMES = ["tabSummary", "tabParameters", "tabLogs", "tabOutput"];
const TAB_BUTTONS = ["btnSummary", "btnParameters", "btnLogs", "btnOutput"];
const EXTRA_TAB_NAMES = ["tabSettings", "tabStorage", "tabSearch"];
const EXTRA_BUTTONS = ["btnSettings", "btnStorage", "btnSearch"];

// function switchToSecondaryImage(buttonId) {
//   const button = document.getElementById(buttonId);
//   button.addEventListener("mouseover", () => {
//     const images = button.getElementsByTagName("img");
//     images[0].classList.add("w3-hide");
//     images[1].classList.remove("w3-hide");
//   });
//   button.addEventListener("mouseout", () => {
//     const images = button.getElementsByTagName("img");
//     images[0].classList.remove("w3-hide");
//     images[1].classList.add("w3-hide");
//   });
// }

// initialize events on the tab buttons
function initialize() {
  // job tabs
  document.getElementById("btnSummary").addEventListener("click", () => openTab("tabSummary"));
  document.getElementById("btnParameters").addEventListener("click", () => openTab("tabParameters"));
  document.getElementById("btnLogs").addEventListener("click", () => openTab("tabLogs"));
  document.getElementById("btnOutput").addEventListener("click", () => openTab("tabOutput"));
  // general tabs
  document.getElementById("btnSettings").addEventListener("click", async () => await settings.openSettings());
  // switchToSecondaryImage("btnSettings");
  document.getElementById("btnStorage").addEventListener("click", async () => storage.openStorage());
  // switchToSecondaryImage("btnStorage");
  document.getElementById("btnStorageRefresh").addEventListener("click", async () => await storage.refreshStorage());
  document.getElementById("btnSearch").addEventListener("click", async () => search.openSearch());
  // switchToSecondaryImage("btnSearch");
  document.getElementById("btnHelp").addEventListener("click", async () => await window.electronAPI.openProjectUrl());
  // switchToSecondaryImage("btnHelp");
  // tooltips
  utils.tooltip(document.getElementById("btnHelp"), "Open help page");
  utils.tooltip(document.getElementById("btnSearch"), "Job search");
  utils.tooltip(document.getElementById("btnStorage"), "Remote storage viewer");
  utils.tooltip(document.getElementById("btnSettings"), "Cumulus configuration");
}

function hideAllTabs() {
  for(let i = 0; i < TAB_NAMES.length; i++) {
    document.getElementById(TAB_NAMES[i]).classList.remove("visible");
    document.getElementById(TAB_NAMES[i]).offsetHeight; // forces the reflow of the tab (which forces the animation to be triggered)
    document.getElementById(TAB_BUTTONS[i]).classList.replace("color-accent", "color-secondary");
  }
  for(let i = 0; i < EXTRA_BUTTONS.length; i++) {
    document.getElementById(EXTRA_TAB_NAMES[i]).classList.remove("visible");
    document.getElementById(EXTRA_BUTTONS[i]).classList.replace("color-accent", "color-secondary");
  }
  settings.hideLicense();
}

function isParameterTabOpen() {
  return document.getElementById("tabParameters").classList.contains("visible");
}

function openTab(tabName) {
  hideAllTabs();
  if(TAB_NAMES.includes(tabName)) {
    for(let i = 0; i < TAB_NAMES.length; i++) {
      if(TAB_NAMES[i] == tabName) {
        document.getElementById(TAB_NAMES[i]).classList.add("visible");
        document.getElementById(TAB_BUTTONS[i]).classList.replace("color-secondary", "color-accent");
      }
    }
  } else {
    for(let i = 0; i < EXTRA_TAB_NAMES.length; i++) {
      if(EXTRA_TAB_NAMES[i] == tabName) {
        document.getElementById(EXTRA_TAB_NAMES[i]).classList.add("visible");
        document.getElementById(EXTRA_BUTTONS[i]).classList.replace("color-secondary", "color-accent");
      }
    }
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
      if(document.getElementById(enabledTabsButtons[i]).classList.contains("color-accent")) {
        if(i != 0) nextTabId = enabledTabs[i - 1];
      }
    }
    openTab(nextTabId);
}

export { goToNextTab, goToPreviousTab, initialize, isParameterTabOpen, openTab };
