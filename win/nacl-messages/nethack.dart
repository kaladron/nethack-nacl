#import('dart:html');
#import('dart:json');
#import('dart:dom', prefix:'dom');

#source('gnomelike.dart');
#source('nacl_msg.dart');
#source('xtermconsole.dart');

interface NethackUi {
  void setup();

  String get windowtype();

  void handleMessage(var msg);
}


ObjectElement nethackEmbed;

void initNethack(NethackUi game, Map<String, String> options) {
  nethackEmbed = new Element.tag('object');
  nethackEmbed.width = "0";
  nethackEmbed.height = "0";
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
    if (key == 'windowtype') {
      param.value = game.windowtype;
    }
    nethackEmbed.nodes.add(param);
  }

  DivElement listener = document.query("#listener");
  listener.nodes.add(nethackEmbed);
}

DivElement popup;

Element getPopup() {
  return popup;
}

void showPopup() {
  popup.style.width = window.innerWidth.toString() + "px";
  popup.style.height = window.innerHeight.toString() + "px";
  popup.style.display = "block";
}

void clearPopup() {
  popup.style.display = "none";
  popup.innerHTML = "";
}

void showOptions(MouseEvent evt) {
  showPopup();
  evt.preventDefault();
}
  
void addHeader() {
  Element leftList = new Element.tag('ul');
  leftList.style.display = "table-cell";
  leftList.nodes.add(new Element.html('<li>Nethack: TTY Mode</li>'));
  // leftList.nodes.add(new Element.html(
  //  '<li><a href="https://naclhack.appspot.com/" target="_blank">' + 
  //  'Experimental saved games</a></li>'));
  Element options = new Element.html(
    '<li><a href="">Options</a></li>');
  options.on.click.add(showOptions);
  // leftList.nodes.add(options);

  Element rightList = new Element.tag('ul');
  rightList.style.display = "table-cell";
  rightList.style.textAlign = "right";
  rightList.nodes.add(new Element.html(
    '<li><a href="license.html">License</a></li>'
    ));
  rightList.nodes.add(new Element.html(
    '<li><a href="https://github.com/kaladron/nethack-nacl">' + 
    'Source Code</a></li>'));
  rightList.nodes.add(new Element.html(
    '<li><a href="terminal.html">' + 
    'Terminal</a></li>'));

  Element header = document.query('#header');
  header.nodes.add(leftList);
  header.nodes.add(rightList);
}

void initOptions() {
  dom.window.webkitRequestFileSystem(dom.DOMWindow.PERSISTENT, 5*1024*1024, makeOptionsFile);
}

void errorHandler() {
  return;
}

void makeOptionsFile(dom.DOMFileSystem fs) {

//  fs.root.getFile('NetHack.cnf', {'create': true, 'exclusive': true}, (var fileEntry) {
//
//    fileEntry.createWriter((var fileWriter) {
//      var bb = new dom.BlobBuilder();
//      //bb.append('OPTIONS=windowtype:tty,hilite_pet,color');
//      //bb.append('OPTIONS=pickup_types:\$');
//
//    //  fileWriter.write(bb.getBlog('text/plain'));
//    }, errorHandler);
//
//
//  }, errorHandler);
//

  startGame();
}

main() {
  addHeader();
  popup = document.query("#popup");
  initOptions();
}

void startGame() {
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

  NethackUi game;

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
