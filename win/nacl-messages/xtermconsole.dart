#import('dart:html');
#import('dart:json');

interface NethackUi {
  void setup();

  String get windowtype();

  void handleMessage(var msg);
}


class XtermConsole {
  String windowtype = "tty";

  int width = 80;
  int height = 24;

  int cursor_x = 0;
  int cursor_y = 0;

  PreElement pre;

  var prefix = 'JSPipeMount:1:';

  void setup() {
    numbers = new List<int>();
    DivElement game = document.query("#game");
    pre = new Element.tag("pre");

    for (int y = 0; y < height; y++) {
      SpanElement r = new Element.tag("span");
      r.classes = ['x-line'];

      for (int x = 0; x < width; x++) {
        r.nodes.add(createCell());
      }

      pre.nodes.add(r);
    }

    game.nodes.add(pre);

    //document.on.keyDown.add((KeyboardEvent evt) {
    //
    //}

    document.on.keyPress.add((KeyboardEvent evt) {
      if (evt.charCode == 13) {
        got('\n');
        return false;
      }

      if (evt.which != 0 && evt.charCode != 0) {
        String key = new String.fromCharCodes([evt.which]);
        got(key);
        return false;
      }
    });
  }

  void got(String str) {
    nethackEmbed.postMessage('JSPipeMount:0:' + str);
  }

  Element createCell() {
    SpanElement c = new Element.tag("span");
    c.attributes['data-fg'] = 'lime';
    c.attributes['data-bg'] = 'black';
    c.text = ' ';
    return c;
  }

  void putString(s) {
    for (int i = 0; i < s.length; i++) {
      if (cursor_x >= width) {
        cursor_x = 0;
        cursor_y++;
      }
      if (cursor_y >= height) {
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
      cursor_x++;
    }
  }

  bool specialChar(String s) {
    int ch = s.charCodeAt(0);
    if (ch >= 32) {
      return false;
    }

    switch(ch) {
    case 8:
      SpanElement cell = pre.nodes[cursor_y].nodes[cursor_x];
      // TODO(jeffbailey): Make safe backspace.
      cursor_x--;
    }
    return true;
  }

  // 0: Not acquiring
  // 1: Waiting for [
  // 2: number collection
  int inState = 0;
  String acc = '';
  List<int> numbers;
  RegExp exp = const RegExp(@"[0-9]");

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
          SpanElement cell = pre.nodes[cursor_y].nodes[x];
          cell.text = ' ';
        }    
        for (int y = cursor_y + 1; y < height; y++) {
          for (int x = 0; x < width; x++) {
            SpanElement cell = pre.nodes[y].nodes[x];
            cell.text = ' ';
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
          SpanElement cell = pre.nodes[cursor_y].nodes[i];
          cell.text = ' ';
        }    
        break;
      case 1:
        // Clear from cursor to start of line.
        for (int i = cursor_x; i <= 0; i--) {
          SpanElement cell = pre.nodes[cursor_y].nodes[i];
          cell.text = ' ';
        }
        break;
      case 2:
        // Clear whole line.
        for (int i = 0; i < width; i++) {
          SpanElement cell = pre.nodes[cursor_y].nodes[i];
          cell.text = ' ';
        }    
        break;
      }
      clearState();
      return true;
    case 'm':
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
  }

  void handleMessage(var msg) {
    if (!msg.data.startsWith(prefix)) return;
    putString(msg.data.substring(prefix.length));
  }
}

ObjectElement nethackEmbed;


void initNethack(XtermConsole game) {
  ParamElement param = new Element.tag('param');
  param.name = "windowtype";
  param.value = game.windowtype;

  nethackEmbed = new Element.tag('object');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.on['message'].add(game.handleMessage);
  nethackEmbed.data = "nethack.nmf";
  nethackEmbed.type = "application/x-nacl";
  nethackEmbed.nodes.add(param);

  DivElement listener = document.query("#listener");
  listener.nodes.add(nethackEmbed);
}
  

main() {
  XtermConsole game = new XtermConsole();
  initNethack(game);
  game.setup();
}
