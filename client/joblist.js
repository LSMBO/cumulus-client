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
import * as apps from "./apps/applist.js";

var INTERVAL; // used to store the variable that updates the list of jobs every n seconds
var IS_SEARCH = false;
// // variables used to skip refreshs every n times
// const NB_CONSECUTIVE_SKIPS_ON_BLUR = 2; // skip when blur (not sleep), and NB_SKIPPED_REFRESH equals this value (2 = 15 seconds)
// const NB_CONSECUTIVE_SKIPS_ON_SLEEP = 12; // skip when sleep and NB_SKIPPED_REFRESH equals this value
// var NB_SKIPPED_REFRESH = 0; // increment this value every time
// // variables used to determine if we are in sleep mode
// const NB_SKIPS_ON_BLUR_BEFORE_SLEEP = 12; // number of times we have been in blur (12 = 1 minute; 60 = 5 minutes)
// var NB_SKIPPED_SINCE_BLUR = 0; // if this value is higher than the const above, we are in sleep mode, it is incremented every time we are in blur
var NB_SKIPS_BEFORE_REFRESH = 0;

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
  // refresh button: only if RUNNING or PENDING
  // document.getElementById("btnRefresh").disabled = true;
  // if(CURRENT_JOB_ID > 0 && (status == "PENDING" || status == "RUNNING")) document.getElementById("btnRefresh").disabled = false;
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
  // if(utils.getCurrentJobId() <= 0 && document.getElementById("splash").style.display == "none") document.getElementById("jobs").children[0].classList.remove("w3-hide");
}

function getNewJobAsHtml() {
  return `<a id="new_job" href="#" class="w3-button"><span><img src="./img/new_job.png" /></span><label>New job</label></a>`;
}

function getClearSearchAsHtml(nb) {
  const label = nb == 1 ? "Cancel search (1 result)" : `Cancel search (${nb} results)`;
  return `<a id="clear_search" href="#" class="w3-button"><span><img src="./img/unfilter.png" /></span><label>${label}</label></a>`;
}

function getJobAsHtml(job) {
  const image = "./img/" + job.status.replace("ARCHIVED_", "").toLowerCase() + ".png";
  const archived = job.status.startsWith("ARCHIVED_") ? "archived" : "";
  // TODO find a better way to represent the jobs in the list (the id should be there!!)
  // in the settings, let the user choose between a full or a compact view (with a keyboard shortcut)
  // or even let the user decide what information they want to see (with ckeckboxes), between: job_id, owner, app, date
  // return `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span><label class="${archived}">${job.owner}<br/>${apps.getFullName(job.app_name)}</br>${utils.formatDate(job.creation_date)}</label></a>`;
  const items = [];
  if(settings.CONFIG.has("display.job.id") && settings.CONFIG.get("display.job.id")) items.push(`Job ${job.id}`);
  if(settings.CONFIG.has("display.job.owner") && settings.CONFIG.get("display.job.owner")) items.push(job.owner);
  if(settings.CONFIG.has("display.app.name") && settings.CONFIG.get("display.app.name")) items.push(apps.getFullName(job.app_name));
  if(settings.CONFIG.has("display.job.start.date") && settings.CONFIG.get("display.job.start.date")) items.push(utils.formatDate(job.creation_date));
  if(items.length == 0) items.push(`Job ${job.id}`);
  return `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span><label class="${archived}">${items.join("<br/>")}</label></a>`;
}

function addJobsToJobList(jobs) {
  // top button is used to create a new job, or to cancel the search
  var html = IS_SEARCH ? getClearSearchAsHtml(jobs.length) : getNewJobAsHtml();
  for(let j of jobs) {
    html += getJobAsHtml(j);
    if(j.id == utils.getCurrentJobId()) job.refreshJob(j);
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
    // else a.addEventListener("click", async () => await job.loadJob(a.id));
    else a.addEventListener("click", async () => {
      utils.setCurrentJobId(a.id.replace("job_", ""));
      await reloadJobList();
      tabs.openTab("tabSummary");
    });
  }
  // highlight the selected job
  highlightJobButton();
}

async function getLastJobs() {
  // console.log("getLastJobs()");
  IS_SEARCH = false;
  const [jobs, error] = await window.electronAPI.getLastJobs(utils.getCurrentJobId(), settings.CONFIG.get("max.nb.jobs"));
  if(error != "") dialog.displayErrorMessage("Connection error", error);
  addJobsToJobList(jobs);
}

async function searchJobs(reloadPreviousSettings = true) {
  // console.log("searchJobs()");
  // TODO if the user changes a parameter but does not click on the button, the new value will still be used!
  // get the search parameters
  // const owner = document.getElementById("txtSearchOwner").value;
  // const app = document.getElementById("txtSearchAppName").value;
  // const file = document.getElementById("txtSearchFile").value;
  // const desc = document.getElementById("txtSearchTag").value;
  // const statuses = [];
  // for(let lbl of txtSearchStatus.getElementsByTagName("label")) {
  //     statuses.push(lbl.textContent);
  // }
  // const date = document.getElementById("cmbSearchDate").value;
  // const from = document.getElementById("txtSearchDate1").value;
  // const to = document.getElementById("txtSearchDate2").value;
  // const number = document.getElementById("txtSearchNbJobs").value;
  const [owner, app, file, desc, statuses, date, from, to, number] = reloadPreviousSettings ? search.getPreviousSearchSettings() : search.getCurrentSearchSettings();
  search.storeSearchSettings(owner, app, file, desc, statuses, date, from, to, number);
  // send the search request
  IS_SEARCH = true;
  const [jobs, error] = await window.electronAPI.searchJobs(utils.getCurrentJobId(), owner, app, file, desc, statuses, date, from, to, number);
  if(error != "") dialog.displayErrorMessage("Connection error", error);
  addJobsToJobList(jobs);
}

