
// class Param {
//     constructor(type, label, tooltip = "", defaultValue = null, minValue = null, maxValue = null, values = [], optional = false) {
//         this.type = type; // either "button", "bool", "int", "float", "string", "list", used to determine the input type
//         this.label = label; // what will be written in the label next to the input
//         this.tooltip = tooltip; // used for the tooltip text
//         this.defaultValue = defaultValue; // the default value to give to the input
//         this.minValue = minValue; // used only for "int" and "float" types
//         this.maxValue = maxValue; // used only for "int" and "float" types
//         this.values = values; // used only for "list" type
//         this.optional = optional; // if true, the user can leave it unset
//     }
// }

// class App {
//     constructor(id, name, version, params) {
//         this.id = id;
//         this.name = name;
//         this.version = version;
//         this.params = params; // an array of Param objects
//     }
// }

// const apps = [
//     new App("diann181", "Dia-NN", "1.8.1", [
//         new Param("button", "Browse Thermo .raw"), new Param("button", "Browse diaPASEF .d"), new Param("button", "Browse slicePASEF .d"), new Param("button", "Add FASTA"), 
//         new Param("list", "Protease")
//     ]),
//     new App("diann182b27", "Dia-NN", "1.8.2 beta 27", []),
//     new App("diann182b39", "Dia-NN", "1.8.2 beta 39", []),
//     new App("test", "Test (sleep  60 seconds)", "", [])
// ];

class App {
    constructor(name, version, html, eventsFunction, outputFunction) {
        // this.id = id;
        this.name = name;
        this.version = version;
        this.html = html;
        // call this function after adding the html to an object to create the events listeners
        this.eventsFunction = eventsFunction;
        // call this function to put the user's values in a map and return it for validation
        this.outputFunction = outputFunction;
    }
}
// const apps = [
//     {id: "diann181", name: "Dia-NN", version: "1.8.1", html: getDiann181Html, events: getDiann181Events},
//     {id: "diann182b27", name: "Dia-NN", version: "1.8.2 beta 27", html: ""},
//     {id: "diann182b39", name: "Dia-NN", version: "1.8.2 beta 39", html: ""},
//     {id: "test", name: "sleep", version: "1.0", html: ""}
// ];
const apps = new Map();
apps.set("diann181", new App("Dia-NN", "1.8.1", getDiann181Html(), getDiann181Events, getDiann181Output));
apps.set("diann182b27", new App("Dia-NN", "1.8.2 beta 27", "", null, null));
apps.set("diann182b39", new App("Dia-NN", "1.8.2 beta 39", "", null, null));
apps.set("test", new App("Test (sleep)", "1.0", "", null, null));

