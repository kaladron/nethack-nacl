"use strict";

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

var ctx;
var tiles;
var petmark;

var panel;

var hp;
var maxhp;

var firstTime = true;
var attributeCache = {};

var FileWindow = function(file) {
  this.menu_win = document.createElement('x-modal');
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
  row.dataset.identifier = msg[3];
   
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

  var menuText = "";
  if (msg[4] != 0) {
    menuText += String.fromCharCode(msg[4]);
    menuText += " - "
    row.dataset.accelerator = msg[4];
  }
 
  menuText += msg[7];

  var item = document.createElement(cellType);
  item.textContent = menuText;
  item.className = 'tile-fixedwidth';
  row.appendChild(item);
  this.content.appendChild(row);
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

DisplayWindow.prototype.keyPress = function(evt) {
  // Ignore enter key
  if (evt.which == 13) return;
  var selector = 'tr[data-accelerator="' + evt.which + '"]';
  var row = document.querySelector(selector);
  if (row == null) return;
  this.rowSelect(row);
};

DisplayWindow.prototype.handleSelect = function(evt) {
  // TODO(jeffbailey): Allow enter key to work after selecting.
  // Disabled because it causes a scroll on long windows.
  //this.button.focus();

  if (evt.currentTarget.dataset.identifier == "0") return;

  this.rowSelect(evt.currentTarget);
}

DisplayWindow.prototype.rowSelect = function(element) {
  // TODO(jeffbailey): Remove magic constants in this function!
  if (this.how == 2) {
    element.classList.toggle('tile-menutable-selected');
    return;
  }

  // Only one at a time allowed to be selected.
  var old = document.querySelector('.tile-menutable-selected');
  if (old != null) {
    old.classList.remove('tile-menutable-selected');
  }

  element.classList.add('tile-menutable-selected');
};

/**
 * displayCancel is optional.
 */
var InputWindow = function(content, callback, displayCancel) {
  if (displayCancel === undefined) displayCancel = true;

  this.callback = callback;
  this.win = document.createElement('x-modal');
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
    div.appendChild(button);
    this.win.appendChild(div);
    this.buttons[this.buttons.length] = button;
  }

  this.cancelButton = document.createElement('button');
  this.cancelButton.textContent = 'Cancel';
  this.cancelButton.addEventListener('click', this.cancelButtonAction.bind(this));
  this.win.appendChild(this.cancelButton);
  this.win.addEventListener('keydown', this.cancelKeyWatch.bind(this));
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

ExtCmdWindow.prototype.cancelKeyWatch = function(evt) {
  if (evt.which == 27) {
    this.cancelButtonAction();
  }
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


var nethackEmbed;

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
    cmdKey = setCtrl(evt.which);
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
    cmdKey = setMeta(character);
  }

  if (cmdKey != 0) {
    evt.preventDefault();
    var item = [cmdKey, 0, 0, 0];
    eventBuffer.push(item);
    processInput();
  }
};

function setCtrl(cmdKey) {
  return cmdKey & 0x1F;
}

