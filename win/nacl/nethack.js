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

// TILE stuff

var NaclMsg = {};
NaclMsg.INIT_NHWINDOWS = 0;
NaclMsg.PLAYER_SELECTION = 1;
NaclMsg.ASKNAME = 2;
NaclMsg.GET_NH_EVENT = 3;
NaclMsg.EXIT_NHWINDOWS = 4;
NaclMsg.SUSPEND_NHWINDOWS = 5;
NaclMsg.RESUME_NHWINDOWS = 6;
NaclMsg.CREATE_NHWINDOW = 7;
NaclMsg.CREATE_NHWINDOW_BY_ID = 8;
NaclMsg.CLEAR_NHWINDOW = 9;
NaclMsg.DISPLAY_NHWINDOW = 10;
NaclMsg.DESTROY_NHWINDOW = 11;
NaclMsg.CURS = 12;
NaclMsg.PUTSTR = 13;
NaclMsg.DISPLAY_FILE = 14;
NaclMsg.START_MENU = 15;
NaclMsg.ADD_MENU = 16;
NaclMsg.END_MENU = 17;
NaclMsg.SELECT_MENU = 18;
NaclMsg.UPDATE_INVENTORY = 19;
NaclMsg.MARK_SYNCH = 20;
NaclMsg.WAIT_SYNCH = 21;
NaclMsg.CLIPAROUND = 22;
NaclMsg.CLIPAROUND_PROPER = 23;
NaclMsg.PRINT_GLYPH = 24;
NaclMsg.RAW_PRINT = 25;
NaclMsg.RAW_PRINT_BOLD = 26;
NaclMsg.NHGETCH = 27;
NaclMsg.NH_POSKEY = 28;
NaclMsg.NHBELL = 29;
NaclMsg.DOPREV_MESSAGE = 30;
NaclMsg.YN_FUNCTION = 31;
NaclMsg.GETLIN = 32;
NaclMsg.GET_EXT_CMD = 33;
NaclMsg.NUMBER_PAD = 34;
NaclMsg.DELAY_OUTPUT = 35;
NaclMsg.START_SCREEN = 36;
NaclMsg.END_SCREEN = 37;
NaclMsg.OUTRIP = 38;
NaclMsg.DELETE_NHWINDOW_BY_REFERENCE = 39;
NaclMsg.UPDATE_STATS = 40;

var NHWin = {};
NHWin.MESSAGE = 1;
NHWin.STATUS = 2;
NHWin.MAP = 3;
NHWin.MENU = 4;
NHWin.TEXT = 5;

// Nethack code has this as \033, but ES5 strict disallows octal literals.
var CANCEL_STR = "\x1B";

var HEIGHT = 24;
var WIDTH = 80;
var DISPLAY_SQUARE = 16;
var TILES_PER_ROW = 40;
var TILE_SQUARE = 16;

var MAX_SCROLL_LINES = 2000;

var glyphTable;

var gameCtx;
var inventoryCtx;
var tiles;
var petmark;

var panel;

var hp;
var maxhp;

var firstTime = true;
var attributeCache = {};

var FileWindow = function(file) {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.tabIndex = -1;
  this.menu_win.className = 'tile-dialog';

  var pre = document.createElement('pre');

  this.panel = document.createElement('x-panel');
  this.panel.rel = file;
  pre.appendChild(this.panel);
  // TODO(jeffbailey): This is a hack to work around a bug in x-tags
  // Where the element doesn't load when placed into the dom,
  // but does when src changes later.
  setTimeout(this.test.bind(this), 0);
  this.menu_win.appendChild(pre);

  this.button = document.createElement('button');
  this.button.textContent = 'OK';
  this.button.addEventListener('click', this.okButtonAction.bind(this));
  this.menu_win.appendChild(this.button);

  this.overlay = document.createElement('x-overlay');
};

FileWindow.prototype.test = function(evt) {
  this.panel.src = this.panel.rel;
};

FileWindow.prototype.display = function(block) {
  document.body.appendChild(this.overlay);
  document.body.appendChild(this.menu_win);
  this.button.focus();
};

FileWindow.prototype.okButtonAction = function() {
  this.close();
};

FileWindow.prototype.close = function() {
  document.body.removeChild(this.menu_win);
  document.body.removeChild(this.overlay);
  gameScreen.focus();
};

/**
 * DisplayWindow is made up of an outer modal dialog,
 * On the inside has:
 *  a variable-width header (h1 tag)
 *  a div that will take up no more than 80% of the height of the screen
 *    a monospace pre to append to
 *    a table for menu
 *  a collection of buttons.
 *
 * This is done so that the content has scroll bars as needed, but the heading
 * and the buttons stay on the screen.  This also means that it's safe to
 * call all the *_MENU set of commands on any window, or to call putstr.
 * since empty elements collapse flat.
 */
var DisplayWindow = function() {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.tabIndex = -1;
  this.menu_win.className = 'tile-dialog';

  this.titleDiv = document.createElement('div');
  this.menu_win.appendChild(this.titleDiv);

  this.scrollArea = document.createElement('div');
  this.scrollArea.className = 'tile-scrollarea';

  this.content = null;

  this.menu_win.appendChild(this.scrollArea);

  this.buttonBox = document.createElement('div');
  this.buttonBox.className = 'tile-win-buttonbox';
  this.menu_win.appendChild(this.buttonBox);

  this.button = document.createElement('button');
  this.button.textContent = 'OK';
  this.button.addEventListener('click', this.okButton.bind(this));
  this.buttonBox.appendChild(this.button);

  this.block = false;
  this.overlay = document.createElement('x-overlay');

  this.selectedRows = [];
  this.seenAccel = false;

  this.playerSelection = false;
};

DisplayWindow.prototype.setPlayerSelection = function() {
  this.playerSelection = true;
};

DisplayWindow.prototype.displayRandomButton = function() {
  var button = document.createElement('button');
  button.textContent = 'Random';
  button.addEventListener('click', this.handleRandomButton.bind(this));
  this.buttonBox.appendChild(button);
};

DisplayWindow.prototype.handleRandomButton = function() {
  pm('-2');
  this.close();
};

