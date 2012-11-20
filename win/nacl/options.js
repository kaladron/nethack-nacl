"use strict";

function receiveNethackRc(evt) {
  document.getElementById('nethackrc').value = evt.data;
}

function saveNethackRc(evt) {
  worker.postMessage(['put', document.getElementById('nethackrc').value]);
}

var worker = new Worker('optionsfs.js');
worker.onmessage = receiveNethackRc;
worker.postMessage(['get']);

document.getElementById('save').addEventListener('click', saveNethackRc);
