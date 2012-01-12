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

void initNethack(game, Map<String, String> options) {
  nethackEmbed = new Element.tag('object');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.on['message'].add(game.handleMessage);
  nethackEmbed.data = "nethack.nmf";
  nethackEmbed.type = "application/x-nacl";

  List<String> keys = options.getKeys();
  Iterator<String> i = keys.iterator();

  while (i.hasNext()) {
    ParamElement param = new Element.tag('param');
    String key = i.next();
    param.name = key;
    param.value = options[key];
    nethackEmbed.nodes.add(param);
  }

  DivElement listener = document.query("#listener");
  listener.nodes.add(nethackEmbed);
}
  

main() {
  Storage ls = window.localStorage;
  String optionsString = ls.getItem('options');
  Map<String,String> options;
  if (optionsString == null) {
    options = new Map<String, String>();
    options["windowtype"] = "tty";
    options["color"] = "";
    options["hilite_pet"] = "";
    options["pickup_types"] = "\$";
    ls.setItem("options", JSON.stringify(options));
  } else {
    options = JSON.parse(optionsString);
  }

  // Dart's interfaces are broken, so we use the weak typing.

  var game;

  switch(options["windowtype"]) {
  case "tty":
    game = new XtermConsole(); // XtermConsole
    break;
  case "gnomelike":
    game = new GnomeLike(); // GnomeLike
    break;
  }
  initNethack(game, options);
  game.setup();
}
