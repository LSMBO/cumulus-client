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

// import * as tabs from "./tabs.js";
import * as job from "./job.js";
import * as dialog from "./dialog.js";
import * as tabs from "./tabs.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as utils from "./utils.js";
import * as apps from "./applist.js";

var INTERVAL; // used to store the variable that updates the list of jobs every n seconds
var IS_SEARCH = false;
const RELOAD_BAR = document.getElementById("reloadbar");
const RELOAD_SPAN = RELOAD_BAR.getElementsByTagName("span")[0];

function refreshStatus() {
  // console.log("refreshStatus()");
  // depending on the status, show/hide some elements (or disable)
  const status = document.getElementById("txtJobStatus").value;
  document.getElementById("btnParameters").disabled = utils.getCurrentJobId() == 0;
  document.getElementById("btnNext").disabled = utils.getCurrentJobId() == 0;
  // output files tab: only if DONE
  document.getElementById("btnOutput").disabled = true;
  if(utils.getCurrentJobId() > 0 && status == "DONE") document.getElementById("btnOutput").disabled = false;
  // log tab: not if PENDING or new job
  document.getElementById("btnLogs").disabled = true;
  if(utils.getCurrentJobId() > 0 && status != "PENDING") document.getElementById("btnLogs").disabled = false;
  // cancel button: only if RUNNING or PENDING
  document.getElementById("btnCancel").style.display = "none";
  if(utils.getCurrentJobId() > 0 && (status == "PENDING" || status == "RUNNING")) document.getElementById("btnCancel").style.display = "inline-block";
  // delete button: only if DONE or FAILED
  document.getElementById("btnDelete").style.display = "none";
  if(utils.getCurrentJobId() > 0 && (status == "DONE" || status == "FAILED" || status == "CANCELLED")) document.getElementById("btnDelete").style.display = "inline-block";
}

function highlightJobButton() {
  for(let a of document.getElementById("jobs").getElementsByTagName("a")) {
    if((a.id == "clear_search" && IS_SEARCH)) {
      a.classList.remove("color-secondary");
      a.classList.remove("color-accent");
      a.classList.add("color-opposite");
    } else if((a.id == "new_job" && utils.getCurrentJobId() <= 0) || a.id.replace("job_", "") == utils.getCurrentJobId()) {
      a.classList.remove("color-secondary");
      a.classList.remove("color-opposite");
      a.classList.add("color-accent");
    } else {
      a.classList.remove("color-accent");
      a.classList.remove("color-opposite");
      a.classList.add("color-secondary");
    }
  }
}

// function getNewJobAsHtml() {
//   return `<a id="new_job" href="#" class="w3-button"><span><img src="./img/new_job.png" /></span><label>New job</label></a>`;
// }

// function getClearSearchAsHtml(nb) {
//   const label = nb == 1 ? "Cancel search (1 result)" : `Cancel search (${nb} results)`;
//   return `<a id="clear_search" href="#" class="w3-button"><span><img src="./img/unfilter.png" /></span><label>${label}</label></a>`;
// }

function getHeadJobButton(nb) {
  var html = `<a id="new_job" href="#" class="w3-button ${IS_SEARCH ? "w3-hide" : ""}"><span><img src="./img/new_job.png" /></span><label>New job</label></a>
  <a id="clear_search" href="#" class="w3-button ${IS_SEARCH ? "" : "w3-hide"}"><span><img src="./img/unfilter.png" /></span><label>Cancel search (${nb} result${nb > 1 ? "s" : ""})</label></a>`;
  return html;
}

function setJobListDisplay() {
  const items = ["display.job.id", "display.job.owner", "display.app.name", "display.host.name", "display.job.creation.date", "display.job.end.date"];
  for(let a of document.getElementById("jobs").getElementsByTagName("a")) {
    const labels = a.getElementsByTagName("i");
    if(labels.length > 0) {
      for(let i = 0; i < items.length; i++) {
        labels[i].style.display = settings.CONFIG.has(items[i]) && settings.CONFIG.get(items[i]) ? "block" : "none";
      }
    }
  }
}

