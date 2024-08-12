import { App, browse, tooltip } from "../utils.js";

function getDiann191Html() {
    return `<h3>Diann 1.9.1 parameters</h3>
    <table id="diann191_main" class="w3-table">
        <tr><td class="w3-half">
        <div class="w3-row w3-section">
            <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
            <button id="diann191_btnBrowseFasta" class="w3-button color-opposite">Browse FASTA file...</button>
            </div>
            <div class="w3-rest w3-container" style="padding: 0;"><input id="diann191_txtFasta" name="fasta" type="text" class="w3-input w3-border" style="line-height: 21px;" placeholder="Select a FASTA file" /></div>
        </div>
        <div class="w3-row w3-section">
            <div class="w3-col w3-right w3-container" style="width:auto; padding: 0;margin-left: 5px;">
            <button id="diann191_btnBrowseRaw" class="w3-button color-opposite" style="width: 128px">Browse...</button>
            <button id="diann191_btnClearRaw" class="w3-button color-secondary" title="Remove all files">╳</button>
            </div>
            <div class="w3-rest w3-container" style="padding: 0;">
            <select id="diann191_cmbRawType" name="rawType" class="w3-select w3-border" style="vertical-align: middle;">
                <option value="diapasef" selected>diaPASEF .d files</option>
                <option value="slicepasef">slicePASEF .d files</option>
                <option value="raw">Thermo .raw files</option>
            </select>
            </div>
        </div>
        <div class="w3-row w3-section">
            <ul id="diann191_rawFiles" class="w3-ul w3-border w3-hoverable" style="height: 331px; overflow: auto;"></ul>
        </div>
        </div>
    </td><td class="w3-half">
        <table class="w3-table w3-bordered">
        <tr>
            <td><label for="diann191_cmbEnzyme">Protease</label></td>
            <td><select id="diann191_cmbEnzyme" name="protease" class="w3-select w3-border">
            <option value="K*,R*" selected="">Trypsin /P</option>
            <option value="K*,R*,!*P">Trypsin</option>
            <option value="K*">Lys-C</option>
            <option value="F*,Y*,W*,M*,L*,!*P">Chymotrypsin</option>
            <option value="*D">AspN</option>
            <option value="E*">GluC</option>
            </select></td>
        </tr>
        <tr>
            <td><label for="diann191_txtMc">Missed cleavages</label></td>
            <td><input id="diann191_txtMc" name="mc" type="number" class="w3-input w3-border" value="1" min="0" max="5"></td>
        </tr>
        <tr>
            <td><label for="diann191_txtVarMods">Maximum number of variable modifications</label></td>
            <td><input id="diann191_txtVarMods" name="var-mods" type="number" class="w3-input w3-border" value="0" min="0" max="5"></td>
        </tr>
        <tr>
            <td></td>
            <td class="w3-dropdown-hover color-primary">
            <button class="w3-button w3-block color-opposite">Select modifications</button>
            <div class="w3-dropdown-content w3-border color-primary-border">
                <div><label for="diann191_chkMetEx">N-term M excision</label><input id="diann191_chkModCarba" name="carba" type="checkbox" class="w3-check" checked=""></div>
                <div><label for="diann191_chkModCarba">C carbamidomethylation</label><input id="diann191_chkModCarba" name="carba" type="checkbox" class="w3-check" checked=""></div>
                <div><label for="diann191_chkModOx">Ox(M)</label><input id="diann191_chkModOx" name="ox-m" type="checkbox" class="w3-check"></div>
                <div><label for="diann191_chkModAc">Ac(N-term)</label><input id="diann191_chkModAc" name="ac-nterm" type="checkbox" class="w3-check"></div>
                <div><label for="diann191_chkModPhospho">Phospho</label><input id="diann191_chkModPhospho" name="phospho" type="checkbox" class="w3-check"></div>
                <div><label for="diann191_chkModKgg">K-GG</label><input id="diann191_chkModKgg" name="k-gg" type="checkbox" class="w3-check"></div>
            </div>
            </td>
        </tr>
        <tr>
            <td><label for="diann191_txtFdr">Precursor FDR (%)</label></td>
            <td><input id="diann191_txtFdr" name="fdr" type="number" class="w3-input w3-border" value="1.0" min="0" max="100" step="0.1"></td>
        </tr>
        <tr>
            <td><label for="diann191_txtMs1Acc">MS1 accuracy (ppm)</label></td>
            <td><input id="diann191_txtMs1Acc" name="ms1-acc" type="number" class="w3-input w3-border" value="10.0" min="0" max="100.0" step="0.1"></td>
        </tr>
        <tr>
            <td><label for="diann191_txtMassAcc">MS2 accuracy (ppm)</label></td>
            <td><input id="diann191_txtMassAcc" name="mass-acc" type="number" class="w3-input w3-border" value="10.0" min="0" max="100.0" step="0.1"></td>
        </tr>
        <tr>
            <td><label for="diann191_txtWindow">Scan window</label></td>
            <td><input id="diann191_txtWindow" name="window" type="number" class="w3-input w3-border" value="10" min="0"></td>
        </tr>
        </table>
    </td></tr>
    </table>
    <h3 id="diann191_advancedParamsHeader" class="w3-button w3-block w3-left-align">Advanced parameters 🞃</h3>
    <table id="diann191_advancedParams" class="w3-table w3-bordered w3-hide">
    <tr>
    <td><label for="diann191_txtMinLen" class="w3-col">Peptide length range</label></td>
    <td><input id="diann191_txtMinLen" name="min-pep-len" type="number" class="w3-input w3-border" value="7" min="1"></td>
    <td>&nbsp;—&nbsp;</td>
    <td><input id="diann191_txtMaxLen" name="max-pep-len" type="number" class="w3-input w3-border" value="30" min="1"></td>
    </tr>
    <tr>
    <td><label for="diann191_txtMinCharge" class="w3-col">Precursor charge state range</label></td>
    <td><input id="diann191_txtMinCharge" name="min-pr-charge" type="number" class="w3-input w3-border" value="1" min="1"></td>
    <td>&nbsp;—&nbsp;</td>
    <td><input id="diann191_txtMaxCharge" name="max-pr-charge" type="number" class="w3-input w3-border" value="4" min=""></td>
    </tr>
    <tr>
    <td><label for="diann191_txtMinMz" class="w3-col">Precursor M/z range</label></td>
    <td><input id="diann191_txtMinMz" name="min-pr-mz" type="number" class="w3-input w3-border" value="300" min="1"></td>
    <td>&nbsp;—&nbsp;</td>
    <td><input id="diann191_txtMaxMz" name="max-pr-mz" type="number" class="w3-input w3-border" value="1800" min=""></td>
    </tr>
    <tr>
    <td><label for="diann191_txtPepMinMz" class="w3-col">Peptide M/z range</label></td>
    <td><input id="diann191_txtPepMinMz" name="min-fr-mz" type="number" class="w3-input w3-border" value="200" min="1"></td>
    <td>&nbsp;—&nbsp;</td>
    <td><input id="diann191_txtPepMaxMz" name="max-fr-mz" type="number" class="w3-input w3-border" value="1800" min=""></td>
    </tr>
    <tr>
    <td><label for="diann191_cmbInference" class="w3-col">Protein inference</label></td>
    <td colspan="3">
        <select id="diann191_cmbInference" name="inference" class="w3-select w3-border w3-rest">
        <option value="isoforms">Isoforms IDs</option>
        <option value="protein" selected="">Protein names (from FASTA)</option>
        <option value="species">Genes (species-specific)</option>
        <option value="genes">Genes</option>
        <option value="off">Off</option>
        </select>
    </td>
    </tr>
    <tr>
    <td><label for="diann191_cmbClassifier" class="w3-col">Neural network classifier</label></td>
    <td colspan="3">
        <select id="diann191_cmbClassifier" name="classifier" class="w3-select w3-border w3-rest">
        <option value="off">Off</option>
        <option value="single" selected="">Single-pass mode</option>
        <option value="double">Double-pass mode</option>
        </select>
    </td>
    </tr>
    <tr>
    <td><label for="diann191_cmbQuant" class="w3-col">Quantification strategy</label></td>
    <td colspan="3">
        <select id="diann191_cmbQuant" name="quant" class="w3-select w3-border w3-rest">
        <option value="ums/prec">QuantUMS (high precision)</option>
        <option value="ums/acc">QuantUMS (high accuracy)</option>
        <option value="legacy">Legacy (direct)</option>
        </select>
    </td>
    </tr>
    <tr>
    <td><label for="diann191_cmbNorm" class="w3-col">Cross-run normalisation</label></td>
    <td colspan="3">
        <select id="diann191_cmbNorm" name="norm" class="w3-select w3-border w3-rest">
        <option value="global">Global</option>
        <option value="rt" selected="">RT-dependent</option>
        <option value="signal">RT &amp; signal-dep. (experimental)</option>
        <option value="off">Off</option>
        </select>
    </td>
    </tr>
    <tr>
    <td><label for="diann191_cmbSpeed" class="w3-col">Speed and RAM usage</label></td>
    <td colspan="3">
        <select id="diann191_cmbSpeed" name="speed" class="w3-select w3-border w3-rest">
        <option value="optimal">Optimal results</option>
        <option value="low ram" selected="">Low RAM usage</option>
        <option value="high speed">Low RAM &amp; high speed</option>
        <option value="ultra fast">Ultra-fast</option>
        </select>
    </td>
    </tr>
    <tr>
    <td><label for="diann191_txtVerbose" class="w3-col">Log level</label></td>
    <td colspan="3"><input id="diann191_txtVerbose" name="verbose" type="number" class="w3-input w3-border" value="1" min="1" max="5"></td>
    </tr>
    </table>`;
}
function getDiann191Events() {
    // it's important to add event.preventDefault() to avoid the GUI to be reloaded!
    document.getElementById("diann191_btnBrowseRaw").addEventListener("click", (event) => {
    event.preventDefault();
    const type = document.getElementById("diann191_cmbRawType").value;
    if(type == "raw") browse("RAW", "Select your RAW files", [ { name: "Thermo RAW file", extensions: ['raw'] }], ['openFile', 'multiSelections'], "diann191_rawFiles");
    else browse("RAW", "Select your Bruker analyses", [ { name: "Bruker analysis", extensions: ['d'] }], ['openDirectory', 'multiSelections'], "diann191_rawFiles");
    });
    document.getElementById("diann191_btnBrowseFasta").addEventListener("click", async (event) => { event.preventDefault(); await browse("FASTA", "Select your Fasta file", [ { name: "Fasta file", extensions: ['fasta'] }], ['openFile'], "diann191_txtFasta"); });
    document.getElementById("diann191_btnClearRaw").addEventListener("click", (event) => { event.preventDefault(); document.getElementById("diann191_rawFiles").textContent = ""; });
    document.getElementById("diann191_rawFiles").addEventListener("click", (event) => {
    event.preventDefault;
    if(event.target.tagName == "SPAN") event.target.parentNode.outerHTML = "";
    });
    document.getElementById("diann191_advancedParamsHeader").addEventListener("click", (event) => {
    event.preventDefault;
    if(document.getElementById("diann191_advancedParams").className.includes("w3-hide")) document.getElementById("diann191_advancedParams").classList.remove("w3-hide");
    else document.getElementById("diann191_advancedParams").classList.add("w3-hide");
    });
    // add the tooltip texts
    tooltip(document.getElementById("diann191_btnBrowseFasta").parentElement.nextElementSibling, "Select the FASTA file for the library-free approach");
    tooltip(document.getElementById("diann191_cmbRawType"), "Select the type of RAW data you want to load");
    tooltip(document.getElementById("diann191_btnClearRaw"), "Remove all files");
    tooltip(document.getElementById("diann191_cmbEnzyme").parentElement.previousElementSibling, "Enzyme used for the digest");
    tooltip(document.getElementById("diann191_txtMc").parentElement.previousElementSibling, "Maximum number of missed cleavages allowed");
    tooltip(document.getElementById("diann191_txtVarMods").parentElement.previousElementSibling, "Warning: more than 3 variable modifications will significantly increase the search space, use with caution");
    tooltip(document.getElementById("diann191_txtFdr").parentElement.previousElementSibling, "False discovery rate level at which the output files will be filtered");
    tooltip(document.getElementById("diann191_txtMs1Acc").parentElement.previousElementSibling, "Leave at 0.0 for automatic inference");
    tooltip(document.getElementById("diann191_txtMassAcc").parentElement.previousElementSibling, "Leave at 0.0 for automatic inference");
    tooltip(document.getElementById("diann191_txtWindow").parentElement.previousElementSibling, "Radius (in scans) of the retention time window that is used to scan extracted chromatograms of precursor ions");
    tooltip(document.getElementById("diann191_txtMinLen").parentElement.previousElementSibling, "The peptide length range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann191_txtMinCharge").parentElement.previousElementSibling, "The precursor charge range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann191_txtMinMz").parentElement.previousElementSibling, "The precursor m/z range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann191_txtPepMinMz").parentElement.previousElementSibling, "The peptide m/z range has an impact on the size of the seach space");
    tooltip(document.getElementById("diann191_cmbInference").parentElement.previousElementSibling, "Select the way that the protein isoforms are grouped by");
    tooltip(document.getElementById("diann191_cmbClassifier").parentElement.previousElementSibling, "Double-pass mode is the best in most cases but is about twice slower than single-pass");
    tooltip(document.getElementById("diann191_cmbQuant").parentElement.previousElementSibling, "Select if you want to prioritize precision or accuracy");
    tooltip(document.getElementById("diann191_cmbNorm").parentElement.previousElementSibling, "Normalized quantities are reported along with the raw quantities");
    tooltip(document.getElementById("diann191_cmbSpeed").parentElement.previousElementSibling, "Optimal results gives the most identifications, Low RAM is almost as good but requires less RAM and is a little faster, the others return significantly less identifications but are significantly faster");
    tooltip(document.getElementById("diann191_txtVerbose").parentElement.previousElementSibling, "Select the detail of the log output, values are between 0 to 5");
}

