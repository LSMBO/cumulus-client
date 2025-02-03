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

// const app = require('electron');
const log = require('electron-log/main');
const FormData = require('form-data');
const fs = require('fs');
const config = require('./config.js');
const path = require('path');
const rest = require('./rest.js');
const xsdv = require('xsd-schema-validator');

// const DEMO_MODE = true; // when true, the client works offline without any server or rsync agent
// if(DEMO_MODE) log.info("DEMO MODE is activated, the GUI will only work offline");
var DEMO_MODE = false;
const XSD = path.join(__dirname, "apps.xsd");

function setDemoMode(value) {
    log.info("DEMO MODE is activated, the GUI will only work offline");
    DEMO_MODE = value;
}

async function checkServerVersion() {
    log.info("Checking that client and server have compatible versions");
    if(DEMO_MODE) {
        config.set("cumulus.version", config.get("cumulus.version"));
        config.set("controller.version", "0.0.1");
        config.set("rsync.version", "0.0.1");
        log.info("Version check is OK");
        return "";
    } else {
        // get controller config
        // const [data, error1] = await rest.sendGetRequest(rest.getUrl("config"));
        var url = rest.getUrl("config");
        log.debug(`Check Cumulus server at ${url}`);
        const [data, error1] = await rest.sendGetRequest(url);
        // console.log(data);
        if(error1 != "") return error1;
        for(let [key, value] of Object.entries(JSON.parse(data))) {
            config.set(key, value);
        }
        // get rsync agent config
        // const [version, error2] = await rest.sendGetRequest(rest.getUrl("/", [], true));
        url = rest.getUrl("/", [], true);
        log.debug(`Check Cumulus RSync client at ${url}`);
        const [version, error2] = await rest.sendGetRequest(url);
        if(error2) return error2;
        config.set("rsync.version", version);
        // check that all versions are compatible
        // return config.checkVersion();
        const check = config.checkVersion();
        if(check == "") log.info("Version check is OK");
        else log.error(check);
        return check;
    }
}

async function listApps() {
    log.info("Retrieving list of applications");
    if(DEMO_MODE) {
        // read the xml files in test
        // return [
        //     ["diann_1.9.1", fs.readFileSync("test/diann_1.9.1.xml", 'utf-8')],
        //     ["alphadia_1.8.2", fs.readFileSync("test/alphadia_1.8.2.xml", 'utf-8')]
        // ]
        // read the test/apps.txt file, it contains a copy of the real output from the server
        const data = fs.readFileSync("test/apps.txt", 'utf-8')
        return Object.entries(JSON.parse(data));
    } else {
        log.debug("listApps()")
        const [data, error] = await rest.sendGetRequest(rest.getUrl("/apps", []));
        const apps = [];
        if(error) {
            log.error(error);
        } else {
            const output = Object.entries(JSON.parse(data));
            for(let [id, xml] of output) {
                // console.log(id);
                // console.log(xml);
                log.debug(XSD);
                try {
                    const result = await xsdv.validateXML(xml, XSD);
                    if(result.valid) {
                        log.info(`App '${id}' is valid`);
                        apps.push([id, xml]);
                    }
                } catch(err) {
                    log.error(err);
                }
            }
        }
        return apps;
    }
}

async function checkRsyncAgent() {
    // log.info("Check that RSync agent is online"); // this is checked at every refresh of the job list
    if(DEMO_MODE) {
        return "";
    } else {
        const [response, error] = await rest.sendGetRequest(rest.getUrl("/", [], true));
        if(error) return error;
        // else if(response != "OK") return "The RSync agent was reached but the expected code was incorrect.";
        else return "";
    }
}

