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
import * as elements from "./app_elements/elements.js";
import * as tabs from "./tabs.js";
import * as jobs from "./sidebar.js";
import * as output from "./output.js";
import * as apps from "./appmanager.js";
import * as settings from "./settings.js";
import * as filelist from "./app_elements/filelist.js";

var INITIALIZED = false;
const FORM = document.getElementById("formParameters");
const LOG_ELEMENT = document.getElementById("txtMergedLog");
// Create the chart once
const PLOT_CONTEXT = document.getElementById('pltJobUsage').getContext('2d');
var PLOT_LABELS = [];
var PLOT_CPU = [];
var PLOT_RAM = [];
const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
const accentColorDark = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-bg').trim();
const oppositeColor = getComputedStyle(document.documentElement).getPropertyValue('--opposite-color').trim();
const oppositeColorDark = getComputedStyle(document.documentElement).getPropertyValue('--opposite-color-bg').trim();
/* 
TODO
Use a fix width for the X axis, and when the data exceed this width, either remove the oldest data or use a sliding window to display only the last N data points.
We could add some buttons between the log and the chart: copy to clipboard, all points or last 250 points, hide/show chart
*/
const PLOT_ELEMENT = new Chart(PLOT_CONTEXT, {
  type: 'line',
  data: {
    labels: PLOT_LABELS,
    datasets: [
        { label: 'CPU Usage (%)', borderColor: accentColor, backgroundColor: accentColorDark, data: PLOT_CPU, fill: true, tension: 0.1 },
        { label: 'RAM Usage (%)', borderColor: oppositeColor, backgroundColor: oppositeColorDark, data: PLOT_RAM, fill: true, tension: 0.1 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    scales: {
        y: { min: 0, max: 100, title: { display: false, text: 'Usage (%)' }, ticks: { stepSize: 50 } },
        x: { title: { display: false, text: 'Time' }, ticks: { display: false } }
    },
    plugins: {
      legend: { position: 'top', align: 'center' },
    }
  }
});

function initialize() {
    if(INITIALIZED) return;
    document.getElementById("cmbAppName").addEventListener("change", () => {
      document.getElementById("btnParameters").disabled = false;
      if(apps.isWorkflow(document.getElementById("cmbAppName").value)) {
        document.getElementById("txtWorkflowName").value = document.getElementById("cmbAppName").value;
      } else {
        document.getElementById("txtWorkflowName").value = "";
      }
      generateButtonBars();
      apps.generate_parameters_page();
    });
    document.getElementById("cmbStrategy").addEventListener("change", () => {
        // extract the associated weight from the selected strategy (what is between "Weight: "and "]")
        const weightMatch = document.getElementById("cmbStrategy").selectedOptions[0].textContent.match(/Weight:\s*(\d+)\]/);
        const weight = weightMatch ? parseInt(weightMatch[1]) : 0;
        // get the max allowed weight
        const maxWeight = settings.CONFIG.get("openstack.max.flavor");
        // display a warning if the weight is over the max allowed weight divided by 2
        document.getElementById("txtStrategyWarning").parentElement.style.display = (weight > maxWeight / 2) ? "block" : "none";
    });
    utils.tooltip(document.getElementById("txtJobOwner").previousElementSibling, "This field shows the name of the user who created the job, it cannot be modified.");
    utils.tooltip(document.getElementById("txtJobStatus").previousElementSibling, "A job goes through the following statuses: PENDING, PREPARING, RUNNING, DONE or FAILED or CANCELLED. It will also be archived later."); // PENDING, PREPARING, RUNNING, DONE, FAILED, CANCELLED, ARCHIVED_DONE, ARCHIVED_FAILED, ARCHIVED_CANCELLED
    utils.tooltip(document.getElementById("cmbAppName").previousElementSibling, "Select the software to run, with its corresponding version.");
    utils.tooltip(document.getElementById("cmbStrategy").previousElementSibling, "The strategy to create the virtual machine. WARNING: the heavier the strategy the longer it may take to start your job.");
    utils.tooltip(document.getElementById("txtJobDescription").previousElementSibling, "Add a description to your job, it can help you or others to distinguish a job without reviewing the set of parameters.");
}

function updateField(fieldId, value = null, display = null, display_of_parent = null, classes_to_add = [], classes_to_remove = [], disabled = null, selectedIndex = null, innerHTML = null) {
    const field = document.getElementById(fieldId);
    if(!field) {
        __electronLog.error(`Field with id '${fieldId}' not found in the DOM.`);
        return;
    }
    if(value) field.value = value;
    if(display) field.style.display = display;
    if(display_of_parent) field.parentNode.style.display = display_of_parent;
    for(const cls of classes_to_add) {
        field.classList.add(cls);
    }
    for(const cls of classes_to_remove) {
        field.classList.remove(cls);
    }
    if(disabled) field.disabled = disabled;
    if(selectedIndex && field.tagName.toUpperCase() == "SELECT") field.value = selectedIndex;
    if(innerHTML) field.innerHTML = innerHTML;
}

function cleanJob() {
    // clear the Summary tab
    updateField("txtJobOwner", utils.getUserName());
    updateField("txtJobStatus", "", null, "none");
    updateField("txtWorkflowName", "", null, null, ["w3-hide"]);
    updateField("cmbAppName", "", null, null, [], ["w3-hide"], false);
    document.getElementById("cmbAppName").selectedIndex = 0;
    updateField("txtAppName", null, null, null, ["w3-hide"]);
    updateField("cmbStrategy", null, null, null, [], ["w3-hide"], false, 0);
    updateField("txtJobStrategy", null, null, null, ["w3-hide"]);
    updateField("txtJobDescription", "", null, null, [], [], false);
    updateField("divDates", null, "none");
    // clear the Parameters tab
    FORM.innerHTML = "";
    // clear the Log tab
    LOG_ELEMENT.innerHTML = "";
    PLOT_ELEMENT.data.datasets[0].data = [];
    PLOT_ELEMENT.data.datasets[1].data = [];
    // clear the Output tab
    document.getElementById("outputSummary").textContent = "Nothing yet...";
    document.getElementById("treeview").innerHTML = "";
}

function generateButton(label, callback = null, id = "", classes = "", is_disabled = false) {
    const button = elements.createElement("button", new Map([["class", classes], ["textContent", label]]));
    if(callback) button.addEventListener("click", callback);
    if(id) button.id = id;
    if(is_disabled) button.disabled = true;
    return button;
}

function createButtonBarGotoParameters(parent_id, is_disabled) {
    const parent = document.getElementById(parent_id);
    parent.innerHTML = ""; // clear the content
    parent.appendChild(generateButton("Set the parameters", () => tabs.openTab("tabParameters"), "btnNext", "w3-button w3-block color-opposite", is_disabled));
}
function createButtonBarCloneCancelDelete(parent_id, is_workflow, is_finished) {
    // display a button to clone the job, if the job is part of a workflow we also display a button to clone the workflow
    // if the job is finished, we display a delete button, otherwise a cancel button
    const parent = document.getElementById(parent_id);
    parent.innerHTML = ""; // clear the content
    // define the number of buttons: 2 if the job is part of a workflow, 3 otherwise
    const button_width = is_workflow ? "w3-third" : "w3-half";
    // add a clone button for the job
    parent.appendChild(generateButton("Clone job", () => cloneJob(), "", `w3-button ${button_width} color-opposite`));
    // add a clone button for the workflow if applicable
    if(is_workflow) parent.appendChild(generateButton("Clone workflow", () => cloneWorkflow(), "", `w3-button ${button_width} color-opposite`)); // TODO write cloneWorkflow function
    // add a cancel button if the job is running or pending, otherwise add a delete button
    if(is_finished) parent.appendChild(generateButton(is_workflow ? "Delete workflow" : "Delete job", () => deleteJob(), "", `w3-button ${button_width} color-secondary`));
    else parent.appendChild(generateButton(is_workflow ? "Cancel workflow" : "Cancel job", () => cancelJob(), "", `w3-button ${button_width} color-secondary`));
}
function createButtonBarStartJob(parent_id, is_workflow) {
    const parent = document.getElementById(parent_id);
    parent.innerHTML = ""; // clear the content
    if(is_workflow) {
        parent.appendChild(generateButton("Previous app settings", (e) => apps.switchWorkflowApp(e, false), "btnGotoPrev", "w3-button color-opposite w3-disabled"));
        parent.appendChild(generateButton("Start Workflow", () => startJob(), "btnStart", "w3-button color-accent w3-hide"));
        parent.appendChild(generateButton("Next app settings", (e) => apps.switchWorkflowApp(e, true), "btnGotoNext", "w3-button color-opposite"));
        for(let i = 0; i < parent.children.length; i++) {
            parent.children[i].style.width = "calc(50% - 1px)"; // make sure the buttons are equally sized, with some space between them
            if(i > 0) parent.children[i].style.marginLeft = "2px"; // add a margin to the right of the first button
        }
    } else {
        parent.appendChild(generateButton("Start job", () => startJob(), "btnStart", "w3-bar-item w3-button w3-block color-accent"));
    }
}

function generateButtonBars(status = "", isWorkflow = false) {
    // a job is part of a workflow if the field "workflow_name" is not null
    if(utils.getCurrentJobId() <= 0) { // new job
        createButtonBarGotoParameters("divSummaryButtonBar", document.getElementById("cmbAppName").value == "");
        createButtonBarStartJob("divParamsButtonBar", document.getElementById("txtWorkflowName").value != "");
    } else { // existing job
        createButtonBarCloneCancelDelete("divSummaryButtonBar", isWorkflow, status != "RUNNING" && status != "PENDING" && status != "PREPARING");
        createButtonBarCloneCancelDelete("divParamsButtonBar", isWorkflow, status != "RUNNING" && status != "PENDING" && status != "PREPARING");
    }
}

function describeJobDates(job) {
    var html = `<div class='w3-third'><img src='img/hg-create-alt.png'/><label>Created at ${utils.formatDate(job.creation_date)}</label></div>`;
    html += job.start_date ? `<div class="w3-third"><img src='img/hg-begin-alt.png'/><label>Started at ${utils.formatDate(job.start_date)}</label></div>` : "<div class='w3-third'>&nbsp;</div>";
    html += job.end_date ? `<div class="w3-third"><img src='img/hg-end-alt.png'/><label>Ended at ${utils.formatDate(job.end_date)}</label></div>` : "<div class='w3-third'>&nbsp;</div>";
    if(job.status != "RUNNING" && job.status != "PENDING" && job.status != "PREPARING") {
        const days = settings.CONFIG.get("data.max.age.in.days") - Math.floor((new Date() - new Date(job.creation_date * 1000)) / 86400000);
        html += `<br/><span>This job will be archived in ${days} day${days > 1 ? "s" : ""}. You will still have access to the parameters and to the logs, but the output files will be deleted.</span>`;
    }
    return html;
}

async function displayFileTransfers(job) {
    // get the transfer progression from the rsync client
    const [data, error] = await window.electronAPI.getTransferProgress(job.owner, job.id);
    // handle the error, it's likely a connexion error from the rsync agent, display a popup?
    const map = error ? new Map() : new Map(Object.entries(data));
    // get the list of files
    const files = elements.getLocalFiles().concat(elements.getSharedFiles());
    // display the list of files
    var html = "";
    var nb = 0;
    for(let file of files) {
        // only display the basename
        const name = file.split(file.includes("/") ? "/" : "\\").pop();
        // add a span with the percentage: 0%, n%, or ✓ (in bold, accent bgcolor and round icon?)
        var span = error ? "<span class='fail'>✗</span>" : "<span class='done'>✓</span>"
        if(map.has(name)) span = `<span>${map.get(name)}%</span>`;
        html += `<li>${name}${span}</li>`;
        if(!map.has(name)) nb++;
    }
    const ul = document.getElementById("tabLogs").getElementsByTagName("ul")[0];
    ul.innerHTML = html;
    ul.previousElementSibling.textContent = error ? error : "Your job will begin once all the files listed below are completely transferred.";
    ul.previousElementSibling.previousElementSibling.textContent = `File transfer ${nb}/${files.length}`;
}

function updateJobPage(job, generateParametersTab = true) {
    // sometimes the job or its settings can be null, it can happen when the refreshing of the job list is not done yet
    if(job != null && job.settings != null) {
        updateField("txtJobOwner", job.owner, null, null, [], [], true);
        updateField("txtJobStatus", job.status, null, "block", [], [], true);
        updateField("cmbAppName", job.app_name, null, null, ["w3-hide"]);
        updateField("txtAppName", job.app_name, null, null, [], ["w3-hide"]);
        updateField("txtWorkflowName", job.workflow_name, null, null, [], ["w3-hide"]);
        updateField("cmbStrategy", null, null, null, ["w3-hide"], [], null, job.strategy)
        // TODO if the strategy is not in the list, just print it in the text field (it's an old strategy that has been removed from the list)
        if(document.getElementById("cmbStrategy").value == "")
            updateField("txtJobStrategy", job.strategy, null, null, [], ["w3-hide"]);
        else
            updateField("txtJobStrategy", document.getElementById("cmbStrategy").selectedOptions[0].textContent, null, null, [], ["w3-hide"]);
        updateField("txtJobDescription", job.description, null, null, [], [], true);
        updateField("divDates", null, "block", null, [], [], null, null, describeJobDates(job));
        // generate the button bar
        generateButtonBars(job.status, job.workflow_name != null);
        // generate the parameters page, but do not set the values yet
        if(generateParametersTab) apps.generate_parameters_page();
        // update the content of the log tab
        if(job.status == "PENDING") {
            document.getElementById("tabLogs").children[0].classList.remove("w3-hide");
            document.getElementById("tabLogs").children[1].classList.add("w3-hide");
            // display the progression for each file
            displayFileTransfers(job);
        } else {
            // hide the file transfer info
            document.getElementById("tabLogs").children[0].classList.add("w3-hide");
            document.getElementById("tabLogs").children[1].classList.remove("w3-hide");
            // do not reload the logs if the content is the same (especially if the job is finished)
            const logContent = utils.extractJobLog(job.log, true, true, true, false);
            if(LOG_ELEMENT.innerHTML == "" || LOG_ELEMENT.innerHTML != logContent) {
                LOG_ELEMENT.innerHTML = logContent;
                // scroll to the bottom of the log if the job is running
                if(job.status == "RUNNING" || job.status == "PREPARING") LOG_ELEMENT.scrollTop = LOG_ELEMENT.scrollHeight;
            }
            // update the CPU/RAM usage plot
            [PLOT_LABELS, PLOT_CPU, PLOT_RAM] = utils.extractInfoFromJobLog(job.log);
            PLOT_ELEMENT.data.labels = PLOT_LABELS;
            PLOT_ELEMENT.data.datasets[0].data = PLOT_CPU;
            PLOT_ELEMENT.data.datasets[1].data = PLOT_RAM;
            PLOT_ELEMENT.update();
        }
        // update the content of the Output tab
        if(!job.status.startsWith("ARCHIVED_")) output.insertOutputFiles(job.files);
        // enable or disable tabs depending on the status
        document.getElementById("btnParameters").disabled = false;
        // document.getElementById("btnTransfers").disabled = false;
        document.getElementById("btnLogs").disabled = false;
        document.getElementById("btnOutput").disabled = job.status.startsWith("ARCHIVED_"); // user can see and download files unless the job is archived and the folder is gone
        // highlight the job in the sidebar
        jobs.highlightJobButton();
    } else __electronLog.error("Failed to load the job");
}

function openNewJob() {
    // set the current job id to 0 (new job)
    utils.setCurrentJobId(0);
    // make the "New Job" button visible to indicate that we are creating a new job
    jobs.highlightJobButton();
    // reset the content of all tabs
    cleanJob();
    // set the default strategy
    document.getElementById("cmbStrategy").value = settings.CONFIG.get("default.strategy");
    // disable the other tabs
    document.getElementById("btnParameters").disabled = true;
    // document.getElementById("btnTransfers").disabled = true;
    document.getElementById("btnLogs").disabled = true;
    document.getElementById("btnOutput").disabled = true;
    // generate the button bar
    generateButtonBars();
    // open the first tab
    tabs.openTab("tabSummary");
}

function setSettings(settings, disable_all_parameters = false) {
    // set the values to the form
    apps.setParamValues(settings);
    // call the events if there are any (only the WHEN cases!)
    for(let item of FORM.getElementsByClassName("cond")) {
        apps.conditionalEvent(item);
    }
    // for all WHEN cases that are not selected, unset the parameters (when cloning a job, it's confusing to see parameters set with unmatched conditions)
    for(let item of FORM.getElementsByClassName("when")) {
        if(!item.classList.contains("visible")) {
            // search all parameters and unset them
            apps.resetParamValues(item);
        }
    }
    // on file lists, display the number of files that are in the list (search for class "param-file-list")
    for(let item of FORM.getElementsByClassName("param-file-list")) {
        filelist.updateFileList(item);
    }
    // when the job is not new, disable all parameters
    if(disable_all_parameters) {
        // disable all parameters in the form
        apps.disableParameters(FORM, true);
    }
}

function openCurrentJob(job) {
    // the job has been loaded, except for the parameters (this allows to load the parameters once, while the other tabs can be refreshed)
    setSettings(new Map(Object.entries(job.settings)), true);
    // open the Summary tab once the job is loaded
    tabs.openTab("tabSummary");
}

function cloneJob() {
    // use the current job as a template for the new job
    // in fact, we just need to set the current job id to 0 and change some fields in the form
    // the parameters will remain as they are, so the user can modify them if needed
    // if the job is part of a workflow, all the parameters are already set, but not displayed

    // set the new job id
    utils.setCurrentJobId(0);
    // update some of the fields
    document.getElementById("txtJobOwner").value = utils.getUserName();
    document.getElementById("txtJobStatus").value = "";
    document.getElementById("txtJobStatus").parentNode.style.display = "none";
    document.getElementById("cmbAppName").disabled = false;
    document.getElementById("cmbAppName").classList.remove("w3-hide");
    document.getElementById("txtAppName").classList.add("w3-hide");
    document.getElementById("cmbStrategy").disabled = false;
    document.getElementById("cmbStrategy").classList.remove("w3-hide");
    document.getElementById("txtJobStrategy").classList.add("w3-hide");
    // if the strategy is unset (because it was an old strategy), set it to the default one
    if(document.getElementById("cmbStrategy").value == "")
        document.getElementById("cmbStrategy").value = settings.CONFIG.get("default.strategy");
    // document.getElementById("txtSelectedHost").parentNode.style.display = "none";
    document.getElementById("txtJobDescription").disabled = false;
    document.getElementById("divDates").style.display = "none";
    generateButtonBars("PENDING", false);
    LOG_ELEMENT.innerHTML = "";
    PLOT_ELEMENT.data.datasets[0].data = [];
    PLOT_ELEMENT.data.datasets[1].data = [];
    document.getElementById("outputSummary").textContent = "Nothing yet...";
    document.getElementById("treeview").innerHTML = "";
    document.getElementById("btnLogs").disabled = true;
    document.getElementById("btnOutput").disabled = true;
    // enable all parameters in the form
    apps.disableParameters(FORM, false);
    // highlight the "New job" button to give the impression that a new job was opened
    jobs.highlightJobButton();
}

function cancelJob() {
    const owner = document.getElementById("txtJobOwner").value;
    if(owner != utils.getUserName()) dialog.createDialogWarning("Operation impossible", "You are not the owner of this job, you cannot cancel it!");
    else {
        dialog.createDialogQuestion("Warning", "Are you sure you want to cancel this job?", async () => {
            utils.toggleLoadingScreen();
            const [_, error] = await window.electronAPI.cancelJob(utils.getUserName(), utils.getCurrentJobId());
            if(error != "") dialog.createDialogWarning("The job could not be canceled", error);
            jobs.refreshSidebar();
            utils.toggleLoadingScreen();
        });
    }
}

function deleteJob() {
    const owner = document.getElementById("txtJobOwner").value;
    if(owner != utils.getUserName()) dialog.createDialogWarning("Operation impossible", "You are not the owner of this job, you cannot delete it!");
    else {
        dialog.createDialogQuestion("Warning", "Are you sure you want to delete this job?", async () => {
            utils.toggleLoadingScreen();
            const [_, error] = await window.electronAPI.deleteJob(utils.getUserName(), utils.getCurrentJobId());
            if(error != "") dialog.createDialogWarning("The job could not be deleted", error);
            jobs.refreshSidebar();
            utils.toggleLoadingScreen();
        });
    }
}

async function startJob() {
    // check if the app parameters are valid
    const errors = apps.checkParamValues();
    if(errors.length > 0) {
        // display the errors in a dialog
        dialog.createDialogWarning("Invalid parameters", errors.join("<br/>"));
    } else {
        // display the loading screen
        utils.toggleLoadingScreen();
        // gather all parameters
        const appName = document.getElementById("cmbAppName").value;
        const strategy = document.getElementById("cmbStrategy").value;
        const description = document.getElementById("txtJobDescription").value;
        // also get the files, make sure that UNC paths are replaced by the network path
        // const sharedFiles = JSON.stringify(elements.getSharedFiles());
        // const localFiles = JSON.stringify(elements.getLocalFiles());
        // also get the files, the UNC paths will be replaced by the network paths on server side
        const sharedFiles = elements.getSharedFiles();
        const localFiles = elements.getLocalFiles();
        // get the settings from the form, one by one (in case of a workflow, there would be one settings set per job)
        var first_job_id = null; // in case of a workflow, the first job will be displayed later
        var previous_job_id = null;
        var error = "";
        for(let [app_id, settings] of apps.getSettingsSets()) {
            // in case of a workflow, appName is the workflow_id, otherwise it is the same as app_id
            const workflow_id = apps.isWorkflow(appName) ? document.getElementById("txtWorkflowName").value : null;
            // send the job to the server
            previous_job_id = await window.electronAPI.startJob(utils.getUserName(), app_id, strategy, description, settings, sharedFiles, localFiles, previous_job_id, workflow_id);
            // if the job_id is not numeric, it's an error message
            if(isNaN(previous_job_id) || previous_job_id === "") {
                error = previous_job_id === "" ? "Unknown error, the server did not return a job id." : previous_job_id;
                break;
            }
            if(first_job_id == null) first_job_id = previous_job_id; // store the first job id to display it later
        }
        utils.toggleLoadingScreen();
        if(error != "") {
            dialog.createDialogWarning("Job creation failure", `The creation of the job failed with the following error:<br/>${error}`);
        } else {
            // reload the job list
            utils.setCurrentJobId(first_job_id);
            jobs.refreshSidebar();
            document.getElementById("btnLogs").disabled = false;
            tabs.openTab("tabLogs");
        }
    }
}

export { generateButtonBars, initialize, openNewJob, openCurrentJob, updateJobPage, setSettings, startJob };
