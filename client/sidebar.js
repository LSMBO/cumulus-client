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

import * as apps from "./appmanager.js";
import * as dialog from "./dialog.js";
import * as elements from "./app_elements/elements.js";
import * as jc from "./jobcontent.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as utils from "./utils.js";

var INTERVAL; // used to store the variable that updates the list of jobs every n seconds
var OPEN_JOB = false; // used to know if the user has opened a job or not, so we only set the parameters once
const SIDEBAR = document.getElementById("jobs");

function createNewJobButton() {
    const a = elements.createElement("a", new Map([["id", "new_job"], ["href", "#"], ["class", "w3-button"]]));
    if(search.isSearchMode()) a.classList.add("w3-hide");
    const img = elements.createElement("img", new Map([["src", "./img/new_job.png"]]));
    utils.tooltip(img, "NEW JOB");
    a.appendChild(elements.createElement("span", null, [img]));
    a.appendChild(elements.createElement("label", new Map([["textContent", "New job"]])));
    a.addEventListener("click", () => jc.openNewJob());
    return a;
}

function createCancelSearchButton(nb_jobs) {
    const a = elements.createElement("a", new Map([["id", "clear_search"], ["href", "#"], ["class", "w3-button"]]));
    if(!search.isSearchMode()) a.classList.add("w3-hide");
    const img = elements.createElement("img", new Map([["src", "./img/unfilter.png"]]));
    utils.tooltip(img, "CLEAR SEARCH FILTERS");
    a.appendChild(elements.createElement("span", null, [img]));
    a.appendChild(elements.createElement("label", new Map([["textContent", `Cancel search (${nb_jobs} result${nb_jobs > 1 ? "s" : ""})`]])));
    a.addEventListener("click", async () => { 
        search.setSearchMode(false); // disable search mode
        await refreshSidebar();
    });
    return a;
}

