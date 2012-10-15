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

var HEIGHT = 24;
var WIDTH = 80;
var DISPLAY_SQUARE = 16;
var TILES_PER_ROW = 40;
var TILE_SQUARE = 16;

var glyphTable;

var ctx;
var tiles;
var petmark;

var panel;

var FileWindow = function(file) {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.className = 'dialog';

  var pre = document.createElement('pre');

  this.panel = document.createElement('x-panel');
  this.panel.rel = file;
  pre.appendChild(this.panel);
  // TODO(jeffbailey): This is a hack to work around a bug in x-tags
  // Where the element doesn't load when placed into the dom,
  // but does when src changes later.
  setTimeout(this.test.bind(this), 100);
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

var DisplayWindow = function(content) {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.className = 'dialog';
  this.content = content;
  this.menu_win.appendChild(content);
  this.button = document.createElement('button');
  this.button.textContent = 'OK';
  this.button.addEventListener('click', this.okButton.bind(this));
  this.menu_win.appendChild(this.button);
  this.block = false;
  this.overlay = document.createElement('x-overlay');
};

DisplayWindow.prototype.display = function(block) {
  document.body.appendChild(this.overlay);
  document.body.appendChild(this.menu_win);
  if (block == 1) {
    this.block = true;
  }
  this.button.focus();
};

DisplayWindow.prototype.okButton = function() {
  if (this.block) {
    pm('OK');
    this.block = false;
  }
};

DisplayWindow.prototype.putStr = function(text) {
  var text = document.createTextNode(text + '\n');
  this.content.appendChild(text);
};

DisplayWindow.prototype.close = function() {
  document.body.removeChild(this.menu_win);
  document.body.removeChild(this.overlay);
};

var MenuWindow = function(content) {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.className = 'dialog';
  this.content = content;
  this.menu_win.appendChild(content);

  var okButton = document.createElement('button');
  okButton.type = 'button';
  okButton.textContent = 'OK';
  okButton.addEventListener('click', this.okButtonAction.bind(this));
  this.menu_win.appendChild(okButton);

  var cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', this.cancelButtonAction.bind(this));
  this.menu_win.appendChild(cancelButton);
  this.overlay = document.createElement('x-overlay');
};

MenuWindow.prototype.display = function(block) {
  document.body.appendChild(this.overlay);
  document.body.appendChild(this.menu_win);
  if (block == 1) {
    this.block = true;
  }
};

MenuWindow.prototype.okButtonAction = function() {
  pm('0');
  this.close();
};

MenuWindow.prototype.cancelButtonAction = function() {
  pm('-1');
  this.close();
};

MenuWindow.prototype.close = function() {
  document.body.removeChild(this.menu_win);
  document.body.removeChild(this.overlay);
};


var InputWindow = function(content, callback) {
  this.callback = callback;
  this.win = document.createElement('x-modal');
  this.win.className = 'dialog';
  
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
  this.callback(this.inputBox.value);
  this.close();
};

InputWindow.prototype.close = function() {
  document.body.removeChild(this.win);
  document.body.removeChild(this.overlay);
};


var ExtCmdWindow = function(msg) {
  this.win = document.createElement('x-modal');
  this.win.className = 'dialog';
  
  var caption = document.createElement('div');
  caption.textContent = "Extended Commands";
  this.win.appendChild(caption);

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
  }

  this.cancelButton = document.createElement('button');
  this.cancelButton.textContent = 'Cancel';
  this.cancelButton.addEventListener('click', this.cancelButtonAction.bind(this));
  this.win.appendChild(this.cancelButton);
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

ExtCmdWindow.prototype.close = function() {
  document.body.removeChild(this.win);
  document.body.removeChild(this.overlay);
};


var nethackEmbed;

var eventBuffer = new Array();

var awaitingInput = false;

var handleKeyDown = function(evt) {
  var cmdKey = 0;

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
  case 17: // ctrl
    return;
  }

  if (evt.ctrlKey == true) {
    cmdKey = evt.which & 0x1F;
  }

  if (cmdKey != 0) {
    evt.preventDefault();
    var item = [cmdKey, 0, 0, 0];
    eventBuffer.push(item);
    processInput();
  }
};

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

  var canvas = document.getElementById('gameCanvas');
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
  addMenu('game', 'Change Settings...', 'Change Game Settings', ooga);
  addSeparator('game');
  addMenu('game', 'Version', null, ooga);
  addMenu('game', 'History...', null, ooga);
  addMenu('game', 'Compilation...', null, ooga);
  addMenu('game', 'Options...', null, ooga);
  addMenu('game', 'Explore Mode...', null, ooga);
  addSeparator('game');
  addMenu('game', 'New Game', null, ooga);
  addMenu('game', 'Save Game', null, ooga);
  addMenu('game', 'Switch to TTY mode', null, ooga);
  addMenu('game', 'Edit Options File...', null, ooga);
  addMenu('game', 'Exit', null, ooga);

  addMenu('edit', 'Inventory', 'Edit/View your inventory', ooga);
  addMenu('edit', 'Discoveried', 'Edit/View your Discoveries', ooga);
  addMenu('edit', 'List/reorder your spells', 'List/reorder your spells', ooga);
  addMenu('edit', 'Adjust letters', 'Adjust letter for items in your Inventory', ooga);
  addSeparator('edit');
  addMenu('edit', 'Name object', 'Assign a name to an object', ooga);
  addMenu('edit', 'Name creature', 'Assign a name to a creature', ooga);
  addSeparator('edit');
  addMenu('edit', 'Qualifications', 'Edit your Qualifications', ooga);

  addMenu('apparel', 'Wield Weapon', 'Select a weapon to fight with', ooga);
  addMenu('apparel', 'Remove Apparel...', 'Remove apparel dialog box', ooga);
  addSeparator('apparel');
  addMenu('apparel', 'Wear Armor', 'Put on armor', ooga);
  addMenu('apparel', 'Take off Armor', 'Take off armor you are wearing', ooga);
  addMenu('apparel', 'Put on non-armor', 'Put on non-armor apparel', ooga);
  addMenu('apparel', 'Remove non-armor', 'Remove non-armor apparel you are wearing', ooga);

  addMenu('action', 'Get', 'Pick up things at the current location', ooga);
  addMenu('action', 'Loot', 'Loot a box on the floor', ooga);
  addMenu('action', 'Sit', 'Sit Down', ooga);
  addMenu('action', 'Force', 'Force a lock', ooga);
  addMenu('action', 'Kick', 'Kick something (usually a door)', ooga);
  addMenu('action', 'Jump', 'Jump to another location', ooga);
  addMenu('action', 'Ride', 'Ride (or stop riding) a monster', ooga);
  addMenu('action', 'Wipe face', 'Wipe off your face', ooga);
  addMenu('action', 'Throw/Shoot', 'Throw or shoot a weapon', ooga);
  addMenu('action', 'Quiver/Ready', 'Ready or quiver some ammunition', ooga);
  addMenu('action', 'Open Door', 'Open a door', ooga);
  addMenu('action', 'Close Door', 'Close a door', ooga);
  addSeparator('action');
  addMenu('action', 'Drop', 'Drop an object', ooga);
  addMenu('action', 'Drop Many', 'Drop selected types of objects', ooga);
  addMenu('action', 'Eat', 'Eat something', ooga);
  addMenu('action', 'Engrave', 'Write a message in the dust on the floor', ooga);
  addMenu('action', 'Apply', 'Apply or use a tool (pick-axe, key, camera, etc.)', ooga);
  addSeparator('action');
  addMenu('action', 'Up', 'Go up the stairs', ooga);
  addMenu('action', 'Down', 'Go down the stairs', ooga);
  addMenu('action', 'Rest', 'Wait for a moment', ooga);
  addMenu('action', 'Search', 'Search for secret doors, hidden traps and monsters', ooga);
  addSeparator('action');
  addMenu('action', 'Chat', 'Talk to someone', ooga);
  addMenu('action', 'Pay', 'Pay your bill to the shopkeeper', ooga);

  addMenu('magic', 'Quaff potion', 'Drink a potion', ooga);
  addMenu('magic', 'Read Book/Scroll', 'Read a spell book or a scroll', ooga);
  addMenu('magic', 'Zap Wand', 'Zap a wand', ooga);
  addMenu('magic', 'Zap Spell', 'Cast a spell', ooga);
  addMenu('magic', 'Dip', 'Dip an object into something', ooga);
  addMenu('magic', 'Rub', 'Rub something (i.e. a lamp)', ooga);
  addMenu('magic', 'Invoke', "Invoke an object's special powers", ooga);
  addMenu('magic', 'Offer', 'Offer a sacrifice to the gods', ooga);
  addMenu('magic', 'Pray', 'Pray to the gods for help', ooga);
  addMenu('magic', 'Teleport', 'Teleport (if you can)', ooga);
  addMenu('magic', 'Monster Action', "Use a monster's special ability", ooga);
  addMenu('magic', 'Turn Undead', 'Turn undead', ooga);

  addMenu('help', 'About...', 'About Nethack', ooga);
  addMenu('help', 'Help', null, ooga);
  addSeparator('help');
  addMenu('help', 'What is here', 'Check what itemts occupy the current location', ooga);
  addMenu('help', 'What is that', 'Identify an object', ooga);
  addMenu('help', 'Identify a map symbol', 'Identify a map symbol', ooga);

}

