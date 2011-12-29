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
      SpanElement cell = pre.nodes[cursor_y].nodes[cursor_x];
      cell.text = s[i];
      cursor_x++;
    }
  }

  // 0: Not acquiring
  // 1: Waiting for [
  // 2: First number
  // 3: Second number
  int inState = 0;
  String acc = '';
  int firstNum = -1;
  int secondNum = -1;
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
      // TODO(jeffbailey): This doesn't handle the single number case without ;
      if (s[0] == ';') {
        firstNum = Math.parseInt(acc);
        acc = '';
        inState = 3;
        return true;
      }
      if (exp.hasMatch(s[0])) {
        acc += s[0];
        return true;
      }
      break;
    case 3:  
      if (exp.hasMatch(s[0])) {
        acc += s[0];
        return true;
      }
      secondNum = Math.parseInt(acc);
      acc = '';
      break;
    }

    switch(s[0]) {
    case 'H':
      if (firstNum == -1) {
        firstNum = 1;
      }
      if (secondNum == -1) {
        secondNum = 1;
      }
      cursor_y = firstNum - 1;
      cursor_x = secondNum - 1;
      clearState();
      return true;
    case 'J':
      if (firstNum == -1) {
        firstNum = 0;
      }
      switch(firstNum) {
      case 0:
        // Clear from cursor to end of line and rest of screen.
      }
      clearState();
      return true;
    }

    // Unknown sequence
    return clearState();
  }

  bool clearState() {
    inState = 0;
    acc = '';
    firstNum = -1;
    secondNum = -1;
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