function setMeta(cmdKey) {
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
  ctx = canvas.getContext('2d');
  canvas.width = pixwidth;
  canvas.height = pixheight;
  canvas.style.width = pixwidth;
  canvas.style.height = pixheight;
  canvas.addEventListener('mousedown', mouseNav);

  tiles = document.createElement('img');
  tiles.src = 'x11tiles.png';

  petmark = document.createElement('img');
  petmark.src = 'pet_mark.png';

  gameScreen = document.getElementById('tile-gamescreen');
  gameScreen.addEventListener('keydown', handleKeyDown);
  gameScreen.addEventListener('keypress', handleKeyPress);
  gameScreen.tabIndex = 1;

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
  addMenu('game', 'Version', null, unimplemented);
  addMenu('game', 'History...', null, unimplemented);
  addMenu('game', 'Compilation...', null, unimplemented);
  addMenu('game', 'Options...', null, unimplemented);
  addMenu('game', 'Explore Mode...', null, unimplemented);
  addSeparator('game');
  addMenu('game', 'New Game', null, unimplemented);
  addMenu('game', 'Save Game', null, unimplemented);
  addMenu('game', 'Switch to TTY mode', null, unimplemented);
  addMenu('game', 'Edit Options File...', null, unimplemented);
  addMenu('game', 'Exit', null, unimplemented);

  addMenu('edit', 'Inventory', 'Edit/View your inventory', unimplemented);
  addMenu('edit', 'Discoveries', 'Edit/View your Discoveries', unimplemented);
  addMenu('edit', 'List/reorder your spells', 'List/reorder your spells', unimplemented);
  addMenu('edit', 'Adjust letters', 'Adjust letter for items in your Inventory', unimplemented);
  addSeparator('edit');
  addMenu('edit', 'Name object', 'Assign a name to an object', unimplemented);
  addMenu('edit', 'Name creature', 'Assign a name to a creature', unimplemented);
  addSeparator('edit');
  addMenu('edit', 'Qualifications', 'Edit your Qualifications', unimplemented);

  addMenu('apparel', 'Wield Weapon', 'Select a weapon to fight with', unimplemented);
  addMenu('apparel', 'Remove Apparel...', 'Remove apparel dialog box', unimplemented);
  addSeparator('apparel');
  addMenu('apparel', 'Wear Armor', 'Put on armor', unimplemented);
  addMenu('apparel', 'Take off Armor', 'Take off armor you are wearing', unimplemented);
  addMenu('apparel', 'Put on non-armor', 'Put on non-armor apparel', unimplemented);
  addMenu('apparel', 'Remove non-armor', 'Remove non-armor apparel you are wearing', unimplemented);

  addMenu('action', 'Get', 'Pick up things at the current location', unimplemented);
  addMenu('action', 'Loot', 'Loot a box on the floor', unimplemented);
  addMenu('action', 'Sit', 'Sit Down', unimplemented);
  addMenu('action', 'Force', 'Force a lock', unimplemented);
  addMenu('action', 'Kick', 'Kick something (usually a door)', nhAction, setCtrl(100));
  addMenu('action', 'Jump', 'Jump to another location', unimplemented);
  addMenu('action', 'Ride', 'Ride (or stop riding) a monster', unimplemented);
  addMenu('action', 'Wipe face', 'Wipe off your face', unimplemented);
  addMenu('action', 'Throw/Shoot', 'Throw or shoot a weapon', unimplemented);
  addMenu('action', 'Quiver/Ready', 'Ready or quiver some ammunition', unimplemented);
  addMenu('action', 'Open Door', 'Open a door', unimplemented);
  addMenu('action', 'Close Door', 'Close a door', unimplemented);
  addSeparator('action');
  addMenu('action', 'Drop', 'Drop an object', unimplemented);
  addMenu('action', 'Drop Many', 'Drop selected types of objects', unimplemented);
  addMenu('action', 'Eat', 'Eat something', unimplemented);
  addMenu('action', 'Engrave', 'Write a message in the dust on the floor', unimplemented);
  addMenu('action', 'Apply', 'Apply or use a tool (pick-axe, key, camera, etc.)', unimplemented);
  addSeparator('action');
  addMenu('action', 'Up', 'Go up the stairs', unimplemented);
  addMenu('action', 'Down', 'Go down the stairs', unimplemented);
  addMenu('action', 'Rest', 'Wait for a moment', unimplemented);
  addMenu('action', 'Search', 'Search for secret doors, hidden traps and monsters', unimplemented);
  addSeparator('action');
  addMenu('action', 'Chat', 'Talk to someone', unimplemented);
  addMenu('action', 'Pay', 'Pay your bill to the shopkeeper', unimplemented);

  addMenu('magic', 'Quaff potion', 'Drink a potion', unimplemented);
  addMenu('magic', 'Read Book/Scroll', 'Read a spell book or a scroll', unimplemented);
  addMenu('magic', 'Zap Wand', 'Zap a wand', unimplemented);
  addMenu('magic', 'Zap Spell', 'Cast a spell', unimplemented);
  addMenu('magic', 'Dip', 'Dip an object into something', unimplemented);
  addMenu('magic', 'Rub', 'Rub something (i.e. a lamp)', unimplemented);
  addMenu('magic', 'Invoke', "Invoke an object's special powers", unimplemented);
  addMenu('magic', 'Offer', 'Offer a sacrifice to the gods', unimplemented);
  addMenu('magic', 'Pray', 'Pray to the gods for help', unimplemented);
  addMenu('magic', 'Teleport', 'Teleport (if you can)', unimplemented);
  addMenu('magic', 'Monster Action', "Use a monster's special ability", unimplemented);
  addMenu('magic', 'Turn Undead', 'Turn undead', unimplemented);

  addMenu('help', 'About...', 'About Nethack', unimplemented);
  addMenu('help', 'Help', null, unimplemented);
  addSeparator('help');
  addMenu('help', 'What is here', 'Check what itemts occupy the current location', unimplemented);
  addMenu('help', 'What is that', 'Identify an object', unimplemented);
  addMenu('help', 'Identify a map symbol', 'Identify a map symbol', unimplemented);

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

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  var color = 'rgb('+Math.floor(r)+','+Math.floor(g)+','+Math.floor(b)+')';
  ctx.strokeStyle = color;
  ctx.lineTo(x2, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x1, y2);
  ctx.lineTo(x1, y1);
  ctx.stroke();
};

