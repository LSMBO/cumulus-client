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

const fs = require('fs');
const { net } = require('electron');
const path = require('path')
const config = require('./config.js');

const WAIT_TIME = 100;

function wait(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function sendGetRequest(url) {
    var data = "";
    var error = "";
    try {
        const response = await net.fetch(url);
        if (response.ok) data = await response.text();
    } catch(err) {
        error = err.toString();
    }
    return [data, error];
}

async function sendPostRequest(url, form) {
    var data = "";
    var error = "";
    try {
        var is_ended = false;
        const request = net.request({ method: 'POST', url: url, headers: form.getHeaders() });
        form.pipe(request);
        request.on('response', (response) => {
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => is_ended = true);
        });
        request.end();
        while(!is_ended) await wait(WAIT_TIME); // wait until the request ends before starting the next one
    } catch(err) {
        error = err.toString();
    }
    return [data, error];
}

function getUrl(route, args = [], rsyncAgent = false) {
    var host = "";
    var port = "";
    if(rsyncAgent) {
        host = config.get("rsync.agent");
        port = config.get("rsync.port");
    } else {
        host = config.get("cumulus.controller");
        port = config.get("cumulus.port");
    }
    var url = port == "" ? `http://${host}` : `http://${host}:${port}`;
    url += `/${route}`;
    for(let arg of args) {
        url += "/" + encodeURIComponent(arg);
    }
    return url;
}



async function download(url, target, progressCallback = null, length = null) {
    // create the target directory if it does not exist yet
    const dir = path.dirname(target);
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);

    // request the file to the server
    const request = new Request(url, { headers: new Headers({ "Content-Type": "application/octet-stream" }) });
    const response = await fetch(request);
    if(!response.ok) throw Error(`Unable to download, server returned ${response.status} ${response.statusText}`);

    const body = response.body;
    if(body == null) throw Error("No response body");

    const finalLength = length || parseInt(response.headers.get("Content-Length" || "0"), 10);
    const reader = body.getReader();
    const writer = fs.createWriteStream(target);

    await streamWithProgress(finalLength, reader, writer, progressCallback);
    writer.end();
}

async function streamWithProgress(length, reader, writer, progressCallback) {
    let bytesDone = 0;

    while(true) {
        const result = await reader.read();
        if(result.done) {
            if(progressCallback != null) progressCallback(length, 100);
            return;
        }

        const chunk = result.value;
        if(chunk == null) throw Error("Empty chunk received during download");
        else {
            writer.write(Buffer.from(chunk));
            if(progressCallback != null) {
                bytesDone += chunk.byteLength;
                const percent = length === 0 ? null : Math.floor((bytesDone / length) * 100);
                progressCallback(bytesDone, percent);
            }
        }
    }
}

module.exports = { download, getUrl, sendGetRequest, sendPostRequest }