async function listStorage() {
    log.info("Retrieving the list of files already on the server");
    if(DEMO_MODE) {
        const data = [["TP19990FD_Slot1-40_1_20934.d",2697187862],["Human_pSP_CMO_20190213.fasta",29115940],["TP19976FD_Slot1-14_1_20920.d",2243772467],["TP19974FD_Slot1-73_1_20918.d",3340354779],["TP19984FD_Slot1-27_1_20928.d",5297101355],["TP19972FD_Slot1-37_1_20916.d",2150002654],["TP19986FD_Slot1-63_1_20930.d",4320134564],["TP19995FD_Slot1-49_1_20940.d",2193039635],["TP19978FD_Slot1-50_1_20922.d",2389368872],["TP19970FD_Slot1-01_1_20914.d",4136935373],["TP19988FD_Slot1-04_1_20932.d",3207792359],["TP19999FD_Slot1-26_1_20944.d",2382637659],["TP19982FD_Slot1-86_1_20926.d",3517079948]];
        return [data, ""];
    } else {
        const url = rest.getUrl("storage");
        const [data, error] = await rest.sendGetRequest(url);
        // console.log("storage: "+JSON.parse(data));
        // log.debug("listStorage: "+data);
        const output = new Map(JSON.parse(data));
        if(!error) {
            // also request the rsync agent to get a list of file names
            const rsync_url = rest.getUrl("list-rsync", [], true);
            // console.log(rsync_url);
            const [files, error2] = await rest.sendGetRequest(rsync_url);
            // console.log("transfer: "+files);
            if(!error2) {
                for(let file of JSON.parse(files)) {
                    // do not add the files already on the server
                    // new files have a size of -1
                    if(!output.has(file)) output.set(file, -1);
                }
            }
        }
        // console.log("listStorage: "+output);
        return [output, error];
    }
}

async function getDiskUsage() {
    log.info("Get server disk usage");
    // const map = { "total": 0, "used": 0, "free": 0 };
    const map = new Map([["total", 0], ["used", 0], ["free", 0]]);
    if(DEMO_MODE) {
        map.set("total", 15609467670528);
        map.set("used", 387315232768);
        map.set("free", 15222135660544);
    } else {
        const url = rest.getUrl("diskusage");
        const [output, error] = await rest.sendGetRequest(url);
        if(!error)  {
            const data = JSON.parse(output);
            map.set("total", Number(data[0]));
            map.set("used", Number(data[1]));
            map.set("free", Number(data[2]));
        }
    }
    return map;
}

async function listHosts() {
    log.info("Get the list of available hosts");
    if(DEMO_MODE) {
        const data = [{"cpu":"32","jobs_pending":0,"jobs_running":0,"name":"VM1","ram":"64"}];
        return [data, ""];
    } else {
        const url = rest.getUrl("info");
        const [data, error] = await rest.sendGetRequest(url);
        // console.log("listHosts: "+data);
        return [JSON.parse(data), error];
    }
}

