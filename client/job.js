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
import * as dialog from "./dialog.js";
import * as tabs from "./tabs.js";
import * as jobs from "./joblist.js";
import * as output from "./output.js";
import * as apps from "./apps/applist.js";
import * as settings from "./settings.js";

const FORM = document.getElementById("formParameters");
const STD_OUT = document.getElementById("stdout");
const STD_ERR = document.getElementById("stderr");

function setAppParameters(settings = null) {
  const app = document.getElementById("cmbAppName").value;
  if(app != "") {
    apps.get(app).initialize(document.getElementById("formParameters"));
    if(settings != null) apps.get(app).setSettings(settings);
    // enable parameter tab
    document.getElementById("btnParameters").disabled = false;
  } else {
    document.getElementById("formParameters").innerHTML = "";
    // disable parameter tab
    document.getElementById("btnParameters").disabled = true;
  }
}

async function displayFileTransfers(job) {
  // get the transfer progression from the rsync client
  // console.log(job);
  const [data, error] = await window.electronAPI.getTransferProgress(job.owner, job.id);
  const map = new Map (Object.entries(data));
  // get the list of files
  const app = apps.get(job.app_name);
  const files = app.getLocalFiles().concat(app.getSharedFiles());
  // display the list of files
  var html = "";
  var nb = 0;
  for(let file of files) {
    // only display the basename
    const name = file.split(file.includes("/") ? "/" : "\\").pop();
    // add a span with the percentage: 0%, n%, or ✓ (in bold, accent bgcolor and round icon?)
    const pct = map.has(file) ? `<span>${map.get(file)}%</span>` : "<span class='done'>✓</span>";
    html += `<li>${name}${pct}</li>`;
    if(!map.has(file)) nb++;
  }
  const ul = document.getElementById("tabLogs").getElementsByTagName("ul")[0];
  ul.innerHTML = html;
  ul.previousElementSibling.textContent = error ? error : "Your job will begin once all the files listed below will be completely transferred.";
  ul.previousElementSibling.previousElementSibling.textContent = `File transfer ${nb}/${files.length}`;
}

function refreshJob(job) {
  // console.log(job);
  // sometimes the job or its settings can be null, it can happen when the refreshing of the job list is not done yet
  if(job != null && job.settings != null) {
    // summary
    document.getElementById("txtJobOwner").value = job.owner;
    document.getElementById("txtJobOwner").disabled = true;
    document.getElementById("txtJobStatus").value = job.status;
    document.getElementById("txtJobStatus").disabled = true;
    document.getElementById("txtJobStatus").parentNode.style.display = "block";
    document.getElementById("cmbAppName").value = job.app_name;
    document.getElementById("cmbAppName").disabled = true;
    document.getElementById("cmbStrategy").value = job.strategy;
    document.getElementById("cmbStrategy").disabled = true;
    document.getElementById("txtSelectedHost").value = job.host;
    document.getElementById("txtSelectedHost").parentNode.style.display = "block";
    document.getElementById("txtJobDescription").value = job.description;
    document.getElementById("txtJobDescription").disabled = true;
    document.getElementById("divDates").style.display = "block";
    document.getElementById("divDates").innerHTML = `<div class="w3-third"><label>Creation date: ${utils.formatDate(job.creation_date)}</label></div><div class="w3-third"><label>Started date: ${utils.formatDate(job.start_date)}</label></div><div class="w3-third"><label>Ended date: ${utils.formatDate(job.end_date)}</label></div>`;
    document.getElementById("divButtonsNext").style.display = "none";
    document.getElementById("divButtonsSummary").style.display = "block";
    document.getElementById("btnStart").parentNode.style.display = "none";
    // if job is ended, remove the Cancel button and show the delete button
    // TODO maybe leave btnDelete all the time, and onclick it cancels and deletes?
    document.getElementById("btnCancel").style.display = "inline-block";
    document.getElementById("btnDelete").style.display = "none";
    if(job.status != "PENDING" && job.status != "RUNNING") {
      document.getElementById("btnCancel").style.display = "none";
      document.getElementById("btnDelete").style.display = "inline-block";
    }
    // settings
    setSettings(new Map(Object.entries(job.settings)));
    // logs
    if(job.status == "PENDING") {
      document.getElementById("tabLogs").children[0].classList.remove("w3-hide");
      document.getElementById("tabLogs").children[1].classList.add("w3-hide");
      // display the progression for each file
      displayFileTransfers(job);
    } else {
      document.getElementById("tabLogs").children[0].classList.add("w3-hide");
      document.getElementById("tabLogs").children[1].classList.remove("w3-hide");
      STD_OUT.textContent = job.stdout;
      STD_OUT.scrollTop = job.status == "RUNNING" ? STD_OUT.scrollHeight : 0;
      STD_ERR.textContent = job.stderr;
      STD_ERR.scrollTop = job.status == "RUNNING" ? STD_ERR.scrollHeight : 0;
    }
    // output files
    if(job.status == "DONE") output.insertOutputFiles(job.files);
    // else output.removeOutputFiles();
    // enable or disable tabs depending on the status
    document.getElementById("btnParameters").disabled = false;
    // document.getElementById("btnLogs").disabled = job.status == "PENDING";
    document.getElementById("btnLogs").disabled = false;
    document.getElementById("btnOutput").disabled = (job.status != "DONE" && job.status != "ARCHIVED_DONE");
    // highlight the job in the list on the left
    jobs.highlightJobButton();
  } else console.log("Failed to load the job");
}

