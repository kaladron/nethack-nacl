/*
 * Copyright (c) 2011 The Native Client Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Implement an xterm-color style console.
 */

/**
 * @namespace Namespace for console related functions/classes.
 */
var console = {};


/**
 * Class implementing a generic console related exception.
 * @param {string} name Text describing the exception.
 * @constructor
 */
console.Exception = function(name) {
  this.name_ = name;
};

console.Exception.prototype.toString = function() {
  return '[' + this.name + ']';
};


/**
 * Class implementing an unknown element id exception.
 * @constructor
 */
console.UnknownElementIdException = function() {
};

/**
 * Convert the exception to a string.
 * @return {string} Text representation of the exception.
 */
console.UnknownElementIdException.prototype.toString = function() {
  return '[UnknownElementIdException]';
};


/**
 * Class implementing an unknown escape sequence exception.
 * @constructor
 */
console.UnknownEscapeSequenceException = function(code) {
  this.code_ = code;
};

/**
 * Convert the exception to a string.
 * @return {string} Text representation of the exception.
 */
console.UnknownEscapeSequenceException.prototype.toString = function() {
  return '[UnknownEscapeSequenceException(' + this.code_ + ')]';
};


/**
 * Class implementing an xterm-color style console.
 * @param {string} consoleId HTML id of console html element.
 * @param {string} naclModuleId HTML id of nacl module, or empty for none.
 * @constructor
 */
console.Console = function(consoleId, naclModuleId) {
  // Lookup console element.
  this.consoleElement_ = document.getElementById(consoleId);
  if (!this.consoleElement_) throw new console.UnknownElementIdException();

  // Lookup nacl module if any.
  if (naclModuleId.length > 0) {
    this.naclModule_ = document.getElementById(naclModuleId);
    if (!this.naclModule_) throw new console.UnknownElementIdException();
  } else {
    this.naclModule_ = null;
  }

  // Use default prefix.
  this.prefix_ = 'JSPipeMount';

  // Store orignal strings.
  this.consoleId_ = consoleId;
  this.naclModuleId_ = naclModuleId;

  // Other defaults.
  this.currentAttribute_ = 0;
  this.currentForeground_ = '#00ff00';
  this.currentBackground_ = '#000000';
  this.pendingCode_ = '';  // Used to track current escape code.
  this.keyboardMap_ = {};  // Mapping from [code, shift, ctrl, alt] to string.

  // Default keyboard mappings.
  this.defaultKeyboard();

  // Default to size 80x25.
  this.resize(80, 25);

  // Start interval for polling screen.
  var this_console = this;
  setInterval(function() { this_console.idle(); }, 30);
};

/**
 * Attach to the nacl module and take over keyboard.
 */
console.Console.prototype.attach = function() {
  // Setup message handler.
  var this_console = this;  // So it stays in scope in the closure.
  this.naclModule_.addEventListener('message', function(msg) {
    var prefix_offset = this_console.prefix_.length + 3;
    var prefix = msg.data.substr(0, prefix_offset);
    if (prefix == this_console.prefix_ + ':1:' ||
        prefix == this_console.prefix_ + ':2:') {
      this_console.write(msg.data.substr(prefix_offset));
    }
  }, false);
  // Take over keyboard.
  var focus_this = this;;
  document.onkeypress = function(evt) { return focus_this.keypress(evt); };
  document.onkeydown = function(evt) { return focus_this.keydown(evt); };
  document.onkeyup = function(evt) { return focus_this.keyup(evt); };
};

/**
 * Resize the console.
 * @param {number} width Resize target width.
 * @param {number} height Resize target height.
 */
console.Console.prototype.resize = function(width, height) {
  this.width_ = width;
  this.height_ = height;
  this.size_ = width * height;
  this.max_ = this.size_ - 1;
  this.symbol_ = new Array(this.size_);
  this.attribute_ = new Array(this.size_);
  this.foreground_ = new Array(this.size_);
  this.background_ = new Array(this.size_);
  this.clear();
};

/**
 * Clear a portion of the console.
 * @param {number} start Where to start.
 * @param {number} end One past where to end.
 */
