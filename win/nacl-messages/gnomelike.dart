DivElement gnomelikePopup;

// Keep these in sync with include/wintype.h
int NHW_MESSAGE = 1;
int NHW_STATUS = 2;
int NHW_MAP = 3;
int NHW_MENU = 4;
int NHW_TEXT = 5;

class ExtHandler {
  int i;

  ExtHandler(this.i);

  void handleClick(MouseEvent evt) {
    pm(i.toString());
    clearPopup();
  }

  void pm(out) {
    nethackEmbed.postMessage('JSPipeMount:3:' + out);
  }
}

class GnomeLike implements NethackUi {
  int HEIGHT = 24;
  int WIDTH = 80;
  int DISPLAY_SQUARE = 16;
  int SCROLLBUFFER_SIZE = 2500;

  String windowtype = "Nacl";

  Queue<List<String>> eventBuffer;
  bool awaitingInput = false;
  
  int TILES_PER_ROW = 40;
  int TILE_SQUARE = 16;
  
  int win_num = 1;
  CanvasElement canvas;
  CanvasRenderingContext2D ctx;
  ImageElement tiles;
  ImageElement petmark;
  DivElement textWindow;
  DivElement game;

  void setup() {
    int pixheight = HEIGHT * DISPLAY_SQUARE;
    int pixwidth = WIDTH * DISPLAY_SQUARE;

    game = document.query("#game");

    DivElement topPart = new Element.tag("div");

    textWindow = new Element.tag("div");
    textWindow.id = "textwindow";
    textWindow.style.display = "inline-block";

    DivElement statusBox = new Element.tag("div");
    statusBox.style.display = "inline-block";

    DivElement strBox = new Element.tag("div");
    strBox.style.display = "inline-block";
    strBox.nodes.add(new Element.html('<div><img src="str.png"></div>'));
    DivElement strText = new Element.tag("div");
    strText.text = "STR: 99";
    strBox.nodes.add(strText);
    statusBox.nodes.add(strBox);

    DivElement dexBox = new Element.tag("div");
    dexBox.style.display = "inline-block";
    dexBox.nodes.add(new Element.html('<div><img src="dex.png"></div>'));
    DivElement dexText = new Element.tag("div");
    dexText.text = "DEX: 99";
    dexBox.nodes.add(dexText);
    statusBox.nodes.add(dexBox);

    DivElement conBox = new Element.tag("div");
    conBox.style.display = "inline-block";
    conBox.nodes.add(new Element.html(
        '<div><img src="constitution.png"></div>'));
    DivElement conText = new Element.tag("div");
    conText.text = "CON: 99";
    conBox.nodes.add(conText);
    statusBox.nodes.add(conBox);

    DivElement intBox = new Element.tag("div");
    intBox.style.display = "inline-block";
    intBox.nodes.add(new Element.html('<div><img src="int.png"></div>'));
    DivElement intText = new Element.tag("div");
    intText.text = "INT: 99";
    intBox.nodes.add(intText);
    statusBox.nodes.add(intBox);

    DivElement wisBox = new Element.tag("div");
    wisBox.style.display = "inline-block";
    wisBox.nodes.add(new Element.html('<div><img src="wis.png"></div>'));
    DivElement wisText = new Element.tag("div");
    wisText.text = "WIS: 99";
    wisBox.nodes.add(wisText);
    statusBox.nodes.add(wisBox);

    DivElement chaBox = new Element.tag("div");
    chaBox.style.display = "inline-block";
    chaBox.nodes.add(new Element.html('<div><img src="cha.png"></div>'));
    DivElement chaText = new Element.tag("div");
    chaText.text = "CHA: 99";
    chaBox.nodes.add(chaText);
    statusBox.nodes.add(chaBox);

    topPart.nodes.add(textWindow);
    topPart.nodes.add(statusBox);

    canvas = document.query("#canvas");

    DivElement map = new Element.tag("div");
    map.id = "map";

    canvas = new Element.tag("canvas");

    map.nodes.add(canvas);

    game.nodes.add(topPart);
    game.nodes.add(map);

    ctx = canvas.getContext("2d");
    canvas.width = pixwidth;
    canvas.height = pixheight;
    canvas.style.width = pixwidth;
    canvas.style.height = pixheight;
    canvas.on.mouseDown.add(mouseNav);

    tiles = new Element.tag('img');
    tiles.src = "x11tiles.png";

    petmark = new Element.tag('img');
    petmark.src = "petmark.png";

    eventBuffer = new Queue<List<String>>();
    textWindow = document.query("#textwindow");
    setupKeyListener();
  }  

