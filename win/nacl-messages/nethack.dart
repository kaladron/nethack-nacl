#import('dart:html');

#source('nacl_msg.dart');

class x11tiles {
  String src = "x11tiles.png";
  int TILE_SQUARE = 16;
}

int height = 24;
int width = 80;
int DISPLAY_SQUARE = 16;

main() {
  int pixheight = height * DISPLAY_SQUARE;
  int pixwidth = width * DISPLAY_SQUARE;

  CanvasElement canvas = document.query("#canvas");
  CanvasRenderingContext2D ctx = canvas.getContext("2d");
  canvas.width = pixwidth;
  canvas.height = pixheight;
  canvas.style.width = pixwidth;
  canvas.style.height = pixheight;
}
