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
import * as tabs from "./tabs.js";
import * as jobs from "./joblist.js";
import * as utils from "./utils.js";
import * as apps from "./apps/applist.js";

const FORM = document.getElementById("formParameters");
const STD_OUT = document.getElementById("stdout");
const STD_ERR = document.getElementById("stderr");

async function refreshJob() {
    if(utils.getCurrentJobId() > 0) {
      utils.toggleLoadingScreen();
      const [[status, stdout, stderr], error] = await window.electronAPI.getJobStatus(utils.getCurrentJobId());
      if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
      // update status in the summary
      document.getElementById("txtJobStatus").value = status;
      // update the logs
      STD_OUT.textContent = stdout;
      STD_ERR.textContent = stderr;
      STD_OUT.scrollTop = 0;
      STD_ERR.scrollTop = 0;
      if(status == "RUNNING") {
        STD_OUT.scrollTop = STD_OUT.scrollHeight;
        STD_ERR.scrollTop = STD_ERR.scrollHeight;
      }
      utils.toggleLoadingScreen();
    }
    jobs.refreshStatus();
}

// async function createJob() {
function createJob() {
    utils.setCurrentJobId(0);
    jobs.refreshJobList();
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
    document.getElementById("tabOutput").getElementsByTagName("button")[0].disabled = true;
    // open the first tab
    tabs.openTab("tabSummary");
}

async function cloneJob() {
    utils.toggleLoadingScreen();
    const [job, error] = await window.electronAPI.getJobDetails(utils.getCurrentJobId());
    if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
    // utils.CURRENT_JOB_ID = -1 * utils.CURRENT_JOB_ID; // necessary for keeping the number of the job for the setting tab
    utils.setCurrentJobId(-1 * utils.getCurrentJobId()); // necessary for keeping the number of the job for the setting tab
    jobs.refreshJobList();
    // clear the summary fields
    document.getElementById("txtJobOwner").value = utils.getUserName();
    document.getElementById("txtJobStatus").value = "";
    document.getElementById("txtJobStatus").parentNode.style.display = "none";
    document.getElementById("cmbAppName").value = job.get("app_name");
    document.getElementById("cmbAppName").disabled = false;
    document.getElementById("cmbStrategy").value = job.get("strategy");
    document.getElementById("cmbStrategy").disabled = false;
    document.getElementById("txtSelectedHost").parentNode.style.display = "none";
    document.getElementById("txtJobDescription").value = job.get("description");
    document.getElementById("txtJobDescription").disabled = false;
    document.getElementById("divDates").style.display = "none";
    document.getElementById("divButtonsNext").style.display = "block";
    document.getElementById("divButtonsSummary").style.display = "none";
    document.getElementById("btnStart").parentNode.style.display = "block";
    // clear the parameters fields
    FORM.innerHTML = ""; // FIXME this should already contain the proper settings
    // clear the log fields
    STD_OUT.textContent = "";
    STD_ERR.textContent = "";
    // clear the output fields
    document.getElementById("outputSummary").textContent = "Nothing yet...";
    document.getElementById("treeview").innerHTML = "";
    document.getElementById("btnLogs").disabled = true;
    document.getElementById("btnOutput").disabled = true;
    // document.getElementById("btnRefresh").disabled = true;
    // open the first tab
    tabs.openTab("tabSummary");
    utils.toggleLoadingScreen();
}

async function loadJob(job_id) {
    document.getElementById("detail").getElementsByTagName("header")[0].style.display = "block";
    document.getElementById("splash").style.display = "none";
    if(job_id == "new_job") {
        createJob();
    } else {
        utils.toggleLoadingScreen();
        // utils.CURRENT_JOB_ID = job_id.replace("job_", "");
        utils.setCurrentJobId(job_id.replace("job_", ""));
        const [job, error] = await window.electronAPI.getJobDetails(utils.getCurrentJobId());
        if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
        // lock what needs to be locked
        for(let item of ["cmbAppName", "cmbStrategy", "txtSelectedHost", "txtJobDescription"]) { document.getElementById(item).disabled = true; }
        // fill the summary fields
        // console.log(job);
        document.getElementById("txtJobOwner").value = job.get("username");
        document.getElementById("txtJobStatus").parentNode.style.display = "block";
        document.getElementById("txtJobStatus").value = job.get("status");
        document.getElementById("cmbAppName").value = job.get("app_name");
        document.getElementById("cmbStrategy").value = job.get("strategy");
        document.getElementById("txtSelectedHost").parentNode.style.display = "block";
        document.getElementById("txtSelectedHost").value = job.get("host");
        document.getElementById("txtJobDescription").value = job.get("description");
        document.getElementById("divDates").style.display = "block";
        document.getElementById("divDates").innerHTML = `<div class="w3-third"><label>Creation date: ${utils.formatDate(job.creation_date)}</label></div><div class="w3-third"><label>Started date: ${utils.formatDate(job.start_date)}</label></div><div class="w3-third"><label>Ended date: ${utils.formatDate(job.end_date)}</label></div>`;
        document.getElementById("divButtonsNext").style.display = "none";
        document.getElementById("divButtonsSummary").style.display = "block";
        document.getElementById("btnStart").parentNode.style.display = "none";
        // highlight the job in the list on the left
        jobs.refreshJobList();
        // open the first tab
        tabs.openTab("tabSummary");
        utils.toggleLoadingScreen();
    }
    jobs.refreshStatus();
}

async function startJob() {
    const appName = document.getElementById("cmbAppName").value;
    const strategy = document.getElementById("cmbStrategy").value;
    const description = document.getElementById("txtJobDescription").value;
    const app = apps.get(appName);
    const job_id = await window.electronAPI.startJob(utils.getUserName(), appName, strategy, description, app.getSettings(), app.getSharedFiles(), app.getLocalFiles());
    // reload the job list
    jobs.loadJobList();
    // open the new job
    loadJob(`job_${job_id}`);
}

async function cancelJob() {
    utils.toggleLoadingScreen();
    const [response, error] = await window.electronAPI.cancelJob(utils.getUserName(), utils.getCurrentJobId());
    if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
    // console.log(response);
    jobs.loadJobList();
    utils.toggleLoadingScreen();
}

async function deleteJob() {
    // TODO warn the user that there is no way back
    utils.toggleLoadingScreen();
    const [response, error] = await window.electronAPI.deleteJob(utils.getUserName(), utils.getCurrentJobId());
    if(error != "") dialog.displayErrorMessage(`Connection error: '${error}'. Warn the admin and restart later.`, true);
    // console.log(response);
    jobs.loadJobList();
    utils.toggleLoadingScreen();
}

export { cancelJob, cloneJob, deleteJob, loadJob, refreshJob, startJob };
