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

var ctx;
var tiles;
var petmark;

var DisplayWindow = function(content) {
  this.menu_win = document.createElement('x-modal');
  this.menu_win.className = 'dialog';
  this.content = content;
  this.menu_win.appendChild(content);
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'OK';
  button.addEventListener('click', this.okButton.bind(this));
  this.menu_win.appendChild(button);
  this.block = false;
};

DisplayWindow.prototype.display = function(block) {
  document.body.appendChild(this.menu_win);
  if (block == 1) {
    this.block = true;
  }
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
};

MenuWindow.prototype.display = function(block) {
  document.body.appendChild(this.menu_win);
  if (block == 1) {
    this.block = true;
  }
};

MenuWindow.prototype.okButtonAction = function() {
  pm('OK');
  this.close();
};

MenuWindow.prototype.cancelButtonAction = function() {
  pm('-1');
  this.close();
};

MenuWindow.prototype.close = function() {
  document.body.removeChild(this.menu_win);
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

var startGame = function() {

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
  petmark.src = 'petmark.png';

  document.body.addEventListener('keydown', handleKeyDown);
  document.body.addEventListener('keypress', handleKeyPress);

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

  document.getElementById('listener').appendChild(nethackEmbed);
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

var putTile = function(x, y, tile, pet) {
  x--;

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
  var msg = JSON.parse(event.data.substr(PREFIX.length));
  console.log(msg);
  switch(msg[0]) {
  case NaclMsg.INIT_NHWINDOWS:
    break;
  case NaclMsg.ASKNAME:
    pm('bob');
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
      break;
    }
    win_array[msg[1]].display(msg[2]);
    break;
  case NaclMsg.DESTROY_NHWINDOW:
    win_array[msg[1]].close();
    win_array[msg[1]] = null;
    break;
  case NaclMsg.PRINT_GLYPH:
    putTile(msg[2], msg[3], msg[4], msg[5]);
    break;
  case NaclMsg.PUTSTR:
    win_array[msg[1]].putStr(msg[3]);
    break;
  case NaclMsg.RAW_PRINT:
    var pline = document.getElementsByClassName('plineDiv')[0];
    var text = document.createTextNode(msg[1]);
    pline.appendChild(text);
    pm('ack');
    break;
  case NaclMsg.NH_POSKEY:
  case NaclMsg.NHGETCH:
    awaitingInput = true;
    processInput();
    break;
  case NaclMsg.YN_FUNCTION:
    var pline = document.getElementsByClassName('plineDiv')[0];
    var text = document.createTextNode(msg[1]);
    pline.appendChild(text);
    awaitingInput = true;
    processInput();
  case NaclMsg.CLEAR_NHWINDOW:
    if (msg[1] == NHWin.MAP) {
      ctx.clearRect(0, 0, pixwidth, pixheight);
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
  //default:
  //  console.log(msg);
  }
}

startGame();
