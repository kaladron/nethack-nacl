#import('dart:html');
#import('dart:json');

#source('nacl_msg.dart');
#source('nacl_glyph.dart');

class x11tiles {
  String src = "x11tiles.png";
  int TILE_SQUARE = 16;
}

int height = 24;
int width = 80;
int DISPLAY_SQUARE = 16;
int SCROLLBUFFER_SIZE = 2500;

void initNetHack(evt) {
  nethackEmbed = new Element.tag('embed');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.on.load.add(setupKeyListener);
  nethackEmbed.on['message'].add(handleMessage);
  nethackEmbed.src = "nethack.nmf";
  nethackEmbed.type = "application/x-nacl";
  DivElement listener = document.query("#listener");
  listener.nodes.add(nethackEmbed);
}

Queue<List<String>> eventBuffer;
bool awaitingInput = false;

void setupKeyListener(evt) {
  document.on.keyPress.add((evt) {
    int ch = evt.which;
    //if (ch == undefined) ch = evt.keyCode;
    eventBuffer.add([ch, 0, 0, 0]);
    processInput();
    return false;
  });
}

void processInput() {
  if (awaitingInput && eventBuffer.length > 0) {
    awaitingInput = false;
    List<String> event = eventBuffer.removeFirst();
    String cmd = Strings.join(event, " ");
    print(cmd);
    pm(cmd);
  }
}

void handleMessage(var msg) {
  var data = JSON.parse(msg.data);
  print(data);
  switch (data[0]) {
    case NaclMsg.NACL_MSG_ASKNAME:
      pm('bob');
      break;

    // Args: Window Number
    case NaclMsg.NACL_MSG_CLEAR_NHWINDOW:
    print(data[1]);
    if (data[1] == 3) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    break;

    case NaclMsg.NACL_MSG_CREATE_NHWINDOW:
      pm('' + win_num);
      win_num++;
      break;

    // Args: Window, X, Y, glyph
    case NaclMsg.NACL_MSG_PRINT_GLYPH:
      putGlyph(data[2], data[3], data[4]);
      break;

    // Args: Window, Attribute, Text
    case NaclMsg.NACL_MSG_PUTSTR:
      putStr(data[1], data[2], data[3]);
      break;

    // Args: String
    case NaclMsg.NACL_MSG_RAW_PRINT:
      putStr(0, 0, data[1]);
      pm('ack');
      break;

    // Args: String
    case NaclMsg.NACL_MSG_RAW_PRINT_BOLD:
      // Make raw print synchronous for now to aid crash debugging.
      putStr(0, 0, data[1]);
      pm('ack');
      break;

    // Args: String
    case NaclMsg.NACL_MSG_YN_FUNCTION:
      // Make YN_FUNCTION synchronous for now to aid crash debugging.
      putStr(0, 0, data[1]);
      awaitingInput = true;
      processInput();
      break;

    // Args: window, glyph, id, accell, group_accell, attr, str, presel
    case NaclMsg.NACL_MSG_ADD_MENU:
      putStr(0, 0, data[7]);
      break;

    case NaclMsg.NACL_MSG_SELECT_MENU:
      // TODO: make this actually select from a menu.
      // Should return a count of items selected, follow by their
      // identifiers (as ints).
      // -1 indicates cancel (doing that for now).
      pm('-1');
      break;

    case NaclMsg.NACL_MSG_NH_POSKEY:
    case NaclMsg.NACL_MSG_NHGETCH:
      awaitingInput = true;
      processInput();
      break;

    default:
      // Print text readable version.
      break;
  }
}

void pm(out) {
  nethackEmbed.postMessage(out);
}

int TILES_PER_ROW = 40;
int TILE_SQUARE = 16;

void putGlyph(int x, int y, int glyph) {
  int tile = GLYPH2TILE[glyph];
  int tile_x = tile % TILES_PER_ROW;
  int tile_y = (tile / TILES_PER_ROW).floor();

  ctx.drawImage(image, tile_x * TILE_SQUARE,
                tile_y * TILE_SQUARE,
                TILE_SQUARE,
                TILE_SQUARE,
                x * DISPLAY_SQUARE,
                y * DISPLAY_SQUARE,
                DISPLAY_SQUARE,
                DISPLAY_SQUARE);
}

void putStr(int win, int attr, String text) {
  Element newDiv = new Element.tag('div');
  newDiv.text = text;
  textWindow.nodes.add(newDiv);
  if (textWindow.nodes.length > SCROLLBUFFER_SIZE) {
    textWindow.nodes[0].remove();
  }  
  textWindow.scrollTop = textWindow.scrollHeight;
}

bool mouseNav(MouseEvent evt) {
  canvas.rect.then((ElementRect elementRect) {
    int x = evt.pageX - elementRect.offset.left;
    int y = evt.pageY - elementRect.offset.top;
    x = (x / TILE_SQUARE).floor();
    y = (y / TILE_SQUARE).floor();
    eventBuffer.add([0, x, y, 0]);
    processInput();
  });
  return true;
}

int win_num = 1;
EmbedElement nethackEmbed;
CanvasElement canvas;
CanvasRenderingContext2D ctx;
ImageElement image;
DivElement textWindow;

main() {
  int pixheight = height * DISPLAY_SQUARE;
  int pixwidth = width * DISPLAY_SQUARE;

  canvas = document.query("#canvas");
  ctx = canvas.getContext("2d");
  canvas.width = pixwidth;
  canvas.height = pixheight;
  canvas.style.width = pixwidth;
  canvas.style.height = pixheight;
  canvas.on.mouseDown.add(mouseNav);

  image = new Element.tag('img');
  image.on.load.add(initNetHack);
  image.src = "x11tiles.png";

  eventBuffer = new Queue<List<String>>();
  textWindow = document.query("#textwindow");
}