console.Console.prototype.clearRange = function(start, end) {
  for (var i = start; i < end; i++) {
    this.symbol_[i] = ' ';
    this.attribute_[i] = this.currentAttribute_;
    this.foreground_[i] = this.currentForeground_;
    this.background_[i] = this.currentBackground_;
  }
  this.updateDOM();
};

/**
 * Clear the console, place the cursor in home position.
 */
console.Console.prototype.clear = function() {
  var sz = this.width_ * this.height_;
  this.clearRange(0, sz);
  this.position_ = 0;
};

/**
 * Write text to the console.
 * @param {string} str Text to output.
 */
console.Console.prototype.write = function(str) {
  var len = str.length;
  for (var i = 0; i < len; i++) {
    this.writeChar(str.charAt(i));
  }
  if (str.length > 0) {
    this.updateDOM();
  }
};

/**
 * Write a single character to the console.
 * @param {string} ch Character to output.
 */
console.Console.prototype.writeChar = function(ch) {
  if (this.pendingCode_ != '' || ch =='\x1b') {
    var code = this.pendingCode_ + ch;
    this.pendingCode_ = '';
    if (code == '\x1b' + '[C') {
      this.position_++;
    } else if (code == '\x1b' + '[A') {
      this.position_ -= this.width_;
    } else if (code == '\x1b' + '[B') {
      this.position_ += this.width_;
    } else if (code == '\x1b' + '[K') {
      var next = Math.floor((this.position_ + this.width_) /
                            this.width_) * this.width_;
      this.clearRange(this.position_, next);
    } else if (code == '\x1b' + '[J') {
      this.clearRange(this.position_, this.size_);
    } else if (code == '\x1b' + '[m') {
      this.currentAttribute_ = console.attributeTable[0];
    } else if (code.charAt(1) == '[' &&
               code.charAt(code.length - 1) == 'm') {
      var subCodes = code.substr(2, code.length - 3).split(';');
      for (var i = 0; i < subCodes.length; i++) {
        var subCode = parseInt(subCodes[i]);
        if (subCode >= 0 && subCode <= 9) {
          this.currentAttribute_ = console.attributeTable[subCode];
        } else if (subCode >= 30 && subCode <= 39) {
          this.currentForeground_ = console.colorTable[subCode - 30];
        } else if (subCode >= 40 && subCode <= 49) {
          this.currentBackground_ = console.colorTable[subCode - 40];
        }
      }
    } else if (code.charAt(1) == '[' &&
               code.charAt(code.length - 1) == 'H') {
      var coords = code.substr(2, code.length - 3);
      coords = coords.split(';');
      var x, y;
      while (coords.length < 2) { coords.push('1'); }
      if (coords[0] == '') coords[0] = '1';
      if (coords[1] == '') coords[1] = '1';
      x = parseInt(coords[1]) - 1;
      y = parseInt(coords[0]) - 1;
      this.position_ = x + y * this.width_;
    } else if (code.charAt(1) == '[' &&
               code.charAt(code.length - 1) >= 64) {
      // Skip unknown ANSI style codes.
    } else if (code.length > 20) {
      throw new console.UnknownEscapeSequenceException(code);
    } else {
      // Wait for now input.
      this.pendingCode_ = code;
    }
  } else if (ch == '\x07') {
    // Ignore bell for now.
  } else if (ch == '\r') {
    this.position_ = Math.floor(this.position_ / this.width_) * this.width_;
  } else if (ch == '\n') {
    this.position += this.width_;
    this.position = Math.floor(this.position_ / this.width_) * this.width_;
  } else if (ch == '\x08') {
    this.position_--;
  } else if (ch.charCodeAt(0) < 32) {
    //throw new console.UnknownEscapeSequenceException(ch.charCodeAt(0));
  } else {
    this.symbol_[this.position_] = ch;
    this.attribute_[this.position_] = this.currentAttribute_;
    this.foreground_[this.position_] = this.currentForeground_;
    this.background_[this.position_] = this.currentBackground_;
    this.position_++;
  }
  // Clip current position to screen.
  if (this.position_ < 0) { this.position_ = 0; }
  if (this.position_ > this.max_) { this.position_ = this.max_; }
};

