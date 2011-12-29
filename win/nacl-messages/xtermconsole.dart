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
  }

  Element createCell() {
    SpanElement c = new Element.tag("span");
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
      SpanElement cell = pre.nodes[cursor_y].nodes[cursor_x];
      cell.text = s[i];
      cursor_x++;
    }
  }

  void handleMessage(var msg) {
    putString(msg.data);
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
