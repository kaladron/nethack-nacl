#import('dart:html');
#import('dart:json');

#source('gnomelike.dart');
#source('nacl_msg.dart');
#source('xtermconsole.dart');

interface NethackUi {
  void setup();

  String get windowtype();

  void handleMessage(var msg);
}


ObjectElement nethackEmbed;


void initNethack(game) {
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
  Storage ls = window.localStorage;
  String ui = ls.getItem('ui');
  if (ui == null) {
    ui = "tty";
    ls.setItem("ui", ui);
  }

  // Dart's interfaces are broken, so we use the weak typing.

  var game;

  switch(ui) {
  case "tty":
    game = new XtermConsole(); // XtermConsole
    break;
  case "gnomelike":
    game = new GnomeLike(); // GnomeLike
    break;
  }
  initNethack(game);
  game.setup();
}