async function createJob(_, owner, app, strategy, description, settings, rawfiles, fastafiles) {
    log.info(`Creating a new job for user '${owner}' with app '${app}'`);
    if(DEMO_MODE) {
        log.debug(settings);
        // {"fasta-file":"//ANALYST-PC/sequence/08Jan2024_Only14Defensin_DCp_BAR_20240402/current/08Jan2024_Only14Defensin_DCp_BAR_20240402.fasta","contaminants":true,"mc":"1","met-excision":true,"peptide-length-max":"30","peptide-length-min":"7","precursor-charge-max":"4","precursor-charge-min":"2","precursor-mz-max":"1800","precursor-mz-min":"300","fragment-mz-max":"1800","fragment-mz-min":"200","speclib-path":"","matrices":true,"prosit":true,"fdr":"1.0","loglevel":"1","max-var-mod":"2","ptm-carba":true,"ptm-ox":true,"ptm-ac":true,"ms1-acc":"10.0","ms2-acc":"10.0","scan-window":"10","mbr":true,"no-shared-spectra":true,"raw-type":"dia-pasef","format":"fasta","protease":"K*,R*","protein-inference":"protein","machine-learning":"single","quantification-strategy":"quantums-precision","cross-run-norm":"rt","library-generation":"rt-profiling","speed-ram":"low-ram","dia-pasef-list":["//SERV-NAS-II/RawDataTemporaire/BUREL Alexandre/DIA/TP4808CMO_Slot2-1_1_4820.d","//SERV-NAS-II/RawDataTemporaire/BUREL Alexandre/DIA/TP4823CMO_Slot2-17_1_4835.d","//SERV-NAS-II/RawDataTemporaire/BUREL Alexandre/DIA/TU013690CK_Slot2-2_1_2031.d","//SERV-NAS-II/RawDataTemporaire/BUREL Alexandre/DIA/TU013766CK_Slot1-02_1_2095.d"],"slice-pasef-list":[],"thermo-raw-list":[],"mzml-list":[]}
        return 10000;
    } else {
        // prepare the parameters
        const form = new FormData({ maxDataSize: 20971520 });
        form.append("username", owner);
        form.append("app_name", app);
        form.append("strategy", strategy);
        form.append("description", description);
        form.append("settings", str = settings);
        // send the request
        const url = rest.getUrl("start");
        const [data, error] = await rest.sendPostRequest(url, form);
        // console.log("start: "+data);
        const [job_id, job_dir] = JSON.parse(data)
        // console.log(data);
        log.info(`Job has been created with id ${job_id} and directory '${job_dir}'`);
        // call the rsync agent to transfer the files
        const form2 = new FormData({ maxDataSize: 20971520 });
        form2.append("job_id", job_id);
        form2.append("job_dir", job_dir);
        form2.append("owner", owner);
        form2.append("files", rawfiles);
        form2.append("local_files", fastafiles);
        log.info("Sending files to the server");
        await rest.sendPostRequest(rest.getUrl("send-rsync", [], true), form2);
        // return the job id
        return job_id;
    }
}

