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

function openDialog(dialog_id, title = "Title", message = "") {
    document.getElementById(dialog_id).getElementsByTagName("header")[0].textContent = title;
    document.getElementById(dialog_id).getElementsByTagName("label")[0].textContent = message;
    document.getElementById("dialogs").style.display = "block";
    document.getElementById(dialog_id).style.display = "block";
}

function isDialogOpen(dialog_id) {
    return document.getElementById(dialog_id).style.display == "block";
}

function closeDialog(dialog_id) {
    document.getElementById(dialog_id).getElementsByTagName("header")[0].textContent = "";
    document.getElementById(dialog_id).getElementsByTagName("label")[0].textContent = "";
    document.getElementById("dialogs").style.display = "none";
    document.getElementById(dialog_id).style.display = "none";
}

function openDialogInfo(title, message) { openDialog("dialog_info", title, message); }
function isDialogInfoOpen() { return isDialogOpen("dialog_info"); }
function closeDialogInfo() { closeDialog("dialog_info"); }

function openDialogQuestion(title, message, onYes, onYesLabel = "Yes", onYesArgs = undefined, onNo = undefined, onNoLabel = "No", onNoArgs = undefined) {
    // apply the Yes button
    document.getElementById("btn_dialq_1").textContent = onYesLabel;
    document.getElementById("btn_dialq_1").addEventListener("click", () => onYesArgs !== undefined ? onYes(onYesArgs) : onYes(), { once: true });
    // apply the No button
    document.getElementById("btn_dialq_2").textContent = onNoLabel;
    if(onNo !== undefined) {
        document.getElementById("btn_dialq_2").addEventListener("click", () => onNoArgs !== undefined ? onNo(onNoArgs) : onNo(), { once: true });
    } else {
        document.getElementById("btn_dialq_2").addEventListener("click", () => closeDialogQuestion());
    }
    openDialog("dialog_question", title, message);
}
function isDialogQuestionOpen() { return isDialogOpen("dialog_question"); }
function closeDialogQuestion() { closeDialog("dialog_question"); }

function openDialogWarning(title, message, action = undefined, label = "Close", args = undefined) {
    // apply the Close button
    document.getElementById("btn_dialw").textContent = label;
    if(action !== undefined) {
        document.getElementById("btn_dialw").addEventListener("click", () => args !== undefined ? action(args) : action(), { once: true });
    } else {
        document.getElementById("btn_dialw").addEventListener("click", () => closeDialogWarning());
    }
    openDialog("dialog_warning", title, message);
}
function isDialogWarningOpen() { return isDialogOpen("dialog_warning"); }
function closeDialogWarning() { closeDialog("dialog_warning"); }

// function displayErrorMessage(message, exitInsteadOfClose = false) {
//     if(exitInsteadOfClose == false) openDialogWarning("Error", message);
//     else openDialogWarning("Error", message, async () => await window.electronAPI.exitApp());
// }
function displayErrorMessage(title = "Connection error", error = "") {
    openDialogWarning(title, error, async () => await window.electronAPI.exitApp());
    document.getElementById("dialog_warning").getElementsByTagName("label")[0].innerHTML += "<br /><br />Warn the admin and restart later.";
}

export { closeDialogInfo, closeDialogQuestion, closeDialogWarning, displayErrorMessage, isDialogInfoOpen, isDialogQuestionOpen, isDialogWarningOpen, openDialogInfo, openDialogQuestion, openDialogWarning };
