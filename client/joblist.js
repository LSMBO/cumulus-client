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
import * as job from "./job.js";
import * as dialog from "./dialog.js";
import * as settings from "./settings.js";
import * as utils from "./utils.js";
import * as apps from "./apps/applist.js";

const JOB_LIST = document.getElementById("jobs");
var INTERVAL; // used to store the variable that updates the list of jobs every n seconds
var FILTER_HOST = "";
var FILTER_USER = "";
var FILTER_APP = "";

function refreshStatus() {
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

function refreshJobList() {
    for(let a of JOB_LIST.getElementsByTagName("a")) {
      if((a.id == "new_job" && utils.getCurrentJobId() <= 0) || a.id.replace("job_", "") == utils.getCurrentJobId()) {
        a.classList.remove("color-secondary");
          a.classList.add("color-accent");
      } else {
        a.classList.remove("color-accent");
        a.classList.add("color-secondary");
      }
    }
    if(utils.getCurrentJobId() <= 0 && document.getElementById("splash").style.display == "none") JOB_LIST.children[0].classList.remove("w3-hide");
}

async function loadJobList(filter_tag = "") {
    // ask the server for the list of jobs with their status
    // const jobs = await window.electronAPI.getJobList(CONFIG.get("max.nb.jobs"), FILTER_USER, FILTER_APP, filter_tag);
    // async function listJobs(_, host, owner, app, tag, number) {
    const [jobs, error] = await window.electronAPI.getJobList(FILTER_HOST, FILTER_USER, FILTER_APP, filter_tag, settings.CONFIG.get("max.nb.jobs"));
    if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
    // top button is used to create a new job
    // var html = `<a id="new_job" class="w3-button color-accent"><img src="./img/NEW.svg" />New job</a>`;
    var html = `<a id="new_job" class="w3-button color-accent"><span><img src="./img/new_job.png" /></span><label>New job</label></a>`;
    // add all the jobs one after the other
    for(let job of jobs) {
      // console.log(job);
      // the status icon is set here, it's either PENDING, RUNNING, DONE, FAILED, CANCELLED, ARCHIVED_DONE, ARCHIVED_FAILED, ARCHIVED_CANCELLED
      const image = "./img/" + job.status.replace("ARCHIVED_", "").toLowerCase() + ".png";
      const archived = job.status.startsWith("ARCHIVED_") ? "archived" : "";
      html += `<a id="job_${job.id}" href="#" class="w3-button"><span><img src="${image}" /></span><label class="${archived}">${job.owner}<br/>${apps.getFullName(job.app_name)}</br>${utils.formatDate(job.creation_date)}</label></a>`;
    }
    html += `<input id="txtSearch" type="text" placeholder="Search..." class="w3-input w3-border" value="${filter_tag}" />`;
    JOB_LIST.innerHTML = html;
    // add the event listeners
    Array.from(JOB_LIST.getElementsByTagName("a")).forEach(a => a.addEventListener("click", async () => await job.loadJob(a.id)));
    document.getElementById("txtSearch").addEventListener("keyup", async (event) => await searchJob(event));
    refreshJobList();
}

// async function searchJob(event) {
function searchJob(event) {
    if(event.key === "Enter") {
      loadJobList(document.getElementById("txtSearch").value);
    }
}

async function autoRefresh() {
  // TODO if the server is down, the job list will fail, display a message in that case
  // reload the job list
  loadJobList();
  // also refresh the tab currently open
  if(utils.getCurrentJobId() > 0) {
    // do not refresh if the job is DONE or FAILED
    const status = document.getElementById("txtJobStatus").value;
    if(status != "DONE" && status != "FAILED") {
      // const tab = Array.from(tabs.TAB_LIST).filter(t => t.style.display == "block")[0].id;
      // if(tab == "tabSummary") job.loadJob(utils.getCurrentJobId());
      // // TODO how to reload properly the tabs if each tab has a different caller? 
      // // TODO Maybe load all tabs at once? Then always call loadJob and just reopen current tab
      // else tabs.openTab(Array.from(tabs.TAB_LIST).filter(t => t.style.display == "block")[0].id);
    }
  }
}

function resetInterval() {
    clearInterval(INTERVAL);
    const value = utils.isFocus() ? settings.CONFIG.get("refresh.rate") * 1000 : 300000;
    INTERVAL = window.setInterval(autoRefresh, value);
}

export { loadJobList, refreshJobList, refreshStatus, resetInterval };
