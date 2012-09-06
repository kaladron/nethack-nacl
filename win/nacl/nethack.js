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
  this.pid_ = -1;
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
 * The name of this command used in messages to the user.
 *
 * Perhaps this will also be used by the user to invoke this command, if we
 * build a shell command.
 */
Nethack.prototype.commandName = 'crosh';

/**
 * Called when an event from the crosh process is detected.
 *
 * @param pid Process id of the process the event came from.
 * @param type Type of the event.
 *             'stdout': Process output detected.
 *             'exit': Process has exited.
 * @param text Text that was detected on process output.
**/
Nethack.prototype.onProcessOutput_ = function(pid, type, text) {
  if (this.pid_ == -1 || pid != this.pid_)
    return;

  if (type == 'exit') {
    this.exit(0);
    return;
  }
  this.io.print(text);
}

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
  // TODO(jeffbailey): 
  // Everything past this point is old code and should
  // be removed once things work.

  this.io.onVTKeystroke = this.sendString_.bind(this);
  this.io.sendString = this.sendString_.bind(this);

  var self = this;
  this.io.onTerminalResize = this.onTerminalResize_.bind(this);
  chrome.terminalPrivate.onProcessOutput.addListener(
      this.onProcessOutput_.bind(this));
  document.body.onunload = this.close_.bind(this);
  chrome.terminalPrivate.openTerminalProcess(this.commandName,
      function(pid) {
        if (pid == undefined || pid == -1) {
          self.io.println("Opening crosh process failed.");
          self.exit(1);
          return;
        }

        window.onbeforeunload = self.onBeforeUnload_.bind(self);
        self.pid_ = pid;

        if (!chrome.terminalPrivate.onTerminalResize) {
          console.warn("Terminal resizing not supported.");
          return;
        }

        // Setup initial window size.
        self.onTerminalResize_(self.io.terminal_.screenSize.width,
                               self.io.terminal_.screenSize.height);
      }
  );
};

Nethack.prototype.onBeforeUnload_ = function(e) {
  var msg = 'Closing this tab will exit crosh.';
  e.returnValue = msg;
  return msg;
};

/**
 * Send a string to the crosh process.
 *
 * @param {string} string The string to send.
 */
Nethack.prototype.sendString_ = function(string) {
  if (this.pid_ == -1)
    return;
  chrome.terminalPrivate.sendInput(this.pid_, string);
};

/**
 * Closes crosh terminal and exits the crosh command.
**/
Nethack.prototype.close_ = function() {
    if (this.pid_ == -1)
      return;
    chrome.terminalPrivate.closeTerminalProcess(this.pid_);
    this.pid_ = -1;
}

/**
 * Notify process about new terminal size.
 *
 * @param {string|integer} terminal width.
 * @param {string|integer} terminal height.
 */
Nethack.prototype.onTerminalResize_ = function(width, height) {
  if (this.pid_ == -1)
    return;

  // We don't want to break older versions of chrome.
  if (!chrome.terminalPrivate.onTerminalResize)
    return;

  chrome.terminalPrivate.onTerminalResize(this.pid_,
      Number(width), Number(height),
      function(success) {
        if (!success)
          console.warn("terminalPrivate.onTerminalResize failed");
      }
  );
};

/**
 * Exit the crosh command.
 */
Nethack.prototype.exit = function(code) {
  this.close_();
  this.io.pop();
  window.onbeforeunload = null;

  if (this.argv_.onExit)
    this.argv_.onExit(code);
};