DisplayWindow.prototype.display = function(block) {
  document.body.appendChild(this.overlay);
  document.body.appendChild(this.menu_win);
  if (block == 1) {
    this.block = true;
  }
  this.button.focus();
};

DisplayWindow.prototype.handleCancelButton = function() {
  pm('-1');
  this.close();
};

DisplayWindow.prototype.okButton = function() {
  if (this.block) {

    var selected = document.querySelectorAll('.tile-menutable-selected');
 
    if (selected.length == 0) { 
      pm('0');
    } else {
      var pmList = [];
      if (this.playerSelection == false) {
        pmList.push(selected.length + '');
      }
      for (var i = 0; i < selected.length; i++) {
        pmList.push(selected[i].dataset.identifier);
      }
      pm(pmList.join(' '));
    }
    this.block = false;
  }
  this.close();
};

DisplayWindow.prototype.putStr = function(text) {
  if (this.content == null) {
    this.content = document.createElement('pre');
    this.scrollArea.appendChild(this.content);
  }

  var text = document.createTextNode(text + '\n');
  this.content.appendChild(text);
};

DisplayWindow.prototype.close = function() {
  document.body.removeChild(this.menu_win);
  document.body.removeChild(this.overlay);
};

DisplayWindow.prototype.addMenu = function(msg) {
  if (this.content == null) {
    this.content = document.createElement('table');
    this.content.className = 'tile-menutable';
    this.scrollArea.appendChild(this.content);
  }

  var cellType = 'td';
  if (msg[2] == 0 && msg[3] == 0 && msg[6] == 7) {
    cellType = 'th';
  }

  var row = document.createElement('tr');
  if (msg[3] != 0) {
    row.dataset.identifier = msg[3];
  }
   
  var picture = document.createElement(cellType);
  // TODO(jeffbailey): This should be NO_GLYPH, except that the code
  // is sending us 0, and we don't know NO_GLYPH from here yet.
  if (msg[2] != 0) {
    var tile = msg[2];
    var div = document.createElement('div');
    div.className = 'tile-menuwin-img';
    var tile_x = -(tile % TILES_PER_ROW) * TILE_SQUARE;
    var tile_y = -(Math.floor(tile / TILES_PER_ROW)) * TILE_SQUARE;
    div.style.backgroundPosition = tile_x + "px " + tile_y + "px";
    picture.appendChild(div);
  }
  row.appendChild(picture);

  var item = document.createElement(cellType);
  item.textContent = msg[7];
  item.className = 'tile-fixedwidth';
  row.appendChild(item);

  if (msg[4] != 0) {
    this.addAccel(row, msg[4]);
  }

  this.content.appendChild(row);
};

DisplayWindow.prototype.addAccel = function(row, accel) {
  this.seenAccel = true;
  row.dataset.accelerator = accel;
  var oldText = row.lastChild.textContent;
  var newText = String.fromCharCode(accel);
  newText += " - "
  newText += oldText;
  row.lastChild.textContent = newText;
};

DisplayWindow.prototype.setPrompt = function(text) {
  if (text == "") return;
  var h1 = document.createElement('h1');
  h1.textContent = text;
  this.titleDiv.appendChild(h1);
};

DisplayWindow.prototype.selectMenu = function(how) {
  var PICK_NONE = 0;     /* user picks nothing (display only) */
  var PICK_ONE = 1;      /* only pick one */
  var PICK_ANY = 2;      /* can pick any amount */
  this.block = 1; // Ensure that response is sent.
  this.display(0);

  this.how = how;

  if (how == PICK_NONE) return;

  if (this.seenAccel == false) {
    var rows = document.querySelectorAll('tr[data-identifier]');
    for (var i=0, accel = 97; i < rows.length; i++, accel++) {
      this.addAccel(rows[i], accel);
    }
  }

  if (this.playerSelection == false) {
    var button = document.createElement('button');
    button.textContent = 'Cancel';
    button.addEventListener('click', this.handleCancelButton.bind(this));
    this.buttonBox.appendChild(button);
  }

  var row = this.content.children;

  for (var i = 0; i < row.length; i++) {
    row[i].addEventListener('click', this.handleSelect.bind(this));
  }

  this.menu_win.addEventListener('keypress', this.keyPress.bind(this));
};

var ROWSELECT = {
  'select': 1,
  'deselect': 2,
  'toggle': 3
};

DisplayWindow.prototype.keyPress = function(evt) {
  // Ignore enter key
  if (evt.which == 13) return;

  var selector;
  var method;
  if (evt.which == 44 && this.how == 2) {
    selector = 'tr[data-identifier]';
    method = ROWSELECT.select;
  } else if (evt.which == 45 && this.how == 2) {
    selector = 'tr[data-identifier]';
    method = ROWSELECT.deselect;
  } else {
    selector = 'tr[data-accelerator="' + evt.which + '"]';
    method = ROWSELECT.toggle;
  }

  var rows = document.querySelectorAll(selector);

  for (var i = 0; i < rows.length; i++) {
    this.rowSelect(rows[i], method);
  }
};

DisplayWindow.prototype.handleSelect = function(evt) {
  // TODO(jeffbailey): Allow enter key to work after selecting.
  // Disabled because it causes a scroll on long windows.
  //this.button.focus();

  if (evt.currentTarget.dataset.identifier == undefined) return;

  this.rowSelect(evt.currentTarget, ROWSELECT.toggle);
}

DisplayWindow.prototype.rowSelect = function(element, method) {
  // TODO(jeffbailey): Remove magic constants in this function!
  if (this.how == 2) {
    switch(method) {
    case ROWSELECT.toggle:
      element.classList.toggle('tile-menutable-selected');
      break;
    case ROWSELECT.select:
      element.classList.add('tile-menutable-selected');
      break;
    case ROWSELECT.deselect:
      element.classList.remove('tile-menutable-selected');
      break;
    }
    return;
  }

  // Only one at a time allowed to be selected.
  var old = document.querySelector('.tile-menutable-selected');
  if (old != null) {
    old.classList.remove('tile-menutable-selected');
  }

  element.classList.add('tile-menutable-selected');
};