function getJobAsHtml(job) {
  const image = "./img/" + job.status.replace("ARCHIVED_", "").toLowerCase() + ".png";
  const archived = job.status.startsWith("ARCHIVED_") ? "archived" : "";
  // const items = [`Job ${job.id}`, job.owner, apps.getFullName(job.app_name), utils.formatDate(job.creation_date)];
  // const items = [`Job ID: ${job.id}`, `Owner: ${job.owner}`, apps.getFullName(job.app_name), job.host == "" ? "No host selected" : `Host: ${job.host}`, "&#9873;&nbsp;" + utils.formatDate(job.creation_date), job.end_date == "" ? "" : "&#9872;&nbsp;" + utils.formatDate(job.end_date)];
  // console.log(job);
  // const items = [`Job ID: ${job.id}`, `<img src='img/owner.png'/>${job.owner}`, "<img src='img/cmd-app.png'/>"+apps.getFullName(job.app_name), job.host == "" ? "<img src='img/host.png'/>No host selected" : `<img src='img/host.png'/>${job.host}`, "<img src='img/hg-create.png'/>" + utils.formatDate(job.creation_date), job.end_date ? "" : "<img src='img/hg-end.png'/>" + utils.formatDate(job.end_date)];
  // return `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span><label class="${archived}"><i>${items.join("</i><i>")}</i></label></a>`;
  var html = `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span>`;
  // var html = `<a id="job_${job.id}" href="#" class="w3-button">`;
  html += job.status.startsWith("ARCHIVED_") ? `<label class="archived">` : "<label>";
  html += `<i>Job ID: ${job.id}</i>`;
  html += `<i><img src='img/owner.png'/>${job.owner}</i>`;
  html += "<i><img src='img/cmd-app.png'/>"+apps.getFullName(job.app_name)+"</i>";
  html += job.host == "" ? "<i><img src='img/host.png'/>No host selected</i>" : `<i><img src='img/host.png'/>${job.host}</i>`;
  html += "<i><img src='img/hg-create-white.png'/>" + utils.formatDate(job.creation_date)+"</i>";
  // if(job.end_date) html += "<i><img src='img/hg-end.png'/>" + utils.formatDate(job.end_date)+"</i>";
  html += job.end_date ? "<i><img src='img/hg-end-white.png'/>" + utils.formatDate(job.end_date)+"</i>" : "<i></i>";
  html += "</label></a>\n";
  // html += `</label><span><img src="${image}" /></span></a>`;
  return html;
}

async function openJob(a) {
  utils.setCurrentJobId(a.id.replace("job_", ""));
  highlightJobButton(); // immediately highlight the selected job
  utils.toggleLoadingScreen(); // show the loading screen
  job.cleanJob(); // remove the previous list of output files
  await reloadJobList(); // refresh the list of jobs
  utils.toggleLoadingScreen(); // remove the loading screen
  tabs.openTab("tabSummary"); // open the main tab
}

function addJobsToJobList(jobs) {
  // console.log(jobs);
  // top button is used to create a new job, or to cancel the search
  // var html = IS_SEARCH ? getClearSearchAsHtml(jobs.length) : getNewJobAsHtml();
  var html = getHeadJobButton(jobs.length);
  for(let j of jobs) {
    html += getJobAsHtml(j);
    // if(j.id == utils.getCurrentJobId()) job.refreshJob(j);
    // refresh the job if it is the current one, except if we are reloading the same job and the parameter tab is open
    if(j.id == utils.getCurrentJobId() && (j.id != utils.getPreviousJobId() || !tabs.isParameterTabOpen())) job.refreshJob(j);
  }
  document.getElementById("jobs").innerHTML = html;
  // add tooltips
  for(let img of document.getElementById("jobs").getElementsByTagName("img")) {
    var status = img.src.split("/").pop().replace(".png", "");
    if(status == "new_job") status = "New job";
    else if(status == "unfilter") status = "Clear filter";
    utils.tooltip(img, status.toUpperCase());
  }
  // add the event listeners
  for(let a of document.getElementById("jobs").getElementsByTagName("a")) {
    if(a.id == "new_job") a.addEventListener("click", () => job.createJob());
    else if(a.id == "clear_search") a.addEventListener("click", async () => { IS_SEARCH = false; await reloadJobList(); });
    else a.addEventListener("click", () => {
      // if the previous job was a new job, warn the user that changes will be lost
      if(utils.getCurrentJobId() <= 0 && apps.isFormDirty())
        dialog.createDialogQuestion("Warning", "The changes you have made to the parameters will be lost, continue?", openJob, "Yes", a);
      else openJob(a);
    });
  }
  // display what the user wants to see in the list
  setJobListDisplay();
  // highlight the selected job
  highlightJobButton();
}

