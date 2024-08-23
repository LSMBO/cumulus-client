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

const FormData = require('form-data');
const config = require('./config.js');
const rest = require('./rest.js');

async function checkServer() {
    const localVersion = config.get("cumulus.version");
    // check that the server can be reached
    const [remoteVersion, error] = await rest.sendGetRequest(rest.getUrl("version"));
    if(error != "") return error;
    // check that the client version matches the server version
    else if(localVersion != remoteVersion) return `Local version '${localVersion}' does not match with server version '${remoteVersion}', please update.`;
    // check that the rsync agent can be reached
    else {
        const [response, error2] = await rest.sendGetRequest(rest.getUrl("/", [], true));
        if(error2) return error2;
        else if(response != "OK") return "The RSync agent was reached but the expected code was incorrect.";
        else return "";
    }
}

// async function checkRsyncAgent() {
//     const [response, error] = await rest.sendGetRequest(rest.getUrl("/", [], true));
//     if(error) return error;
//     else if(response != "OK") return "Error with the RSync agent";
//     else return "";
// }

// async function checkVersion() {
//     const localVersion = config.get("cumulus.version");
//     const url = rest.getUrl("version");
//     const [remoteVersion, error] = await rest.sendGetRequest(url);
//     console.log(`Client version: '${localVersion}'; Server version: '${remoteVersion}'; error message: '${error}'`);
//     // if(localVersion == remoteVersion) return ["", error];
//     // else return [`Local version '${localVersion}' does not match with server version '${remoteVersion}', please update.`, error];
//     if(error != "") return error;
//     else if(localVersion != remoteVersion) return `Local version '${localVersion}' does not match with server version '${remoteVersion}', please update.`;
//     else return "";
// }

async function listStorage() {
    const url = rest.getUrl("storage");
    const [data, error] = await rest.sendGetRequest(url);
    // console.log("storage: "+JSON.parse(data));
    const output = new Map(JSON.parse(data));
    if(!error) {
        // also request the rsync agent to get a list of file names
        const rsync_url = rest.getUrl("list-rsync", [], true);
        // console.log(rsync_url);
        const [files, error2] = await rest.sendGetRequest(rsync_url);
        // console.log("transfer: "+files);
        if(!error2) {
            for(let file of JSON.parse(files)) {
                // do not add the files already on the server
                // new files have a size of -1
                if(!output.has(file)) output.set(file, -1);
            }
        }
    }
    return [output, error];
}

async function listHosts() {
    const url = rest.getUrl("info");
    const [data, error] = await rest.sendGetRequest(url);
    // console.log("info: "+JSON.parse(data));
    return [JSON.parse(data), error];
}

async function createJob(_, owner, app, strategy, description, settings, rawfiles, fastafiles) {
    // prepare the parameters
    const form = new FormData({ maxDataSize: 20971520 });
    form.append("username", owner);
    form.append("app_name", app);
    form.append("strategy", strategy);
    form.append("description", description);
    // stringify the settings
    // const txt_settings = JSON.stringify(Object.fromEntries(settings));
    // form.append("settings", str = txt_settings);
    form.append("settings", str = settings);
    // send the request
    const url = rest.getUrl("start");
    const data = await rest.sendPostRequest(url, form);
    // return id;
    // console.log("start: "+data);
    const [job_id, job_dir] = JSON.parse(data)
    // console.log(data);
    // console.log(`Job created with id ${job_id} and directory '${job_dir}'`);
    // call the rsync agent to transfer the files
    const form2 = new FormData({ maxDataSize: 20971520 });
    form2.append("job_id", job_id);
    form2.append("job_dir", job_dir);
    form2.append("owner", owner);
    form2.append("files", rawfiles);
    form2.append("local_files", fastafiles);
    // form2.append("files", JSON.parse(rawfiles));
    // form2.append("local_files", JSON.parse(fastafiles));
    await rest.sendPostRequest(rest.getUrl("send-rsync", [], true), form2);
    // return the job id
    return job_id;
}

async function jobDetails(_, job_id) {
    const url = rest.getUrl("details", [job_id]);
    const [data, error] = await rest.sendGetRequest(url);
    // console.log("details: "+JSON.parse(data));
    const json = JSON.parse(data);
    const map = new Map(Object.entries(json));
    // console.log("details: "+map);
    return [map, error];
}

// async function getLastJobs(_, number) {
//     const url = rest.getUrl("joblist", [number]);
//     const [data, error] = await rest.sendGetRequest(url);
//     return [JSON.parse(data), error];
// }
async function getLastJobs(_, job_id, number) {
    // console.log(`getLastJobs(_, ${job_id}, ${number})`);
    const url = rest.getUrl("joblist", [job_id, number]);
    const [data, error] = await rest.sendGetRequest(url);
    return [JSON.parse(data), error];
}

async function searchJobs(_, current_job_id, owner, app, file, desc, statuses, date, from, to, number) {
    const form = new FormData({ maxDataSize: 20971520 });
    form.append("current_job_id", current_job_id);
    form.append("owner", owner);
    form.append("app", app);
    form.append("file", file);
    form.append("description", desc);
    form.append("date", date);
    form.append("from", from);
    form.append("to", to);
    for(let status of statuses) {
        form.append(status.toLowerCase(), 1);
    }
    form.append("number", number);
    // send the request
    const data = await rest.sendPostRequest(rest.getUrl("search"), form);
    // console.log(data);
    return [JSON.parse(data), ""];
}

async function jobStatus(_, job_id) {
    const url = rest.getUrl("status", [job_id]);
    const [data, error] = await rest.sendGetRequest(url);
    // console.log("status: "+JSON.parse(data));
    return [JSON.parse(data), error];
}

async function transferProgress(_, owner, job_id) {
    const [data, error] = await rest.sendGetRequest(rest.getUrl("progress-rsync", [owner, job_id], true));
    console.log(data);
    return [JSON.parse(data), error];
}

async function cancelJob(_, owner, job_id) {
    // request the rsync agent to cancel the transfers corresponding to this job
    await rest.sendGetRequest(rest.getUrl("cancel-rsync", [owner, job_id], true));
    // console.log("transfer: "+files);
    // for(let file of JSON.parse(files)) {
    //     // do not add the files already on the server
    //     // new files have a size of -1
    //     if(!output.has(file)) output.set(file, -1);
    // }
    const url = rest.getUrl("cancel", [owner, job_id]);
    const [data, error] = await rest.sendGetRequest(url);
    return [data, error];
}

async function deleteJob(_, owner, job_id) {
    const url = rest.getUrl("delete", [owner, job_id]);
    const [data, error] = await rest.sendGetRequest(url);
    return [data, error];
}

async function listJobFiles(_, owner, job_id) {
    const url = rest.getUrl("getfilelist", [owner, job_id]);
    const [data, error] = await rest.sendGetRequest(url);
    return [JSON.parse(data), error];
}

async function downloadFile(_, owner, job_id, file_name, target) {
    const url = rest.getUrl("getresults", [owner, job_id, file_name]);
    await rest.download(url, target);
}

module.exports = { cancelJob, checkServer, createJob, deleteJob, downloadFile, getLastJobs, jobDetails, jobStatus, listHosts, listJobFiles, listStorage, searchJobs, transferProgress }
