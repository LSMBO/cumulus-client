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
import * as utils from "./utils.js";

const CONFIG = new Map();
const jobLabels = document.getElementById("divSettingsJobLabelElement");

async function loadSettings() {
    CONFIG.clear();
    for(let [key, value] of await window.electronAPI.getConfig()) {
        if(value == "true") CONFIG.set(key, true);
        else if(value == "false") CONFIG.set(key, false);
        else CONFIG.set(key, value);
    }
}

function openSettings() {
    // reload the config, in case the user changed it earlier without saving
    if(CONFIG.has("cumulus.controller")) document.getElementById("txtSettingsServerAddress").value = CONFIG.get("cumulus.controller");
    if(CONFIG.has("cumulus.port")) document.getElementById("txtSettingsServerPort").value = CONFIG.get("cumulus.port");
    if(CONFIG.has("rsync.agent")) document.getElementById("txtSettingsRsyncAddress").value = CONFIG.get("rsync.agent");
    if(CONFIG.has("rsync.port")) document.getElementById("txtSettingsRsyncPort").value = CONFIG.get("rsync.port");
    if(CONFIG.has("max.nb.jobs")) document.getElementById("txtSettingsNbJobs").value = CONFIG.get("max.nb.jobs");
    if(CONFIG.has("refresh.rate")) document.getElementById("txtSettingsRefreshRate").value = CONFIG.get("refresh.rate");
    if(CONFIG.has("default.strategy")) document.getElementById("cmbSettingsDefaultStrategy").value = CONFIG.get("default.strategy");
    if(CONFIG.has("raw.file.path")) document.getElementById("txtSettingsDefaultRawFilesPath").value = CONFIG.get("raw.file.path");
    if(CONFIG.has("fasta.path")) document.getElementById("txtSettingsDefaultFastaFilesPath").value = CONFIG.get("fasta.path");
    if(CONFIG.has("license")) document.getElementById("txtSettingsLicense").value = CONFIG.get("license");
    for(let option of ["display.job.id", "display.job.owner", "display.app.name", "display.job.start.date"]) {
        utils.selectCheckboxListItem(jobLabels, option, CONFIG.has(option) ? CONFIG.get(option) : true);
    }
    utils.updateCheckboxList(jobLabels);
    tabs.openTab("tabSettings");
}

async function saveSettings() {
    // TODO add some checks
    CONFIG.set("cumulus.controller", document.getElementById("txtSettingsServerAddress").value);
    CONFIG.set("cumulus.port", document.getElementById("txtSettingsServerPort").value);
    CONFIG.set("rsync.agent", document.getElementById("txtSettingsRsyncAddress").value);
    CONFIG.set("rsync.port", document.getElementById("txtSettingsRsyncPort").value);
    CONFIG.set("max.nb.jobs", document.getElementById("txtSettingsNbJobs").value);
    CONFIG.set("refresh.rate", document.getElementById("txtSettingsRefreshRate").value);
    CONFIG.set("default.strategy", document.getElementById("cmbSettingsDefaultStrategy").value);
    CONFIG.set("raw.file.path", document.getElementById("txtSettingsDefaultRawFilesPath").value);
    CONFIG.set("fasta.path", document.getElementById("txtSettingsDefaultFastaFilesPath").value);
    const selectedOptions = Object.entries(utils.getCheckboxListSelection(jobLabels)).map(kv => kv[0]);
    for(let option of ["display.job.id", "display.job.owner", "display.app.name", "display.job.start.date"]) {
        CONFIG.set(option, selectedOptions.includes(option));
    }
    await window.electronAPI.setConfig(CONFIG);
    jobs.setJobListDisplay();
    jobs.resetInterval();
}

async function resetSettings() {
    await window.electronAPI.resetConfig();
    await loadSettings();
    openSettings();
    jobs.resetInterval();
}

function showLicense() {
    document.getElementById("btnSettingsLicense").textContent = "Hide the license";
    document.getElementById("txtSettingsLicense").parentElement.classList.remove("w3-hide");
}

function hideLicense() {
    document.getElementById("btnSettingsLicense").textContent = "Display the license";
    document.getElementById("txtSettingsLicense").parentElement.classList.add("w3-hide");
}

function toggleLicense() {
    if(document.getElementById("txtSettingsLicense").parentElement.classList.contains("w3-hide")) showLicense();
    else hideLicense();
}

utils.addCheckboxList(jobLabels, "Job descriptions", {"display.job.id": "Job ID", "display.job.owner": "Job owner", "display.app.name": "Software name", "display.job.start.date": "Start date"}, false, "Select the information that will be displayed in the job list.");
utils.updateCheckboxList(jobLabels);

export { CONFIG, hideLicense, loadSettings, openSettings, resetSettings, saveSettings, toggleLicense };
