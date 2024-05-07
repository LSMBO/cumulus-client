const tabs = document.getElementsByClassName("tab");
const tabButtons = document.getElementById("detail").getElementsByTagName("header")[0].getElementsByTagName("button");
const treeview = document.getElementById("treeview");
const stdout = document.getElementById("stdout");
const stderr = document.getElementById("stderr");
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

function resize() {
  stdout.style.height = `${window.innerHeight - 118}px`;
  stderr.style.height = `${window.innerHeight - 118}px`;
}

function toHumanReadable(size) {
    var i = 0;
    while(size > 1024) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(2)} ${UNITS[i]}`
}

function openTab(tabName) {
  var index = -1;
  for(let i = 0; i < tabs.length; i++) {
    if(tabs[i].id == tabName) index = i;
    tabs[i].style.display = "none";
    tabButtons[i].classList.remove("selected");
  }
  tabs[index].style.display = "block";
  tabButtons[index].classList.add("selected");

  // TODO move the next line elsewhere: when changing the app in the list, or when loading an existing job
  if(tabName == "tabParameters") {
    document.getElementById("formParameters").innerHTML = apps.get("diann181").html;
    apps.get("diann181").eventsFunction();
    // document.getElementById("tabParameters").innerHTML = getDiann181Html();
    // addEvents();
  }
}

function goToNextTab() {
  // for(let tab of document.getElementsByClassName("tab")) {
  //     tab.style.display = "none";
  // }
  // document.getElementById(tabName).style.display = "block";
  var nextTab = "";
  for(let i = 0; i < tabs.length; i++) {
    if(tabs[i].style.display == "block") {
      // tabs[i].style.display = "none";
      // if(i == tabs.length - 1) tabs[0].style.display == "block";
      // else tabs[i + 1].style.display == "block";
      nextTab = i == tabs.length - 1 ? tabs[0] : tabs[i + 1]
    }
  }
  openTab(nextTab.id);
}

function goToPreviousTab() {
  // const tabs = document.getElementsByClassName("tab");
  var previousTab = "";
  for(let i = 0; i < tabs.length; i++) {
    if(tabs[i].style.display == "block") {
      // tabs[i].style.display = "none";
      // if(i == 0) tabs[tabs.length - 1].style.display == "block";
      // else tabs[i - 1].style.display == "block";
      previousTab = i == 0 ? tabs[tabs.length - 1] : tabs[i - 1];
    }
  }
  openTab(previousTab.id);
}

function toggleFolder(node, forceExpand = false, forceCollapse = false) {
  // show/hide the content of the node
  // console.log(event);
  // if(node.getElementsByTagName("i").length > 0) {
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
  for(let node of treeview.children) {
    toggleFolder(node, forceExpand = true, forceCollapse = false);
  }
}

function collapseAllFolders() {
  for(let node of treeview.children) {
    toggleFolder(node, forceExpand = false, forceCollapse = true);
  }
}

function toggleCheckbox(node, forceCheck = false, forceUncheck = false) {
  // TODO check/uncheck all the boxes below (until the level is lower or equal)
  var setChecked = node.getElementsByTagName("input")[0].checked;
  if(forceCheck) setChecked = true;
  else if(forceUncheck) setChecked = false;
  console.log(`Node ${node} ; forceCheck=${forceCheck} ; forceUncheck=${forceUncheck} ; setChecked=${setChecked}`);
  const level = node.className.replace("lvl", "");
  var next = node.nextSibling;
  while(next != null && next.className.replace("lvl", "") > level) {
    next.getElementsByTagName("input")[0].checked = setChecked;
    next = next.nextSibling;
  }
  node.getElementsByTagName("input")[0].checked = setChecked;
}

function selectAllCheckboxes() {
  for(let node of treeview.children) {
    toggleCheckbox(node, forceCheck = true, forceUncheck = false);
  }
}

function unselectAllCheckboxes() {
  for(let node of treeview.children) {
    toggleCheckbox(node, forceCheck = false, forceUncheck = true);
  }
}

function getOutputFileItem(level, name, size) {
  // create the main item
  const item = document.createElement("div");
  item.className = `lvl${level}`;
  item.style = `margin-left: ${level * 25}px`;
  // if(size == -1) {
  const icon = document.createElement("i");
  if(size == -1) {
    icon.textContent = "–";
    icon.addEventListener("click", (event) => toggleFolder(event.target.parentNode));
  }
  item.appendChild(icon);
  // }
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
    span.textContent = `(${toHumanReadable(size)})`;
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
      // TODO fix a limit to the depth, do not show anything with a level > 3
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
  // treeview.appendChild(getOutputFileItem(0, "Select/Unselect all", totalSize));
  for(let child of children) { treeview.appendChild(child); }
  document.getElementById("outputSummary").textContent = `${directories.size} directories, ${files.length} files, ${toHumanReadable(totalSize)} in total`;
}

document.getElementById("btnSummary").addEventListener("click", () => openTab("tabSummary"));
document.getElementById("btnParameters").addEventListener("click", () => openTab("tabParameters"));
document.getElementById("btnLogs").addEventListener("click", () => openTab("tabLogs"));
document.getElementById("btnOutput").addEventListener("click", () => openTab("tabOutput"));
document.getElementById("aSelect").addEventListener("click", () => selectAllCheckboxes());
document.getElementById("aUnselect").addEventListener("click", () => unselectAllCheckboxes());
document.getElementById("aExpand").addEventListener("click", () => expandAllFolders());
document.getElementById("aCollapse").addEventListener("click", () => collapseAllFolders());
document.getElementById("btnNew").addEventListener("click", () => alert("Create a new job!"));
document.getElementById("btn").addEventListener("click", () => {
  //alert("Remove this button");
});
function keydownEvent(event) {
    if (event.key === 'Control' || event.key === 'Shift') return; // do nothing
    if(event.ctrlKey && ((!event.shiftKey && event.code === 'Tab') || event.code === 'PageDown')) goToNextTab();
    else if(event.ctrlKey && (event.shiftKey && event.code === 'Tab' || event.code === 'PageUp')) goToPreviousTab();
    // when Ctrl + N, open tab-settings
    else if(event.ctrlKey && event.key === 'n') btnNew.click();
}
async function keyupEvent(event) {
    // if(event.key === 't') {
    //     loadTestSettings();
    // } else if(event.key === 'Enter' && CURRENT_TAB == "div-settings") {
    //     search();
    // }
}
window.addEventListener('keydown', keydownEvent, true);
window.addEventListener('keyup', keyupEvent, true);
window.addEventListener("resize", resize);


const outputFiles = new Array();
outputFiles.push(["final/other/report.parquet", 56571823]);
outputFiles.push(["final/report.gg_matrix.tsv", 636466]);
outputFiles.push(["final/report.pg_matrix.tsv", 750831]);
outputFiles.push(["final/report.pr_matrix.tsv", 5940197]);
outputFiles.push(["final/report.stats.tsv", 13653]);
outputFiles.push(["final/report.tsv", 420297154]);
outputFiles.push(["final/report.unique_genes_matrix.tsv", 521577]);
outputFiles.push(["first-pass/report-first-pass.gg_matrix.tsv", 496901]);
outputFiles.push(["first-pass/report-first-pass.parquet", 39571372]);
outputFiles.push(["first-pass/report-first-pass.pg_matrix.tsv", 606999]);
outputFiles.push(["first-pass/report-first-pass.pr_matrix.tsv", 4778057]);
outputFiles.push(["first-pass/report-first-pass.stats.tsv", 13571]);
outputFiles.push(["first-pass/report-first-pass.tsv", 300331599]);
outputFiles.push(["first-pass/report-first-pass.unique_genes_matrix.tsv", 401082]);
outputFiles.push(["report.log.txt", 95944]);
insertOutputFiles(outputFiles);

resize();
openTab("tabParameters");