var ChoiceWindow = function(content, options, def) {
  this.options = options;
  this.def = def;

  this.win = document.createElement('x-modal');
  this.win.tabIndex = -1;
  this.win.className = 'tile-dialog';
  this.win.addEventListener('keypress', this.keyPress.bind(this));
  this.win.addEventListener('keydown', this.keyDown.bind(this));

  var caption = document.createElement('div');
  caption.textContent = content;
  this.win.appendChild(caption);

  this.cancelButton = document.createElement('button');
  this.cancelButton.textContent = 'Cancel';
  this.cancelButton.style.float = 'right';

  if (options.indexOf('q') != -1) {
    this.cancelButton.dataset.action = L('q');
  } else if (options.indexOf('n') != -1) {
    this.cancelButton.dataset.action = L('n');
  } else {
    this.cancelButton.dataset.action == def;
  }

  if (this.cancelButton.dataset.action != undefined) {
    this.cancelButton.addEventListener('click', this.buttonAction.bind(this));
    this.focus = this.cancelButton;
  }

  for (var i = 0; i < options.length; i++) {
    var button = document.createElement('button');
    button.textContent = options[i];
    button.dataset.action = options.charCodeAt(i);
    button.addEventListener('click', this.buttonAction.bind(this));
    this.win.appendChild(button);
    if (options.charCodeAt(i) == def || this.focus == undefined) {
      this.focus = button;
    }
  }

  if (this.cancelButton.dataset.action != undefined) {
    this.win.appendChild(this.cancelButton);
  }

  this.overlay = document.createElement('x-overlay');
};

ChoiceWindow.prototype.buttonAction = function(evt) {
  pm(evt.target.dataset.action);
  this.close();
};

ChoiceWindow.prototype.close = function() {
  document.body.removeChild(this.win);
  document.body.removeChild(this.overlay);
};

ChoiceWindow.prototype.display = function(block) {
  document.body.appendChild(this.win);
  document.body.appendChild(this.overlay);
  this.focus.focus();
};

ChoiceWindow.prototype.keyDown = function(evt) {
  if (evt.which == 27) {
    pm(this.cancelButton.dataset.action);
    this.close();
  }
};

ChoiceWindow.prototype.keyPress = function(evt) {
  if (this.options.indexOf(String.fromCharCode(evt.which)) != -1) {
    pm(evt.which);
    this.close();
  }
};

/**
 * displayCancel is optional.
 */
var InputWindow = function(content, callback, displayCancel) {
  if (displayCancel === undefined) displayCancel = true;

  this.callback = callback;
  this.win = document.createElement('x-modal');
  this.win.tabIndex = -1;
  this.win.className = 'tile-dialog';
  
  var caption = document.createElement('div');
  caption.textContent = content;
  this.win.appendChild(caption);

  this.inputBox = document.createElement('input');
  this.inputBox.addEventListener('keypress', this.enterKeyWatch.bind(this));

  this.win.appendChild(this.inputBox); 

  var okButton = document.createElement('button');
  okButton.type = 'button';
  okButton.textContent = 'OK';
  okButton.addEventListener('click', this.okButtonAction.bind(this));
  this.win.appendChild(okButton);

  if (displayCancel) {
    var cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', this.cancelButtonAction.bind(this));
    this.win.appendChild(cancelButton);
  }

  this.overlay = document.createElement('x-overlay');
};

InputWindow.prototype.enterKeyWatch = function(evt) {
  if (evt.which == 13) {
    this.okButtonAction();
  }
};

InputWindow.prototype.display = function(block) {
  document.body.appendChild(this.win);
  document.body.appendChild(this.overlay);
  this.inputBox.focus();
};

InputWindow.prototype.okButtonAction = function() {
  if (this.inputBox.value == '') return;
  this.callback(this.inputBox.value);
  this.close();
};

InputWindow.prototype.cancelButtonAction = function() {
  this.callback(CANCEL_STR);
  this.close();
};

InputWindow.prototype.close = function() {
  document.body.removeChild(this.win);
  document.body.removeChild(this.overlay);
};


var ExtCmdWindow = function(msg) {
  this.win = document.createElement('x-modal');
  this.win.tabIndex = -1;
  this.win.className = 'tile-dialog';
  
  var caption = document.createElement('div');
  caption.textContent = "Extended Commands";
  this.win.appendChild(caption);

  this.filterText = "";
  this.buttons = new Array();

  // Start at 1 to skip the message name
  for (var i = 1; i < msg.length; i++) {
    var div = document.createElement('div');
    var button = document.createElement('button');
    button.dataset.index = (i-1)/2;
    button.textContent = msg[i];
    button.addEventListener('click', this.buttonAction.bind(this));
    // Keep this last because of the increment
    button.title = msg[++i];
    button.className = 'tile-extcmdbutton';
    this.buttons.push(button);
    div.appendChild(button);
    this.win.appendChild(div);
  }

  this.cancelButton = document.createElement('button');
  this.cancelButton.textContent = 'Cancel';
  this.cancelButton.addEventListener('click', this.cancelButtonAction.bind(this));
  this.win.appendChild(this.cancelButton);
  this.win.addEventListener('keypress', this.filterKeypressAction.bind(this));
  this.overlay = document.createElement('x-overlay');
};

ExtCmdWindow.prototype.buttonAction = function(evt) {
  pm(evt.target.dataset.index);
  this.close();
};

ExtCmdWindow.prototype.display = function(block) {
  document.body.appendChild(this.overlay);
  document.body.appendChild(this.win);
  this.cancelButton.focus();
};

ExtCmdWindow.prototype.cancelButtonAction = function() {
  pm('-1');
  this.close();
};

ExtCmdWindow.prototype.filterKeypressAction = function(evt) {
  var c = String.fromCharCode(evt.which);
  if (c < 'A' || c > 'z' || c > 'Z' && c < 'a')
    return;

  this.filterText += c;
  var filter = this.filterText.toLowerCase();

  // Filter out buttons by letters being typed.
  var numVisible = 0;
  var lastVisible;
  for (var i = 0; i < this.buttons.length; ++i) {
    var button = this.buttons[i]
    if (button.textContent.substr(0, filter.length).toLowerCase() != filter) {
      button.style.display = "None";
      continue;
    }
    numVisible += 1;
    lastVisible = button;
  }

  if (numVisible == 0) {
    this.cancelButtonAction();
  }

  if (numVisible != 1)
    return;

  pm(lastVisible.dataset.index);
  this.close();
}

