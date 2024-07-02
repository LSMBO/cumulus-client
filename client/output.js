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
import * as utils from "./utils.js";

const TREE_VIEW = document.getElementById("treeview");

function toggleFolder(node, forceExpand = false, forceCollapse = false) {
    // show/hide the content of the node
    const item = node.getElementsByTagName("i")[0];
    if(item.textContent != "") {
      var setVisible = item.textContent == "+";
      if(forceExpand) setVisible = true;
      else if(forceCollapse) setVisible = false;
      const level = node.className.replace("lvl", "");
      var next = node.nextSibling;
      while(next != null && next.className.replace("lvl", "") > level) {
        next.style.display = setVisible ? "block" : "none";
        next = next.nextSibling;
      }
      item.textContent = setVisible ? "–" : "+";
    }
}

function expandAllFolders() {
    for(let node of TREE_VIEW.children) {
      toggleFolder(node, true, false);
    }
}

function collapseAllFolders() {
    for(let node of TREE_VIEW.children) {
      toggleFolder(node, false, true);
    }
}

function toggleCheckbox(node, forceCheck = false, forceUncheck = false) {
    // check/uncheck all the boxes below (until the level is lower or equal)
    // TODO if checking a box, also check it's parent
    var setChecked = node.getElementsByTagName("input")[0].checked;
    if(forceCheck) setChecked = true;
    else if(forceUncheck) setChecked = false;
    const level = node.className.replace("lvl", "");
    var next = node.nextSibling;
    while(next != null && next.className.replace("lvl", "") > level) {
      next.getElementsByTagName("input")[0].checked = setChecked;
      next = next.nextSibling;
    }
    node.getElementsByTagName("input")[0].checked = setChecked;
}

function selectAllCheckboxes() {
    for(let node of TREE_VIEW.children) {
      toggleCheckbox(node, true, false);
    }
}

function unselectAllCheckboxes() {
    for(let node of TREE_VIEW.children) {
      toggleCheckbox(node, false, true);
    }
}

function getOutputFileItem(level, name, size) {
    // create the main item
    const item = document.createElement("div");
    item.className = `lvl${level}`;
    item.style = `margin-left: ${level * 25}px`;
    const icon = document.createElement("i");
    if(size == -1) {
      icon.textContent = "–";
      icon.addEventListener("click", (event) => toggleFolder(event.target.parentNode));
    }
    item.appendChild(icon);
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = true;
    chk.addEventListener("change", (event) => toggleCheckbox(event.target.parentNode));
    item.appendChild(chk);
    const label = document.createElement("label");
    label.textContent = name;
    label.addEventListener("click", (event) => {
      event.target.previousSibling.checked = !event.target.previousSibling.checked;
      toggleCheckbox(event.target.parentNode);
    });
    item.appendChild(label);
    if(size != -1) {
      const span = document.createElement("span");
      span.textContent = `(${utils.toHumanReadable(size)})`;
      item.appendChild(span);
    }
    return item;
}

function insertOutputFiles(files) {
    const directories = new Map();
    var totalSize = 0;
    const children = new Array();
    for(let [file, size] of files) {
      const items = file.split("/");
      for(let i = 0; i < items.length - 1; i++) {
        // get the path of each directory, to only create it once
        var path = ".";
        for(let j = 0; j <= i; j++) { path += "/" + items[j]; }
        if(!directories.has(path)) {
          children.push(getOutputFileItem(i, items[i], -1));
          directories.set(path, "");
        }
      }
      // now add the file
      children.push(getOutputFileItem(items.length - 1, items.pop(), size));
      totalSize += size
    }
    // add all the items to the treeview
    TREE_VIEW.innerHTML = "";
    for(let child of children) { TREE_VIEW.appendChild(child); }
    document.getElementById("outputSummary").textContent = `${directories.size} directories, ${files.length} files, ${utils.toHumanReadable(totalSize)} in total`;
    document.getElementById("tabOutput").getElementsByTagName("button")[0].disabled = false;
}

function getTreeName(item) { return item.getElementsByTagName("label")[0].textContent; }
function getTreeLevel(item) { return parseInt(item.className.replace("lvl", "")); }
function getTreePath(item) {
	var path = getTreeName(item);
	var searchedLevel = getTreeLevel(item) - 1;
	if(searchedLevel < 0) return path;
	else {
		var sibling = item.previousElementSibling;
		var siblingLevel = getTreeLevel(sibling);
		while(siblingLevel > 0) { // level will always be 0 before sibling is null
			// if level is the one we want, prepend the name to the path
			if(siblingLevel == searchedLevel) {
				path = getTreeName(sibling) + "/" + path;
				searchedLevel--;
			}
			// previous sibling
			sibling = sibling.previousElementSibling;
			siblingLevel = getTreeLevel(sibling);
		}
		return getTreeName(sibling) + "/" + path;
	}
}

async function downloadFiles(path, files) {
    dialog.closeDialogQuestion();
    const btn = document.getElementById("btnOutputDownload");
    const label = btn.textContent;
    btn.disabled = true;
    var i = 0;
    const total = files.length;
    for(let file of files) {
        btn.textContent = `Downloading file ${file}`;
        await window.electronAPI.downloadFile(utils.getUserName(), utils.getCurrentJobId(), file, path + "/" + file);
        document.getElementById("downloadProgressBar").style.width = Math.floor((i * 100)/total) + "%";
        i += 1;
    }
    btn.textContent = `${files.length} have been downloaded`;
    document.getElementById("downloadProgressBar").style.width = "100%";
    await utils.sleep(2000);
    document.getElementById("downloadProgressBar").style.width = "0%";
    btn.textContent = label;
    btn.disabled = false;
}

async function downloadOutput() {
    const files = [];
    for(let child of TREE_VIEW.children) {
        if(child.getElementsByTagName("i")[0].textContent == "" && child.getElementsByTagName("input")[0].checked) {
            files.push(getTreePath(child));
        }
    }
    // console.log(`${files.length} files to download`);
    if(files.length > 0) {
        // get the folder where to download the files
        // FIXME files cannot be seen when browsing for a directory, it seems like it's how Windows manages it. OpenSaveDialog can only save a file, not a list of files
        const path = await window.electronAPI.browseServer("OUT", "Select where the files will be downloaded", [{ name: 'All files', extensions: ['*'] }], ['openDirectory']);
        if(path != "") {
            if(await window.electronAPI.countExistingFiles(path[0], files) > 0)
            dialog.openDialogQuestion("Some files will be overwritten, do you want to continue?", async () => downloadFiles(path[0], files));
            else await downloadFiles(path[0], files);
        }
    }
}

export { collapseAllFolders, downloadOutput, expandAllFolders, insertOutputFiles, selectAllCheckboxes, unselectAllCheckboxes };