var saveGlyph = function(x, y, tile, pet) {
  x--;
  glyphTable[x][y].glyph = tile;
  glyphTable[x][y].petmark = pet;
};

function displayMap() {
  ctx.clearRect(0, 0, pixwidth, pixheight);
  for (var x = 0; x < WIDTH; x++) {
    for (var y = 0; y < HEIGHT; y++) {
      if (glyphTable[x][y].glyph !== null) {
        putTile(x, y, glyphTable[x][y].glyph, glyphTable[x][y].petmark);
      }
    }
  }
  putCurs();
}

var putTile = function(x, y, tile, pet) {
  var tile_x = tile % TILES_PER_ROW;
  var tile_y = Math.floor(tile / TILES_PER_ROW);

  ctx.drawImage(tiles, tile_x * TILE_SQUARE,
                tile_y * TILE_SQUARE,
                TILE_SQUARE,
                TILE_SQUARE,
                x * DISPLAY_SQUARE,
                y * DISPLAY_SQUARE,
                DISPLAY_SQUARE,
                DISPLAY_SQUARE);

  if (pet == 1) {
    ctx.drawImage(petmark,
                  x * DISPLAY_SQUARE,
                  y * DISPLAY_SQUARE);  
  }
}

var win_num = 1;

var win_array = new Array();

