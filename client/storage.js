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
import * as utils from "./utils.js";
import * as settings from "./settings.js";

var INITIALIZED = false;

function initialize() {
  if(INITIALIZED) return;
  document.getElementById("txtStorageSearch").addEventListener("keyup", searchStorage);
  utils.tooltip(document.getElementById("txtStorageSearch"), "You can use the following wildcards:\n    '*' matches any number of characters\n    '?' matches exactly one character\n    '^' indicate the beginning of the file name\n    '$' indicate the end of the file name\nThe search is case insensitive");
  document.getElementById("btnStorageDownload").addEventListener("click", async () => await downloadSelectedFiles());
  INITIALIZED = true;
}

function localSort(a, b, asc = true) {
  if(isNaN(a)) {
    if(asc) {
      if(a.toLowerCase() > b.toLowerCase()) return 1;
      if(a.toLowerCase() < b.toLowerCase()) return -1;
      return 0;
    } else {
      if(a.toLowerCase() > b.toLowerCase()) return -1;
      if(a.toLowerCase() < b.toLowerCase()) return 1;
      return 0;
    }
  } else {
    return asc ? a - b : b - a;
  }
}

function sortStorage(byName = true, asc = true) {
  // console.log(`sortStorage(${byName}, ${asc})`);
  // store each row in a map, the key is the row number, the value is the content of the column we want to sort
  const map = new Map();
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  for(let row of table.rows) {
    if(row.rowIndex > 0) {
      // console.log(row);
      if(byName) {
        map.set(row.rowIndex, row.cells[0].getElementsByTagName("label")[0].textContent);
      } else {
        map.set(row.rowIndex, parseInt(row.cells[1].getElementsByTagName("label")[0].textContent));
      }
    }
  }
  // sort by value
  const sortedMap = new Map([...map.entries()].sort((a, b) => localSort(a[1], b[1], asc)));
  // recreate the table content
  table.rows[0].getElementsByTagName("i")[0].textContent = byName ? asc ? "⏶" : "⏷" : "";
  table.rows[0].getElementsByTagName("i")[1].textContent = byName ? "" : asc ? "⏶" : "⏷";
  var content = table.rows[0].outerHTML;
  for(let rowIndex of sortedMap.keys()) {
    content += table.rows[rowIndex].outerHTML;
  }
  table.innerHTML = content;
  table.rows[0].cells[0].addEventListener("click", sortStorageEvent);
  table.rows[0].cells[1].addEventListener("click", sortStorageEvent);
}

function sortStorageEvent(event) {
  // console.log(event);
  const byName = event.target.cellIndex == 0;
  const asc = event.target.getElementsByTagName("i")[0].textContent != "⏶";
  sortStorage(byName, asc);
}

function wildcardToRegex(pattern) {
  // Escape regex special characters except for * and ?
  // let escaped = pattern.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1");
  let escaped = pattern.replace(/([.+=!:{}()|\[\]\/\\])/g, "\\$1");
  // Replace * with .*, ? with .
  let regexString = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(regexString);
}

function searchStorage(_) {
  const tag = document.getElementById("txtStorageSearch").value.toLowerCase();
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  // const regex = new RegExp(tag);
  const regex = wildcardToRegex(tag);
  for(let row of table.rows) {
    // first row is the header
    if(row.rowIndex == 0) continue;
    // use the search tag as a regex
    row.style.display = regex.test(row.cells[0].childNodes[1].textContent.toLowerCase()) ? "" : "none";
  }
}

async function refreshStorage() {
  initialize();
  utils.toggleLoadingScreen();
  // get disk usage
  const disk = await window.electronAPI.getDiskUsage();
  document.getElementById("diskUsage").getElementsByTagName("p")[0].textContent = `Server storage usage: ${utils.toHumanReadable(disk.get("used"))} / ${utils.toHumanReadable(disk.get("total"))}`;
  var pct = disk.get("used") / disk.get("total");
  if(pct < 1) pct = 1;
  else if(pct > 100) pct = 100;
  document.getElementById("diskUsage").getElementsByTagName("div")[0].style.width = `${pct}%`;
  document.getElementById("diskUsage").getElementsByTagName("div")[0].style.backgroundColor = pct > 80 ? "var(--accent-color-light)" : "var(--opposite-color-light)";
  // get uploaded files
  document.getElementById("tabStorage").getElementsByTagName("h6")[0].innerHTML = `Files will be automatically removed after ${settings.CONFIG.get("data.max.age.in.days")} days (unless they are being used)`;
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  const [data, _] = await window.electronAPI.listStorage();
  var content = "<tr class='color-secondary'><th>File name<i></i></th><th>Size<i></i></th></tr>";
  var i = 1;
  for(const [file, size] of data) {
    // const cls = size == -1 ? "rsync" : "";
    // const fsize = size == -1 ? "Queued for transfer" : utils.toHumanReadable(size);
    // content += `<tr><td><label class="${cls}">${file}<label></td><td><label>${size}</label><span class="${cls}">${fsize}</span></td></tr>`;
    if(size == -1) {
      // file is being transferred
      content += `<tr><td><label for="chk_${i}" class="${rsync}">${file}<label></td><td><label>${size}</label><span class="${rsync}">Queued for transfer</span></td></tr>`;
    } else {
      // normal file
      content += `<tr><td><input type="checkbox" id="chk_${i}"><label for="chk_${i}">${file}<label></td><td><label>${size}</label><span>${utils.toHumanReadable(size)}</span></td></tr>`;
    }
    i++;
  }
  table.innerHTML = content;
  sortStorage();
  utils.toggleLoadingScreen();
}

function openStorage() {
  // ask the server for the list of files
  refreshStorage();
  tabs.openTab("tabStorage");
}

async function downloadFiles(path, files) {
  const btn = document.getElementById("btnStorageDownload");
  const label = btn.textContent;
  btn.disabled = true;
  var i = 1;
  const total = files.length;
  for(let file of files) {
    btn.textContent = `Downloading file ${file}`;
    await window.electronAPI.downloadFile(utils.getUserName(), null, file, path + "/" + file);
    document.getElementById("storageDownloadProgressBar").style.width = Math.floor((i * 100)/total) + "%";
    i += 1;
  }
  btn.textContent = `${files.length} have been downloaded`;
  document.getElementById("storageDownloadProgressBar").style.width = "100%";
  await utils.sleep(2000);
  document.getElementById("storageDownloadProgressBar").style.width = "0%";
  btn.textContent = label;
  btn.disabled = false;
}

async function downloadSelectedFiles() {
  // get the list of files
  const files = [];
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  for(let row of table.rows) {
    // first row is the header
    if(row.rowIndex == 0) continue;
    // check if the checkbox is selected
    const checkbox = row.cells[0].getElementsByTagName("input")[0];
    if(checkbox.checked) {
      const filename = row.cells[0].getElementsByTagName("label")[0].textContent;
      files.push(filename);
    }
  }
  // ask the user for the download path
  if(files.length > 0) {
    const path = await window.electronAPI.browseServer("OUT", "Select where the files will be downloaded", "", [{ name: 'All files', extensions: ['*'] }], ['openDirectory']);
    if(path != "") {
      if(await window.electronAPI.countExistingFiles(path[0], files) > 0)
        dialog.createDialogQuestion("Warning", "Some files will be overwritten, do you want to continue?", async () => downloadFiles(path[0], files));
      else await downloadFiles(path[0], files);
    }
  }
}

export { openStorage, refreshStorage, searchStorage };