async function getLastJobs(_, job_id, number) {
    // no logging because this will be called all the time
    if(DEMO_MODE) {
        const data = [{"app_name":"diann_1.9.1","creation_date":1724839182,"id":57,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"diann_1.9.1","creation_date":1724835326,"description":"","end_date":1724836841,"files":[["_storage_data_TP19999FD_Slot1-26_1_20944_d.quant",10398168],["report.log.txt",11078],["report-first-pass.stats.tsv",867],[".diann_1.9.1.stderr",194],[".diann_1.9.1.stdout",8342],["report-lib.parquet",5191887],["report-first-pass.parquet",4619971],["report-first-pass.tsv",20099798],["_storage_data_TP19990FD_Slot1-40_1_20934_d.quant",14531648],["report.parquet",4499787],["report.stats.tsv",868],["report-lib.parquet.skyline.speclib",7905929],["HumanSPiRT_pSP_AUH_20240117.fasta",13585626],["report.tsv",20939682],["report-lib.predicted.speclib",639563983],["_storage_data_TP19974FD_Slot1-73_1_20918_d.quant",14310808],["test.py",189],["report_xic/TP19990FD_Slot1-40_1_20934.xic.parquet",5963455],["report_xic/TP19999FD_Slot1-26_1_20944.xic.parquet",4823279],["report_xic/TP19974FD_Slot1-73_1_20918.xic.parquet",6393136]],"host":"VM1","id":56,"owner":"Burel.Alexandre","settings":{"carba":true,"classifier":"single","fasta":"D:/Projets/Tims2Rescore/workflow/ms2rescore/auh/fasta/HumanSPiRT_pSP_AUH_20240117.fasta","fdr":"1.0","files":["//SERV-NAS-II/RawDataTemporaire/DELALANDE Frankois/Salive juillet 2024/DIA/TP19974FD_Slot1-73_1_20918.d","//SERV-NAS-II/RawDataTemporaire/DELALANDE Frankois/Salive juillet 2024/DIA/TP19990FD_Slot1-40_1_20934.d","//SERV-NAS-II/RawDataTemporaire/DELALANDE Frankois/Salive juillet 2024/DIA/TP19999FD_Slot1-26_1_20944.d"],"inference":"protein","mass-acc":"10.0","max-fr-mz":"1800","max-pep-length":"30","max-pr-charge":"4","max-pr-mz":"1800","mc":"0","met-excision":true,"min-fr-mz":"200","min-pep-length":"7","min-pr-charge":"2","min-pr-mz":"300","ms1-acc":"10.0","norm":"rt","protease":"K*,R*","quant":"ums/prec","rawType":"diapasef","speed":"ultra fast","var-mods":"0","verbose":"1","window":"10"},"start_date":1724835689,"status":"DONE","stderr":"","stdout":"DIA-NN 1.9.1 (Data-Independent Acquisition by Neural Networks)\nCompiled on Jul 15 2024 09:42:01\nCurrent date and time: Wed Aug 28 09:01:29 2024\nLogical CPU cores: 32\nDIA-NN will carry out FASTA digest for in silico lib generation\nDeep learning will be used to generate a new in silico spectral library from peptides provided\nIn silico digest will involve cuts at K*,R*\nMaximum number of missed cleavages set to 0\nMaximum number of variable modifications set to 0\nN-terminal methionine excision enabled\nCysteine carbamidomethylation enabled as a fixed modification\nWARNING: unrecognised option [--min-pep-length 7]\nWARNING: unrecognised option [--max-pep-length 30]\nMin precursor charge set to 2\nMax precursor charge set to 4\nMin precursor m/z set to 300\nMax precursor m/z set to 1800\nMin fragment m/z set to 200\nMax fragment m/z set to 1800\nA spectral library will be generated\nOutput will be filtered at 1 FDR\nThread number set to 32\nScan window radius set to 10\nA spectral library will be created from the DIA runs and used to reanalyse them; .quant files will only be saved to disk during the first step\nImplicit protein grouping: protein names; this determines which peptides are considered 'proteotypic' and thus affects protein FDR calculation\nWhen generating a spectral library, in silico predicted spectra will be retained if deemed more reliable than experimental ones\nXICs within 10 seconds from the apex will be extracted for each precursor and saved in .parquet format, a folder will be created next to the main report for the XICs storage\nOnly peaks with correlation sum exceeding 2 will be considered\nPeaks with correlation sum below 1 from maximum will not be considered\nA single score will be used until RT alignment to save memory; this can potentially lead to slower search\nFast algorithm based on MS1 feature extraction for quicker library-free search will be applied; this significantly worsens the identification performance\nMass accuracy will be fixed to 1e-05 (MS2) and 1e-05 (MS1)\nWARNING: it is strongly recommended to first generate an in silico-predicted library in a separate pipeline step and then use it to process the raw data, now without activating FASTA digest\nWARNING: it is strongly recommended to keep the q-value threshold at 5% or below when generating a spectral library from DIA data.\n\n3 files will be processed\n[0:00] Loading FASTA HumanSPiRT_pSP_AUH_20240117.fasta\n[0:02] Processing FASTA\n[0:04] Assembling elution groups\n[0:06] 1241884 precursors generated\n[0:06] Gene names missing for some isoforms\n[0:06] Library contains 20322 proteins, and 20110 genes\n[0:09] Encoding peptides for spectra and RTs prediction\n[0:13] Predicting spectra and IMs\n[1:14] Predicting RTs\n[1:20] Decoding predicted spectra and IMs\n[1:21] Decoding RTs\n[1:22] Saving the library to report-lib.predicted.speclib\n[1:33] Initialising library\n[1:37] Loading spectral library report-lib.predicted.speclib\n[1:39] Library annotated with sequence database(s): HumanSPiRT_pSP_AUH_20240117.fasta\n[1:40] Spectral library loaded: 20322 protein isoforms, 26303 protein groups and 1241884 precursors in 509438 elution groups.\n[1:40] Loading protein annotations from FASTA HumanSPiRT_pSP_AUH_20240117.fasta\n[1:40] Annotating library proteins with information from the FASTA database\n[1:40] Gene names missing for some isoforms\n[1:40] Library contains 20322 proteins, and 20110 genes\n[1:43] Encoding peptides for spectra and RTs prediction\n[1:48] Predicting spectra and IMs\n[2:48] Predicting RTs\n[2:54] Decoding predicted spectra and IMs\n[2:55] Decoding RTs\n[2:56] Saving the library to report-lib.predicted.speclib\n[3:06] Initialising library\n\nFirst pass: generating a spectral library from DIA data\n\n[3:09] File #1/3\n[3:09] Loading run /storage/data/TP19974FD_Slot1-73_1_20918.d\n[3:42] 871684 library precursors are potentially detectable\n[3:42] Processing...\n[6:19] RT window set to 1.88124\n[6:19] Ion mobility window set to 0.0353522\n[6:20] Recommended MS1 mass accuracy setting: 12.6399 ppm\n[6:53] Removing low confidence identifications\n[6:53] Removing interfering precursors\n[6:55] Training neural networks: 11529 targets, 6195 decoys\n[6:56] Number of IDs at 0.01 FDR: 6042\n[6:57] Calculating protein q-values\n[6:57] Number of proteins identified at 1% FDR: 1706 (precursor-level), 1549 (protein-level) (inference performed using proteotypic peptides only)\n[6:57] Quantification\n[6:59] Quantification information saved to ./_storage_data_TP19974FD_Slot1-73_1_20918_d.quant\n\n[6:59] File #2/3\n[6:59] Loading run /storage/data/TP19990FD_Slot1-40_1_20934.d\n[7:49] 871684 library precursors are potentially detectable\n[7:49] Processing...\n[10:34] RT window set to 1.70498\n[10:34] Ion mobility window set to 0.0360671\n[10:34] Recommended MS1 mass accuracy setting: 12.7786 ppm\n[11:05] Removing low confidence identifications\n[11:06] Removing interfering precursors\n[11:08] Training neural networks: 11782 targets, 6289 decoys\n[11:09] Number of IDs at 0.01 FDR: 5967\n[11:10] Calculating protein q-values\n[11:10] Number of proteins identified at 1% FDR: 1740 (precursor-level), 1613 (protein-level) (inference performed using proteotypic peptides only)\n[11:10] Quantification\n[11:11] Quantification information saved to ./_storage_data_TP19990FD_Slot1-40_1_20934_d.quant\n\n[11:11] File #3/3\n[11:11] Loading run /storage/data/TP19999FD_Slot1-26_1_20944.d\n[12:09] 871684 library precursors are potentially detectable\n[12:09] Processing...\n[15:36] RT window set to 2.37457\n[15:36] Ion mobility window set to 0.0357776\n[15:36] Recommended MS1 mass accuracy setting: 12.7211 ppm\n[16:16] Removing low confidence identifications\n[16:17] Removing interfering precursors\n[16:19] Training neural networks: 8416 targets, 4534 decoys\n[16:20] Number of IDs at 0.01 FDR: 4208\n[16:21] Calculating protein q-values\n[16:21] Number of proteins identified at 1% FDR: 1254 (precursor-level), 1180 (protein-level) (inference performed using proteotypic peptides only)\n[16:21] Quantification\n[16:22] Quantification information saved to ./_storage_data_TP19999FD_Slot1-26_1_20944_d.quant\n\n[16:22] Cross-run analysis\n[16:22] Reading quantification information: 3 files\n[16:23] Quantifying peptides\n[16:24] Assembling protein groups\n[16:25] Quantifying proteins\n[16:25] Calculating q-values for protein and gene groups\n[16:25] Calculating global q-values for protein and gene groups\n[16:25] Protein groups with global q-value <= 0.01: 2340\n[16:26] Compressed report saved to ./report-first-pass.parquet. Use R 'arrow' or Python 'PyArrow' package to process\n[16:26] Writing report\n[16:28] Report saved to ./report-first-pass.tsv.\n[16:28] Stats report saved to ./report-first-pass.stats.tsv\n[16:28] Generating spectral library:\n[16:29] 19702 target and 9851 decoy precursors saved\nWARNING: 1 precursors without any fragments annotated were skipped\n[16:29] Spectral library saved to report-lib.parquet\n\n[16:30] Loading spectral library report-lib.parquet\n[16:31] Spectral library loaded: 3562 protein isoforms, 3647 protein groups and 29553 precursors in 28077 elution groups.\n[16:31] Loading protein annotations from FASTA HumanSPiRT_pSP_AUH_20240117.fasta\n[16:31] Annotating library proteins with information from the FASTA database\n[16:31] Gene names missing for some isoforms\n[16:31] Library contains 3562 proteins, and 3552 genes\n[16:31] Initialising library\n[16:31] Saving the library to report-lib.parquet.skyline.speclib\n\n\nSecond pass: using the newly created spectral library to reanalyse the data\n\n[16:31] File #1/3\n[16:31] Loading run /storage/data/TP19974FD_Slot1-73_1_20918.d\n[17:01] 19702 library precursors are potentially detectable\n[17:01] Processing...\n[17:14] RT window set to 0.918542\n[17:14] Ion mobility window set to 0.0107427\n[17:14] Recommended MS1 mass accuracy setting: 13.5428 ppm\n[17:17] Removing low confidence identifications\n[17:17] Removing interfering precursors\n[17:17] Training neural networks: 10903 targets, 5681 decoys\n[17:17] Number of IDs at 0.01 FDR: 7191\n[17:17] Calculating protein q-values\n[17:17] Number of proteins identified at 1% FDR: 1883 (precursor-level), 1816 (protein-level) (inference performed using proteotypic peptides only)\n[17:17] Quantification\n[17:19] XICs saved to ./report_xic/TP19974FD_Slot1-73_1_20918.xic.parquet\n\n[17:20] File #2/3\n[17:20] Loading run /storage/data/TP19990FD_Slot1-40_1_20934.d\n[17:45] 19702 library precursors are potentially detectable\n[17:45] Processing...\n[17:57] RT window set to 0.896381\n[17:57] Ion mobility window set to 0.0102175\n[17:57] Recommended MS1 mass accuracy setting: 13.3678 ppm\n[17:59] Removing low confidence identifications\n[17:59] Removing interfering precursors\n[17:59] Training neural networks: 11217 targets, 5815 decoys\n[18:00] Number of IDs at 0.01 FDR: 7434\n[18:00] Calculating protein q-values\n[18:00] Number of proteins identified at 1% FDR: 1961 (precursor-level), 1822 (protein-level) (inference performed using proteotypic peptides only)\n[18:00] Quantification\n[18:02] XICs saved to ./report_xic/TP19990FD_Slot1-40_1_20934.xic.parquet\n\n[18:02] File #3/3\n[18:02] Loading run /storage/data/TP19999FD_Slot1-26_1_20944.d\n[18:23] 19702 library precursors are potentially detectable\n[18:23] Processing...\n[18:36] RT window set to 0.846976\n[18:36] Ion mobility window set to 0.0110476\n[18:36] Recommended MS1 mass accuracy setting: 13.97 ppm\n[18:38] Removing low confidence identifications\n[18:38] Removing interfering precursors\n[18:38] Training neural networks: 9646 targets, 4975 decoys\n[18:39] Number of IDs at 0.01 FDR: 6004\n[18:39] Calculating protein q-values\n[18:39] Number of proteins identified at 1% FDR: 1691 (precursor-level), 1589 (protein-level) (inference performed using proteotypic peptides only)\n[18:39] Quantification\n[18:41] XICs saved to ./report_xic/TP19999FD_Slot1-26_1_20944.xic.parquet\n\n[18:42] Cross-run analysis\n[18:42] Reading quantification information: 3 files\n[18:42] Quantifying peptides\nWARNING: QuantUMS requires 6 or more runs for the optimisation of its hyperparameters to perform best.\n[18:49] Quantification parameters: 0.380459, 0.00721803, 0.00845196, 0.0126956, 0.0129454, 0.0127608, 0.0584254, 0.125172, 0.0614216, 0.0136173, 0.0152284, 0.0143171, 0.167322, 0.0675959, 0.0660291, 0.0118399\n[18:50] Quantifying proteins\n[18:50] Calculating q-values for protein and gene groups\n[18:50] Calculating global q-values for protein and gene groups\n[18:50] Protein groups with global q-value <= 0.01: 2357\n[18:51] Compressed report saved to ./report.parquet. Use R 'arrow' or Python 'PyArrow' package to process\n[18:51] Writing report\n[18:54] Report saved to ./report.tsv.\n[18:54] Stats report saved to ./report.stats.tsv\n\nThe following warnings or errors (in alphabetic order) were detected at least the indicated number of times:\nWARNING: 1 precursors without any fragments annotated were skipped : 1\nWARNING: QuantUMS requires 6 or more runs for the optimisation of its hyperparameters to perform best. : 1\nWARNING: it is strongly recommended to first generate an in silico-predicted library in a separate pipeline step and then use it to process the raw data, now without activating FASTA digest : 1\nWARNING: it is strongly recommended to keep the q-value threshold at 5% or below when generating a spectral library from DIA data. : 1\nWARNING: unrecognised option [--max-pep-length 30] : 1\nWARNING: unrecognised option [--min-pep-length 7] : 1\nFinished\n\n\nHow to cite:\nusing DIA-NN: Demichev et al, Nature Methods, 2020, https://www.nature.com/articles/s41592-019-0638-x\nanalysing Scanning SWATH: Messner et al, Nature Biotechnology, 2021, https://www.nature.com/articles/s41587-021-00860-4\nanalysing PTMs: Steger et al, Nature Communications, 2021, https://www.nature.com/articles/s41467-021-25454-1\nanalysing dia-PASEF: Demichev et al, Nature Communications, 2022, https://www.nature.com/articles/s41467-022-31492-0\nanalysing Slice-PASEF: Szyrwiel et al, biorxiv, 2022, https://doi.org/10.1101/2022.10.31.514544\nplexDIA / multiplexed DIA: Derks et al, Nature Biotechnology, 2023, https://www.nature.com/articles/s41587-022-01389-w\nCysQuant: Huang et al, Redox Biology, 2023, https://doi.org/10.1016/j.redox.2023.102908\nusing QuantUMS: Kistner at al, biorxiv, 2023, https://doi.org/10.1101/2023.06.20.545604\n[18:54] Log saved to ./report.log.txt\n","strategy":"first_available"},{"app_name":"diann_1.9.1","creation_date":1724832712,"id":55,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724831870,"id":54,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724826548,"id":53,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724162951,"id":52,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724162236,"id":51,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724161733,"id":50,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724146964,"id":49,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724144706,"id":48,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724142627,"id":47,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724059058,"id":42,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724058873,"id":41,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723642674,"id":40,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723641380,"id":38,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723634891,"id":37,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723628368,"id":36,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1723628095,"id":35,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719305222,"id":13,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719304365,"id":12,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719304164,"id":11,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719303768,"id":10,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719302382,"id":9,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719299947,"id":8,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719299670,"id":7,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719215713,"id":6,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719215455,"id":5,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719215415,"id":4,"owner":"Burel.Alexandre","status":"CANCELLED"}];
        return [data, ""];
    } else {
        // console.log(`getLastJobs(_, ${job_id}, ${number})`);
        const url = rest.getUrl("joblist", [job_id, number]);
        const [data, error] = await rest.sendGetRequest(url);
        // if(!error) console.log("getLastJobs: "+data);
        return [error ? data : JSON.parse(data), error];
    }
}