function isSearchMode() { return IS_SEARCH; }
function setSearchMode(value) {
  IS_SEARCH = value;
}

async function getLastJobs() {
  // console.log("getLastJobs()");
  return await window.electronAPI.getLastJobs(utils.getCurrentJobId(), settings.CONFIG.get("max.nb.jobs"));
}

async function searchJobs(reloadPreviousSettings = true) {
  // console.log("searchJobs()");
  // the search is refreshed, so we store the settings in case the user changes a field without validating
  const [owner, app, file, desc, statuses, date, from, to, number] = reloadPreviousSettings ? search.getPreviousSearchSettings() : search.getCurrentSearchSettings();
  search.storeSearchSettings(owner, app, file, desc, statuses, date, from, to, number);
  // send the search request
  return await window.electronAPI.searchJobs(utils.getCurrentJobId(), owner, app, file, desc, statuses, date, from, to, number);
}

async function reloadJobList(reloadPreviousSettings = true) {
  // refresh the list of jobs
  // console.log("Reload job list at " + new Date().toLocaleTimeString());
  const [jobs, error] = IS_SEARCH ? await searchJobs(reloadPreviousSettings) : await getLastJobs();
  if(error) {
    // do not reopen the dialog if it's already open
    if(!dialog.isDialogOfflineOpen()) {
      utils.setOffline(true);
      const title = "Cumulus is disconnected!";
      // const message = `Cumulus has lost the connection with the ${error ? "server" : "RSync agent"} with the following error:<br/>${errorMessage}<br/><br/>Please contact your administrator.`;
      const message = `Cumulus has lost the connection with the server with the following error:<br/>${error}<br/><br/>Please contact your administrator.`;
      dialog.createDialogOffline(title, message, retryReloadJobList);
    }
  } else addJobsToJobList(jobs);
}

function retryReloadJobList() {
  utils.setOffline(false);
  reloadJobList();
}

function reloadJobListOrSleep(reloadPreviousSettings = true) {
  // refresh the list of jobs
  if(utils.doRefresh()) reloadJobList(reloadPreviousSettings);
  // check sleepiness
  utils.checkSleepMode();
}

function resetReloadBarTimer(time_left_in_seconds = settings.CONFIG.get("refresh.rate")) {
  // display the refresh animation, to indicate to the user how long it will take before the next refresh
  RELOAD_SPAN.style.animationDuration = `${time_left_in_seconds}s`;
  RELOAD_SPAN.style.animationName = "none";
  RELOAD_SPAN.offsetHeight; // trigger reflow (forces the animation to restart)
  RELOAD_SPAN.style.animationName = "grow";
  RELOAD_BAR.style.visibility = "visible";
}

function resetInterval() {
  if(INTERVAL) clearInterval(INTERVAL);
  INTERVAL = window.setInterval(reloadJobListOrSleep, settings.CONFIG.get("refresh.rate") * 1000);
  resetReloadBarTimer();
}

function pauseRefresh() {
  if(INTERVAL) {
    __electronLog.debug("Stop refreshing");
    clearInterval(INTERVAL);
    INTERVAL = null;
    RELOAD_SPAN.style.animationPlayState = "paused";
  } else {
    __electronLog.debug("Start refreshing");
    resetInterval();
    RELOAD_SPAN.style.animationPlayState = "running";
  }
}

export { highlightJobButton, isSearchMode, pauseRefresh, refreshStatus, reloadJobList, resetInterval, resetReloadBarTimer, setJobListDisplay, setSearchMode };