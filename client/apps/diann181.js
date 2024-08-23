import { addBrowsedFiles, App, browse, getBrowsedFiles, tooltip } from "../utils.js";

export function getDiann181Html() {
    return `<h3>Diann 1.8.1 parameters</h3>
          <table id="diann181_main" class="w3-table">
            <tr><td class="w3-half">
              <div class="w3-row w3-section">
                <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
                  <button id="diann181_btnBrowseFasta" class="w3-button color-opposite">Browse FASTA file...</button>
                </div>
                <div class="w3-rest w3-container" style="padding: 0;"><input id="diann181_txtFasta" name="fasta" type="text" class="w3-input w3-border" style="line-height: 21px;" placeholder="Select a FASTA file" /></div>
              </div>
              <div class="w3-row w3-section">
                <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
                  <button id="diann181_btnBrowseRaw" class="w3-button color-opposite" style="width: 123px">Browse...</button>
                  <button id="diann181_btnClearRaw" class="w3-button color-secondary" title="Remove all files">╳</button>
                </div>
                <div class="w3-rest w3-container" style="padding: 0;">
                  <select id="diann181_cmbRawType" name="rawType" class="w3-select w3-border" style="vertical-align: middle;">
                    <option value="diapasef" selected>diaPASEF .d files</option>
                    <option value="raw">Thermo .raw files</option>
                  </select>
                </div>
              </div>
              <div class="w3-row w3-section">
                <ul id="diann181_rawFiles" class="w3-ul w3-border w3-hoverable raw-file" style="height: 331px; overflow: auto;"></ul>
              </div>
            </div>
          </td><td class="w3-half">
            <table class="w3-table w3-bordered">
              <tr>
                <td>
                    <label for="diann181_cmbEnzyme">Protease</label>
                    <select id="diann181_cmbEnzyme" name="protease" class="w3-select w3-border">
                        <option value="K*,R*" selected="">Trypsin /P</option>
                        <option value="K*,R*,!*P">Trypsin</option>
                        <option value="K*">Lys-C</option>
                        <option value="F*,Y*,W*,M*,L*,!*P">Chymotrypsin</option>
                        <option value="*D">AspN</option>
                        <option value="E*">GluC</option>
                    </select>
                </td>
                <td>
                    <label for="diann181_txtMc">Missed cleavages</label>
                    <input id="diann181_txtMc" name="mc" type="number" class="w3-input w3-border" value="1" min="0" max="5">
                </td>
            </tr>
            <tr>
                <td class="full-width-col" colspan="2">
                    <label for="diann181_txtVarMods">Maximum number of variable modifications</label>
                    <input id="diann181_txtVarMods" name="var-mods" type="number" class="w3-input w3-border" value="0" min="0" max="5">
                </td>
            </tr>
            <tr>
                <td class="full-width-col" colspan="2">
                    <input id="diann181_chkMetEx" name="met-excision" type="checkbox" class="w3-check" checked="">
                    <label for="diann181_chkMetEx">N-term excision (M)</label>
                </td>
            </tr>
            <tr>
                <td>
                    <input id="diann181_chkModCarba" name="carba" type="checkbox" class="w3-check" checked="">
                    <label for="diann181_chkModCarba">Carbamidomethyl (C)</label>
                </td>
                <td>
                    <input id="diann181_chkModOx" name="ox-m" type="checkbox" class="w3-check">
                    <label for="diann181_chkModOx">Oxidation (M)</label>
                </td>
            </tr>
                <td>
                    <input id="diann181_chkModAc" name="ac-nterm" type="checkbox" class="w3-check">
                    <label for="diann181_chkModAc">Acetylation (N-term)</label>
                </td>
                <td>
                    <input id="diann181_chkModPhospho" name="phospho" type="checkbox" class="w3-check">
                    <label for="diann181_chkModPhospho">Phosphorylation</label>
                </td>
            </tr>
            <tr>
                <td>
                    <label for="diann181_txtMs1Acc">MS1 accuracy (ppm)</label>
                    <input id="diann181_txtMs1Acc" name="ms1-acc" type="number" class="w3-input w3-border" value="10.0" min="0" max="100.0" step="0.1">
                </td>
                <td>
                    <label for="diann181_txtMassAcc">MS2 accuracy (ppm)</label>
                    <input id="diann181_txtMassAcc" name="mass-acc" type="number" class="w3-input w3-border" value="10.0" min="0" max="100.0" step="0.1">
                </td>
            </tr>
            <tr>
                <td>
                    <label for="diann181_txtWindow">Scan window</label>
                    <input id="diann181_txtWindow" name="window" type="number" class="w3-input w3-border" value="10" min="0">
                </td>
                <td>
                    <label for="diann181_txtFdr">Precursor FDR (%)</label>
                    <input id="diann181_txtFdr" name="fdr" type="number" class="w3-input w3-border" value="1.0" min="0" max="100" step="0.1">
                </td>
            </tr>
            </table>
          </td></tr>
        </table>
        <h3 id="diann181_advancedParamsHeader" class="w3-button w3-block w3-left-align">Advanced parameters 🞃</h3>
        <table id="diann181_advancedParams" class="w3-table w3-bordered w3-hide">
        <tr>
          <td><label for="diann181_txtMinLen" class="w3-col">Peptide length range</label></td>
          <td><input id="diann181_txtMinLen" name="min-pep-len" type="number" class="w3-input w3-border" value="7" min="1"></td>
          <td>&nbsp;—&nbsp;</td>
          <td><input id="diann181_txtMaxLen" name="max-pep-len" type="number" class="w3-input w3-border" value="30" min="1"></td>
        </tr>
        <tr>
          <td><label for="diann181_txtMinCharge" class="w3-col">Precursor charge state range</label></td>
          <td><input id="diann181_txtMinCharge" name="min-pr-charge" type="number" class="w3-input w3-border" value="1" min="1"></td>
          <td>&nbsp;—&nbsp;</td>
          <td><input id="diann181_txtMaxCharge" name="max-pr-charge" type="number" class="w3-input w3-border" value="4" min=""></td>
        </tr>
        <tr>
          <td><label for="diann181_txtMinMz" class="w3-col">Precursor M/z range</label></td>
          <td><input id="diann181_txtMinMz" name="min-pr-mz" type="number" class="w3-input w3-border" value="300" min="1"></td>
          <td>&nbsp;—&nbsp;</td>
          <td><input id="diann181_txtMaxMz" name="max-pr-mz" type="number" class="w3-input w3-border" value="1800" min=""></td>
        </tr>
        <tr>
          <td><label for="diann181_txtPepMinMz" class="w3-col">Peptide M/z range</label></td>
          <td><input id="diann181_txtPepMinMz" name="min-fr-mz" type="number" class="w3-input w3-border" value="200" min="1"></td>
          <td>&nbsp;—&nbsp;</td>
          <td><input id="diann181_txtPepMaxMz" name="max-fr-mz" type="number" class="w3-input w3-border" value="1800" min=""></td>
        </tr>
        <tr>
          <td><label for="diann181_cmbInference" class="w3-col">Protein inference</label></td>
          <td colspan="3">
            <select id="diann181_cmbInference" name="inference" class="w3-select w3-border w3-rest">
              <option value="isoforms">Isoforms IDs</option>
              <option value="protein" selected="">Protein names (from FASTA)</option>
              <option value="species">Genes (species-specific)</option>
              <option value="genes">Genes</option>
              <option value="off">Off</option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="diann181_cmbClassifier" class="w3-col">Neural network classifier</label></td>
          <td colspan="3">
            <select id="diann181_cmbClassifier" name="classifier" class="w3-select w3-border w3-rest">
              <option value="off">Off</option>
              <option value="single" selected="">Single-pass mode</option>
              <option value="double">Double-pass mode</option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="diann181_cmbQuant" class="w3-col">Quantification strategy</label></td>
          <td colspan="3">
            <select id="diann181_cmbQuant" name="quant" class="w3-select w3-border w3-rest">
              <option value="any/acc">Any LC (high accuracy)</option>
              <option value="any/prec">Any LC (high precision)</option>
              <option value="robust/acc">Robust LC (high accuracy)</option>
              <option value="robust/prec" selected="">Robust LC (high precision)</option>
              <option value="height"></option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="diann181_cmbNorm" class="w3-col">Cross-run normalisation</label></td>
          <td colspan="3">
            <select id="diann181_cmbNorm" name="norm" class="w3-select w3-border w3-rest">
              <option value="global">Global</option>
              <option value="rt" selected="">RT-dependent</option>
              <option value="signal">RT &amp; signal-dep. (experimental)</option>
              <option value="off">Off</option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="diann181_cmbSpeed" class="w3-col">Speed and RAM usage</label></td>
          <td colspan="3">
            <select id="diann181_cmbSpeed" name="speed" class="w3-select w3-border w3-rest">
              <option value="optimal">Optimal results</option>
              <option value="low ram" selected="">Low RAM usage</option>
              <option value="high speed">Low RAM &amp; high speed</option>
              <option value="ultra fast">Ultra-fast</option>
            </select>
          </td>
        </tr>
        <tr>
          <td><label for="diann181_txtVerbose" class="w3-col">Log level</label></td>
          <td colspan="3"><input id="diann181_txtVerbose" name="verbose" type="number" class="w3-input w3-border" value="1" min="1" max="5"></td>
        </tr>
        </table>`;
}