function addMenu(menu, text, title, func) {
  var li = document.createElement('li');
  li.innerHTML = text;
  li.addEventListener('click', func);
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

function ooga(evt) {
  alert('foo');
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
  nethackEmbed.postMessage(PREFIX + out);
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

  //TODO(jeffbailey): Colour the cursor
  ctx.beginPath();
  ctx.moveTo(x1, y1);
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
  // console.log(msg);

  switch(msg[0]) {
  case NaclMsg.INIT_NHWINDOWS:
    break;
  case NaclMsg.ASKNAME:
    var getlineWin = new InputWindow("What is your name?", pm);
    getlineWin.display();
    break;
  case NaclMsg.GET_NH_EVENT:
    throw "Not Implemented!";
  case NaclMsg.EXIT_NHWINDOWS:
    throw "Not Implemented!";
  case NaclMsg.SUSPEND_NHWINDOWS:
    throw "Not Implemented!";
  case NaclMsg.RESUME_NHWINDOWS:
    throw "Not Implemented!";
  case NaclMsg.CREATE_NHWINDOW:
    // msg[1]: type
  //  switch(msg[1]) {
  //  case NHWin.MENU:
      win_array[win_num] = new DisplayWindow(document.createElement('pre'));
  //    break;
  //  }

    pm('' + win_num);
    win_num++;
    break;
  case NaclMsg.DISPLAY_NHWINDOW:
    // msg[1]: winid
    // We'll handle root windows ourselves.
    if (msg[1] < 4) {
      if (msg[2] == '1') {
        pm('ACK');
      }
      if (msg[1] == NHWin.MAP) {
        displayMap();
      }
      break;
    }
    win_array[msg[1]].display(msg[2]);
    // TODO(jeffbailey): Window isn't displaying for specifying an object
    // by cursor and then asking for more info.
    break;
  case NaclMsg.DESTROY_NHWINDOW:
    win_array[msg[1]].close();
    win_array[msg[1]] = null;
    break;
  case NaclMsg.PRINT_GLYPH:
    saveGlyph(msg[2], msg[3], msg[4], msg[5]);
    break;
  case NaclMsg.PUTSTR:
    win_array[msg[1]].putStr(msg[3]);
    break;
  case NaclMsg.DISPLAY_FILE:
    var fileWin = new FileWindow(msg[1]);
    fileWin.display();
    break;
  case NaclMsg.RAW_PRINT:
    plineput(msg[1]);
    pm('ack');
    break;
  case NaclMsg.NH_POSKEY:
  case NaclMsg.NHGETCH:
    awaitingInput = true;
    processInput();
    gameScreen.focus();
    break;
  case NaclMsg.YN_FUNCTION:
    plineput(msg[1]);
    awaitingInput = true;
    processInput();
    gameScreen.focus();
  case NaclMsg.CLEAR_NHWINDOW:
    // 1: Window Number
    if (msg[1] == NHWin.MAP) {
      clearGlyphs();
    }
    break;
  case NaclMsg.START_MENU:
    // 1: Window Number
    win_array[msg[1]] = new MenuWindow(document.createElement('table'));
    break;
  case NaclMsg.ADD_MENU:
    // 1: Window Number, 2: tile, 3: identifier, 4: accelerator
    // 5: group accel, 6: attribute, 7: string, 8: presel
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.textContent = msg[7];
    tr.appendChild(td);
    win_array[msg[1]].content.appendChild(tr);
        
    break;
  case NaclMsg.END_MENU:
    // 1: Window ID, 2: Prompt
    win_array[msg[1]].display(0);
    break;
  case NaclMsg.GETLIN:
    var getlineWin = new InputWindow(msg[1], pm);
    getlineWin.display();
    break;
  case NaclMsg.GET_EXT_CMD:
    var extCmdWin = new ExtCmdWindow(msg);
    extCmdWin.display();
    break;
  case NaclMsg.UPDATE_STATS:
    document.getElementById('plname').textContent = msg[1];
    document.getElementById('rank').textContent = msg[2];
    document.getElementById('dname').textContent = msg[3];
    document.getElementById('dlevel').textContent = msg[4];
    document.getElementById('str').textContent = msg[5];
    document.getElementById('dex').textContent = msg[6];
    document.getElementById('con').textContent = msg[7];
    document.getElementById('int').textContent = msg[8];
    document.getElementById('wis').textContent = msg[9];
    document.getElementById('cha').textContent = msg[10];
    document.getElementById('hp').textContent = msg[11];
    document.getElementById('maxhp').textContent = msg[12];
    document.getElementById('ac').textContent = msg[13];
    document.getElementById('power').textContent = msg[14];
    document.getElementById('maxpower').textContent = msg[15];
    document.getElementById('gold').textContent = msg[16];
    document.getElementById('level').textContent = msg[17];
    document.getElementById('xp').textContent = msg[18];
    document.getElementById('time').textContent = msg[19];
    break;
  case NaclMsg.CURS:
    // Window, X, Y
    saveCurs(msg[2], msg[3]);
    break;
  //default:
  //  console.log(event.data.substr(PREFIX.length));
  }
}

function plineput(text) {
  var plinecontent = document.getElementById('tile-plinecontent');
  var p = document.createElement('p');
  p.textContent = text;
  plinecontent.appendChild(p);
  var plinewin = document.getElementById('tile-plinewin');
  plinewin.scrollTop = plinewin.scrollHeight;
}

window.onbeforeunload = function() {
  return 'You will lose any unsaved progress!';
};

startGame();