function cleanJob() {
  // clear the summary fields
  document.getElementById("txtJobOwner").value = utils.getUserName();
  document.getElementById("txtJobStatus").value = "";
  document.getElementById("txtJobStatus").parentNode.style.display = "none";
  document.getElementById("cmbAppName").selectedIndex = 0;
  document.getElementById("cmbAppName").disabled = false;
  document.getElementById("cmbStrategy").selectedIndex = 0;
  document.getElementById("cmbStrategy").disabled = false;
  document.getElementById("txtSelectedHost").parentNode.style.display = "none";
  document.getElementById("txtJobDescription").value = "";
  document.getElementById("txtJobDescription").disabled = false;
  document.getElementById("divDates").style.display = "none";
  document.getElementById("divButtonsNext").style.display = "block";
  document.getElementById("divButtonsSummary").style.display = "none";
  document.getElementById("btnStart").parentNode.style.display = "block";
  // clear the parameters fields
  FORM.innerHTML = "";
  // clear the log fields
  STD_OUT.textContent = "";
  STD_ERR.textContent = "";
  // clear the output fields
  document.getElementById("outputSummary").textContent = "Nothing yet...";
  document.getElementById("treeview").innerHTML = "";
}

function createJob() {
  // console.log("createJob()");
  document.getElementById("detail").getElementsByTagName("header")[0].style.display = "block";
  document.getElementById("splash").style.display = "none";
  utils.setCurrentJobId(0);
  jobs.highlightJobButton();
  // clear the summary fields
  cleanJob();
  // set the default strategy
  const cmbStrategy = document.getElementById("cmbStrategy");
  for(let i = 0; i < cmbStrategy.options.length; i++) {
    if(cmbStrategy.options[i].value == settings.CONFIG.get("default.strategy")) cmbStrategy.selectedIndex = i;
  }
  // disable the other tabs
  document.getElementById("btnParameters").disabled = true;
  document.getElementById("btnLogs").disabled = true;
  document.getElementById("btnOutput").disabled = true;
  // open the first tab
  tabs.openTab("tabSummary");
}