export function getDiann181Events() {
    // it's important to add event.preventDefault() to avoid the GUI to be reloaded!
    document.getElementById("diann181_btnBrowseRaw").addEventListener("click", (event) => {
      event.preventDefault();
      const type = document.getElementById("diann181_cmbRawType").value;
      if(type == "raw") browse("RAW", "Select your RAW files", [ { name: "Thermo RAW file", extensions: ['raw'] }], ['openFile', 'multiSelections'], "diann181_rawFiles");
      else browse("RAW", "Select your Bruker analyses", [ { name: "Bruker analysis", extensions: ['d'] }], ['openDirectory', 'multiSelections'], "diann181_rawFiles");
    });
    document.getElementById("diann181_btnBrowseFasta").addEventListener("click", async (event) => { event.preventDefault(); await browse("FASTA", "Select your Fasta file", [ { name: "Fasta file", extensions: ['fasta'] }], ['openFile'], "diann181_txtFasta"); });
    document.getElementById("diann181_btnClearRaw").addEventListener("click", (event) => { event.preventDefault(); document.getElementById("diann181_rawFiles").textContent = ""; });
    document.getElementById("diann181_rawFiles").addEventListener("click", (event) => {
      event.preventDefault;
      if(event.target.tagName == "SPAN") event.target.parentNode.outerHTML = "";
    });
    document.getElementById("diann181_advancedParamsHeader").addEventListener("click", (event) => {
      event.preventDefault;
      if(document.getElementById("diann181_advancedParams").className.includes("w3-hide")) document.getElementById("diann181_advancedParams").classList.remove("w3-hide");
      else document.getElementById("diann181_advancedParams").classList.add("w3-hide");
    });
    // add the tooltip texts
    tooltip(document.getElementById("diann181_btnBrowseFasta").parentElement.nextElementSibling, "Select the FASTA file for the library-free approach");
    tooltip(document.getElementById("diann181_cmbRawType"), "Select the type of RAW data you want to load");
    tooltip(document.getElementById("diann181_btnClearRaw"), "Remove all files");
    tooltip(document.getElementById("diann181_cmbEnzyme").previousElementSibling, "Enzyme used for the digest");
    tooltip(document.getElementById("diann181_txtMc").previousElementSibling, "Maximum number of missed cleavages allowed");
    tooltip(document.getElementById("diann181_txtVarMods").previousElementSibling, "Warning: more than 3 variable modifications will significantly increase the search space, use with caution");
    tooltip(document.getElementById("diann181_txtFdr").previousElementSibling, "False discovery rate level at which the output files will be filtered");
    tooltip(document.getElementById("diann181_txtMs1Acc").previousElementSibling, "Leave at 0.0 for automatic inference");
    tooltip(document.getElementById("diann181_txtMassAcc").previousElementSibling, "Leave at 0.0 for automatic inference");
    tooltip(document.getElementById("diann181_txtWindow").previousElementSibling, "Radius (in scans) of the retention time window that is used to scan extracted chromatograms of precursor ions");
    tooltip(document.getElementById("diann181_txtMinLen").parentElement.previousElementSibling, "The peptide length range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann181_txtMinCharge").parentElement.previousElementSibling, "The precursor charge range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann181_txtMinMz").parentElement.previousElementSibling, "The precursor m/z range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann181_txtPepMinMz").parentElement.previousElementSibling, "The peptide m/z range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann181_cmbInference").parentElement.previousElementSibling, "Select the way that the protein isoforms are grouped by");
    tooltip(document.getElementById("diann181_cmbClassifier").parentElement.previousElementSibling, "Double-pass mode is the best in most cases but is about twice slower than single-pass");
    tooltip(document.getElementById("diann181_cmbQuant").parentElement.previousElementSibling, "Select if you want to prioritize precision or accuracy");
    tooltip(document.getElementById("diann181_cmbNorm").parentElement.previousElementSibling, "Normalized quantities are reported along with the raw quantities");
    tooltip(document.getElementById("diann181_cmbSpeed").parentElement.previousElementSibling, "Optimal results gives the most identifications, Low RAM is almost as good but requires less RAM and is a little faster, the others return significantly less identifications but are significantly faster");
    tooltip(document.getElementById("diann181_txtVerbose").parentElement.previousElementSibling, "Select the detail of the log output, values are between 0 to 5");
}

function getSharedFiles() {
  // return the list of raw files
  return getBrowsedFiles(document.getElementById("diann181_rawFiles"));
}

function getLocalFiles() {
  // return the list of fasta files
  return [utils.fixFilePath(document.getElementById("diann181_txtFasta").value)];
}

function checkSettings() {
  document.getElementById("diann181_txtFasta").value = utils.fixFilePath(document.getElementById("diann181_txtFasta").value);
  return [];
}

function setSpecificSettings(settings) {
    addBrowsedFiles(document.getElementsByClassName("raw-file")[0], settings.get("files"));
}

export function get() {
  return new App("diann_1.8.1", "Dia-NN", "1.8.1", getDiann181Html(), getDiann181Events, getSharedFiles, getLocalFiles, checkSettings, setSpecificSettings);
}