ExtCmdWindow.prototype.close = function() {
  document.body.removeChild(this.win);
  document.body.removeChild(this.overlay);
};


var eventBuffer = new Array();

var awaitingInput = false;

var handleKeyDown = function(evt) {
  var cmdKey = 0;

  if (evt.which < 32) return;

  switch (evt.which) {
  case 37: // left Arrow
    cmdKey = 104; // h
    break;
  case 39: // Right
    cmdKey = 108; // l
    break;
  case 38: // Up
    cmdKey = 107; // k
    break;
  case 40: // Down
    cmdKey = 106; // j
    break;
  }

  if (evt.ctrlKey == true) {
    cmdKey = C(evt.which);
  }

  if (evt.altKey == true || evt.metaKey == true) {
    // Oy, crap.  So the game takes lower case and upper case
    // characters to an alt modifier.  Keydown gives me an upper case
    // letter in evt.which.  So, let's reconstruct it.
    var character = evt.which;

    if (evt.shiftKey == false) {
      character |= 0x20;
    }

    // Set the meta modifier.
    cmdKey = M(character);
  }

  if (cmdKey != 0) {
    evt.preventDefault();
    var item = [cmdKey, 0, 0, 0];
    eventBuffer.push(item);
    processInput();
  }
};

function L(character) {
  return character.charCodeAt(0);
}

function C(cmdKey) {
  return cmdKey & 0x1F;
}

function M(cmdKey) {
  return cmdKey | 0x80;
}

var handleKeyPress = function(evt) {
  eventBuffer.push([evt.which, 0, 0, 0]);
  processInput();
};

function processInput() {
  if (awaitingInput && eventBuffer.length > 0) {
    awaitingInput = false;
    var item = eventBuffer.shift();
    var cmd = item.join(' ');
    pm(cmd);
  }
}

var pixheight = HEIGHT * DISPLAY_SQUARE;
var pixwidth = WIDTH * DISPLAY_SQUARE;

var glyph = function() {
  this.glyph = null;
  this.petmark = false;
};

function clearGlyphs() {
  glyphTable = [];
  for (var x = 0; x != WIDTH; x++) {
    glyphTable[x] = [];
    for (var y = 0; y != HEIGHT; y++) {
      glyphTable[x][y] = new glyph();
    }
  }
}

var cursor = {};

var gameScreen;

var startGame = function() {
  cursor.x = 0;
  cursor.y = 0;

  clearGlyphs();

  var canvas = document.getElementById('tile-gamecanvas');
  gameCtx = canvas.getContext('2d');
  canvas.width = pixwidth;
  canvas.height = pixheight;
  canvas.style.width = pixwidth;
  canvas.style.height = pixheight;
  canvas.addEventListener('mousedown', mouseNav);

  var inventory = document.getElementById('tile-inventory');
  inventoryCtx = inventory.getContext('2d');

  tiles = document.createElement('img');
  tiles.src = 'x11tiles.png';

  petmark = document.createElement('img');
  petmark.src = 'pet_mark.png';

  gameScreen = document.getElementById('tile-gamescreen');
  gameScreen.addEventListener('keydown', handleKeyDown);
  gameScreen.addEventListener('keypress', handleKeyPress);
  gameScreen.tabIndex = -1;

  // Create the object for Nethack.
  nethackEmbed = document.createElement('object');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.addEventListener('message', handleMessage);
  nethackEmbed.data = 'nethack.nmf';
  nethackEmbed.type = 'application/x-nacl';

  var param = document.createElement('param');
  param.name = 'windowtype';
  param.value = 'nacl';
  nethackEmbed.appendChild(param);

  addMenus();

  document.getElementById('listener').appendChild(nethackEmbed);
}