async function searchJobs(_, current_job_id, owner, app, file, desc, statuses, date, from, to, number) {
    log.info("Searching for jobs");
    if(DEMO_MODE) {
        const data = [{"app_name":"diann_1.9.1","creation_date":1724826548,"id":53,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724162951,"id":52,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724162236,"id":51,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724161733,"id":50,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724146964,"id":49,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1724144706,"id":48,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724059058,"id":42,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1724058873,"id":41,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723642674,"id":40,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723641380,"id":38,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723634891,"id":37,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"diann_1.9.1","creation_date":1723628368,"id":36,"owner":"Burel.Alexandre","status":"FAILED"},{"app_name":"diann_1.9.1","creation_date":1723628095,"id":35,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719305222,"id":13,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719304365,"id":12,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719304164,"id":11,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719303768,"id":10,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719302382,"id":9,"owner":"Burel.Alexandre","status":"CANCELLED"},{"app_name":"test","creation_date":1719299947,"id":8,"owner":"Burel.Alexandre","status":"DONE"},{"app_name":"test","creation_date":1719299670,"id":7,"owner":"Burel.Alexandre","status":"CANCELLED"}];
        return [data, ""];
    } else {
        const form = new FormData({ maxDataSize: 20971520 });
        form.append("current_job_id", current_job_id);
        form.append("owner", owner);
        form.append("app", app);
        form.append("file", file);
        form.append("description", desc);
        form.append("date", date);
        form.append("from", from);
        form.append("to", to);
        for(let status of statuses) {
            form.append(status.toLowerCase(), 1);
        }
        form.append("number", number);
        // send the request
        // const data = await rest.sendPostRequest(rest.getUrl("search"), form);
        const [data, error] = await rest.sendPostRequest(rest.getUrl("search"), form);
        // if(!error) console.log("searchJobs: "+data);
        return [error ? data : JSON.parse(data), error];
    }
}