function isSleepMode() {
  // allow a threshold of 5 minutes if app has focus, 1 minute if not
  const threshold = (utils.isFocus() ? 5 : 1) * 60;
  // it's asleep if the difference in seconds between now and last activity is above the threshold
  const now = new Date();
  const diff = Math.floor((now - utils.getLastActivity()) / 1000);
  // console.log(`Now: ${now} ; Last: ${utils.getLastActivity()} ; diff: ${diff} ; threshold: ${threshold}`);
  // return Math.floor((new Date() - utils.getLastActivity()) / 1000) > threshold;
  return diff > threshold;
}

async function reloadJobList() {
  // When focus, allow to get to sleep mode (after 5 minutes?)
  // When blur, only refresh 1/3 maybe
  // When blur, get to sleep mode after 1 minute
  // console.log(`NB_SKIPS_BEFORE_REFRESH = ${NB_SKIPS_BEFORE_REFRESH}`);
  if(NB_SKIPS_BEFORE_REFRESH <= 0) {
    if(IS_SEARCH) searchJobs();
    else getLastJobs();
  }
  if(isSleepMode()) {
    // console.log(`Sleep mode, active:${utils.isActive()}`);
    if(utils.isActive()) { // just do it once
      utils.setActive(false);
      dialog.openDialogInfo("Sleeping mode", "Cumulus will be refreshed less often, but do not worry your jobs are still running!");
      NB_SKIPS_BEFORE_REFRESH = Math.floor(2 * 60 / settings.CONFIG.get("refresh.rate")); // refresh once every 2 minutes on sleep?
    } else if(NB_SKIPS_BEFORE_REFRESH <= 0) NB_SKIPS_BEFORE_REFRESH = Math.floor(2 * 60 / settings.CONFIG.get("refresh.rate"));
  } else if(!utils.isFocus()) {
    if(NB_SKIPS_BEFORE_REFRESH <= 0) NB_SKIPS_BEFORE_REFRESH = Math.floor(30 / settings.CONFIG.get("refresh.rate")); // refresh once every 30 seconds on blur?
  } else {
    NB_SKIPS_BEFORE_REFRESH = 0; // refresh every time on focus
  }
  NB_SKIPS_BEFORE_REFRESH--;
}

// async function reloadJobList() {
//   // this function is called every {refresh.rate} seconds
//   // reload even when a search is done
//   // reload every {refresh.rate} seconds
//   // when not in focus, only do 1/2 or 1/3 reloads
//   // when not in focus for more than X times the {refresh.rate}, only do 1/10 or less reloads
//   // console.log("reloadJobList()");
//   var doReload = false;
//   if(utils.isFocus()) {
//     // reload everytime the app is in focus
//     NB_SKIPPED_SINCE_BLUR = 0;
//     doReload = true;
//   } else {
//     // the window is not in focus, refresh less often until it enters sleep mode
//     if(NB_SKIPPED_SINCE_BLUR >= NB_SKIPS_ON_BLUR_BEFORE_SLEEP) {
//       // if sleep mode, do not refresh as often as before (just once per minute)
//       // display a dialog to warn the user that the app is still running
//       dialog.openDialogInfo("Sleeping mode", "Cumulus will be refreshed less often, but do not worry your jobs are still running!");
//       if(NB_SKIPPED_REFRESH == NB_CONSECUTIVE_SKIPS_ON_SLEEP) doReload = true;
//     } else {
//       // if blur (not in focus but not in sleep mode), just refresh 1/3 of the time
//       if(NB_SKIPPED_REFRESH == NB_CONSECUTIVE_SKIPS_ON_BLUR) doReload = true;
//     }
//     NB_SKIPPED_SINCE_BLUR++;
//   }
//   if(doReload) {
//     // either refresh the search or the full list of jobs
//     if(IS_SEARCH) searchJobs();
//     else getLastJobs();
//     // reinitialize the counter
//     NB_SKIPPED_REFRESH = 0;
//   } else NB_SKIPPED_REFRESH++;
// }

function resetInterval() {
  if(INTERVAL) clearInterval(INTERVAL);
  INTERVAL = window.setInterval(reloadJobList, settings.CONFIG.get("refresh.rate") * 1000);
}

function pauseRefresh() {
  if(INTERVAL) {
    console.log("Stop refreshing");
    clearInterval(INTERVAL);
  } else {
    console.log("Start refreshing");
    resetInterval();
  }
}

// async function searchJobs(owner, app, file, desc, statuses, date, from, to, number) {
//   // console.log("searchJobs()");
//   const [jobs, error] = await window.electronAPI.searchJobs(utils.getCurrentJobId(), owner, app, file, desc, statuses, date, from, to, number);
//   // if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
//   if(error != "") dialog.displayErrorMessage("Connection error", error);
//   IS_SEARCH = true;
//   addJobsToJobList(jobs);
// }

export { getLastJobs, highlightJobButton, pauseRefresh, refreshStatus, reloadJobList, resetInterval, searchJobs };