function highlightJobButton() {
    for(let a of SIDEBAR.getElementsByTagName("a")) {
        if(a.id == "clear_search" && search.isSearchMode()) {
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

function setJobListDisplay() {
    const items = ["display.job.id", "display.job.owner", "display.app.name", "display.flavor.name", "display.job.creation.date", "display.job.end.date"];
    for(let a of SIDEBAR.getElementsByTagName("a")) {
        const labels = a.getElementsByTagName("i");
        if(labels.length > 0) {
            for(let i = 0; i < items.length; i++) {
                labels[i].style.display = settings.CONFIG.has(items[i]) && settings.CONFIG.get(items[i]) ? "block" : "none";
            }
        }
    }
}

async function openJob(a) {
    // set the flag to true, the refreshSidebar function will set the parameters only once
    OPEN_JOB = true;
    // store the current job id in the utils module
    utils.setCurrentJobId(a.id.replace("job_", ""));
    // immediately highlight the selected job
    highlightJobButton();
    // show the loading screen
    utils.toggleLoadingScreen();
    // refresh the job list
    await refreshSidebar();
    // remove the loading screen
    utils.toggleLoadingScreen();
}

function createJobItem(label, image = null) {
    // using innerHTML to add the image and the label, otherwise adding textContent would remove the image (alternative solution would be to use a span for the label and an img for the image, but this is simpler)
    const i = document.createElement("i");
    i.innerHTML = image ? `<img src="${image}" />${label}` : label;
    return i;
}

function createJobButton(job) {
    const image = "./img/" + job.status.replace("ARCHIVED_", "").toLowerCase() + ".png";
    const a = elements.createElement("a", new Map([["id", `job_${job.id}`], ["href", "#"], ["class", "w3-button"]]));
    // add the image on the left side of the button, representing the job status
    const img = elements.createElement("img", new Map([["src", image]]));
    utils.tooltip(img, job.status.replace("ARCHIVED_", ""));
    a.appendChild(elements.createElement("span", null, [img]));
    // add the information about the job in a label
    const id = createJobItem(`Job ID: ${job.id}`);
    const owner = createJobItem(`Owner: ${job.owner}`, "img/owner.png", job.id);
    const appName = createJobItem(apps.getFullName(job.app_name), "img/cmd-app.png");
    const strategy = createJobItem(job.strategy == "" ? "No strategy selected" : job.strategy, "img/strategy.png");
    const creationDate = createJobItem(utils.formatDate(job.creation_date), "img/hg-create-white.png");
    const endDate = job.end_date ? createJobItem(utils.formatDate(job.end_date), "img/hg-end-white.png") : createJobItem("");
    // add all the elements in a label
    const label = elements.createElement("label", new Map([["class", job.status.startsWith("ARCHIVED_") ? "archived" : ""]]), [id, owner, appName, strategy, creationDate, endDate]);
    // add a class to the label if the job is part of a workflow (the css should add a small icon on the top right side of the label, to link it with the previous job)
    if(job.start_after_id != null && job.start_after_id != "") {
        const top = elements.createElement("img", new Map([["class", "workflow wf-top"], ["src", "img/link-top.png"]]));
        utils.tooltip(top, "This job is part of a workflow");
        SIDEBAR.children[SIDEBAR.children.length - 1].children[0].appendChild(top);
        const bottom = elements.createElement("img", new Map([["class", "workflow wf-bottom"], ["src", "img/link-bottom.png"]]));
        utils.tooltip(bottom, "This job is part of a workflow");
        a.children[0].appendChild(bottom);
    }
    a.appendChild(label);
    // add the job button event
    a.addEventListener("click", () => {
        // if the previous job was a new job, warn the user that changes will be lost
        if(utils.getCurrentJobId() <= 0 && apps.isFormDirty())
            dialog.createDialogQuestion("Warning", "The changes you have made to the parameters will be lost, continue?", openJob, "Yes", a);
        else openJob(a);
    });
    return a;
}

function retryReloadJobList() {
    utils.setOffline(false);
    refreshSidebar();
}

async function refreshSidebar(reloadPreviousSettings = true) {
    const [jobs, error] = search.isSearchMode() ? await search.searchJobs(reloadPreviousSettings) : await window.electronAPI.getLastJobs(utils.getCurrentJobId(), settings.CONFIG.get("max.nb.jobs"));
    if(error) {
    // do not reopen the dialog if it's already open
    if(!dialog.isDialogOfflineOpen()) {
        utils.setOffline(true);
        const title = "Cumulus is disconnected!";
        const message = `Cumulus has lost the connection with the server with the following error:<br/>${error}<br/><br/>Please contact your administrator.`;
        dialog.createDialogOffline(title, message, retryReloadJobList);
    }
    } else {
        SIDEBAR.innerHTML = ""; // clear the sidebar
        // we start with a button to create a new job and a button to cancel the search
        SIDEBAR.appendChild(createNewJobButton());
        SIDEBAR.appendChild(createCancelSearchButton(jobs.length));
        // then add one button for each job
        for(let job of jobs) {
            SIDEBAR.appendChild(createJobButton(job));
            if(job.id == utils.getCurrentJobId()) {
                if(OPEN_JOB) {
                    jc.updateJobPage(job, true);
                    jc.openCurrentJob(job);
                    jc.generateButtonBars(job.status, job.workflow_name != null && job.workflow_name != "");
                } else {
                    jc.updateJobPage(job, false);
                    jc.generateButtonBars(job.status, job.workflow_name != null && job.workflow_name != "");
                }
            }
        }
    }
    // display what the user wants to see in the list
    setJobListDisplay();
    // highlight the selected job
    highlightJobButton();
    // reset the flag, default behavior is that the list of jobs is refreshed every n seconds
    OPEN_JOB = false;
}

function reloadJobListOrSleep(reloadPreviousSettings = true) {
    // refresh the list of jobs
    if(utils.doRefresh()) refreshSidebar(reloadPreviousSettings);
    // check sleepiness
    utils.checkSleepMode();
}

function resetInterval() {
    if(INTERVAL) clearInterval(INTERVAL);
    INTERVAL = window.setInterval(reloadJobListOrSleep, settings.CONFIG.get("refresh.rate") * 1000);
}

function pauseRefresh() {
    if(INTERVAL) {
        __electronLog.debug("Stop refreshing");
        clearInterval(INTERVAL);
        INTERVAL = null;
    } else {
        __electronLog.debug("Start refreshing");
        resetInterval();
    }
}

export { highlightJobButton, pauseRefresh, refreshSidebar, resetInterval, setJobListDisplay };