function addMenus() {
  addMenu('game', 'Change Settings...', 'Change Game Settings', unimplemented);
  addSeparator('game');
  addMenu('game', 'Version', null, nhAction, L("v"));
  addMenu('game', 'History...', null, nhAction, L("V"));
  addMenu('game', 'Compilation...', null, nhAction, M(L("v")));
  addMenu('game', 'Options...', null, nhAction, L("O"));
  addMenu('game', 'Explore Mode...', null, nhAction, L("X"));
  addSeparator('game');
  addMenu('game', 'New Game', null, unimplemented);
  addMenu('game', 'Save Game', null, nhAction, L("S"));
  addMenu('game', 'Switch to TTY mode', null, unimplemented);

  addMenu('edit', 'Inventory', 'Edit/View your inventory',
    nhAction, L("i"));
  addMenu('edit', 'Discoveries', 'Edit/View your Discoveries',
    nhAction, L("\\"));
  addMenu('edit', 'List/reorder your spells', 'List/reorder your spells',
    nhAction, L("x"));
  addMenu('edit', 'Adjust letters', 'Adjust letter for items in your Inventory',
    nhAction, M(L("a")));
  addSeparator('edit');
  addMenu('edit', 'Name object', 'Assign a name to an object',
    nhAction, M(L("n")));
  addMenu('edit', 'Name creature', 'Assign a name to a creature',
    nhAction, L("C"));
  addSeparator('edit');
  addMenu('edit', 'Qualifications', 'Edit your Qualifications',
    nhAction, M(L("e")));

  addMenu('apparel', 'Wield Weapon', 'Select a weapon to fight with',
    nhAction, L("w"));
  addMenu('apparel', 'Remove Apparel...', 'Remove apparel dialog box',
    nhAction, L("A"));
  addSeparator('apparel');
  addMenu('apparel', 'Wear Armor', 'Put on armor',
    nhAction, L("W"));
  addMenu('apparel', 'Take off Armor', 'Take off armor you are wearing',
    nhAction, L("T"));
  addMenu('apparel', 'Put on non-armor', 'Put on non-armor apparel',
    nhAction, L("P"));
  addMenu('apparel', 'Remove non-armor',
    'Remove non-armor apparel you are wearing',
    nhAction, L("R"));

  addMenu('action', 'Get', 'Pick up things at the current location',
    nhAction, L(","));
  addMenu('action', 'Loot', 'Loot a box on the floor',
    nhAction, M(L("l")));
  addMenu('action', 'Sit', 'Sit Down',
    nhAction, M(L("s")));
  addMenu('action', 'Force', 'Force a lock',
    nhAction, M(L("f")));
  addMenu('action', 'Kick', 'Kick something (usually a door)',
    nhAction, C(L("d")));
  addMenu('action', 'Jump', 'Jump to another location',
    nhAction, M(L("j")));
  //TODO(jeffbailey): There is no accelerator exposed for this,
  //so we can't do it.
  //addMenu('action', 'Ride', 'Ride (or stop riding) a monster',
  //  unimplemented);
  addMenu('action', 'Wipe face', 'Wipe off your face',
    nhAction, M(L("w")));
  addMenu('action', 'Throw/Shoot', 'Throw or shoot a weapon',
    nhAction, L("t"));
  addMenu('action', 'Quiver/Ready', 'Ready or quiver some ammunition',
    nhAction, L("Q"));
  addMenu('action', 'Open Door', 'Open a door',
    nhAction, L("o"));
  addMenu('action', 'Close Door', 'Close a door',
    nhAction, L("c"));
  addSeparator('action');
  addMenu('action', 'Drop', 'Drop an object',
    nhAction, L("d"));
  addMenu('action', 'Drop Many', 'Drop selected types of objects',
    nhAction, L("D"));
  addMenu('action', 'Eat', 'Eat something',
    nhAction, L("e"));
  addMenu('action', 'Engrave', 'Write a message in the dust on the floor',
    nhAction, L("E"));
  addMenu('action', 'Apply',
    'Apply or use a tool (pick-axe, key, camera, etc.)',
    nhAction, L("a"));
  addSeparator('action');
  addMenu('action', 'Up', 'Go up the stairs',
    nhAction, L("<"));
  addMenu('action', 'Down', 'Go down the stairs',
    nhAction, L(">"));
  addMenu('action', 'Rest', 'Wait for a moment',
    nhAction, L("."));
  addMenu('action', 'Search',
    'Search for secret doors, hidden traps and monsters',
    nhAction, L("s"));
  addSeparator('action');
  addMenu('action', 'Chat', 'Talk to someone',
    nhAction, M(L("c")));
  addMenu('action', 'Pay', 'Pay your bill to the shopkeeper',
    nhAction, L("p"));

  addMenu('magic', 'Quaff potion', 'Drink a potion',
    nhAction, L("q"));
  addMenu('magic', 'Read Book/Scroll', 'Read a spell book or a scroll',
    nhAction, L("r"));
  addMenu('magic', 'Zap Wand', 'Zap a wand',
    nhAction, L("z"));
  addMenu('magic', 'Zap Spell', 'Cast a spell',
    nhAction, L("Z"));
  addMenu('magic', 'Dip', 'Dip an object into something',
    nhAction, M(L("d")));
  addMenu('magic', 'Rub', 'Rub something (i.e. a lamp)',
    nhAction, M(L("r")));
  addMenu('magic', 'Invoke', "Invoke an object's special powers",
    nhAction, M(L("i")));
  addMenu('magic', 'Offer', 'Offer a sacrifice to the gods',
    nhAction, M(L("o")));
  addMenu('magic', 'Pray', 'Pray to the gods for help',
    nhAction, M(L("p")));
  addMenu('magic', 'Teleport', 'Teleport (if you can)',
    nhAction, C(L("t")));
  addMenu('magic', 'Monster Action', "Use a monster's special ability",
    nhAction, M(L("m")));
  addMenu('magic', 'Turn Undead', 'Turn undead',
    nhAction, M(L("t")));

  addMenu('help', 'About...', 'About Nethack',
    unimplemented);
  addMenu('help', 'Help', null,
    nhAction, L("?"));
  addSeparator('help');
  addMenu('help', 'What is here',
    'Check what items occupy the current location',
    nhAction, L(":"));
  addMenu('help', 'What is that', 'Identify an object',
    nhAction, L(";"));
  addMenu('help', 'Identify a map symbol', 'Identify a map symbol',
    nhAction, L("/"));

}

function nhAction(evt) {
  pm(evt.currentTarget.dataset.keycode);
}

function addMenu(menu, text, title, func, keycode) {
  var li = document.createElement('li');
  li.innerHTML = text;
  li.addEventListener('click', func);
  if (func === nhAction) {
    li.dataset.keycode = keycode;
  }
  li.className = 'tile-menuitem';
  if (title != null) {
    li.title = title;
  }
  document.getElementById('tile-menu-' + menu).appendChild(li);  
}

function addSeparator(menu) {
  var hr = document.createElement('hr');
  document.getElementById('tile-menu-' + menu).appendChild(hr);
}

function unimplemented(evt) {
  alert('Unimplemented, coming soon');
}

function mouseNav(evt) {
  var x = Math.floor(evt.offsetX / TILE_SQUARE) + 1;
  var y = Math.floor(evt.offsetY / TILE_SQUARE);
  var item = [0, x, y, 0];
  eventBuffer.push(item);
  processInput();
}

var PREFIX = 'JSPipeMount:3:';

function pm(out) {
  var output = PREFIX + out;
  console.log(output);
  nethackEmbed.postMessage(output);
}

var saveCurs = function(x, y) {
  cursor.x = x;
  cursor.y = y;
};

var putCurs = function() {
  var x = cursor.x - 1;
  var y = cursor.y;

  var x1 = x * TILE_SQUARE - 1;
  var y1 = y * TILE_SQUARE - 1;
  var x2 = x1 + TILE_SQUARE + 2;
  var y2 = y1 + TILE_SQUARE + 2;

  var hr = hp/maxhp;

  var r = 255;
  var g = (hr >= 0.75) ? 255             : (hr >= 0.25 ? 255*2*(hr-0.25) : 0);
  var b = (hr >= 0.75) ? 255*4*(hr-0.75) : (hr >= 0.25 ? 0 : 255*4*(0.25-hr));

  gameCtx.beginPath();
  gameCtx.moveTo(x1, y1);
  var color = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
  gameCtx.strokeStyle = color;
  gameCtx.lineTo(x2, y1);
  gameCtx.lineTo(x2, y2);
  gameCtx.lineTo(x1, y2);
  gameCtx.lineTo(x1, y1);
  gameCtx.stroke();
};

