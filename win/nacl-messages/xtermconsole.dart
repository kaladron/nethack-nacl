#import('dart:html');
#import('dart:json');

interface NethackUi {
  void setup();

  String get windowtype();

  void handleMessage(var msg);
}


class XtermConsole {
  String windowtype = "tty";

  void setup() {

  }

  void handleMessage(var msg) {
    print(msg.data);
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