async function transferProgress(_, owner, job_id) {
    if(DEMO_MODE) {
        const data = [{"File1": 93}, {"File2": 0}, {"File3": 0}, {"File4": 0}];
        return [data, ""];
    } else {
        const [data, error] = await rest.sendGetRequest(rest.getUrl("progress-rsync", [owner, job_id], true));
        // const [data, error] = await rest.sendGetRequest(rest.getUrl("test", [], true));
        // console.log("transferProgress: "+JSON.parse(data));
        return [JSON.parse(data), error];
    }
}

async function cancelJob(_, owner, job_id) {
    log.info(`Request by user '${owner}' to cancel job ${job_id}`);
    if(DEMO_MODE) {
        return [`Job ${job_id} has been cancelled`, ""];
    } else {
        // request the rsync agent to cancel the transfers corresponding to this job
        await rest.sendGetRequest(rest.getUrl("cancel-rsync", [owner, job_id], true));
        const url = rest.getUrl("cancel", [owner, job_id]);
        const [data, error] = await rest.sendGetRequest(url);
        // console.log("cancelJob: "+JSON.parse(data));
        return [data, error];
    }
}

async function deleteJob(_, owner, job_id) {
    log.info(`Request by user '${owner}' to delete job ${job_id}`);
    if(DEMO_MODE) {
        return [`Job ${job_id} has been deleted`, ""];
    } else {
        const url = rest.getUrl("delete", [owner, job_id]);
        const [data, error] = await rest.sendGetRequest(url);
        // console.log("deleteJob: "+JSON.parse(data));
        return [data, error];
    }
}

async function downloadFile(_, owner, job_id, file_name, target) {
    log.info(`Start downloading Job ${job_id}'s file '${file_name}'`);
    if(!DEMO_MODE) {
        const url = rest.getUrl("getresults", [owner, job_id, file_name]);
        await rest.download(url, target);
    }
}

module.exports = { cancelJob, checkRsyncAgent, checkServerVersion, createJob, deleteJob, downloadFile, getDiskUsage, getLastJobs, listApps, listHosts, listStorage, searchJobs, setDemoMode, transferProgress }
