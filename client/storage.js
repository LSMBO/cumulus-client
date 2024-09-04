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
import * as utils from "./utils.js";

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

function searchStorage(_) {
  const tag = document.getElementById("txtStorageSearch").value.toLowerCase();
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  for(let row of table.rows) {
    row.style.display = row.cells[0].childNodes[0].textContent.toLowerCase().includes(tag) ? "" : "none";
  }
}

async function refreshStorage() {
  utils.toggleLoadingScreen();
  document.getElementById("tabStorage").getElementsByTagName("h4")[0].innerHTML = `Files will be automatically removed after ${settings.CONFIG.get("data.max.age.in.days")} days (unless they are being used)`;
  const table = document.getElementById("tabStorage").getElementsByTagName("table")[0];
  const [data, _] = await window.electronAPI.listStorage();
  var content = "<tr class='color-secondary'><th>File name<i></i></th><th>Size<i></i></th></tr>";
  for(const [file, size] of data) {
    const cls = size == -1 ? "rsync" : "";
    const fsize = size == -1 ? "Queued for transfer" : utils.toHumanReadable(size);
    // if(file == "Human_pSP_CMO_20190213.fasta")
    //   content += `<tr><td><label class="${cls}">${file}${file}${file}<label></td><td><label>${size}</label><span class="${cls}">${fsize}</span></td></tr>`;
    // else 
    //   content += `<tr><td><label class="${cls}">${file}<label></td><td><label>${size}</label><span class="${cls}">${fsize}</span></td></tr>`;
    content += `<tr><td><label class="${cls}">${file}<label></td><td><label>${size}</label><span class="${cls}">${fsize}</span></td></tr>`;
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

export { openStorage, refreshStorage, searchStorage };