function getDiann181Html() {
    return `<h3>Diann 1.8.1 parameters</h3>
            <div class="w3-row w3-section">
              <button id="btnBrowseRaw" class="w3-button w3-teal">Browse Thermo .raw</button>
              <button id="btnBrowseDiaPasef" class="w3-button w3-teal">Browse diaPASEF .d</button>
              <button id="btnBrowseSlicePasef" class="w3-button w3-teal">Browse slicePASEF .d</button>
              <textarea id="rawFiles" name="files" class="w3-block w3-input w3-border" readonly></textarea>
            </div>
            <div class="w3-row w3-section">
              <button id="btnFasta" class="w3-col w3-button w3-teal" style="width: 150px">Add FASTA</button>
              <input id="txtFasta" name="fasta" type="text" class="w3-input w3-border w3-ligh-grey w3-rest" />
            </div>
            <div class="w3-row w3-section">
              <label for="cmbEnzyme" class="w3-col">Protease</label>
              <select id="cmbEnzyme" name="protease" class="w3-select w3-border w3-rest">
                <option value="K*,R*" selected>Trypsin /P</option>
                <option value="K*,R*,!*P">Trypsin</option>
                <option value="K*">Lys-C</option>
                <option value="F*,Y*,W*,M*,L*,!*P">Chymotrypsin</option>
                <option value="*D">AspN</option>
                <option value="E*">GluC</option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="txtMc" class="w3-col">Missed cleavages</label>
              <input id="txtMc" name="mc" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="1" min="0" max="5" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtVarMods" class="w3-col">Maximum number of variable modifications</label>
              <input id="txtVarMods" name="var-mods" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="0" min="0" max="5" />
            </div>
            <div class="w3-row w3-section">
              <input id="chkMetEx" name="met-excision" type="checkbox" class="w3-check" checked><label for="chkMetEx">N-term M excision</label>
              <input id="chkModCarba" name="carba" type="checkbox" class="w3-check" checked><label for="chkModCarba">C carbamidomethylation</label>
              <input id="chkModOx" name="ox-m" type="checkbox" class="w3-check"><label for="chkModOx">Ox(M)</label>
              <input id="chkModAc" name="ac-nterm" type="checkbox" class="w3-check"><label for="chkModAc">Ac(N-term)</label>
              <input id="chkModPhospho" name="phospho" type="checkbox" class="w3-check"><label for="chkModPhospho">Phospho</label>
              <input id="chkModKgg" name="k-gg" type="checkbox" class="w3-check"><label for="chkModKgg">K-GG</label>
            </div>
            <div class="w3-row w3-section">
              <label for="txtFdr" class="w3-col">Precursor FDR (%)</label>
              <input id="txtFdr" name="fdr" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="1.0" min="0" max="100" step="0.1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMassAcc" class="w3-col">Mass accuracy</label>
              <input id="txtMassAcc" name="mass-acc" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="10.0" min="0" max="100.0" step="0.1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMs1Acc" class="w3-col">MS1 accuracy</label>
              <input id="txtMs1Acc" name="ms1-acc" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="10.0" min="0" max="100.0" step="0.1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtWindow" class="w3-col">Scan window</label>
              <input id="txtWindow" name="window" type="number" class="w3-input w3-border w3-ligh-grey w3-rest" value="10" min="0" />
            </div>
            <hr/>
            <div class="w3-row w3-section">
              <label for="txtMinLen" class="w3-col">Peptide minimal length</label>
              <input id="txtMinLen" name="min-pep-len" type="number" class="w3-input w3-border w3-ligh-grey" value="7" min="1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMaxLen" class="w3-col">Peptide maximal length</label>
              <input id="txtMaxLen" name="max-pep-len" type="number" class="w3-input w3-border w3-ligh-grey" value="30" min="1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMinCharge" class="w3-col">Precursor minimal charge state</label>
              <input id="txtMinCharge" name="min-pr-charge" type="number" class="w3-input w3-border w3-ligh-grey" value="1" min="1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMaxCharge" class="w3-col">Precursor maximal charge state</label>
              <input id="txtMaxCharge" name="max-pr-charge" type="number" class="w3-input w3-border w3-ligh-grey" value="4" min "1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMinMz" class="w3-col">Precursor minimal M/z</label>
              <input id="txtMinMz" name="min-pr-mz" type="number" class="w3-input w3-border w3-ligh-grey" value="300" min="1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtMaxMz" class="w3-col">Precursor maximal M/z</label>
              <input id="txtMaxMz" name="max-pr-mz" type="number" class="w3-input w3-border w3-ligh-grey" value="1800" min "1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtPepMinMz" class="w3-col">Peptide minimal M/z</label>
              <input id="txtPepMinMz" name="min-fr-mz" type="number" class="w3-input w3-border w3-ligh-grey" value="200" min="1" />
            </div>
            <div class="w3-row w3-section">
              <label for="txtPepMaxMz" class="w3-col">Peptide maximal M/z</label>
              <input id="txtPepMaxMz" name="max-fr-mz" type="number" class="w3-input w3-border w3-ligh-grey" value="1800" min "1" />
            </div>
            <div class="w3-row w3-section">
              <label for="cmbInference" class="w3-col">Protein inference</label>
              <select id="cmbInference" name="inference" class="w3-select w3-border w3-rest">
                <option value="isoforms">Isoforms IDs</option>
                <option value="protein" selected>Protein names (from FASTA)</option>
                <option value="species">Genes (species-specific)</option>
                <option value="genes">Genes</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="cmbClassifier" class="w3-col">Neural network classifier</label>
              <select id="cmbClassifier" name="classifier" class="w3-select w3-border w3-rest">
                <option value="off">Off</option>
                <option value="single" selected>Single-pass mode</option>
                <option value="double">Double-pass mode</option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="cmbQuant" class="w3-col">Quantification strategy</label>
              <select id="cmbQuant" name="quant" class="w3-select w3-border w3-rest">
                <option value="any/acc">Any LC (high accuracy)</option>
                <option value="any/prec">Any LC (high precision)</option>
                <option value="robust/acc">Robust LC (high accuracy)</option>
                <option value="robust/prec" selected>Robust LC (high precision)</option>
                <option value="height"></option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="cmbNorm" class="w3-col">Cross-run normalisation</label>
              <select id="cmbNorm" name="norm" class="w3-select w3-border w3-rest">
                <option value="global">Global</option>
                <option value="rt" selected>RT-dependent</option>
                <option value="signal">RT & signal-dep. (experimental)</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="cmbSpeed" class="w3-col">Speed and RAM usage</label>
              <select id="cmbSpeed" name="speed" class="w3-select w3-border w3-rest">
                <option value="optimal">Optimal results</option>
                <option value="low ram" selected>Low RAM usage</option>
                <option value="high speed">Low RAM & high speed</option>
                <option value="ultra fast">Ultra-fast</option>
              </select>
            </div>
            <div class="w3-row w3-section">
              <label for="txtVerbose" class="w3-col">Log level</label>
              <input id="txtVerbose" name="verbose" type="number" class="w3-input w3-border w3-ligh-grey" value="1" min="1" max="5" />
            </div>`;
}
function getDiann181Events() {
    document.getElementById("btnBrowseRaw").addEventListener("click", () => alert("Browse raw files"));
    document.getElementById("btnBrowseDiaPasef").addEventListener("click", () => alert("Browse diaPASEF .d folders"));
    document.getElementById("btnBrowseSlicePasef").addEventListener("click", () => alert("Browse slicePASEF .d folders"));
    document.getElementById("btnFasta").addEventListener("click", () => alert("Browse Fasta file"));
}

function getDiann181Output() {
    // TODO we can make it simpler, and not depend on the app
    // var html = "";
    // const formData = new FormData(document.getElementById("formParameters"));
    // for (const pair of formData.entries()) {
    //   console.log(pair[0], pair[1]);
    //   html += `Key '${pair[0]}' => Value '${pair[1]}'\n`;
    // }
    return new Map();
}