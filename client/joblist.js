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
import * as settings from "./settings.js";
import * as utils from "./utils.js";
import * as apps from "./apps/applist.js";

var INTERVAL; // used to store the variable that updates the list of jobs every n seconds
var IS_SEARCH = false;

function refreshStatus() {
  console.log("refreshStatus()");
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
  if(utils.getCurrentJobId() <= 0 && document.getElementById("splash").style.display == "none") document.getElementById("jobs").children[0].classList.remove("w3-hide");
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
  return `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span><label class="${archived}">${job.owner}<br/>${apps.getFullName(job.app_name)}</br>${utils.formatDate(job.creation_date)}</label></a>`;
}

function addJobsToJobList(jobs) {
  // top button is used to create a new job, or to cancel the search
  var html = IS_SEARCH ? getClearSearchAsHtml(jobs.length) : getNewJobAsHtml();
  for(let job of jobs) {
    html += getJobAsHtml(job);
  }
  document.getElementById("jobs").innerHTML = html;
  // add the event listeners
  for(let a of document.getElementById("jobs").getElementsByTagName("a")) {
    if(a.id == "new_job") a.addEventListener("click", () => job.createJob());
    else if(a.id == "clear_search") a.addEventListener("click", async () => { IS_SEARCH = false; await reloadJobList(); });
    else a.addEventListener("click", async () => await job.loadJob(a.id));
  }
  // highlight the selected job
  highlightJobButton();
}

async function reloadJobList() {
  // this function will be called every N seconds
  // but we dont want to execute it if the window is not in focus or if a search is made
  if(utils.isFocus() && !IS_SEARCH) {
    console.log("reloadJobList()");
    const [jobs, error] = await window.electronAPI.getLastJobs(settings.CONFIG.get("max.nb.jobs"));
    // if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
    if(error != "") dialog.displayErrorMessage("Connection error", error);
    addJobsToJobList(jobs);
  }
}

function resetInterval() {
  clearInterval(INTERVAL);
  INTERVAL = window.setInterval(reloadJobList, settings.CONFIG.get("refresh.rate") * 1000);
}

async function searchJobs(owner, app, file, desc, statuses, date, from, to, number) {
  console.log("searchJobs()");
  const [jobs, error] = await window.electronAPI.searchJobs(owner, app, file, desc, statuses, date, from, to, number);
  // if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
  if(error != "") dialog.displayErrorMessage("Connection error", error);
  IS_SEARCH = true;
  addJobsToJobList(jobs);
}

export { highlightJobButton, refreshStatus, reloadJobList, resetInterval, searchJobs };