  void setupKeyListener() {
    document.on.keyDown.add((KeyboardEvent evt) {

      int cmdKey = 0;

      switch(evt.which) {
      case 37: // left Arrow
        cmdKey = 104; // h
        break;
      case 39: // Right
        cmdKey = 108; // l
        break;
      case 38: // up
        cmdKey = 107; // k
        break;
      case 40: // down
        cmdKey = 106; // j
        break;
      case 17: // ctrl
        return;
      }

      if (evt.ctrlKey == true) {
        cmdKey = evt.which & 0x1F;
      }

      if (cmdKey != 0) {
        evt.preventDefault();
        eventBuffer.add([cmdKey, 0, 0, 0]);
        processInput();
        return false;
      }
    });

    document.on.keyPress.add((KeyboardEvent evt) {
      eventBuffer.add([evt.which, 0, 0, 0]);
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
    var prefix = 'JSPipeMount:3:';
    if (!msg.data.startsWith(prefix)) return;
    List<String> data = JSON.parse(msg.data.substring(prefix.length));
    print(data);
    switch (data[0]) {
      case NaclMsg.NACL_MSG_ASKNAME:
        pm('bob');
        break;
  
      // Args: Window Number
      case NaclMsg.NACL_MSG_CLEAR_NHWINDOW:
      print(data[1]);
      if (data[1] == NHW_MAP) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      break;
  
      case NaclMsg.NACL_MSG_CREATE_NHWINDOW:
        pm('' + win_num);
        win_num++;
        break;
  
      // Args: Window, X, Y, glyph, pet
      case NaclMsg.NACL_MSG_PRINT_GLYPH:
        putTile(data[2], data[3], data[4], data[5]);
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
  
      // Args: Pair<Cmd, Desc>*
      case NaclMsg.NACL_MSG_GET_EXT_CMD:
        gnomelikePopup = getPopup();
        // TODO(jeffbailey): Handle keyboard

        Iterator<String> iString = data.iterator();
        int i = -1; // We start before the list.
        iString.next();

        DivElement borderBox = new Element.tag("div");
        borderBox.id = "gnomelikeBorderBox";

        while (iString.hasNext()) {
          ButtonElement button = new Element.tag("button");
          button.style.width = "20em";
          button.text = iString.next();
          i++;
          iString.next(); // TODO(jeffbailey): Hover text for help.
          button.on.click.add(new ExtHandler(i).handleClick);
          DivElement buttonWrap = new Element.tag("div");
          buttonWrap.nodes.add(button);
          borderBox.nodes.add(buttonWrap);
        }

        gnomelikePopup.nodes.add(borderBox);
        showPopup();
        
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
    nethackEmbed.postMessage('JSPipeMount:3:' + out);
  }
  
  void putTile(int x, int y, int tile, int pet) {

    x--; // This is the easiest way to correct for origin weirdness.

    int tile_x = tile % TILES_PER_ROW;
    int tile_y = (tile / TILES_PER_ROW).floor();
  
    ctx.drawImage(tiles, tile_x * TILE_SQUARE,
                  tile_y * TILE_SQUARE,
                  TILE_SQUARE,
                  TILE_SQUARE,
                  x * DISPLAY_SQUARE,
                  y * DISPLAY_SQUARE,
                  DISPLAY_SQUARE,
                  DISPLAY_SQUARE);

    if (pet == 1) {
      ctx.drawImage(petmark, 
                    x * DISPLAY_SQUARE,
                    y * DISPLAY_SQUARE);
    }
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
}
