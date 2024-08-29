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

const INFO = document.getElementById("dialog_info");
const QUESTION = document.getElementById("dialog_question");
const WARNING = document.getElementById("dialog_warning");

const ICON_INFO = "img/info.png";
const ICON_QUESTION = "img/question.png";
const ICON_WARNING = "img/warning.png";
const ICON_SLEEP = "img/sleep.png";
const ICON_OFFLINE = "img/offline.png";

function initializeDialogs() {
    INFO.parentElement.addEventListener("click", closeDialogInfo());
    QUESTION.parentElement.addEventListener("click", closeDialogQuestion());
    WARNING.parentElement.addEventListener("click", closeDialogWarning());
}

function updateZIndex(dialog) {
    // make sure that the last open dialog is above the previous ones (if any)
    var nb = 10;
    if(isDialogInfoOpen() && parseInt(INFO.style.zIndex) >= nb) nb = parseInt(INFO.style.zIndex) + 1;
    if(isDialogQuestionOpen() && parseInt(QUESTION.style.zIndex) >= nb) nb = parseInt(QUESTION.style.zIndex) + 1;
    if(isDialogWarningOpen() && parseInt(WARNING.style.zIndex) >= nb) nb = parseInt(WARNING.style.zIndex) + 1;
    dialog.style.zIndex = nb;
    dialog.parentElement.style.zIndex = nb;
}

// TODO in the future, we may want to be able to open several dialogs of the same type
//      at the moment we only reuse the same dialog, so we loose the previous one in the process
//      to do so, we should create dynamically the dialogs with an id that increments automatically (with the z-index)
function openDialog(dialog, title = "Title", message = "", icon = "") {
    dialog.getElementsByTagName("header")[0].textContent = title;
    dialog.getElementsByTagName("label")[0].innerHTML = message;
    if(icon != "") dialog.getElementsByTagName("img")[0].src = icon;
    dialog.parentElement.style.display = "block";
    // dialog.style.display = "block";
    updateZIndex(dialog);
}

function isDialogOpen(dialog) {
    // return dialog.style.display == "block";
    return dialog.parentElement.style.display == "block";
}

function closeDialog(dialog) {
    dialog.getElementsByTagName("header")[0].textContent = "";
    dialog.getElementsByTagName("label")[0].textContent = "";
    dialog.parentElement.style.display = "none";
    // dialog.style.display = "none";
    updateZIndex(dialog);
}

function openDialogInfo(title, message, icon = ICON_INFO) {
    openDialog(INFO, title, message, icon);
}
function openDialogSleep() {
    openDialog(INFO, "Sleep mode", "Cumulus is in sleep mode and will be refreshed less often, but do not worry your jobs are still running!", ICON_SLEEP);
}
function isDialogInfoOpen() { return isDialogOpen(INFO); }
function closeDialogInfo() {
    closeDialog(INFO);
}

function openDialogQuestion(title, message, onYes, onYesLabel = "Yes", onYesArgs = undefined, onNo = undefined, onNoLabel = "No", onNoArgs = undefined, icon = ICON_QUESTION) {
    // apply the Yes button
    document.getElementById("btn_dialq_1").textContent = onYesLabel;
    document.getElementById("btn_dialq_1").addEventListener("click", () => onYesArgs !== undefined ? onYes(onYesArgs) : onYes(), { once: true }); // once = true, so the listener will disappear after being used once
    // apply the No button
    document.getElementById("btn_dialq_2").textContent = onNoLabel;
    if(onNo !== undefined) {
        document.getElementById("btn_dialq_2").addEventListener("click", () => onNoArgs !== undefined ? onNo(onNoArgs) : onNo(), { once: true });
    } else {
        document.getElementById("btn_dialq_2").addEventListener("click", () => closeDialogQuestion());
    }
    // document.getElementById("dialogs").removeEventListener("click");
    openDialog(QUESTION, title, message, icon);
}
function isDialogQuestionOpen() { return isDialogOpen(QUESTION); }
function closeDialogQuestion() { closeDialog(QUESTION); }

function openDialogWarning(title, message, action = undefined, label = "Close", args = undefined, icon = ICON_WARNING) {
    // apply the Close button
    document.getElementById("btn_dialw").textContent = label;
    if(action !== undefined) {
        document.getElementById("btn_dialw").addEventListener("click", () => args !== undefined ? action(args) : action(), { once: true });
    } else {
        document.getElementById("btn_dialw").addEventListener("click", () => closeDialogWarning());
    }
    openDialog(WARNING, title, message, icon);
}
function isDialogWarningOpen() { return isDialogOpen(WARNING); }
function closeDialogWarning() { closeDialog(WARNING); }

function displayErrorMessage(title = "Connection error", error = "") {
    openDialogWarning(title, error, async () => await window.electronAPI.exitApp());
    document.getElementById(WARNING).getElementsByTagName("label")[0].innerHTML += "<br /><br />Warn the admin and restart later.";
}

function isDialogOfflineOpen() { return isDialogQuestionOpen() && QUESTION.getElementsByTagName("img")[0].src.endsWith(ICON_OFFLINE);  }

export { closeDialogInfo, closeDialogQuestion, closeDialogWarning, displayErrorMessage, ICON_INFO, ICON_OFFLINE, ICON_QUESTION, ICON_SLEEP, ICON_WARNING, initializeDialogs, isDialogInfoOpen, isDialogOfflineOpen, isDialogQuestionOpen, isDialogWarningOpen, openDialogInfo, openDialogQuestion, openDialogSleep, openDialogWarning };