function cloneJob() {
  // set the new job id
  utils.setCurrentJobId(0);
  // update some of the fields
  document.getElementById("txtJobOwner").value = utils.getUserName();
  document.getElementById("txtJobStatus").value = "";
  document.getElementById("txtJobStatus").parentNode.style.display = "none";
  document.getElementById("cmbAppName").disabled = false;
  document.getElementById("cmbStrategy").disabled = false;
  document.getElementById("txtSelectedHost").parentNode.style.display = "none";
  document.getElementById("txtJobDescription").disabled = false;
  document.getElementById("divDates").style.display = "none";
  document.getElementById("divButtonsNext").style.display = "block";
  document.getElementById("btnNext").disabled = false;
  document.getElementById("divButtonsSummary").style.display = "none";
  document.getElementById("btnStart").parentNode.style.display = "block";
  STD_OUT.textContent = "";
  STD_ERR.textContent = "";
  document.getElementById("outputSummary").textContent = "Nothing yet...";
  document.getElementById("treeview").innerHTML = "";
  document.getElementById("btnLogs").disabled = true;
  document.getElementById("btnOutput").disabled = true;
  // highlight the "New job" button to give the impression that a new job was opened
  jobs.highlightJobButton();
}

async function startJob() {
  // console.log(`startJob()`);
  const appName = document.getElementById("cmbAppName").value;
  const strategy = document.getElementById("cmbStrategy").value;
  const description = document.getElementById("txtJobDescription").value;
  const app = apps.get(appName);
  const settingsErrors = app.checkSettings();
  if(settingsErrors.length == 0) {
    const settings = JSON.stringify(Object.fromEntries(getSettings()));
    const sharedFiles = JSON.stringify(app.getSharedFiles());
    const localFiles = JSON.stringify(app.getLocalFiles());
    const job_id = await window.electronAPI.startJob(utils.getUserName(), appName, strategy, description, settings, sharedFiles, localFiles);
    // reload the job list
    utils.setCurrentJobId(job_id);
    jobs.reloadJobList();
    document.getElementById("btnLogs").disabled = false;
    tabs.openTab("tabLogs");
  } else {
    // display a dialog box with the list of errors
    dialog.createDialogWarning("Incorrect settings", "- " + settingsErrors.join("<br/>- "));
  }
}

async function cancelJob() {
  // console.log("cancelJob()");
  utils.toggleLoadingScreen();
  const [response, error] = await window.electronAPI.cancelJob(utils.getUserName(), utils.getCurrentJobId());
  // TODO rethink the error management
  if(error != "") dialog.createDialogWarning("The job could not be canceled", error);
  // console.log(response);
  jobs.reloadJobList();
  utils.toggleLoadingScreen();
}

async function deleteJob() {
  // console.log("deleteJob()");
  utils.toggleLoadingScreen();
  const [response, error] = await window.electronAPI.deleteJob(utils.getUserName(), utils.getCurrentJobId());
  // TODO rethink the error management
  if(error != "") dialog.createDialogWarning("The job could not be deleted", error);
  // console.log(response);
  jobs.reloadJobList();
  utils.toggleLoadingScreen();
}

function getSettings() {
  const settings = new Map();
  for(let item of FORM.getElementsByTagName("input")) {
    if(item.name) {
      if(item.type == "checkbox") {
        if(item.checked) settings.set(item.name, true);
      } else settings.set(item.name, item.value);
    }
  }
  for(let item of FORM.getElementsByTagName("select")) {
    if(item.name) settings.set(item.name, item.value);
  }
  settings.set("files", utils.getBrowsedFiles(document.getElementsByClassName("raw-file")[0]));
  // console.log(settings);
  return settings;
}

function setSettings(settings) {
  // console.log(settings);
  setAppParameters(settings);
  for(let item of FORM.getElementsByTagName("input")) {
    if(item.name) {
      if(item.type == "checkbox") {
        item.checked = settings.has(item.name);
      } else if(settings.has(item.name)) {
        item.value = settings.get(item.name);
      }
    }
  }
  for(let item of FORM.getElementsByTagName("select")) {
    if(item.name && settings.has(item.name)) item.value = settings.get(item.name);
  }
}

export { cancelJob, cleanJob, cloneJob, createJob, deleteJob, refreshJob, startJob, setAppParameters };