var saveGlyph = function(x, y, tile, pet) {
  x--;
  glyphTable[x][y].glyph = tile;
  glyphTable[x][y].petmark = pet;
};

function displayMap() {
  gameCtx.clearRect(0, 0, pixwidth, pixheight);
  for (var x = 0; x < WIDTH; x++) {
    for (var y = 0; y < HEIGHT; y++) {
      if (glyphTable[x][y].glyph !== null) {
        putTile(x, y, glyphTable[x][y].glyph, glyphTable[x][y].petmark);
      }
    }
  }
  putCurs();
}

var putInventoryTile = function(x, y, tile) {

  if (tile == -1) return;

  var tile_x = tile % TILES_PER_ROW;
  var tile_y = Math.floor(tile / TILES_PER_ROW);

  inventoryCtx.drawImage(tiles, tile_x * TILE_SQUARE,
                         tile_y * TILE_SQUARE,
                         TILE_SQUARE,
                         TILE_SQUARE,
                         x,
                         y,
                         DISPLAY_SQUARE,
                         DISPLAY_SQUARE);
};

var putTile = function(x, y, tile, pet) {
  var tile_x = tile % TILES_PER_ROW;
  var tile_y = Math.floor(tile / TILES_PER_ROW);

  gameCtx.drawImage(tiles, tile_x * TILE_SQUARE,
                    tile_y * TILE_SQUARE,
                    TILE_SQUARE,
                    TILE_SQUARE,
                    x * DISPLAY_SQUARE,
                    y * DISPLAY_SQUARE,
                    DISPLAY_SQUARE,
                    DISPLAY_SQUARE);

  if (pet == 1) {
    gameCtx.drawImage(petmark,
                      x * DISPLAY_SQUARE,
                      y * DISPLAY_SQUARE);  
  }
}

var win_num = 1;

var win_array = new Array();

var tile_func_array = new Array();

function tile_askname(msg) {
    var getlineWin = new InputWindow("What is your name?", pm, false);
    getlineWin.display();
}

function tile_player_selection(msg) {
    // 1: Title 2: Text ...: choices
    // TODO(jeffbailey): Remove magic constants
    win_array[win_num] = new DisplayWindow();
    win_array[win_num].setPrompt(msg[2]);
    win_array[win_num].setPlayerSelection();
    win_array[win_num].displayRandomButton();
    // Populate list
    // 1: Window Number, 2: tile, 3: identifier, 4: accelerator
    // 5: group accel, 6: attribute, 7: string, 8: presel
    for (var i=0; i<msg.length - 3; i++) {
      // We add one the to identifier because '0' means 'none'
      win_array[win_num].addMenu([0, win_array[win_num], 0, i+1, 0, 0, 0, msg[i+3], 0]);
    }
    win_array[win_num].selectMenu(1);
    // pm(-2); // Random
    win_num++;
}

function tile_exit_nhwindows(msg) {
    // 1: Text
    plineput(msg[1]);
    // TODO(jeffbailey): This should clear the screen, disable menus,
    // and offer a close/new game set of buttons.
}

function tile_create_nhwindow(msg) {
    // msg[1]: type
    // The type never seems to get used
    win_array[win_num] = new DisplayWindow();
    pm('' + win_num);
    win_num++;
}

function tile_clear_nhwindow(msg) {
    // 1: Window Number
    if (msg[1] == NHWin.MAP) {
      clearGlyphs();
    }
}

function tile_display_nhwindow(msg) {
  // msg[1]: winid
  // We'll handle root windows ourselves.
  if (msg[1] < 4) {
    if (msg[2] == '1') {
      pm('ACK');
    }
    if (msg[1] == NHWin.MAP) {
      displayMap();
      unboldStatus();
    }
    return;
  }
  win_array[msg[1]].display(msg[2]);
}

function tile_destroy_nhwindow(msg) {
  // This shouldn't close it for non-modal windows.  Instead
  // we'll let all the windows close themselves and leave the windows
  // to decide if they lock down the interface for other interaction
  // or not.
  win_array[msg[1]] = null;
}

function tile_curs(msg) {
  // Window, X, Y
  saveCurs(msg[2], msg[3]);
}

function tile_putstr(msg) {
  win_array[msg[1]].putStr(msg[3]);
}

function tile_display_file(msg) {
  var fileWin = new FileWindow(msg[1]);
  fileWin.display();
}

function tile_start_menu(msg) {
  // 1: Window Number
  win_array[msg[1]] = new DisplayWindow();
}

function tile_add_menu(msg) {
  // 1: Window Number, 2: tile, 3: identifier, 4: accelerator
  // 5: group accel, 6: attribute, 7: string, 8: presel
  win_array[msg[1]].addMenu(msg);
}

function tile_end_menu(msg) {
  // 1: Window ID, 2: Prompt
  win_array[msg[1]].setPrompt(msg[2]);
}

function tile_select_menu(msg) {
  // 1: Window, 2: How
  win_array[msg[1]].selectMenu(msg[2]);
}

function tile_update_inventory(msg) {
  // Body Armor: 25, 63
  // Cloak: 100, 63
  // Helmet: 62, 11
  // Shield: 120, 91 
  // Gloves, 6, 142
  // Footwear, 110, 188
  // Undershirt, 120, 142
  // Amulet: 89, 38 
  // Lt. Ring: 120, 111
  // Rt. Ring: 6, 111
  // Blindfold: 25, 38
  // Weapon: 6, 91
  // Swap Weapon: 117, 11 
  // Quiver: 8, 11
  // Skin: 10, 110
  // Not in the worn struct:
  inventoryCtx.clearRect(0, 0, 141, 212);
  putInventoryTile(25, 63, msg[1]);
  putInventoryTile(100, 63, msg[2]);
  putInventoryTile(62, 11, msg[3]);
  putInventoryTile(120, 91, msg[4]);
  putInventoryTile(6, 142, msg[5]);
  putInventoryTile(110, 188, msg[6]);
  putInventoryTile(120, 142, msg[7]);
  putInventoryTile(10, 110, msg[8]); // Maybe wrong
  putInventoryTile(89, 38, msg[9]);
  putInventoryTile(120, 111, msg[10]);
  putInventoryTile(6, 111, msg[11]);
  putInventoryTile(25, 38, msg[12]);
  putInventoryTile(6, 91, msg[13]);
  putInventoryTile(117, 11, msg[14]);
  putInventoryTile(8, 11, msg[15]);
}

