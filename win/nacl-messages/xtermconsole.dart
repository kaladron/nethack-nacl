class XtermConsole {
  String windowtype = "tty";

  int width = 80;
  int height = 25;

  int cursor_x = 0;
  int cursor_y = 0;

  PreElement pre;

  var prefix = 'JSPipeMount:1:';

  Map<int, String> keyMap;

  void setup() {
    numbers = new List<int>();
    DivElement game = document.query("#game");
    pre = new Element.tag("pre");
    pre.id = "x-pre";

    for (int y = 0; y < height; y++) {
      SpanElement r = new Element.tag("span");
      r.classes = ['x-line'];

      for (int x = 0; x < width; x++) {
        r.nodes.add(createCell());
      }

      pre.nodes.add(r);
    }

    game.nodes.add(pre);

    toggleCursor();

    setupKeyMap();
    
    document.on.keyDown.add((KeyboardEvent evt) {
      if (keyMap.containsKey(evt.keyCode)) {
        got(keyMap[evt.keyCode]);
        evt.preventDefault();
        return false;
      }

      if (evt.ctrlKey == false) {
        return true;
      }

      evt.preventDefault();

      if (evt.which == 17) {
        return true;
      }

      this.got(new String.fromCharCodes([evt.which & 0x1F]));
      return true;
    });

    document.on.keyPress.add((KeyboardEvent evt) {
      if (evt.which != 0 && evt.charCode != 0) {
        String key = new String.fromCharCodes([evt.which]);
        got(key);
        return false;
      }
    });
  }

  void setupKeyMap() {
    keyMap = new Map<int, String>();
    keyMap[8] = '\x08'; // backspace
    keyMap[9] = '\x09'; // tab
    keyMap[13] = '\n'; //enter
    //keyMap[38] = '\x1b' + '[A'; // up

    // TODO(jeffbailey): Split this into a nethackKeyMap, handle shift-arrows
    keyMap[38] = 'k';
    keyMap[40] = 'j';
    keyMap[39] = 'l';
    keyMap[37] = 'h';
    keyMap[36] = 'y';
    keyMap[35] = 'b';
    keyMap[33] = 'u';
    keyMap[34] = 'n';
  }


  void got(String str) {
    nethackEmbed.postMessage('JSPipeMount:0:' + str);
  }

  Element createCell() {
    SpanElement c = new Element.tag("span");
    c.attributes['data-fg'] = 'hcolour2';
    c.attributes['data-bg'] = 'colour0';
    c.text = ' ';
    c.classes = ['x-cell'];
    return c;
  }

  void toggleCursor() {
    SpanElement cell = pre.nodes[cursor_y].nodes[cursor_x];
    String temp = cell.attributes['data-fg'];
    cell.attributes['data-fg'] = cell.attributes['data-bg'];
    cell.attributes['data-bg'] = temp;
  }

  void putString(String s) {
    toggleCursor();
    for (int i = 0; i < s.length; i++) {
      if (cursor_x >= width) {
        cursor_x = 0;
        cursor_y++;
      }
      if (cursor_y >= height) {
        toggleCursor();
        return;
      }
      if (sequenceCheck(s[i])) {
        continue;
      }
      if (specialChar(s[i])) {
        continue;
      }

      SpanElement cell = pre.nodes[cursor_y].nodes[cursor_x];
      cell.text = s[i];
      setColour(cell);
      cursor_x++;
    }
    toggleCursor();
  }

  bool specialChar(String s) {
    int ch = s.charCodeAt(0);
    if (ch >= 32) {
      return false;
    }

    switch(ch) {
    case 8:
      cursor_x--;
      if (cursor_x < 0 ) {
        cursor_x = width - 1;
        cursor_y--;
      }
      if (cursor_y < 0) {
        cursor_x = 0;
        cursor_y = 0;
      }
      return true;
    case 10:
      cursor_x = 0;
      // TODO(jeffbailey): This should scroll the screen.
      if (cursor_y != width -1) {
        cursor_y++;
      }
      return true;
    case 13:
      cursor_x = 0;
      return true;
    }
    print('Unknown special char: ' + ch.toString());
    return true;
  }

  void setColour(Element cell) {
    if (bright) {
      cell.attributes['data-fg'] = "hcolour" + foreground.toString();
    } else {
      cell.attributes['data-fg'] = "colour" + foreground.toString();
    }
    cell.attributes['data-bg'] = "colour" + background.toString();
  }

  void clearCell(Element cell) {
    cell.text = ' ';
    setColour(cell);
  }
 
  

  // 0: Not acquiring
  // 1: Waiting for [
  // 2: number collection
  int inState = 0;
  String acc = '';
  List<int> numbers;
  RegExp exp = const RegExp(@"[0-9]");
  int foreground = 2;
  int background = 0;
  int defaultForeground = 2;
  int defaultBackground = 0;

  bool underline = false;
  bool bright = false;

  // Handles Escape Squences.  If we're handling a sequence, return true;
  bool sequenceCheck(String s) {

    switch(inState) {
    case 0:
      if (s[0] == '\x1b') {
        inState = 1;
        return true;
      }
      return false;
    case 1:
      if (s[0] == '[') {
        inState = 2;
        return true;
      }
      return clearState();
    case 2:
      if (exp.hasMatch(s[0])) {
        acc += s[0];
        return true;
      }

      if (acc == '') {
        numbers.add(-1);
      } else {
        int token = Math.parseInt(acc);
        numbers.add(token);
        acc = '';
      }

      if (s[0] == ';') {
        return true;
      }
    }

    //printSeq(s[0]);
    switch(s[0]) {
    case 'A':
      if (cursor_y != 0) {
        cursor_y--;
      }
      clearState();
      return true;
    case 'B':
      if (cursor_y < height) {
        cursor_y++;
      }
      clearState();
      return true;
    case 'C':
      if (cursor_x < width) {
        cursor_x++;
      }
      clearState();
      return true;
    case 'D':
      if (cursor_x != 0) {
        cursor_x--;
      }
      clearState();
      return true;
    case 'H':
      for (int x = numbers.length; x < 2; x++) {
        numbers.add(-1);
      }

      if (numbers[0] == -1) {
        numbers[0] = 1;
      }
      if (numbers[1] == -1) {
        numbers[1] = 1;
      }
      cursor_y = numbers[0] - 1;
      cursor_x = numbers[1] - 1;
      clearState();
      return true;
    case 'J':
      if (numbers[0] == -1) {
        numbers[0] = 0;
      }
      switch(numbers[0]) {
      case 0:
        // Clear from cursor to end of line and rest of screen.
        for (int x = cursor_x; x < width; x++) {
          clearCell(pre.nodes[cursor_y].nodes[x]);
        }    
        for (int y = cursor_y + 1; y < height; y++) {
          for (int x = 0; x < width; x++) {
            clearCell(pre.nodes[y].nodes[x]);
          }
        }
      }
      clearState();
      return true;
    case 'K':
      if (numbers[0] == -1) {
        numbers[0] = 0;
      }
      switch(numbers[0]) {
      case 0:
        // Clear from cursor to end of line;
        for (int i = cursor_x; i < width; i++) {
          clearCell(pre.nodes[cursor_y].nodes[i]);
        }    
        break;
      case 1:
        // Clear from cursor to start of line.
        for (int i = cursor_x; i <= 0; i--) {
          clearCell(pre.nodes[cursor_y].nodes[i]);
        }
        break;
      case 2:
        // Clear whole line.
        for (int i = 0; i < width; i++) {
          clearCell(pre.nodes[cursor_y].nodes[i]);
        }    
        break;
      }
      clearState();
      return true;
    case 'm':
      Iterator<int> numItr = numbers.iterator();
      while(numItr.hasNext()) {
        int attr = numItr.next();
        if (attr == -1) {
          attr = 0;
        }
        switch(attr) {
        case 0:
          foreground = defaultForeground;
          background = defaultBackground;
          bright = false;
          continue;
        case 1:
          bright = true;
          continue;
        case 7:
          int tmp = foreground;
          foreground = background;
          background = tmp;
          continue;
        }

        if (attr >= 30 && attr <= 37) {
          foreground = attr - 30;
          continue;
        }

        if (attr >= 40 && attr <= 47) {
          background = attr - 40;
          continue;
        }

        print('Unrecognised attribute for "m" directive: ' + attr.toString());
      }
      clearState();
      return true;
    }

    // Unknown sequence
    print('Unknown sequence: ' + s);
    return clearState();
  }

  void printLoc() {
    print('x: ' + cursor_x.toString() + ' y: ' + cursor_y.toString());
  }

  void printSeq(String s) {
    String out = "[";
    for (int x = 0; x < numbers.length; x++) {
      out += numbers[x].toString() + ";";
    }
    out += s;
    print(out);
  }

  bool clearState() {
    inState = 0;
    acc = '';
    numbers = new List<int>();
    return false;
    bright = false;
  }

  void handleMessage(var msg) {
    if (!msg.data.startsWith(prefix)) return;
    putString(msg.data.substring(prefix.length));
  }
}