/**
 * Update DOM to reflect the state of the console.
 */
console.Console.prototype.updateDOM = function() {
  var items = [];
  var len = this.size_;
  for (var i = 0; i < this.size_; i++) {
    var ch = this.symbol_[i];
    var attr = this.attribute_[i];
    var fg = this.foreground_[i];
    var bg = this.background_[i];

    // handle reverse (or cursor).
    if (attr & 0x8 || i == this.position_) {
      var tmp = fg;
      fg = bg;
      bg = tmp;
    }

    if (ch == '<') {
      ch = '&lt;';
    } else if (ch == '>') {
      ch = '&gt;';
    } else if (ch == ' ') {
      ch = '&nbsp;';
    }

    ch = '<span style="color:' + fg + '; background-color:' + bg + ';">' +
         ch + '</span>';

    if (attr & 0x1) { ch = '<b>' + ch + '</b>'; }
    if (attr & 0x2) { ch = '<i>' + ch + '</i>'; }
    if (attr & 0x4) { ch = '<u>' + ch + '</u>'; }

    items.push(ch);

    if (i % this.width_ == this.width_ - 1) {
      items.push('<br>\n');
    }
  }
  this.consoleElement_.innerHTML = items.join('');
};

/**
 * Mapping from VT attribute codes to our format.
 * @const
 * @type {Object.<number, number>}
 */
console.attributeTable = {
  0: 0,  // normal
  1: 1,  // bright (bold)
  2: 2,  // dim (italic)
  3: 2,  // italic
  4: 4,  // underline
  5: 3,  // blink slow (bold italic)
  6: 7,  // blink rapid (bold italic underline)
  7: 8,  // reverse
  8: 9,  // conceal (revert bold)
  9: 12,  // crossed out (revert underline)
};

/**
 * Mapping from small integers to html colors.
 * @const
 * @type {Object.<number, string>}
 */
console.colorTable = {
  0: '#000000',
  1: '#ff0000',
  2: '#00ff00',
  3: '#ffff00',
  4: '#0000ff',
  5: '#ff00ff',
  6: '#00ffff',
  7: '#ffffff',
};

/**
 * Handle input of text.
 * @param {string} str Text typed to console.
 */
console.Console.prototype.got = function(str) {
  // Ignore input if no nacl module.
  if (!this.naclModule_) return;
  // Send to nacl module.
  this.naclModule_.postMessage('JSPipeMount:0:' + str);
};

/**
 * Set a keyboard mapping.
 * @param {boolean} keypress For keypress, rather than keydown?
 * @param {number} code The key code.
 * @param {boolean} shift Is the shift key down?
 * @param {boolean} ctrl Is the ctrl key down?
 * @param {boolean} alt Is the alt key down?
 * @param {string|null} escapeCode Text to emit to console for this key.
 */
console.Console.prototype.setKey = function(
    keypress, code, shift, ctrl, alt, escapeCode) {
  var packed = '' + keypress + '_' + code + '_' +
               shift + '_' + ctrl + '_' + alt;
  this.keyboardMap_[packed] = escapeCode;
};

/**
 * Get a keyboard mapping.
 * @param {boolean} keypress For keypress, rather than keydown?
 * @param {number} code The key code.
 * @param {boolean} shift Is the shift key down?
 * @param {boolean} ctrl Is the ctrl key down?
 * @param {boolean} alt Is the alt key down?
 * @return {string|null} Text to emit to console for this key or null.
 */
console.Console.prototype.getKey = function(
    keypress, code, shift, ctrl, alt) {
  var packed = '' + keypress + '_' + code + '_' +
               shift + '_' + ctrl + '_' + alt;
  return this.keyboardMap_[packed];
};

/**
 * Setup default keyboard mappings.
 */