function tile_print_glyph(msg) {
  saveGlyph(msg[2], msg[3], msg[4], msg[5]);
}

function tile_raw_print(msg) {
  plineput(msg[1]);
  pm('ack');
}

function tile_nhgetch(msg) {
  awaitingInput = true;
  processInput();
  gameScreen.focus();
}

function tile_yn_function(msg) {
  // 1: text 2: choices "yn" 3: ascii value of default choice
  /*          -- Print a prompt made up of ques, choices and default.
   *             Read a single character response that is contained in
   *             choices or default.  If choices is NULL, all possible
   *             inputs are accepted and returned.  This overrides
   *             everything else.  The choices are expected to be in
   *             lower case.  Entering ESC always maps to 'q', or 'n',
   *             in that order, if present in choices, otherwise it maps
   *             to default.  Entering any other quit character (SPACE,
   *             RETURN, NEWLINE) maps to default.
   *          -- If the choices string contains ESC, then anything after
   *             it is an acceptable response, but the ESC and whatever
   *             follows is not included in the prompt.
   *          -- If the choices string contains a '#' then accept a count.
   *             Place this value in the global "yn_number" and return '#'.
   *          -- This uses the top line in the tty window-port, other
   *             ports might use a popup.
   */
  // TODO(jeffbailey): handle these cases, but it's no worse than it was
  // before this way.
  if (msg[2] != ""
      || msg[2].indexOf('\x1b') != -1
      || msg[2].indexOf('#') != -1) {
    var choiceWindow = new ChoiceWindow(msg[1], msg[2], msg[3]);
    choiceWindow.display();
  } else {
    //TODO(jeffbailey): Validate the input here
    plineput(msg[1]);
    awaitingInput = true;
    processInput();
    gameScreen.focus();
  }
}

function tile_getlin(msg) {
  var getlineWin = new InputWindow(msg[1], pm);
  getlineWin.display();
}

function tile_get_ext_cmd(msg) {
  var extCmdWin = new ExtCmdWindow(msg);
  extCmdWin.display();
}

function tile_update_stats(msg) {
  setStatus('plname', msg[1]);
  setStatus('rank', msg[2]);
  setStatus('dnamelvl', msg[3]);
  setStatus('str', msg[5]);
  setStatus('dex', msg[6]);
  setStatus('con', msg[7]);
  setStatus('int', msg[8]);
  setStatus('wis', msg[9]);
  setStatus('cha', msg[10]);
  hp = msg[11];
  setStatus('hp', msg[11]);
  maxhp = msg[12];
  setStatus('maxhp', msg[12]);
  setStatus('ac', msg[13]);
  setStatus('power', msg[14]);
  setStatus('maxpower', msg[15]);
  setStatus('gold', msg[16]);
  setStatus('level', msg[17]);
  setStatus('xp', msg[18]);
  // Time changes too often to be bolded.
  document.getElementById('time').textContent = msg[19];
  setAlignment(msg[20]);
  setHunger(msg[21], msg[22]);
  setConfusion(msg[23]);
  setBlind(msg[24]);
  setStunned(msg[25]);
  setHallucination(msg[26]);
  setSick(msg[27], msg[28]);
  setEncumbered(msg[29], msg[30]);
  firstTime = false;
}

// NaclMsg.INIT_NHWINDOWS
tile_func_array[NaclMsg.ASKNAME] = tile_askname;
tile_func_array[NaclMsg.PLAYER_SELECTION] = tile_player_selection;
// NaclMsg.GET_NH_EVENT
tile_func_array[NaclMsg.EXIT_NHWINDOWS] = tile_exit_nhwindows;
// NaclMsg.SUSPEND_NHWINDOWS
// NaclMsg.RESUME_NHWINDOWS
tile_func_array[NaclMsg.CREATE_NHWINDOW] = tile_create_nhwindow;
// NaclMsg.CREATE_NHWINDOW_BY_ID
tile_func_array[NaclMsg.CLEAR_NHWINDOW] = tile_clear_nhwindow;
tile_func_array[NaclMsg.DISPLAY_NHWINDOW] = tile_display_nhwindow;
tile_func_array[NaclMsg.DESTROY_NHWINDOW] = tile_destroy_nhwindow;
tile_func_array[NaclMsg.CURS] = tile_curs;
tile_func_array[NaclMsg.PUTSTR] = tile_putstr;
tile_func_array[NaclMsg.DISPLAY_FILE] = tile_display_file;
tile_func_array[NaclMsg.START_MENU] = tile_start_menu;
tile_func_array[NaclMsg.ADD_MENU] = tile_add_menu;
tile_func_array[NaclMsg.END_MENU] = tile_end_menu;
tile_func_array[NaclMsg.SELECT_MENU] = tile_select_menu;
tile_func_array[NaclMsg.UPDATE_INVENTORY] = tile_update_inventory;
// NaclMsg.MARK_SYNCH
// NaclMsg.WAIT_SYNCH
// NaclMsg.CLIPAROUND
// NaclMsg.CLIPAROUND_PROPER
tile_func_array[NaclMsg.PRINT_GLYPH] = tile_print_glyph;
tile_func_array[NaclMsg.RAW_PRINT] = tile_raw_print;
tile_func_array[NaclMsg.RAW_PRINT_BOLD] = tile_raw_print; // TODO(jeffbailey)
tile_func_array[NaclMsg.NHGETCH] = tile_nhgetch;
tile_func_array[NaclMsg.NH_POSKEY] = tile_nhgetch; // TODO(jeffbailey)
tile_func_array[NaclMsg.YN_FUNCTION] = tile_yn_function;
tile_func_array[NaclMsg.GETLIN] = tile_getlin;
tile_func_array[NaclMsg.GET_EXT_CMD] = tile_get_ext_cmd;
// NaclMsg.NUMBER_PAD
// NaclMsg.DELAY_OUTPUT
// NaclMsg.START_SCREEN
// NaclMsg.END_SCREEN
// NaclMsg.OUTRIP
// NaclMsg.DELETE_NHWINDOW_BY_REFERENCE
tile_func_array[NaclMsg.UPDATE_STATS] = tile_update_stats;

