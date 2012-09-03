var NaclMsg = {};
NaclMsg.INIT_NHWINDOWS = 0;
NaclMsg.PLAYER_SELECTION = 1;
NaclMsg.ASKNAME = 2;
NaclMsg.GET_NH_EVENT = 3;
NaclMsg.EXIT_NHWINDOWS = 4;
NaclMsg.SUSPEND_NHWINDOWS = 5;
NaclMsg.RESUME_NHWINDOWS = 6;
NaclMsg.CREATE_NHWINDOW = 7;
NaclMsg.CREATE_NHWINDOW_BY_ID = 8;
NaclMsg.CLEAR_NHWINDOW = 9;
NaclMsg.DISPLAY_NHWINDOW = 10;
NaclMsg.DESTROY_NHWINDOW = 11;
NaclMsg.CURS = 12;
NaclMsg.PUTSTR = 13;
NaclMsg.DISPLAY_FILE = 14;
NaclMsg.START_MENU = 15;
NaclMsg.ADD_MENU = 16;
NaclMsg.END_MENU = 17;
NaclMsg.SELECT_MENU = 18;
NaclMsg.UPDATE_INVENTORY = 19;
NaclMsg.MARK_SYNCH = 20;
NaclMsg.WAIT_SYNCH = 21;
NaclMsg.CLIPAROUND = 22;
NaclMsg.CLIPAROUND_PROPER = 23;
NaclMsg.PRINT_GLYPH = 24;
NaclMsg.RAW_PRINT = 25;
NaclMsg.RAW_PRINT_BOLD = 26;
NaclMsg.NHGETCH = 27;
NaclMsg.NH_POSKEY = 28;
NaclMsg.NHBELL = 29;
NaclMsg.DOPREV_MESSAGE = 30;
NaclMsg.YN_FUNCTION = 31;
NaclMsg.GETLIN = 32;
NaclMsg.GET_EXT_CMD = 33;
NaclMsg.NUMBER_PAD = 34;
NaclMsg.DELAY_OUTPUT = 35;
NaclMsg.START_SCREEN = 36;
NaclMsg.END_SCREEN = 37;
NaclMsg.OUTRIP = 38;
NaclMsg.DELETE_NHWINDOW_BY_REFERENCE = 39;

var nethackEmbed;

startGame = function() {

  // Create the object for Nethack.
  nethackEmbed = document.createElement('object');
  nethackEmbed.width = 0;
  nethackEmbed.height = 0;
  nethackEmbed.addEventListener('message', handleMessage);
  nethackEmbed.data = 'nethack.nmf';
  nethackEmbed.type = 'application/x-nacl';

  var param = document.createElement('param');
  param.name = 'windowtype';
  param.value = 'nacl';
  nethackEmbed.appendChild(param);

  document.getElementById('listener').appendChild(nethackEmbed);
}

var PREFIX = 'JSPipeMount:3:';

function pm(out) {
  nethackEmbed.postMessage(PREFIX + out);
}

handleMessage = function(event) {
  // Make sure it's the right kind of event we got
  // Check to make sure it starts with PREFIX
  var msg = JSON.parse(event.data.substr(PREFIX.length));
  console.log(msg);
  switch(msg[0]) {
  case NaclMsg.INIT_NHWINDOWS:
    break;
  case NaclMsg.ASKNAME:
    pm('bob');
    break;
  }
}

startGame();
