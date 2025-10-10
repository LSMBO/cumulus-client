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
import * as settings from "./settings.js";

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

function getParentCheckbox(node) {
  const level = node.className.replace("lvl", "");
  if(level > 0) {
    var prev = node.previousSibling;
    // loop backward until we get to a node with a lesser level
    while(prev != null && prev.className.replace("lvl", "") >= level) {
      prev = prev.previousSibling;
    }
    return prev;
  } else return null;
}

function areAllChildrenUnchecked(node) {
  const level = node.className.replace("lvl", "");
  var next = node.nextSibling;
  while(next != null && next.className.replace("lvl", "") > level) {
    if(next.getElementsByTagName("input")[0].checked) return false;
    next = next.nextSibling;
  }
  return true;
}

function checkParents(node) {
  var parent = getParentCheckbox(node);
  while(parent != null) {
    parent.getElementsByTagName("input")[0].checked = true;
    parent = getParentCheckbox(parent);
  }
}

function uncheckParents(node) {
  var parent = getParentCheckbox(node);
  while(parent != null) {
    // uncheck the parent if all its children are unchecked
    if(areAllChildrenUnchecked(parent)) parent.getElementsByTagName("input")[0].checked = false;
    // do the same with the parent, until the parent is null
    parent = getParentCheckbox(parent);
  }
}

function toggleCheckbox(node, forceCheck = false, forceUncheck = false) {
    // get the state of the checkbox
    var setChecked = node.getElementsByTagName("input")[0].checked;
    if(forceCheck) setChecked = true;
    else if(forceUncheck) setChecked = false;
    // get the level of the checkbox
    const level = node.className.replace("lvl", "");
    // set the same check to every following nodes that have a lower lever (children of the selected node)
    var next = node.nextSibling;
    while(next != null && next.className.replace("lvl", "") > level) {
      next.getElementsByTagName("input")[0].checked = setChecked;
      next = next.nextSibling;
    }
    node.getElementsByTagName("input")[0].checked = setChecked;

    // on checking, always check all the parents
    if(setChecked) checkParents(node);
    // on unchecking, if all children are uncheck, uncheck the parent (for each parent)
    else uncheckParents(node);
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
    chk.checked = false;
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
      span.title = `Exact size: ${size}`;
      item.appendChild(span);
    }
    return item;
}

function removeOutputFiles() {
  document.getElementById("outputSummary").textContent = "No output files available.";
  TREE_VIEW.innerHTML = "";
}

// function that will sort a list of file paths to get the paths with the most "/" first, then sort them alphabetically
function sortOutputFiles(files) {
  return files.sort((a, b) => {
    const aItems = a[0].split("/").length;
    const bItems = b[0].split("/").length;
    if(aItems == bItems) return a[0].localeCompare(b[0]);
    else return bItems - aItems;
  });
}

// function that compares two lists of [file path, size] and tell if they are different
function areSameOutputFiles(files1, files2) {
  if(files1.length != files2.length) return false;
  for(let i = 0; i < files1.length; i++) {
    if(files1[i][0] != files2[i][0] || files1[i][1].toString() != files2[i][1].toString()) return false;
  }
  return true;
}

// function that generates a list of file paths and their size from the treeview
function getOutputFiles() {
  const files = [];
  for(let child of TREE_VIEW.children) {
    if(child.getElementsByTagName("i")[0].textContent == "") {
      const path = getTreePath(child);
      const size = child.getElementsByTagName("span")[0].title.replaceAll(/.*: /gi, "");
      files.push([path, size]);
    }
  }
  return files;
}

function insertOutputFiles(files) {
  // sort the files to have the most nested folders first
  const sortedFiles = sortOutputFiles(files)
  // check that the current list of files is not the same as the new one
  const currentFiles = getOutputFiles();
  if(areSameOutputFiles(sortOutputFiles(currentFiles), sortedFiles)) return;
  // create the treeview
  const directories = new Map();
  var totalSize = 0;
  const children = new Array();
  for(let [file, size] of sortedFiles) {
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
  // update the summary
  var summary = "";
  if(directories.size == 1) summary += "one directory, ";
  else if(directories.size > 1) summary += `${directories.size} directories, `;
  if(files.length == 1) summary += "one file, ";
  else if(files.length > 1) summary += `${files.length} files, `;
  summary += `${utils.toHumanReadable(totalSize)} in total`;
  document.getElementById("outputSummary").textContent = summary;
  // add all the items to the treeview
  TREE_VIEW.innerHTML = "";
  for(let child of children) { TREE_VIEW.appendChild(child); }
  document.getElementById("tabOutput").getElementsByTagName("button")[0].disabled = false;
  // trigger some specific events
  // for(let child of TREE_VIEW.childNodes) {
    // the following is not needed anymore, we only return the content of the output folder
    // // an "output" folder is created on server-side, it should be checked by default
    // if(child.classList.contains("lvl0") && child.getElementsByTagName("label")[0].textContent == settings.CONFIG.get("output.folder")) child.getElementsByTagName("input")[0].click();
    // // a "temp" folder is created on server-side, it should be closed by default
    // if(child.classList.contains("lvl0") && child.getElementsByTagName("label")[0].textContent == settings.CONFIG.get("temp.folder")) child.getElementsByTagName("i")[0].click();
  // }
  // by default, select all the output files
  selectAllCheckboxes();
  // do not display the expand/collapse links if there is no folder
  if(directories.size == 0) {
    document.getElementById("aExpand").style.display = "none";
    document.getElementById("aCollapse").style.display = "none";
  } else {
    document.getElementById("aExpand").style.display = "";
    document.getElementById("aCollapse").style.display = "";
  }
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
        // files cannot be seen when browsing for a directory, it seems like it's how Windows manages it. OpenSaveDialog can only save a file, not a list of files
        const path = await window.electronAPI.browseServer("OUT", "Select where the files will be downloaded", "", [{ name: 'All files', extensions: ['*'] }], ['openDirectory']);
        if(path != "") {
          if(await window.electronAPI.countExistingFiles(path[0], files) > 0)
            dialog.createDialogQuestion("Warning", "Some files will be overwritten, do you want to continue?", async () => downloadFiles(path[0], files));
          else await downloadFiles(path[0], files);
        }
    }
}

export { collapseAllFolders, downloadOutput, expandAllFolders, insertOutputFiles, removeOutputFiles, selectAllCheckboxes, unselectAllCheckboxes };