console.Console.prototype.defaultKeyboard = function() {
  this.setKey(true, 13, false, false, false, '\n');  // enter
  this.setKey(false, 13, false, false, false, '\n');  // enter
  this.setKey(false, 8, false, false, false, '\x08');  // backspace
  this.setKey(false, 9, false, false, false, '\x09');  // tab
  this.setKey(false, 46, false, false, false, '\x1b' + '[3~');  // delete
  this.setKey(false, 45, false, false, false, '\x1b' + '[2~');  // insert
  this.setKey(false, 38, false, false, false, '\x1b' + '[A');  // up
  this.setKey(false, 40, false, false, false, '\x1b' + '[B');  // down
  this.setKey(false, 39, false, false, false, '\x1b' + '[C');  // right
  this.setKey(false, 37, false, false, false, '\x1b' + '[D');  // left
  this.setKey(false, 36, false, false, false, '\x1b' + '[1~');  // home
  this.setKey(false, 35, false, false, false, '\x1b' + '[4~');  // end
  this.setKey(false, 33, false, false, false, '\x1b' + '[5~');  // pgup
  this.setKey(false, 34, false, false, false, '\x1b' + '[6~');  // pgdn
  this.setKey(false, 27, false, false, false, '\x1b');  // escape
  for (var i = 1; i <= 10; i++) {
    this.setKey(false, i + 111, false, false, false,
                '\x1b' + '[' + (i + 11) + '~');  // F1-F10
  }
};

/**
 * Setup nethack specific keyboard mappings.
 */
console.Console.prototype.nethackKeyboard = function() {
  this.setKey(false, 38, false, false, false, 'k');  // up
  this.setKey(false, 38, true, false, false, 'K');  // shift-up
  this.setKey(false, 40, false, false, false, 'j');  // down
  this.setKey(false, 40, true, false, false, 'J');  // shift-down
  this.setKey(false, 39, false, false, false, 'l');  // right
  this.setKey(false, 39, true, false, false, 'L');  // shift-right
  this.setKey(false, 37, false, false, false, 'h');  // left
  this.setKey(false, 37, true, false, false, 'H');  // shift-left
  this.setKey(false, 36, false, false, false, 'y');  // home
  this.setKey(false, 36, true, false, false, 'Y');  // shift-home
  this.setKey(false, 35, false, false, false, 'b');  // end
  this.setKey(false, 35, true, false, false, 'B');  // shift-end
  this.setKey(false, 33, false, false, false, 'u');  // pgup
  this.setKey(false, 33, true, false, false, 'U');  // shift-pgup
  this.setKey(false, 34, false, false, false, 'n');  // pgdn
  this.setKey(false, 34, true, false, false, 'N');  // shift-pgdn
};

/**
 * Handle a keypress.
 * @param {Object} evt A key event.
 */
console.Console.prototype.keypress = function(evt) {
  // Check keyboard mappings.
  var escapeCode = this.getKey(true, evt.keyCode,
                               evt.shiftKey, evt.ctrlKey, evt.altKey);
  if (escapeCode != null) {
    this.got(escapeCode);
    return false;
  }
  // Fallback for normal keys.
  if (evt.which && evt.charCode) {
    var key = String.fromCharCode(evt.which);
    this.got(key);
    return false;
  }
  return true;
}

/**
 * Handle a keydown.
 * @param {Object} evt A key event.
 */
console.Console.prototype.keydown = function(evt) {
  // Check keyboard mappings.
  var escapeCode = this.getKey(false, evt.keyCode,
                               evt.shiftKey, evt.ctrlKey, evt.altKey);
  if (escapeCode != null) {
    this.got(escapeCode);
    return false;
  }
  return true;
}

/**
 * Handle a keyup.
 * @param {Object} evt A key event.
 */
console.Console.prototype.keyup = function(evt) {
  // Check keyboard mappings.
  var escapeCode = this.getKey(false, evt.charCode,
                               evt.shiftKey, evt.ctrlKey, evt.altKey);
  if (escapeCode != null) {
    return false;
  }
  return true;
}

/**
 * Handle an idle tick.
 */
console.Console.prototype.idle = function() {
  this.got('');
}