function getSettings() {
    const settings = new Map();
    settings.set("fasta", document.getElementById("diann191_txtFasta").value);
    settings.set("files", Array.from(document.getElementById("diann191_rawFiles").childNodes).map(li => li.textContent));
    if(document.getElementById("diann191_cmbRawType").value == "slicepasef") settings.set("slice-pasef", true);
    settings.set("protease", document.getElementById("diann191_cmbEnzyme").value);
    settings.set("mc", document.getElementById("diann191_txtMc").value);
    settings.set("var-mods", document.getElementById("diann191_txtVarMods").value);
    if(document.getElementById("diann191_chkMetEx").checked) settings.set("met-excision", true);
    if(document.getElementById("diann191_chkModCarba").checked) settings.set("carba", true);
    if(document.getElementById("diann191_chkModOx").checked) settings.set("ox-m", true);
    if(document.getElementById("diann191_chkModAc").checked) settings.set("ac-nterm", true);
    if(document.getElementById("diann191_chkModPhospho").checked) settings.set("phospho", true);
    if(document.getElementById("diann191_chkModKgg").checked) settings.set("k-gg", true);
    settings.set("fdr", document.getElementById("diann191_txtFdr").value);
    settings.set("ms1-acc", document.getElementById("diann191_txtMs1Acc").value);
    settings.set("mass-acc", document.getElementById("diann191_txtMassAcc").value);
    settings.set("window", document.getElementById("diann191_txtWindow").value);
    settings.set("min-pep-length", document.getElementById("diann191_txtMinLen").value);
    settings.set("max-pep-length", document.getElementById("diann191_txtMaxLen").value);
    settings.set("min-pr-charge", document.getElementById("diann191_txtMinCharge").value);
    settings.set("max-pr-charge", document.getElementById("diann191_txtMaxCharge").value);
    settings.set("min-pr-mz", document.getElementById("diann191_txtPepMinMz").value);
    settings.set("max-pr-mz", document.getElementById("diann191_txtPepMaxMz").value);
    settings.set("min-fr-mz", document.getElementById("diann191_txtMinMz").value);
    settings.set("max-fr-mz", document.getElementById("diann191_txtMaxMz").value);
    settings.set("inference", document.getElementById("diann191_cmbInference").value);
    settings.set("classifier", document.getElementById("diann191_cmbClassifier").value);
    settings.set("quant", document.getElementById("diann191_cmbQuant").value);
    settings.set("norm", document.getElementById("diann191_cmbNorm").value);
    settings.set("speed", document.getElementById("diann191_cmbSpeed").value);
    settings.set("verbose", document.getElementById("diann191_txtVerbose").value);
    console.log(settings);
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
    return new App("diann_1.9.1", "Dia-NN", "1.9.1", getDiann191Html(), getDiann191Events, getSettings, getSharedFiles, getLocalFiles);
}
