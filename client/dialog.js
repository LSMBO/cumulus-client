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

function openDialogInfo(message) {
    const cloud = document.getElementById("cloud_info");
    cloud.getElementsByTagName("label")[0].textContent = message;
    cloud.style.display = "block";
}

function openDialogQuestion(message, onYes, onYesLabel = "Yes", onYesArgs = undefined, onNo = undefined, onNoLabel = "No", onNoArgs = undefined) {
    const cloud = document.getElementById("cloud_question");
    cloud.getElementsByTagName("label")[0].textContent = message;
    // apply the Yes button
    document.getElementById("btn_cloudq_1").textContent = onYesLabel;
    document.getElementById("btn_cloudq_1").addEventListener("click", () => onYesArgs !== undefined ? onYes(onYesArgs) : onYes(), { once: true });
    // apply the No button
    document.getElementById("btn_cloudq_2").textContent = onNoLabel;
    if(onNo !== undefined) {
        document.getElementById("btn_cloudq_2").addEventListener("click", () => onNoArgs !== undefined ? onNo(onNoArgs) : onNo(), { once: true });
    } else {
        document.getElementById("btn_cloudq_2").addEventListener("click", () => closeDialogQuestion());
    }
    cloud.style.display = "block";
}

function closeDialogQuestion() {
    document.getElementById("cloud_question").style.display = "none";
}

function openDialogWarning(message, action = undefined, label = "Close", args = undefined) {
    const cloud = document.getElementById("cloud_warning");
    cloud.getElementsByTagName("label")[0].textContent = message;
    // apply the Close button
    document.getElementById("btn_cloudw").textContent = label;
    if(action !== undefined) {
        document.getElementById("btn_cloudw").addEventListener("click", () => args !== undefined ? action(args) : action(), { once: true });
    } else {
        document.getElementById("btn_cloudw").addEventListener("click", () => closeDialogWarning());
    }
    cloud.style.display = "block";
}

function closeDialogWarning() {
    document.getElementById("cloud_warning").style.display = "none";
}

function displayErrorMessage(message, exitInsteadOfClose = false) {
    if(exitInsteadOfClose == false) openDialogWarning(message);
    else openDialogWarning(message, async () => await window.electronAPI.exitApp());
}

export { closeDialogQuestion, closeDialogWarning, displayErrorMessage, openDialogInfo, openDialogQuestion, openDialogWarning };
