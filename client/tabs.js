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

import * as utils from "./utils.js";
import { hideLicense } from "./settings.js";

const TAB_NAMES = ["tabSummary", "tabParameters", "tabLogs", "tabOutput"];
const TAB_BUTTONS = ["btnSummary", "btnParameters", "btnLogs", "btnOutput"];
const EXTRA_TAB_NAMES = ["tabSettings", "tabStorage", "tabSearch"];
const EXTRA_BUTTONS = ["btnSettings", "btnStorage", "btnSearch"];

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
  hideLicense();
}

// function getCurrentTabName() {
//   for(let tab of TAB_NAMES) {
//     if(document.getElementById(tab).style.display == "block") {
//       return tab;
//     }
//   }
//   for(let tab of EXTRA_TAB_NAMES) {
//     if(document.getElementById(tab).style.display == "block") {
//       return tab;
//     }
//   }
//   return "";
// }

function isParameterTabOpen() {
  return document.getElementById("tabParameters").classList.contains("visible");
}

function openTab(tabName) {
  hideAllTabs();
  if(TAB_NAMES.includes(tabName)) {
    for(let i = 0; i < TAB_NAMES.length; i++) {
      if(TAB_NAMES[i] == tabName) {
        // console.log(tabName);
        // document.getElementById(TAB_NAMES[i]).style.display = "block";
        document.getElementById(TAB_NAMES[i]).classList.add("visible");
        document.getElementById(TAB_BUTTONS[i]).classList.replace("color-secondary", "color-accent");
      }
    }
  } else {
    for(let i = 0; i < EXTRA_TAB_NAMES.length; i++) {
      if(EXTRA_TAB_NAMES[i] == tabName) {
        // document.getElementById(EXTRA_TAB_NAMES[i]).style.display = "block";
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

function resizeLogAreas() {
    // document.getElementById("stdout").style.height = `${window.innerHeight - 130}px`;
    // document.getElementById("stderr").style.height = `${window.innerHeight - 130}px`;
    // document.getElementById("txtMergedLog").style.height = `${window.innerHeight - 180}px`;
    // document.getElementById("pltJobUsage").style.height = "300px";
}

async function copyToClipboard(sourceName, target) {
    navigator.clipboard.writeText(target.textContent);
    target.select();
    const source = document.getElementById(sourceName);
    source.classList.add("copied");
    await utils.sleep(1000);
    source.classList.remove("copied");
}

export { copyToClipboard, goToNextTab, goToPreviousTab, isParameterTabOpen, openTab, resizeLogAreas };
