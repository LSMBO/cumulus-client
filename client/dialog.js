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

const PARENT = document.getElementById("dialogs");
var ID = 0;
const ICON_INFO = "img/info.png";
const ICON_QUESTION = "img/question.png";
const ICON_WARNING = "img/warning.png";
const ICON_SLEEP = "img/sleep.png";
const ICON_OFFLINE = "img/offline.png";

function createDialog(title, message, icon) {
    if(ID == 0) {
        // initialize the event listener on the parent
        PARENT.addEventListener("click", (e) => {
            // do not close the last dialog if the click was on the button of another dialog
            if(e.target.tagName != "BUTTON") closeLastDialogIf([ICON_INFO, ICON_SLEEP]);
        });
        ID++;
    }
    const dialog = document.createElement("div");
    dialog.id = `dialog_${ID++}`;
    dialog.className = "w3-modal-content dialog";
    dialog.innerHTML = `<img src="${icon}"/><header>${title}</header><label>${message.replace(/\\n/g, "<br/>")}</label>`;
    dialog.style.zIndex = 10 + ID;
    dialog.style.display = "block";
    if(PARENT.childElementCount == 0) PARENT.classList.remove("w3-hide");
    return dialog;
}

function createDialogInfo(title, message) {
    PARENT.appendChild(createDialog(title, message, ICON_INFO));
}
function createDialogSleep() {
    PARENT.appendChild(createDialog("Sleep mode", "Cumulus is in sleep mode and will be refreshed less often, but do not worry your jobs are still running!", ICON_SLEEP));
}

function closeDialog(id) {
    PARENT.removeChild(document.getElementById(id));
    // remove the visibility of the cover
    if(PARENT.childElementCount == 0) PARENT.classList.add("w3-hide");
}

function closeLastDialogIf(icons) {
    if(PARENT.childElementCount > 0) {
        const lastDialog = PARENT.childNodes[PARENT.childElementCount - 1];
        const lastIcon = lastDialog.getElementsByTagName("img")[0].src;
        var isExpectedIcon = false;
        for(let icon of icons) {
            if(lastIcon.endsWith(icon)) isExpectedIcon = true;
        }
        if(isExpectedIcon) closeDialog(lastDialog.id);
    }
}

function createDialogQuestion(title, message, onYes, onYesLabel = "Yes", onYesArgs = undefined, onNo = undefined, onNoLabel = "No", onNoArgs = undefined) {
    const dialog = createDialog(title, message, ICON_QUESTION);
    dialog.innerHTML += `<div class="w3-bar"><button class="w3-bar-item w3-button color-primary-border">${onNoLabel}</button><button class="w3-bar-item w3-button color-accent">${onYesLabel}</button></div>`
    const buttons = dialog.getElementsByTagName("button");
    if(onNo === undefined) buttons[0].addEventListener("click", () => closeDialog(dialog.id), { once: true }); // once = true, so the listener will disappear after being used once
    else buttons[0].addEventListener("click", () => { closeDialog(dialog.id); onNoArgs !== undefined ? onNo(onNoArgs) : onNo(); } , { once: true });
    if(onYes === undefined) buttons[1].addEventListener("click", () => closeDialog(dialog.id), { once: true });
    else buttons[1].addEventListener("click", () => { closeDialog(dialog.id); onYesArgs !== undefined ? onYes(onYesArgs) : onYes(); }, { once: true });
    PARENT.appendChild(dialog);
}
function createDialogOffline(errorServer, errorRsync, onRetry) {
    errorMessage = errorServer ? errorServer : errorRsync;
    createDialogQuestion("Cumulus is disconnected!", `Cumulus has lost the connection with the ${errorServer ? "server" : "RSync agent"} with the following error:<br/>${errorMessage}<br/><br/>Please contact your administrator.`, onRetry, "Retry", undefined, async () => await window.electronAPI.exitApp(), "Quit", undefined, ICON_OFFLINE);
}

function createDialogWarning(title, message, action = undefined, label = "Close", args = undefined) {
    const dialog = createDialog(title, message, ICON_WARNING);
    dialog.innerHTML += `<div class="w3-bar"><button class="w3-bar-item w3-button color-primary-border">${label}</button></div>`
    if(action === undefined) dialog.getElementsByTagName("button")[0].addEventListener("click", () => closeDialog(dialog.id), { once: true });
    else dialog.getElementsByTagName("button")[0].addEventListener("click", () => { closeDialog(dialog.id); args !== undefined ? action(args) : action(); }, { once: true });
    PARENT.appendChild(dialog);
}

function isDialogOpen(icon) {
    for(let dialog of PARENT.childNodes) {
        if(dialog.getElementsByTagName("img").src.endsWith(icon)) return true;
    }
    return false;
}
function isDialogOfflineOpen() { return isDialogOpen(ICON_OFFLINE); }

export {createDialogInfo, createDialogQuestion, createDialogSleep, createDialogWarning, createDialogOffline, isDialogOfflineOpen };
