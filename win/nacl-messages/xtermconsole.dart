class XtermConsole {
  HashMap<int, String> colorTable;
  DivElement xterm;

  XtermConsole(DivElement xterm) {
    this.xterm = xterm;

    colorTable = new HashMap<int, String>();
    colorTable[0] = '#000000';
    colorTable[1] = '#ff0000';
    colorTable[2] = '#00ff00';
    colorTable[3] = '#ffff00';
    colorTable[4] = '#0000ff';
    colorTable[5] = '#ff00ff';
    colorTable[6] = '#00ffff';
    colorTable[7] = '#ffffff';
  } 
}