var handleMessage = function(event) {
  // Make sure it's the right kind of event we got
  // Check to make sure it starts with PREFIX
  console.log(event.data.substr(PREFIX.length));
  var msg = JSON.parse(event.data.substr(PREFIX.length));

  switch(msg[0]) {
  case NaclMsg.INIT_NHWINDOWS: // 0
    break;
  case NaclMsg.PLAYER_SELECTION: // 1
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
      win_array[win_num].addMenu([0, win_array[win_num], 0, i, (97)+i, 0, 0, msg[i+3], 0]);
    }
    win_array[win_num].selectMenu(1);
    // pm(-2); // Random
    win_num++;
    break;
  case NaclMsg.ASKNAME: // 2
    var getlineWin = new InputWindow("What is your name?", pm, false);
    getlineWin.display();
    break;
  case NaclMsg.GET_NH_EVENT: //3
    throw "Not Implemented!";
  case NaclMsg.EXIT_NHWINDOWS: // 4
    // 1: Text
    plineput(msg[1]);
    // TODO(jeffbailey): This should clear the screen, disable menus,
    // and offer a close/new game set of buttons.
    break;
  case NaclMsg.SUSPEND_NHWINDOWS: // 5
    throw "Not Implemented!";
  case NaclMsg.RESUME_NHWINDOWS: // 6
    throw "Not Implemented!";
  case NaclMsg.CREATE_NHWINDOW: // 7
    // msg[1]: type
  //  switch(msg[1]) {
  //  case NHWin.MENU:
      win_array[win_num] = new DisplayWindow();
  //    break;
  //  }

    pm('' + win_num);
    win_num++;
    break;
  case NaclMsg.CREATE_NHWINDOW_BY_ID: // 8
    throw "Not Implemented!";
  case NaclMsg.CLEAR_NHWINDOW: // 9
    // 1: Window Number
    if (msg[1] == NHWin.MAP) {
      clearGlyphs();
    }
    break;
  case NaclMsg.DISPLAY_NHWINDOW: // 10
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
      break;
    }
    win_array[msg[1]].display(msg[2]);
    break;
  case NaclMsg.DESTROY_NHWINDOW: // 11
    // This shouldn't close it for non-modal windows.  Instead
    // we'll let all the windows close themselves and leave the windows
    // to decide if they lock down the interface for other interaction
    // or not.
    win_array[msg[1]] = null;
    break;
  case NaclMsg.CURS: // 12
    // Window, X, Y
    saveCurs(msg[2], msg[3]);
    break;
  case NaclMsg.PUTSTR: // 13
    win_array[msg[1]].putStr(msg[3]);
    break;
  case NaclMsg.DISPLAY_FILE: // 14
    var fileWin = new FileWindow(msg[1]);
    fileWin.display();
    break;
  case NaclMsg.START_MENU: // 15
    // 1: Window Number
    win_array[msg[1]] = new DisplayWindow();
    break;
  case NaclMsg.ADD_MENU: // 16
    // 1: Window Number, 2: tile, 3: identifier, 4: accelerator
    // 5: group accel, 6: attribute, 7: string, 8: presel
    win_array[msg[1]].addMenu(msg);
    break;
  case NaclMsg.END_MENU: // 17
    // 1: Window ID, 2: Prompt
    win_array[msg[1]].setPrompt(msg[2]);
    break;
  case NaclMsg.SELECT_MENU: // 18
    // 1: Window, 2: How
    win_array[msg[1]].selectMenu(msg[2]);
    break;
  case NaclMsg.UPDATE_INVENTORY: // 19
    // Intentionally not implemented.
    break;
  case NaclMsg.MARK_SYNCH: // 20
    // All items in the UI are synchronous.
    break;
  case NaclMsg.WAIT_SYNCH: // 21
    // All items in the UI are synchronous.
    break;
  case NaclMsg.CLIPAROUND: // 22
    throw "Not Implemented!";
  case NaclMsg.CLIPAROUND_PROPER: // 23
    throw "Not Implemented!";
  case NaclMsg.PRINT_GLYPH: // 24
    saveGlyph(msg[2], msg[3], msg[4], msg[5]);
    break;
  case NaclMsg.RAW_PRINT: // 25
    plineput(msg[1]);
    pm('ack');
    break;
  case NaclMsg.PRINT_GLYPH: // 24
    saveGlyph(msg[2], msg[3], msg[4], msg[5]);
    break;
  case NaclMsg.RAW_PRINT: // 25
    plineput(msg[1]);
    pm('ack');
    break;
  case NaclMsg.NHGETCH: // 27
  case NaclMsg.NH_POSKEY: // 28
    awaitingInput = true;
    processInput();
    gameScreen.focus();
    break;
  case NaclMsg.YN_FUNCTION: // 31
    //TODO(jeffbailey): Validate the input here
    plineput(msg[1]);
    awaitingInput = true;
    processInput();
    gameScreen.focus();
    break;
  case NaclMsg.GETLIN: // 32
    var getlineWin = new InputWindow(msg[1], pm);
    getlineWin.display();
    break;
  case NaclMsg.GET_EXT_CMD: // 33
    var extCmdWin = new ExtCmdWindow(msg);
    extCmdWin.display();
    break;
  case NaclMsg.NUMBER_PAD: // 34
    throw "Not Implemented!";
  case NaclMsg.DELAY_OUTPUT: // 35
    throw "Not Implemented!";
  case NaclMsg.START_SCREEN: // 36
    throw "Not Implemented!";
  case NaclMsg.END_SCREEN: // 37
    throw "Not Implemented!";
  case NaclMsg.OUTRIP: // 38
    throw "Not Implemented!";
  case NaclMsg.DELETE_NHWINDOW_BY_REFERENCE: // 39
    throw "Not Implemented!";
  case NaclMsg.UPDATE_STATS: // 40
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
    break;
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
    element.classLlist.remove('tile-hidden');
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

window.onbeforeunload = function() {
  return 'You will lose any unsaved progress!';
};

startGame();
