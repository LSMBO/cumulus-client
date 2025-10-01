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

import * as utils from "./utils.js";

const PARENT = document.getElementById("dialogs");
var ID = 0;
const ICON_INFO = "img/info.png";
const ICON_QUESTION = "img/question.png";
const ICON_WARNING = "img/warning.png";
const ICON_SLEEP = "img/sleep.png";
const ICON_OFFLINE = "img/offline.png";
var SLEEP_INTERVAL = undefined; // interval to update the sleep dialog

function createDialog(title, message, icon, value = "", placeholder = "") {
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
    if(value != "") dialog.innerHTML += `<input class="w3-input" type="text" value="${value}" placeholder="${placeholder}"/>`;
    dialog.style.zIndex = 10 + ID;
    dialog.style.display = "block";
    if(PARENT.childElementCount == 0) PARENT.classList.remove("w3-hide");
    return dialog;
}

// function createDialogInput(title, message, icon, value = "", placeholder = "") {
//     if(ID == 0) {
//         // initialize the event listener on the parent
//         PARENT.addEventListener("click", (e) => {
//             // do not close the last dialog if the click was on the button of another dialog
//             if(e.target.tagName != "BUTTON") closeLastDialogIf([ICON_INFO, ICON_SLEEP]);
//         });
//         ID++;
//     }
//     const dialog = document.createElement("div");
//     dialog.id = `dialog_${ID++}`;
//     dialog.className = "w3-modal-content dialog";
//     dialog.innerHTML = `<img src="${icon}"/><header>${title}</header><label>${message.replace(/\\n/g, "<br/>")}</label><input class="w3-input" type="text" value="${value}" placeholder="${placeholder}"/>`;
//     dialog.style.zIndex = 10 + ID;
//     dialog.style.display = "block";
//     if(PARENT.childElementCount == 0) PARENT.classList.remove("w3-hide");
//     return dialog;
// }

function createDialogInfo(title, message) {
    PARENT.appendChild(createDialog(title, message, ICON_INFO));
}

function createDialogSleep(time_left_in_seconds) {
    // do not create the dialog if a sleep dialog is already open
    if(isDialogOpen(ICON_SLEEP)) return;
    // create a sleep dialog
    const dialog = createDialog("Sleep mode", `Cumulus is in sleep mode. Next refresh will be in ${time_left_in_seconds} seconds`, ICON_SLEEP);
    // add a countdown to the dialog
    var countdown = time_left_in_seconds - 1;
    clearInterval(SLEEP_INTERVAL); // clear the previous interval if it exists
    SLEEP_INTERVAL = setInterval(() => {
        dialog.getElementsByTagName("label")[0].innerHTML = `Cumulus is in sleep mode. Next refresh will be in ${countdown} seconds`;
        countdown--; // decrement the countdown but not below 0
        if(countdown == 0) countdown = time_left_in_seconds; // reset the countdown to the original value
    }, 1000); // every second
    // add the dialog to the parent
    PARENT.appendChild(dialog);
}

function closeDialog(id) {
    PARENT.removeChild(document.getElementById(id));
    // remove the visibility of the cover
    if(PARENT.childElementCount == 0) PARENT.classList.add("w3-hide");
    utils.setActive(true);
}

function getLastDialog() {
    if(PARENT.childElementCount > 0) {
        return PARENT.childNodes[PARENT.childElementCount - 1];
    } else {
        return undefined;
    }
}

function closeLastDialogIf(icons) {
    // if(PARENT.childElementCount > 0) {
    const lastDialog = getLastDialog();
    if(lastDialog !== undefined) {
        // const lastDialog = PARENT.childNodes[PARENT.childElementCount - 1];
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

function createDialogOffline(title, message, onRetry = undefined) {
    if(onRetry != undefined) {
        createDialogQuestion(title, message, onRetry, "Retry", undefined, async () => await window.electronAPI.exitApp(), "Quit", undefined, ICON_OFFLINE);
    } else {
        createDialogWarning(title, message);
    }
}

function createDialogWarning(title, message, action = undefined, label = "Close", args = undefined) {
    const dialog = createDialog(title, message, ICON_WARNING);
    dialog.innerHTML += `<div class="w3-bar"><button class="w3-bar-item w3-button color-primary-border">${label}</button></div>`
    if(action === undefined) dialog.getElementsByTagName("button")[0].addEventListener("click", () => closeDialog(dialog.id), { once: true });
    else dialog.getElementsByTagName("button")[0].addEventListener("click", () => { closeDialog(dialog.id); args !== undefined ? action(args) : action(); }, { once: true });
    PARENT.appendChild(dialog);
}

// specific dialog that can be displayed at the beginning of the app, if the server cannot be reached
function createDialogForBootCheck(title, message, value = "", onRetryBeforeClosingDialog, onRetryAfterClosingDialog) {
    const dialog = createDialog(title, message, ICON_WARNING, value, "Cumulus Server address");
    dialog.innerHTML += `<div class="w3-bar"><button class="w3-bar-item w3-button color-primary-border">Quit</button><button class="w3-bar-item w3-button color-accent">Retry</button></div>`
    const buttons = dialog.getElementsByTagName("button");
    buttons[0].addEventListener("click", async () => { closeDialog(dialog.id); await window.electronAPI.exitApp(); } , { once: true });
    buttons[1].addEventListener("click", async () => { onRetryBeforeClosingDialog(); closeDialog(dialog.id); onRetryAfterClosingDialog(); } , { once: true });
    PARENT.appendChild(dialog);
}

function isDialogOpen(icon) {
    for(let dialog of PARENT.childNodes) {
        if(dialog.getElementsByTagName("img")[0].src.endsWith(icon)) return true;
    }
    return false;
}
function isDialogOfflineOpen() { return isDialogOpen(ICON_OFFLINE); }

export { createDialogForBootCheck, createDialogInfo, createDialogQuestion, createDialogSleep, createDialogWarning, createDialogOffline, getLastDialog, isDialogOfflineOpen };
