import { App, browse, convertToUncPath, listBrowsedFiles, tooltip } from "../utils.js";

function getTestHtml() { return `
<h3>TESTABU parameters</h3>
<div class="w3-row w3-section">
  <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
    <button id="test_btnBrowseFasta" class="w3-button color-opposite">Browse FASTA file...</button>
  </div>
  <div class="w3-rest w3-container" style="padding: 0;"><input id="test_txtFasta" name="fasta" type="text" class="w3-input w3-border" style="line-height: 21px;" placeholder="Select a FASTA file" /></div>
</div>
<div class="w3-row w3-section">
  <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
    <button id="test_btnBrowseRaw" class="w3-button color-opposite" style="width: 128px">Browse...</button>
    <button id="test_btnClearRaw" class="w3-button color-secondary" title="Remove all files">╳</button>
  </div>
  <div class="w3-rest w3-container" style="padding: 0;">
    <select id="test_cmbRawType" name="rawType" class="w3-select w3-border" style="vertical-align: middle;">
      <option value="diapasef" selected>diaPASEF .d files</option>
      <option value="raw">Thermo .raw files</option>
    </select>
  </div>
</div>
<div class="w3-row w3-section">
  <ul id="test_rawFiles" class="w3-ul w3-border w3-hoverable" style="height: 331px; overflow: auto;"></ul>
</div>
<label for="txtTest">Log level</label>
<input id="txtTest" name="txtTest" type="text" value="" />
<button id="btnTest">Click me!</button>`; }

function getTestEvents() {
  document.getElementById("test_btnBrowseRaw").addEventListener("click", (event) => {
    event.preventDefault();
    const type = document.getElementById("test_cmbRawType").value;
    if(type == "raw") browse("RAW", "Select your RAW files", [ { name: "Thermo RAW file", extensions: ['raw'] }], ['openFile', 'multiSelections'], "test_rawFiles");
    else browse("RAW", "Select your Bruker analyses", [ { name: "Bruker analysis", extensions: ['d'] }], ['openDirectory', 'multiSelections'], "test_rawFiles");
  });
  document.getElementById("test_btnBrowseFasta").addEventListener("click", async (event) => { event.preventDefault(); await browse("FASTA", "Select your Fasta file", [ { name: "Fasta file", extensions: ['fasta'] }], ['openFile'], "test_txtFasta"); });
  document.getElementById("test_btnClearRaw").addEventListener("click", (event) => { event.preventDefault(); document.getElementById("test_rawFiles").textContent = ""; });
  document.getElementById("test_rawFiles").addEventListener("click", (event) => {
    event.preventDefault;
    if(event.target.tagName == "SPAN") event.target.parentNode.outerHTML = "";
  });
  document.getElementById("btnTest").addEventListener("click", (event) => {
    event.preventDefault();
    console.log("yes");
    document.getElementById("txtTest").value = "It works!";
  });
  // add the tooltip texts
  tooltip(document.getElementById("test_btnBrowseFasta").parentElement.nextElementSibling, "Select the FASTA file for the library-free approach");
  tooltip(document.getElementById("test_cmbRawType"), "Select the type of RAW data you want to load");
  tooltip(document.getElementById("test_btnClearRaw"), "Remove all files");
}

function getSettings() {
  const settings = new Map();
  // add the data from the form
  const formData = new FormData(document.getElementById("formParameters"));
  for (const [key, value] of formData.entries()) {
    settings.set(key, value);
  }
  // fix the path for the fasta file
  // settings.set("fasta", convertToUncPath(settings.get("fasta")));
  settings.set("fasta", "Human_pSP_CMO_20190213.fasta");
  // add the raw files
  // settings.set("files", listBrowsedFiles("test_rawFiles"));
  settings.set("files", ["TU014275CK_Slot2-2_1_2622.d", "TU014276CK_Slot1-27_1_2623.d", "TU014277CK_Slot1-28_1_2624.d", "TU014278CK_Slot1-29_1_2625.d", "TU014279CK_Slot1-30_1_2626.d", "TU014280CK_Slot1-31_1_2627.d", "TU014281CK_Slot1-32_1_2628.d", "TU014282CK_Slot1-33_1_2629.d", "TU014283CK_Slot1-34_1_2630.d", "TU014284CK_Slot1-35_1_2631.d", "TU014285CK_Slot1-36_1_2632.d"]);
  // console.log(settings);
  return settings;
}

function getSharedFiles() {
  // return the list of raw files
  return getSettings().get("files");
}

function getLocalFiles() {
  // return the list of fasta files
  return [getSettings().get("fasta")];
}

export function get() {
    return new App("test", "Test ABU (sleep)", "1.0", getTestHtml(), getTestEvents, getSettings, getSharedFiles, getLocalFiles);
}