var handleMessage = function(event) {
  // Make sure it's the right kind of event we got
  // Check to make sure it starts with PREFIX
  console.log(event.data.substr(PREFIX.length));
  var msg = JSON.parse(event.data.substr(PREFIX.length));

  // A port is welcome to just leave anything they don't want to handle
  // as undefined.
  if (tile_func_array[msg[0]]) {
    tile_func_array[msg[0]](msg);
  }
}

function setStatus(tag, text) {
  var element = document.getElementById(tag);
  element.textContent = text;

  boldStatus(tag, text);
}

function boldStatus(tag, text) {
  if (firstTime) {
    attributeCache[tag] = text;
    return;
  }

  if (attributeCache[tag] == text) {
    return;
  }
  attributeCache[tag] = text;

  // The li is me, my parent, or my grandparent
  var element = document.getElementById(tag);
  if (element.tagName != "LI") {
    element = element.parentNode;
    if (element.tagName != "LI") {
      element = element.parentNode;
      if (element.tagName != "LI") {
        return;
      }
    }  
  }

  element.classList.add('tile-statchange');
  element.dataset.boldCount = 4;
}

function unboldStatus() {
  var boldList = document.querySelectorAll('.tile-statchange');
  for (var i = 0; i < boldList.length; i++) {
    boldList[i].dataset.boldCount--;
    if (boldList[i].dataset.boldCount == 0) {
      boldList[i].classList.remove('tile-statchange');
    }
  }
}

function setAlignment(align) {
  var image = document.getElementById('tile-align-image');
  var text = document.getElementById('tile-align-text');

  boldStatus('tile-align-image', align);

  switch(align) {
  case -1:
    image.src = 'chaotic.png';
    text.textContent = 'Chaotic';
    break;
  case 0:
    image.src = 'neutral.png';
    text.textContent = 'Neutral';
    break;
  case 1:
    image.src = 'lawful.png';
    text.textContent = 'Lawful';
    break;
  }
}

function setHunger(hunger, hungerText) {
  /* hunger texts used on bottom line (each 8 chars long) */
  var SATIATED = 0;
  var NOT_HUNGRY = 1;
  var HUNGRY = 2;
  var WEAK = 3;
  var FAINTING = 4;
  var FAINTED = 5;
  var STARVED = 6;

  var image = document.getElementById('tile-hungry-image');
  var text = document.getElementById('tile-hungry-text');

  if (hunger == 1) {
    image.parentElement.classList.add('tile-hidden');
    boldStatus('tile-hungry-image', '');
    return;
  }

  image.parentElement.classList.remove('tile-hidden');

  if (hunger == 0) {
    image.src = 'satiated.png';
  } else {
    image.src = 'hungry.png';
  }

  text.textContent = hungerText;
  boldStatus('tile-hungry-image', hungerText);
}

function statusHideShow(elementName, state) {
  var element = document.getElementById(elementName);
  boldStatus(elementName, state);
  switch(state) {
  case 0:
    element.classList.add('tile-hidden');
    break;
  case 1:
    element.classList.remove('tile-hidden');
    break;
  }
}

function setConfusion(confusion) {
  statusHideShow('tile-confu', confusion);
}

function setBlind(blind) {
  statusHideShow('tile-blind', blind);
}

function setStunned(stunned) {
  statusHideShow('tile-stun', stunned);
}

function setHallucination(hallu) {
  statusHideShow('tile-hallu', hallu);
}

function setSick(sick, sick_type) {
  var SICK_VOMITABLE = 1;
  var SICK_NONVOMITABLE = 2;

  var image = document.getElementById('tile-sick-image');
  var text = document.getElementById('tile-sick-text');

  if (sick == 0) {
    image.parentElement.classList.add('tile-hidden');
    boldStatus('tile-sick-image', '');
    return;
  }

  image.parentElement.classList.remove('tile-hidden');

  if (sickType == 2) {
    image.src = 'sick_il.png';
    text.textContent = 'Ill';
    return;
  }

  image.src = 'sick_fp.png';
  text.textContent = 'FoodPois';
  boldStatus('tile-sick-image', text.textContent);
}

function setEncumbered(capacity, capacityText) {
  var UNENCUMBERED = 0;
  var SLT_ENCUMBER = 1;       /* Burdened */
  var MOD_ENCUMBER = 2;       /* Stressed */
  var HVY_ENCUMBER = 3;       /* Strained */
  var EXT_ENCUMBER = 4;       /* Overtaxed */
  var OVERLOADED = 5;         /* Overloaded */

  var image = document.getElementById('tile-enc-image');
  var text = document.getElementById('tile-enc-text');

  text.textContent = capacityText;

  switch(capacity) {
  case 0:
    image.parentElement.classList.add('tile-hidden');
    boldStatus('tile-enc-image', capacityText);
    return;
  case 1:
    image.src = 'slt_enc.png';
    break;
  case 2:
    image.src = 'mod_enc.png';
    break;
  case 3:
    image.src = 'hvy_enc.png';
    break;
  case 4:
    image.src = 'ext_enc.png';
    break;
  case 5:
    image.src = 'ovt_enc.png';
    break;
  }

  boldStatus('tile-enc-image', capacityText);

  image.parentElement.classList.remove('tile-hidden');
}

function plineput(text) {
  var plinecontent = document.getElementById('tile-plinecontent');
  var p = document.createElement('p');
  p.textContent = text;
  plinecontent.appendChild(p);

  if (plinecontent.children.length >= MAX_SCROLL_LINES) {
    plinecontent.removeChild(plinecontent.firstChild);
  }

  var plinewin = document.getElementById('tile-plinewin');
  plinewin.scrollTop = plinewin.scrollHeight;
}

