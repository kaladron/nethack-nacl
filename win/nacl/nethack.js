// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

lib.rtdep('lib.f',
          'hterm');

// CSP means that we can't kick off the initialization from the html file,
// so we do it like this instead.
window.onload = function() {
  lib.ensureRuntimeDependencies();
  hterm.init(Nethack.init);
};

/**
 * The Nethack-powered terminal command.
 *
 * This class defines a command that can be run in an hterm.Terminal instance.
 * The Nethack command uses terminalPrivate extension API to create and use crosh
 * process on ChromeOS machine.
 *
 *
 * @param {Object} argv The argument object passed in from the Terminal.
 */
function Nethack(argv) {
  this.argv_ = argv;
  this.io = null;
};

var nethackEmbed;

/**
 * Prefix for text from the pipe mount.
 *
 * @private
 */
Nethack.prefix_ = 'JSPipeMount:1:';

/**
 * Static initialier called from crosh.html.
 *
 * This constructs a new Terminal instance and instructs it to run the Nethack
 * command.
 */
Nethack.init = function() {
  var profileName = lib.f.parseQuery(document.location.search)['profile'];
  var terminal = new hterm.Terminal(profileName);
  terminal.decorate(document.querySelector('#terminal'));

  // Useful for console debugging.
  window.term_ = terminal;

  // Looks like there is a race between this and terminal initialization, thus
  // adding timeout.
  setTimeout(function() {
      terminal.setAutoCarriageReturn(true);
      terminal.setCursorPosition(0, 0);
      terminal.setCursorVisible(true);
      terminal.runCommandClass(Nethack, document.location.hash.substr(1));
    }, 500);
  return true;
};

/**
 * Handle messages sent to us from NaCl.
 *
 * @private
 */
Nethack.prototype.handleMessage_ = function(e) {
  if (e.data.indexOf(Nethack.prefix_) != 0) return;
  var msg = e.data.substring(Nethack.prefix_.length);
  term_.io.print(msg);  
}

function got(str) {
  nethackEmbed.postMessage('JSPipeMount:0:' + str);
}

/**
 * Start the crosh command.
 *
 * This is invoked by the terminal as a result of terminal.runCommandClass().
 */
Nethack.prototype.run = function() {
  var worker = new Worker('initfs.js');
  worker.onmessage = this.startGame.bind(this);
  worker.postMessage(true);
};

Nethack.prototype.resize_ = function(width, height) {
  nethackEmbed.postMessage('WINCH:' + width + ':' + height);
}

Nethack.prototype.startGame = function(event) {
  this.io = this.argv_.io.push();

  // Create the object for Nethack.
  nethackEmbed = document.createElement('object');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.addEventListener('message', this.handleMessage_.bind(this));
  nethackEmbed.data = 'nethack.nmf';
  nethackEmbed.type = 'application/x-nacl';

  var param = document.createElement('param');
  param.name = 'windowtype';
  param.value = 'tty';
  nethackEmbed.appendChild(param);

  document.getElementById('listener').appendChild(nethackEmbed);

  this.io.onVTKeystroke = got;

  this.io.onTerminalResize = this.resize_.bind(this);

  return;
};

Nethack.prototype.onBeforeUnload_ = function(e) {
  var msg = 'Closing this tab will exit crosh.';
  e.returnValue = msg;
  return msg;
};

window.onbeforeunload = function() {
  return 'You will lose any unsaved progress!';
};
